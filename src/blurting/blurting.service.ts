import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { BlurtingAnswerDto, BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  UserInfoEntity,
} from 'src/entities';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Sex, SexOrient } from 'src/common/enums';
import { FcmService } from 'src/firebase/fcm.service';
import { ChatService } from 'src/chat/chat.service';
import { BlurtingProfileDto } from 'src/dtos/user.dto';
import { PointService } from 'src/point/point.service';

@Injectable()
export class BlurtingService {
  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly pointService: PointService,
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
    @InjectRepository(BlurtingQuestionEntity)
    private readonly questionRepository: Repository<BlurtingQuestionEntity>,
    @InjectRepository(BlurtingAnswerEntity)
    private readonly answerRepository: Repository<BlurtingAnswerEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
    private readonly fcmService: FcmService,
  ) {}

  async createGroup(users: number[]) {
    const group = await this.groupRepository.save({
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
    await Promise.all(
      users.map(async (id) => {
        await this.userService.updateUser(id, 'group', group);
        await this.fcmService.sendPush(
          id,
          '그룹 매칭 완료!',
          '매칭이 완료되었습니다.',
        );
      }),
    );

    const questions = [
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
      'ㅁㅁ',
    ];
    const shuffled = questions.sort(() => 0.5 - Math.random());

    const selected = shuffled.slice(0, 9);
    const hourInMs = 1000 * 60 * 60;
    const questionDelay = hourInMs * 8;
    await Promise.all(
      selected.map(async (question, i) => {
        await this.queue.add(
          { question, group, no: i + 1, users },
          { delay: i * questionDelay },
        );
      }),
    );
  }

  async insertQuestionToGroup(
    question: string,
    group: BlurtingGroupEntity,
    no: number,
  ) {
    const newQuestion = this.questionRepository.create({
      group,
      question,
      no,
    });
    await this.questionRepository.save(newQuestion);
  }

  async getBlurting(
    id: number,
    group: BlurtingGroupEntity,
    no: number,
  ): Promise<BlurtingPageDto> {
    let question;
    if (no == 0) {
      question = await this.questionRepository.findOne({
        where: { group: group },
        order: { no: 'DESC' },
        relations: ['group'],
      });
    } else {
      question = await this.questionRepository.findOne({
        where: { group: group, no: no },
        relations: ['group'],
      });
    }

    if (!question) {
      throw new BadRequestException('invalid question no');
    }

    const answers = await this.answerRepository.find({
      where: { question: question },
      order: { postedAt: 'ASC' },
      relations: ['question', 'user'],
    });

    const answersDto = Promise.all(
      answers.map(async (answerEntity) => {
        const room = await this.chatService.findCreatedRoom([
          id,
          answerEntity.user.id,
        ]);
        const roomId = room ? room.id : null;
        return await BlurtingAnswerDto.ToDto(answerEntity, roomId);
      }),
    );

    const blurtingPage: BlurtingPageDto = BlurtingPageDto.ToDto(
      group,
      question,
      await answersDto,
    );
    return blurtingPage;
  }

  async postAnswer(userId: number, questionId: number, answer: string) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question || question == null) {
      throw new BadRequestException('존재하지 않는 질문입니다.');
    }

    const user = await this.userService.findUserByVal('id', userId);
    const answerEntity = this.answerRepository.create({
      user: user,
      sex: user.userInfo.sex,
      question: { id: questionId } as BlurtingQuestionEntity,
      postedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      answer: answer,
    });

    this.answerRepository.save(answerEntity);
    console.log(answer);
    console.log(answer.length);
    if (answer.length >= 100) {
      const point = await this.pointService.giveBlurtingPoint(userId);
      console.log(point);
      return point;
    }
    return false;
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

  async getProfile(id: number, other: number) {
    const userInfo = await this.userService.getUserProfile(other, []);
    const room = await this.chatService.findCreatedRoom([id, other]);
    const roomId = room ? room.id : null;
    return await BlurtingProfileDto.ToDto(userInfo, roomId);
  }
}
