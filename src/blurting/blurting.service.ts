import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  UserEntity,
  UserInfoEntity,
} from 'src/entities';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Sex, SexOrient } from 'src/common/enums';

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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
  ) {}

  async createGroup(users: number[]) {
    const group = await this.groupRepository.save({
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
    await Promise.all(
      users.map(
        async (id) => await this.userService.updateUser(id, 'group', group),
      ),
    );

    
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
      postedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      answer: answer,
    });
    return this.answerRepository.save(answerEntity);
  }

  async registerGroupQueue(id: number) {
    const user = await this.userService.findUserByVal('id', id);
    if (user.group) {
      throw new ConflictException('이미 그룹이 있습니다.');
    }
    const sexOrient = this.getUserSexOrient(user.userInfo);

    const groupQueue: number[] = await this.cacheManager.get(sexOrient);
    if (groupQueue.includes(id)) {
      throw new BadRequestException(
        '이미 블러팅 매치메이킹 큐에 등록되어 있습니다.',
      );
    }
    if (groupQueue.length < 2) {
      groupQueue.push(id);
      await this.cacheManager.set(sexOrient, groupQueue);
      return false;
    }
    if (sexOrient.endsWith('homo')) {
      if (groupQueue.length >= 5) {
        const groupIds = groupQueue.slice(0, 5);
        groupIds.push(id);
        await this.createGroup(groupIds);
        await this.cacheManager.set(sexOrient, groupQueue.slice(5));
        return true;
      } else {
        groupQueue.push(id);
        await this.cacheManager.set(sexOrient, groupQueue);
        return false;
      }
    }
    const oppositeQueueName = this.getOppositeQueueName(sexOrient);
    const oppositeQueue: number[] =
      await this.cacheManager.get(oppositeQueueName);

    if (oppositeQueue.length >= 3) {
      const firstGroupIds = groupQueue.slice(0, 2);
      firstGroupIds.push(id);
      await this.cacheManager.set(sexOrient, groupQueue.slice(2));
      const secondGroupIds = oppositeQueue.slice(0, 3);
      await this.cacheManager.set(oppositeQueueName, oppositeQueue.slice(3));
      const groupIds = firstGroupIds.concat(secondGroupIds);

      await this.createGroup(groupIds);
      return true;
    } else {
      groupQueue.push(id);
      await this.cacheManager.set(sexOrient, groupQueue);
      return false;
    }
  }

  getUserSexOrient(info: UserInfoEntity) {
    if (info.sex === Sex.Male) {
      if (info.sexOrient === SexOrient.Homosexual) {
        return 'male_homo';
      } else {
        return 'male';
      }
    } else if (info.sex === Sex.Female) {
      if (info.sexOrient === SexOrient.Homosexual) {
        return 'female_homo';
      } else {
        return 'female';
      }
    }
  }

  getOppositeQueueName(queue: string) {
    if (queue === 'male') return 'female';
    else if (queue === 'female') return 'male';
  }
}
