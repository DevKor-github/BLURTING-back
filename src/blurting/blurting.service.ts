import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  UserEntity,
} from 'src/entities';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
    @InjectRepository(BlurtingQuestionEntity)
    private readonly questionRepository: Repository<BlurtingQuestionEntity>,
    @InjectRepository(BlurtingAnswerEntity)
    private readonly answerRepository: Repository<BlurtingAnswerEntity>,
  ) {}

  async createGroup(users: number[]) {
    const group = await this.groupRepository.save({ createdAt: new Date() });
    users.map((id) => this.userService.updateUser(id, 'group', group));
  }

  async getBlurting(group: BlurtingGroupEntity): Promise<BlurtingPageDto> {
    const question = await this.questionRepository.findOne({
      where: { group: group },
      order: { no: 'DESC' },
      relations: ['group'],
    });
    const answers = await this.answerRepository.find({
      where: { question: question },
      order: { postedAt: 'ASC' },
      relations: ['question', 'user'],
    });

    const blurtingPage: BlurtingPageDto = BlurtingPageDto.ToDto(
      group,
      question,
      answers,
    );
    return blurtingPage;
  }

  async postAnswer(userId: number, questionId: number, answer: string) {
    const answerEntity = this.answerRepository.create({
      user: { id: userId } as UserEntity,
      question: { id: questionId } as BlurtingQuestionEntity,
      postedAt: new Date(),
      answer: answer,
    });
    return this.answerRepository.save(answerEntity);
  }
}
