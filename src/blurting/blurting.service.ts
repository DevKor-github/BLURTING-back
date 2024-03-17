import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { BlurtingAnswerDto, BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  BLurtingArrowEntity,
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  LikeEntity,
  UserEntity,
  NotificationEntity,
  ReplyEntity,
} from 'src/entities';
import { UserService } from 'src/user/user.service';
import { In, Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Sex, SexOrient } from 'src/common/enums';
import { FcmService } from 'src/firebase/fcm.service';
import { ChatService } from 'src/chat/chat.service';
import { BlurtingProfileDto } from 'src/dtos/user.dto';
import { PointService } from 'src/point/point.service';
import { OtherPeopleInfoDto } from './dtos/otherPeopleInfo.dto';
import { ReportEntity } from 'src/entities/report.entity';
import { ArrowInfoResponseDto } from './dtos/arrowInfoResponse.dto';
import { Questions } from 'src/common/const';

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
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('blurtingQuestions') private readonly queue: Queue,
    private readonly fcmService: FcmService,
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(BLurtingArrowEntity)
    private readonly arrowRepository: Repository<BLurtingArrowEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
    @InjectRepository(ReplyEntity)
    private readonly replyRepository: Repository<ReplyEntity>,
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
          '그룹 매칭이 완료되었습니다!',
          'blurting',
        );
        const newEntity = this.notificationRepository.create({
          user: { id: id },
          body: '그룹 매칭이 완료되었습니다!',
        });
        await this.notificationRepository.insert(newEntity);
      }),
    );
    const selected = [];
    for (let i = 0; i < 9; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * Questions.length);
      } while (selected.includes(Questions[rand]));

      selected.push(Questions[rand]);
    }
    console.log('question selected for group:', group.id, group.createdAt);
    console.log(selected);

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
    await this.queue.add(
      { group, question: null },
      { delay: 9 * questionDelay },
    );
  }

  async deleteGroup(group: BlurtingGroupEntity) {
    const users = await this.userService.getUsersInGroup(group.id);
    for (const user of users) {
      user.group = null;
    }
    await this.userService.saveUsers(users);
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
    let question: BlurtingQuestionEntity;
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
      order: { postedAt: 'ASC', reply: { createdAt: 'DESC' } },
      relations: ['question', 'user', 'reply', 'reply.user'],
    });

    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const likes = await this.likeRepository.find({
          where: {
            answer: {
              id: answerEntity.id,
              question: {
                group: {
                  id: group.id,
                },
              },
            },
          },
        });
        let iLike = false;
        if (likes.filter((item) => item.userId === id).length > 0) iLike = true;

        if (answerEntity.user == null) {
          return BlurtingAnswerDto.ToDto(
            answerEntity,
            null,
            null,
            iLike,
            likes.length,
          );
        }

        const room = await this.chatService.findCreatedRoom([
          id,
          answerEntity.user.id,
        ]);
        const user = await this.userService.findUserByVal(
          'id',
          answerEntity.user.id,
        );
        const roomId = room ? room.id : null;
        return BlurtingAnswerDto.ToDto(
          answerEntity,
          roomId,
          user,
          iLike,
          likes.length,
        );
      }),
    );
    const blurtingPage: BlurtingPageDto = BlurtingPageDto.ToDto(
      group,
      question,
      answersDto,
    );
    return blurtingPage;
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
    if (answer.length >= 100) {
      const point = await this.pointService.giveBlurtingPoint(userId);
      return point;
    }

    const users = await this.userService.getGroupUsers(userId);
    users.map(async (user) => {
      if (user.id !== userId) {
        await this.fcmService.sendPush(
          user.id,
          `${question.no}번째 질문에 새로운 답변이 등록되었습니다!`,
          'blurting',
        );
      }
    });

    return false;
  }

  async isMatching(user: UserEntity) {
    const sexOrient = this.userService.getUserSexOrient(user.userInfo);
    //const region = user.userInfo.region.split(' ')[0];
    const qName = /*`${region}_*/ `${sexOrient}`;
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

  async registerGroupQueue(id: number) {
    try {
      const user = await this.userService.findUserByVal('id', id);
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      //const region = user.userInfo.region.split(' ')[0];
      const qName = /*`${region}_*/ `${sexOrient}`;

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
          new Date(new Date().getTime() - 1000 * 60 * 60 * 63)
      ) {
        return 1;
      }

      if (groupQueue.length < 2) {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return 0;
      }
      if (sexOrient.endsWith('homo') || sexOrient.endsWith('bisexual')) {
        if (groupQueue.length >= 5) {
          const groupIds = groupQueue.slice(0, 5);

          groupIds.push(id);
          if (groupIds.length !== 6) {
            throw new Error(
              '왜인지 모르겠지만 groupIds가 이상함.' + groupIds.toString(),
            );
          }
          await this.createGroup(groupIds);
          await this.cacheManager.set(qName, groupQueue.slice(5));
          return 1;
        } else {
          groupQueue.push(id);
          await this.cacheManager.set(qName, groupQueue);
          return 0;
        }
      }
      const oppositeSexorient = this.getOppositeQueueName(sexOrient);
      const oppositeQueueName = /*`${region}_*/ `${oppositeSexorient}`;
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
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      //const region = user.userInfo.region.split(' ')[0];
      const qName = /*`${region}_*/ `${sexOrient}`;

      const groupQueue: number[] = await this.cacheManager.get(qName);
      if (groupQueue.includes(id)) {
        return 2;
      }
      groupQueue.push(id);
      await this.cacheManager.set(qName, groupQueue);
      return 0;
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
    return BlurtingProfileDto.ToDto(userInfo, roomId);
  }

  async likeAnswer(userId: number, answerId: number) {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['user', 'user.group', 'question', 'question.group'],
    });
    if (!answer) throw new NotFoundException('answer not found');
    const like = await this.likeRepository.findOne({
      where: {
        answerId,
        userId,
      },
    });
    if (!like) {
      const newLike = this.likeRepository.create({
        answerId,
        userId,
      });
      answer.allLikes++;
      await this.likeRepository.save(newLike);
      await this.answerRepository.save(answer);
      return true;
    } else {
      await this.likeRepository.delete({
        answerId,
        userId,
      });
      answer.allLikes--;
      await this.answerRepository.save(answer);
      return false;
    }
  }

  async makeArrow(userId: number, toId: number, day: number) {
    const user = await this.userService.findUserByVal('id', userId);

    const arrow = await this.arrowRepository.findOne({
      where: {
        from: { id: userId },
        group: user.group,
      },
      order: { no: 'DESC' },
    });
    const no = day;
    if (arrow && arrow.no >= day) {
      throw new BadRequestException('이미 화살표 존재');
    }
    const newArrow = this.arrowRepository.create({
      from: { id: userId },
      to: toId === -1 ? null : { id: toId },
      group: user.group,
      no: no,
    });

    await this.arrowRepository.save(newArrow);
    if (toId == -1 || toId == userId) return;
    await this.fcmService.sendPush(
      toId,
      `${user.userNickname}님이 당신에게 화살을 보냈습니다!`,
      'blurting',
    );
    const newEntity = this.notificationRepository.create({
      user: { id: toId },
      body: `${user.userNickname}님이 당신에게 화살을 보냈습니다!`,
    });
    await this.notificationRepository.insert(newEntity);
  }

  async getArrows(userId: number): Promise<ArrowInfoResponseDto> {
    const user = await this.userService.findUserByVal('id', userId);
    if (!user.group) return { iSended: [], iReceived: [] };

    const sendArrows = await this.arrowRepository.find({
      where: {
        from: { id: userId },
        group: user.group,
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
    const user = await this.userService.findUserByVal('id', userId);
    const arrowDtos = await this.getArrows(userId);
    const finalSend = arrowDtos.iSended[arrowDtos.iSended.length - 1];
    const finalRecieves = arrowDtos.iReceived;
    let matched;

    if (finalSend.day != 3) {
      matched = [];
    } else {
      matched = finalRecieves.filter((recieve) => {
        if (
          recieve.day === finalSend.day &&
          recieve.fromId === finalSend.toId
        ) {
          return true;
        }
      });
    }

    return {
      myname: user.userNickname,
      mysex: user.userInfo.sex,
      othername: matched.length > 0 ? finalSend.username : null,
      othersex: matched.length > 0 ? finalSend.userSex : null,
    };
  }

  async getGroupInfo(userId: number): Promise<OtherPeopleInfoDto[]> {
    const groupUsers = await this.userService.getGroupUsers(userId);

    const reports = await this.reportRepository.find({
      where: { reportedUser: In(groupUsers.map((user) => user.id)) },
      relations: ['reportedUser'],
    });
    const userSex = groupUsers.filter((user) => user.id === userId)[0].userInfo
      .sex;

    const userSexOrient = groupUsers.filter((user) => user.id === userId)[0]
      .userInfo.sexOrient;

    const filteredSex = [];

    if (userSexOrient === SexOrient.Bisexual) {
      filteredSex.push(Sex.Female, Sex.Male);
    } else if (userSexOrient === SexOrient.Heterosexual) {
      const sex = userSex === Sex.Female ? Sex.Male : Sex.Female;
      filteredSex.push(sex);
    } else {
      filteredSex.push(userSex);
    }

    const result = groupUsers
      .filter((user) => filteredSex.includes(user.userInfo.sex))
      .map((user) => {
        return {
          userId: user.id,
          userNickname: user.userNickname,
          userSex: user.userInfo.sex,
          reported:
            reports.filter((report) => report.reportedUser.id === user.id)
              .length > 0
              ? true
              : false,
        };
      });
    return result;
  }

  async addReply(
    userId: number,
    content: string,
    answerId: number,
  ): Promise<void> {
    const user = await this.userService.findUserByVal('id', userId);
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['user', 'question'],
    });
    if (!user || !answer)
      throw new NotFoundException('user or answer not found');
    await this.replyRepository.insert({
      user: user,
      answer: answer,
      content: content,
    });
    if (answer.user.id !== userId) {
      await this.fcmService.sendPush(
        answer.user.id,
        `${answer.question.no}번째 나의 답변에 댓글이 달렸습니다!`,
        'blurting',
      );
    }
  }
}
