import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity, UserEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async insert(userId: number, body: string): Promise<void> {
    const notificationEntity = this.notificationRepository.create({
      user: { id: userId } as UserEntity,
      body,
    });
    await this.notificationRepository.save(notificationEntity);
  }
}
