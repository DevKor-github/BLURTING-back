import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionDto } from 'src/blurting/dtos/question.dto';
import { BlurtingGroupEntity, BlurtingQuestionEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingQuestionRepository {
  constructor(
    @InjectRepository(BlurtingQuestionEntity)
    private readonly questionRepository: Repository<BlurtingQuestionEntity>,
  ) {}

  async findById(id: number): Promise<BlurtingQuestionEntity> {
    return this.questionRepository.findOne({
      where: { id },
      relations: ['group'],
    });
  }

  async findLatestByGroup(groupId: number): Promise<BlurtingQuestionEntity> {
    return this.questionRepository.findOne({
      where: { group: { id: groupId } },
      order: { no: 'DESC' },
      relations: ['group'],
    });
  }

  async findOneByGroup(
    groupId: number,
    no: number,
  ): Promise<BlurtingQuestionEntity> {
    return this.questionRepository.findOne({
      where: { group: { id: groupId }, no },
      relations: ['group'],
    });
  }

  async findByGroup(groupId: number): Promise<BlurtingQuestionEntity[]> {
    return this.questionRepository.find({
      where: { group: { id: groupId } },
      order: { no: 'DESC' },
    });
  }

  async insert(info: QuestionDto): Promise<void> {
    const questionEntity = this.questionRepository.create({
      group: { id: info.groupId } as BlurtingGroupEntity,
      question: info.question,
      no: info.no,
    });
    await this.questionRepository.save(questionEntity);
  }
}
