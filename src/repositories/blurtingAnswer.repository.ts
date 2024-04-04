import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerDto } from 'src/blurting/dtos';
import {
  BlurtingAnswerEntity,
  BlurtingQuestionEntity,
  UserEntity,
} from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingAnswerRepository {
  constructor(
    @InjectRepository(BlurtingAnswerEntity)
    private readonly answerRepository: Repository<BlurtingAnswerEntity>,
  ) {}

  async findById(id: number): Promise<BlurtingAnswerEntity> {
    return this.answerRepository.findOne({
      where: { id },
      relations: ['user', 'user.group', 'question', 'question.group'],
    });
  }

  async findByQuestion(questionId: number): Promise<BlurtingAnswerEntity[]> {
    return this.answerRepository.find({
      where: { question: { id: questionId } },
      order: { postedAt: 'ASC', reply: { createdAt: 'DESC' } },
      relations: ['question', 'user', 'reply', 'reply.user'],
    });
  }

  async insert(info: AnswerDto): Promise<void> {
    const answerEntity = this.answerRepository.create({
      user: { id: info.userId } as UserEntity,
      question: { id: info.questionId } as BlurtingQuestionEntity,
      postedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      answer: info.answer,
      userSex: info.userSex,
    });

    await this.answerRepository.save(answerEntity);
  }

  async updateLikes(id: number, like: boolean): Promise<void> {
    const answer = await this.findById(id);
    like ? answer.allLikes++ : answer.allLikes--;
    await this.answerRepository.save(answer);
  }
}
