import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlurtingGroupEntity } from 'src/domain/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingGroupRepository {
  constructor(
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
  ) {}

  async insert(): Promise<BlurtingGroupEntity> {
    return this.groupRepository.save({
      createdAt: new Date(),
    });
  }
}
