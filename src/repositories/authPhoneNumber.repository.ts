import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPhoneNumberEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AuthPhoneNumberRepository {
  constructor(
    @InjectRepository(AuthPhoneNumberEntity)
    private readonly authPhoneNumberRepository: Repository<AuthPhoneNumberEntity>,
  ) {}

  async findByPhone(phoneNumber: string): Promise<AuthPhoneNumberEntity> {
    return await this.authPhoneNumberRepository.findOne({
      where: { phoneNumber, isValid: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPhoneCode(
    phoneNumber: string,
    code: string,
  ): Promise<AuthPhoneNumberEntity> {
    return await this.authPhoneNumberRepository.findOne({
      where: { code, phoneNumber },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async insert(phoneNumber: string, code: string): Promise<void> {
    const phoneEntity = this.authPhoneNumberRepository.create({
      phoneNumber,
      code,
      isValid: false,
    });
    await this.authPhoneNumberRepository.save(phoneEntity);
  }

  async deleteByPhone(phoneNumber: string): Promise<void> {
    await this.authPhoneNumberRepository.delete(phoneNumber);
  }
}
