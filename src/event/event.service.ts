import { InjectQueue } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Questions } from 'src/common/const';
import {
  BlurtingEventEntity,
  BlurtingGroupEntity,
  UserEntity,
} from 'src/entities';
import { FcmService } from 'src/firebase/fcm.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Sex } from 'src/common/enums';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(BlurtingGroupEntity)
    private readonly groupRepository: Repository<BlurtingGroupEntity>,
    @InjectRepository(BlurtingEventEntity)
    private readonly eventRepository: Repository<BlurtingEventEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
    private readonly fcmService: FcmService,
    private readonly userService: UserService,
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
    await this.queue.add(
      { group, question: null },
      { delay: 3 * questionDelay },
    );
  }

  async isMatching(user: UserEntity) {
    const sexOrient = this.userService.getUserSexOrient(user.userInfo);
    const qName = `event_${sexOrient}`;
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

  async setTable(userId: number, table: string) {
    await this.eventRepository.update({ userId }, { table });
  }

  async registerGroupQueue(id: number) {
    try {
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
        user.group.createdAt > new Date(new Date().getTime() - 1000 * 60 * 15)
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
}
