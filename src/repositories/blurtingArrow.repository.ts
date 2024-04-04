import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrowDto } from 'src/blurting/dtos';
import { BlurtingArrowEntity, BlurtingGroupEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingArrowRepository {
  constructor(
    @InjectRepository(BlurtingArrowEntity)
    private readonly arrowRepository: Repository<BlurtingArrowEntity>,
  ) {}

  async findOneFromId(
    userId: number,
    groupId: number,
  ): Promise<BlurtingArrowEntity> {
    return this.arrowRepository.findOne({
      where: {
        from: { id: userId },
        group: { id: groupId },
      },
      order: { no: 'DESC' },
    });
  }

  async findFromId(
    userId: number,
    groupId: number,
  ): Promise<BlurtingArrowEntity[]> {
    return this.arrowRepository.find({
      where: {
        from: { id: userId },
        group: { id: groupId },
      },
      order: { no: 'ASC' },
      relations: ['to', 'to.userInfo'],
    });
  }

  async findToId(
    userId: number,
    groupId: number,
  ): Promise<BlurtingArrowEntity[]> {
    return this.arrowRepository.find({
      where: {
        to: { id: userId },
        group: { id: groupId },
      },
      order: { no: 'ASC' },
      relations: ['to', 'to.userInfo'],
    });
  }

  async insert(info: ArrowDto): Promise<void> {
    const newArrow = this.arrowRepository.create({
      from: { id: info.fromId },
      to: info.toId === -1 ? null : { id: info.toId },
      group: { id: info.groupId } as BlurtingGroupEntity,
      no: info.no,
    });

    await this.arrowRepository.save(newArrow);
  }
}
