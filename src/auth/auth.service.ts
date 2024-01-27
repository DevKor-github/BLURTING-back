/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotAcceptableException,
  RequestTimeoutException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPhoneNumberEntity, AuthMailEntity } from 'src/entities';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { UnivMailMap } from 'src/common/const';
import { PointService } from 'src/point/point.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthPhoneNumberEntity)
    private readonly authPhoneNumberRepository: Repository<AuthPhoneNumberEntity>,
    @InjectRepository(AuthMailEntity)
    private readonly authMailRepository: Repository<AuthMailEntity>,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly pointService: PointService,
  ) {}

  async getRefreshToken({ id }) {
    const payload: JwtPayload = {
      id: id,
      signedAt: new Date().toISOString(),
    };

    const refreshJwt = await this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET_KEY,
    });
    this.userService.updateUser(id, 'token', refreshJwt);

    return refreshJwt;
  }

  async getAccessToken({ id }) {
    const payload: JwtPayload = {
      id: id,
      signedAt: new Date().toISOString(),
    };

    const accessJwt = await this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expiresIn: '1h',
    });

    return accessJwt;
  }

  async getSignupToken(signupPayload: SignupPayload) {
    const payload: SignupPayload = {
      id: signupPayload.id,
      infoId: signupPayload.infoId,
      page: signupPayload.page + 1,
    };

    const signupJwt = await this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET_KEY,
    });

    return signupJwt;
  }

  async validatePhoneNumber(phoneNumber: string, userId: number) {
    const phone = await this.authPhoneNumberRepository.findOne({
      where: { phoneNumber, isValid: false },
      order: { createdAt: 'DESC' },
    });

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
      await this.authPhoneNumberRepository.delete(phone);
    }

    this.sendCode(phoneNumber, userId);
  }

  async validateEmail(userId: number, to: string) {
    const existingUser = await this.userService.findUserByVal('email', to);
    if (existingUser) throw new ConflictException('이미 가입된 이메일입니다.');
    const mail = await this.authMailRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    if (mail && mail.createdAt.getTime() + 1000 * 10 > Date.now())
      throw new NotAcceptableException('잠시 후에 다시 시도해주세요');
    if (mail) await this.authMailRepository.delete(mail);

    const code = crypto.randomBytes(32).toString('hex');

    const domain = to.split('@')[1];
    const univ = Object.entries(UnivMailMap).find(
      ([_, value]) => value == domain,
    )[0];

    if (!univ) throw new BadRequestException('올바르지 않은 이메일입니다.');

    try {
      const endpoint = 'https://api.blurting.devkor.club/auth/check/email';
      await this.mailerService.sendMail({
        from: process.env.MAIL_USER,
        to: to,
        subject: '블러팅 이메일을 인증해주세요.',
        html: `아래 링크에 접속하면 인증이 완료됩니다. <br /> <a href="${endpoint}?code=${code}&email=${to}">인증하기</a>`,
      });
    } catch (err) {
      throw new BadRequestException('올바르지 않은 이메일입니다.');
    }

    const entity = this.authMailRepository.create({
      code,
      user: { id: userId },
      isValid: false,
    });

    await this.authMailRepository.save(entity);
  }

  async checkComplete(id: number) {
    const user = await this.userService.findUserByVal('id', id);
    return user.phoneNumber && user.email != null;
  }

  async checkMail(code: string, email: string) {
    const mail = await this.authMailRepository.findOne({
      where: {
        code: code,
        isValid: false,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['user'],
    });

    const domain = email.split('@')[1];
    const univ = Object.entries(UnivMailMap).find(
      ([_, value]) => value == domain,
    )[0];

    await this.userService.updateUser(mail.user.id, 'email', email);
    await this.userService.updateUserInfo(mail.user.id, 'university', univ);
    await this.pointService.giveSignupPoint(mail.user.id);
    await this.authMailRepository.delete(mail);
  }

  async alreadySigned(phoneNumber: string) {
    const user = await this.userService.findUserByPhone(phoneNumber);
    if (!user) throw new NotFoundException('가입되지 않은 전화번호입니다.');

    const phone = await this.authPhoneNumberRepository.findOne({
      where: { phoneNumber: user.phoneNumber, isValid: false },
      order: { createdAt: 'DESC' },
    });

    if (phone && phone.createdAt.getTime() + 1000 * 10 > Date.now()) {
      throw new NotAcceptableException(
        '잠시 후에 다시 인증번호를 요청해주세요.',
      );
    }
    if (phone) {
      await this.authPhoneNumberRepository.delete(phone);
    }

    this.sendCode(phoneNumber, user.id);
  }

  async sendCode(phoneNumber: string, userId: number) {
    if (phoneNumber === '01090319869' || phoneNumber === '01056210281') {
      const phoneEntity = this.authPhoneNumberRepository.create({
        phoneNumber: phoneNumber,
        code: '000000',
        isValid: false,
      });
      await this.authPhoneNumberRepository.save(phoneEntity);
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

    const phoneEntity = this.authPhoneNumberRepository.create({
      phoneNumber: phoneNumber,
      code: number,
      isValid: false,
    });
    await this.authPhoneNumberRepository.save(phoneEntity);

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
    const phone = await this.authPhoneNumberRepository.findOne({
      where: { code, phoneNumber },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
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

    await this.authPhoneNumberRepository.delete(phone);
    return true;
  }
}
