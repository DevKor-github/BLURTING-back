import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Questions } from 'src/common/const';
import {
  BLurtingArrowEntity,
  BlurtingAnswerEntity,
  BlurtingEventEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  UserEntity,
} from 'src/entities';
import { FcmService } from 'src/firebase/fcm.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Sex } from 'src/common/enums';
import { BlurtingService } from 'src/blurting/blurting.service';
import { ArrowInfoResponseDto } from 'src/blurting/dtos/arrowInfoResponse.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
    @InjectRepository(BlurtingEventEntity)
    private readonly eventRepository: Repository<BlurtingEventEntity>,
    @InjectRepository(BlurtingQuestionEntity)
    private readonly questionRepository: Repository<BlurtingQuestionEntity>,
    @InjectRepository(BlurtingAnswerEntity)
    private readonly answerRepository: Repository<BlurtingAnswerEntity>,
    @InjectRepository(BLurtingArrowEntity)
    private readonly arrowRepository: Repository<BLurtingArrowEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
    private readonly fcmService: FcmService,
    private readonly userService: UserService,
    private readonly blurtingService: BlurtingService,
  ) {}

  async createGroup(users: number[]) {
    const group = await this.groupRepository.save({
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
    await Promise.all(
      users.map(async (id) => {
        await this.eventRepository.update({ userId: id }, { group });
        await this.fcmService.sendPush(
          id,
          '이벤트 그룹이 매칭되었습니다!',
          'blurting',
        );
      }),
    );
    const selected = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * Questions.length);
      } while (selected.includes(Questions[rand]));

      selected.push(Questions[rand]);
    }

    const questionDelay = 1000 * 60 * 5;
    await Promise.all(
      selected.map(async (question, i) => {
        await this.queue.add(
          { question, group, no: i + 1, users },
          { delay: i * questionDelay },
        );
      }),
    );
  }

  async isMatching(user: UserEntity) {
    const sex = user.userInfo.sex;
    const qName = `event_${sex}`;
    const groupQueue: number[] = await this.cacheManager.get(qName);
    if (!groupQueue) {
      await this.cacheManager.set(qName, []);
      return false;
    }
    if (groupQueue.includes(user.id)) {
      return true;
    }
    return false;
  }

  async getEventInfo(user: UserEntity) {
    const eventUser = this.eventRepository.findOne({
      where: { userId: user.id },
      relations: ['group'],
    });
    return eventUser;
  }

  async setTable(userId: number, table: string) {
    await this.eventRepository.update({ userId }, { table });
  }

  async registerGroupQueue(id: number) {
    try {
      // debug
      await this.createGroup([id]);

      const user = await this.userService.findUserByVal('id', id);
      const sex = user.userInfo.sex;
      const qName = `event_${sex}`;

      let groupQueue: number[] = await this.cacheManager.get(qName);
      if (!groupQueue) {
        await this.cacheManager.set(qName, []);
        groupQueue = await this.cacheManager.get(qName);
      }
      if (groupQueue.includes(id)) {
        return 2;
      }

      if (
        user.group &&
        user.group.createdAt >
          new Date(new Date().getTime() - 1000 * 60 * 15 + 1000 * 60 * 60 * 9)
      ) {
        return 1;
      }

      if (groupQueue.length < 2) {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return 0;
      }

      let oppositeSex;

      if (sex === Sex.Male) {
        oppositeSex = Sex.Female;
      } else if (sex === Sex.Female) {
        oppositeSex = Sex.Male;
      }
      const oppositeQueueName = `event_${oppositeSex}`;
      let oppositeQueue: number[] =
        await this.cacheManager.get(oppositeQueueName);

      if (!oppositeQueue) {
        oppositeQueue = [];
        await this.cacheManager.set(oppositeQueueName, oppositeQueue);
      }

      if (oppositeQueue.length >= 3) {
        const firstGroupIds = groupQueue.slice(0, 2);
        firstGroupIds.push(id);
        await this.cacheManager.set(qName, groupQueue.slice(2));

        const secondGroupIds = oppositeQueue.slice(0, 3);
        await this.cacheManager.set(oppositeQueueName, oppositeQueue.slice(3));
        const groupIds = firstGroupIds.concat(secondGroupIds);
        if (groupIds.length !== 6) {
          throw new Error(
            '왜인지 모르겠지만 groupIds가 이상함.' + groupIds.toString(),
          );
        }
        await this.createGroup(groupIds);
        return 1;
      } else {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return 0;
      }
    } catch (err) {
      console.log(err);
      const user = await this.userService.findUserByVal('id', id);
      const sex = user.userInfo.sex;
      const qName = `event_${sex}`;

      const groupQueue: number[] = await this.cacheManager.get(qName);
      if (groupQueue.includes(id)) {
        return 2;
      }
      groupQueue.push(id);
      await this.cacheManager.set(qName, groupQueue);
      return 0;
    }
  }

  async postAnswer(userId: number, questionId: number, answer: string) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['group'],
    });
    if (!question || question == null) {
      throw new BadRequestException('존재하지 않는 질문입니다.');
    }

    const user = await this.userService.findUserByVal('id', userId);
    const answerEntity = this.answerRepository.create({
      user: user,
      question: { id: questionId } as BlurtingQuestionEntity,
      postedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      answer: answer,
      userSex: user.userInfo.sex,
    });

    this.answerRepository.save(answerEntity);
  }

  async getArrows(userId: number): Promise<ArrowInfoResponseDto> {
    const user = await this.userService.findUserByVal('id', userId);
    const eventUser = await this.getEventInfo(user);
    if (!eventUser?.group) return { iSended: [], iReceived: [] };

    const sendArrows = await this.arrowRepository.find({
      where: {
        from: { id: userId },
        group: eventUser.group,
      },
      order: { no: 'ASC' },
      relations: ['to', 'to.userInfo'],
    });
    const receiveArrows = await this.arrowRepository.find({
      where: {
        to: { id: userId },
        group: user.group,
      },
      order: { no: 'ASC' },
      relations: ['from', 'from.userInfo'],
    });
    const sendDto = sendArrows.map((arrow) => {
      return {
        fromId: userId,
        toId: arrow.to === null ? -1 : arrow.to.id,
        day: arrow.no,
        username: arrow.to === null ? null : arrow.to.userNickname,
        userSex: arrow.to === null ? null : arrow.to.userInfo.sex,
      };
    });

    const receiveDto = receiveArrows.map((arrow) => {
      return {
        fromId: arrow.from === null ? -1 : arrow.from.id,
        toId: userId,
        day: arrow.no,
        username: arrow.from === null ? null : arrow.from.userNickname,
        userSex: arrow.from === null ? null : arrow.from.userInfo.sex,
      };
    });
    return { iSended: sendDto, iReceived: receiveDto };
  }

  async getFinalArrow(userId: number) {
    const arrowDtos = await this.getArrows(userId);
    const finalSend = arrowDtos.iSended[arrowDtos.iSended.length - 1];
    const finalRecieves = arrowDtos.iReceived;

    const matched = finalRecieves.filter((recieve) => {
      if (recieve.fromId === finalSend.toId) {
        return true;
      }
    });

    if (matched.length > 0) {
      return await this.getOtherProfile(finalSend.toId);
    }

    return null;
  }

  async getOtherProfile(userId: number) {
    const otherUser = await this.userService.findUserByVal('id', userId);
    const userImages = await this.userService.getUserImages(otherUser.id);
    return {
      ...(await this.userService.getUserProfile(otherUser.id, userImages)),
      blur: 2,
    };
  }
}
