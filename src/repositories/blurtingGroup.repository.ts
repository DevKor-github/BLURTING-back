import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlurtingGroupEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingGroupRepository {
  constructor(
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
  ) {}

  async insert(): Promise<BlurtingGroupEntity> {
    return this.groupRepository.save({
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
  }
}
