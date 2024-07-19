import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PreQuestionDto } from 'src/domain/blurting/dtos/question.dto';
import {
  BlurtingGroupEntity,
  BlurtingPreQuestionEntity,
} from 'src/domain/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingPreQuestionRepository {
  constructor(
    @InjectRepository(BlurtingPreQuestionEntity)
    private readonly preQuestionRepository: Repository<BlurtingPreQuestionEntity>,
  ) {}

  async findOne(
    groupId: number,
    no: number,
  ): Promise<BlurtingPreQuestionEntity> {
    return this.preQuestionRepository.findOne({
      where: {
        group: { id: groupId },
        no: no,
      },
    });
  }

  async insert(info: PreQuestionDto): Promise<void> {
    const questionEntity = this.preQuestionRepository.create({
      group: { id: info.groupId } as BlurtingGroupEntity,
      no: info.no,
      question: info.question,
      isUploaded: false,
    });
    await this.preQuestionRepository.save(questionEntity);
  }

  async updateToUpload(id: number): Promise<void> {
    await this.preQuestionRepository.update({ id }, { isUploaded: true });
  }
}
