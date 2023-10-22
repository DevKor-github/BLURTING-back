import { Injectable, Logger } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import {
  UserEntity,
  AuthPhoneNumberEntity,
  AuthMailEntity,
} from 'src/entities';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(UserEntity)
    @InjectRepository(AuthPhoneNumberEntity)
    private readonly authPhoneNumberRepository: Repository<AuthPhoneNumberEntity>,
    @InjectRepository(AuthMailEntity)
    private readonly authMailRepository: Repository<AuthMailEntity>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

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

  async validateUser(id: number) {
    const user = await this.userService.findUser('id', id);

    if (!user) {
      throw new UnauthorizedException('등록되지 않은 사용자입니다.');
    }
    return user;
  }
  async validatePhoneNumber(phoneNumber: string, userId: number) {
    const phone = await this.authPhoneNumberRepository.findOne({
      where: { user: { id: userId }, isValid: false },
      order: { createdAt: 'DESC' },
    });
    if (
      phone &&
      phone.createdAt.getTime() + 180000 > Date.now() - 1000 * 60 * 60 * 9 // 1000 * 60 * 60 * 9 : 시차데스 ..
    ) {
      throw new Error('잠시 후에 다시 인증번호를 요청해주세요.');
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
      user: { id: userId },
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

    const response = await axios.post(API_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': hash,
      },
    });
    if (Number(response.data.statusCode) !== 202)
      throw new Error('올바르지 않은 전화번호입니다. 다시 시도해주세요.');
  }

  async checkCode(userId: number, code: string) {
    const phone = await this.authPhoneNumberRepository.findOne({
      where: { user: { id: userId }, code },
    });
    if (!phone) {
      throw new Error('인증번호가 일치하지 않습니다.');
    }
    if (phone.createdAt.getTime() + 180000 < Date.now() - 1000 * 60 * 60 * 9) {
      throw new Error('유효 시간이 지났습니다. 인증번호를 다시 요청해주세요.');
    }

    if (phone.isValid) {
      throw new Error('이미 인증된 번호입니다.');
    }

    phone.isValid = true;
    await this.authPhoneNumberRepository.save(phone);
    return true;
  }

  async sendVerificationCode(userId: number, to: string) {
    const code = crypto.randomBytes(32).toString('hex');

    await this.mailerService.sendMail({
      from: process.env.MAIL_USER,
      to: to,
      subject: '블러팅 이메일을 인증해주세요.',
      html: `아래 링크에 접속하면 인증이 완료됩니다. <br /> <a href="${'api'}?code=${code}">인증하기</a>`,
    });
    const entity = this.authMailRepository.create({
      code,
      user: { id: userId },
      isValid: false,
    });

    await this.authMailRepository.save(entity);
  }
}
