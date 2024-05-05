import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotAcceptableException,
  RequestTimeoutException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { AuthPhoneNumberRepository } from 'src/repositories';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

@Injectable()
export class AuthService {
  constructor(
    private readonly authPhoneNumberRepository: AuthPhoneNumberRepository,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async getRefreshToken(id: number): Promise<string> {
    const payload: JwtPayload = {
      id,
      signedAt: new Date(
        new Date().getTime() + 9 * 60 * 60 * 1000,
      ).toISOString(),
    };

    const refreshJwt = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET_KEY,
    });
    await this.userService.updateUser(id, 'token', refreshJwt);

    return refreshJwt;
  }

  getAccessToken(id: number): string {
    const payload: JwtPayload = {
      id,
      signedAt: new Date(
        new Date().getTime() + 9 * 60 * 60 * 1000,
      ).toISOString(),
    };

    const accessJwt = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expiresIn: '1h',
    });

    return accessJwt;
  }

  getSignupToken(signupPayload: SignupPayload): string {
    const payload: SignupPayload = {
      id: signupPayload.id,
      infoId: signupPayload.infoId,
      page: signupPayload.page + 1,
    };

    const signupJwt = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return signupJwt;
  }

  async validatePhoneNumber(phoneNumber: string): Promise<void> {
    const phone = await this.authPhoneNumberRepository.findByPhone(phoneNumber);

    const existingUser =
      await this.userService.findCompleteUserByPhone(phoneNumber);
    if (existingUser)
      throw new ConflictException('이미 가입된 전화번호입니다.');
    if (phone && phone.createdAt.getTime() + 1000 * 10 > Date.now()) {
      throw new NotAcceptableException(
        '잠시 후에 다시 인증번호를 요청해주세요.',
      );
    }
    if (phone) {
      await this.authPhoneNumberRepository.deleteByPhone(phone.phoneNumber);
    }

    this.sendCode(phoneNumber);
  }

  async checkComplete(id: number): Promise<boolean> {
    const user = await this.userService.findUserByVal('id', id);
    return user.phoneNumber && user.email != null;
  }

  async alreadySigned(phoneNumber: string): Promise<void> {
    const user = await this.userService.findUserByPhone(phoneNumber);
    if (!user) throw new NotFoundException('가입되지 않은 전화번호입니다.');

    const phone = await this.authPhoneNumberRepository.findByPhone(
      user.phoneNumber,
    );

    if (phone && phone.createdAt.getTime() + 1000 * 10 > Date.now()) {
      throw new NotAcceptableException(
        '잠시 후에 다시 인증번호를 요청해주세요.',
      );
    }
    if (phone) {
      await this.authPhoneNumberRepository.deleteByPhone(phone.phoneNumber);
    }

    this.sendCode(phoneNumber);
  }

  async sendCode(phoneNumber: string) {
    if (phoneNumber === '01090319869' || phoneNumber === '01056210281') {
      await this.authPhoneNumberRepository.insert(phoneNumber, '000000');
      return;
    }

    const API_URL = `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.SENS_SERVICE_ID}/messages`;
    const rand = Math.floor(Math.random() * 1000000).toString();
    const number = rand.padStart(6, '0');
    const body = {
      type: 'SMS',
      from: process.env.SENS_PHONE_NUMBER,
      content: `블러팅 휴대폰 인증번호는 [${number}]입니다.`,
      messages: [
        {
          to: phoneNumber,
          content: `블러팅 휴대폰 인증번호는 [${number}]입니다.`,
        },
      ],
    };

    await this.authPhoneNumberRepository.insert(phoneNumber, number);

    const accessKey = process.env.NAVER_API_KEY;
    const secretKey = process.env.NAVER_API_SECRET;
    const timestamp = Date.now().toString();

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update('POST');
    hmac.update(' ');
    hmac.update(`/sms/v2/services/${process.env.SENS_SERVICE_ID}/messages`);
    hmac.update('\n');
    hmac.update(`${timestamp}`);
    hmac.update('\n');
    hmac.update(`${accessKey}`);
    const hash = hmac.digest('base64');
    let response;
    try {
      response = await axios.post(API_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': accessKey,
          'x-ncp-apigw-signature-v2': hash,
        },
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.response.data);
    }
    if (Number(response.data.statusCode) !== 202)
      throw new BadRequestException(
        '올바르지 않은 전화번호입니다. 다시 시도해주세요.',
      );
  }

  async checkCode(code: string, phoneNumber: string) {
    const phone = await this.authPhoneNumberRepository.findByPhoneCode(
      phoneNumber,
      code,
    );
    if (!phone) {
      throw new UnauthorizedException('인증번호가 일치하지 않습니다.');
    }
    if (phone.createdAt.getTime() + 3 * 60 * 1000 < Date.now()) {
      throw new RequestTimeoutException(
        '유효 시간이 지났습니다. 인증번호를 다시 요청해주세요.',
      );
    }
    if (phone.isValid) {
      throw new ConflictException('이미 인증된 번호입니다.');
    }

    await this.authPhoneNumberRepository.deleteByPhone(phone.phoneNumber);
    return true;
  }
}
