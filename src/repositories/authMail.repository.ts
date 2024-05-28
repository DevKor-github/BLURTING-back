import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthMailEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class AuthMail {
  constructor(
    @InjectRepository(AuthMailEntity)
    private readonly authMailRepository: Repository<AuthMailEntity>,
  ) {}

  async findByUser(id: number): Promise<AuthMailEntity> {
    return await this.authMailRepository.findOne({
      where: { user: { id } },
      order: { createdAt: 'DESC' },
    });
  }

  async insert(code: string, userId: number): Promise<void> {
    const mailEntity = this.authMailRepository.create({
      code,
      user: { id: userId },
      isValid: false,
    });

    await this.authMailRepository.save(mailEntity);
  }

  async deleteById(id: number) {
    await this.authMailRepository.delete(id);
  }
}
