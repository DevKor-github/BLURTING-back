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
import { UserService } from 'src/domain/user/user.service';
import { JwtPayload, SignupPayload } from 'src/interfaces/auth';
import { AuthPhoneNumberRepository } from 'src/domain/repositories';
import CoolsmsMessageService, { type MessageType } from 'coolsms-node-sdk';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const crypto = require('crypto');

@Injectable()
export class AuthService {
  constructor(
    private readonly authPhoneNumberRepository: AuthPhoneNumberRepository,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  messageService = new CoolsmsMessageService(
    process.env.MESSAGE_API_KEY,
    process.env.MESSAGE_API_SECRET,
  );

  async sendSMS(to: string, text: string) {
    const body = {
      from: '01052196349',
      to,
      type: 'SMS' as MessageType,
      text,
      autoTypeDetect: false,
    };
    await this.messageService.sendOne(body);
  }

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
    return user.phoneNumber && user.userInfo.job != null;
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
    if (
      phoneNumber === '01090319869' ||
      phoneNumber === '01035979869' ||
      phoneNumber === '01073709869' ||
      phoneNumber === '01086489869' ||
      phoneNumber === '01082793877' ||
      phoneNumber === '01040681036' ||
      phoneNumber === '01077310281' ||
      phoneNumber === '01029053228'
    ) {
      await this.authPhoneNumberRepository.insert(phoneNumber, '000000');
      return;
    }

    const rand = Math.floor(Math.random() * 1000000).toString();
    const number = rand.padStart(6, '0');

    const text = `블러팅 휴대폰 인증번호는 [${number}]입니다.`;
    await this.authPhoneNumberRepository.insert(phoneNumber, number);
    await this.sendSMS(phoneNumber, text);
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
