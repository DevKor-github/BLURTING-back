import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import AuthPhoneNumberEntity from 'src/entities/authPhoneNumber.entity';
import { MailerService } from '@nestjs-modules/mailer';
import crypto from 'crypto';
import AuthMailEntity from 'src/entities/authMail.entity';
@Injectable()
export class AuthService {
  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthPhoneNumberEntity)
    private readonly authPhoneNumberRepository: Repository<AuthPhoneNumberEntity>,
    @InjectRepository(AuthMailEntity)
    private readonly authMailRepository: Repository<AuthMailEntity>,
  ) {}

  async validateUser() {}

  async validatePhoneNumber(phoneNumber: string, userId: number) {
    const phone = await this.authPhoneNumberRepository.findOne({
      where: { user: { userId }, isValid: false },
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
      user: { userId },
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
      where: { user: { userId }, code },
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
      user: { userId },
      isValid: false,
    });

    await this.authMailRepository.save(entity);
  }

  async verifyEmail(email: string, code: string) {
    const mailEntity = await this.authMailRepository.findOne({
      where: { code, user: {} },
    });
    if (!mailEntity) {
      throw new Error('인증번호가 일치하지 않습니다.');
    }

    // verify
  }
}
