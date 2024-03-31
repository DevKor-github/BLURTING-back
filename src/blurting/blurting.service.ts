import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import {
  BlurtingArrowEntity,
  BlurtingAnswerEntity,
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  LikeEntity,
  NotificationEntity,
  ReplyEntity,
  BlurtingPreQuestionEntity,
} from 'src/entities';
import { UserService } from 'src/user/user.service';
import { In, Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Sex, SexOrient } from 'src/common/enums';
import { FcmService } from 'src/firebase/fcm.service';
import { ChatService } from 'src/chat/chat.service';
import { PointService } from 'src/point/point.service';
import {
  OtherPeopleInfoDto,
  BlurtingProfileDto,
  ArrowInfoResponseDto,
  BlurtingAnswerDto,
  BlurtingPageDto,
  ArrowResultResponseDto,
} from './dtos';
import { ReportEntity } from 'src/entities/report.entity';
import { QUESTION1, QUESTION2, QUESTION3 } from 'src/common/const';
import { State } from 'src/common/enums/blurtingstate.enum';

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
    @InjectQueue('renewaledBlurting') private readonly rQ: Queue,
    private readonly fcmService: FcmService,
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(BlurtingArrowEntity)
    private readonly arrowRepository: Repository<BlurtingArrowEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
    @InjectRepository(ReplyEntity)
    private readonly replyRepository: Repository<ReplyEntity>,
    @InjectRepository(BlurtingPreQuestionEntity)
    private readonly blurtingPreQuestionRepository: Repository<BlurtingPreQuestionEntity>,
  ) {}

  async processPreQuestions(
    group: BlurtingGroupEntity,
    no: number,
    users: number[],
  ) {
    const questionToProcess = await this.blurtingPreQuestionRepository.findOne({
      where: {
        group: group,
        no: no,
      },
    });
    if (!questionToProcess || no > 9) return;

    if (questionToProcess.isUploaded) return;
    const hour =
      new Date().getHours() + 9 >= 24
        ? new Date().getHours() + 9 - 24
        : new Date().getHours() + 9;
    if (hour >= 1 && hour <= 8) {
      const DNDEndsAt = new Date().setHours(23);
      const delay = DNDEndsAt - new Date().getTime();
      await this.rQ.add({ group, no: no, users }, { delay: delay });
      return;
    }
    await this.insertQuestionToGroup(questionToProcess.question, group, no);
    await Promise.all(
      users.map(async (userid) => {
        await this.fcmService.sendPush(
          userid,
          `${no}번째 질문이 등록되었습니다!`,
          'blurting',
        );
      }),
    );
    questionToProcess.isUploaded = true;
    await this.blurtingPreQuestionRepository.save(questionToProcess);
    if (no === 9) return;

    if (no % 3 === 0) {
      const nextPartStartsAt = new Date(
        group.createdAt.getTime() + (no / 3) * (3 * 60 * 60 * 1000),
      );
      const delay = new Date().getTime() - nextPartStartsAt.getTime();
      await this.rQ.add({ group, no: no + 1, users }, { delay: delay });
    } else {
      await this.rQ.add(
        { group, no: no + 1, users },
        { delay: 60 * 60 * 1000 },
      );
    }
  }

  async addPreQuestions(group: BlurtingGroupEntity) {
    const selected1: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION1.length);
      } while (selected1.find((e) => e.question == QUESTION1[rand]));
      const q = this.blurtingPreQuestionRepository.create({
        group: group,
        no: i + 1,
        question: QUESTION1[rand],
        isUploaded: false,
      });
      selected1.push(q);
    }

    const selected2: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION2.length);
      } while (selected2.find((e) => e.question == QUESTION2[rand]));
      const q = this.blurtingPreQuestionRepository.create({
        group: group,
        no: i + 4,
        question: QUESTION2[rand],
        isUploaded: false,
      });
      selected2.push(q);
    }

    const selected3: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION3.length);
      } while (selected3.find((e) => e.question == QUESTION3[rand]));
      const q = this.blurtingPreQuestionRepository.create({
        group: group,
        no: i + 7,
        question: QUESTION3[rand],
        isUploaded: false,
      });
      selected3.push(q);
    }

    await this.blurtingPreQuestionRepository.save(selected1);
    await this.blurtingPreQuestionRepository.save(selected2);
    await this.blurtingPreQuestionRepository.save(selected3);
  }

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

    await this.addPreQuestions(group);
    await this.processPreQuestions(group, 1, users);
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

  async getBlurtingState(id: number): Promise<State> {
    const user = await this.userService.findUserByVal('id', id);
    const sexOrient = this.userService.getUserSexOrient(user.userInfo);
    //const region = user.userInfo.region.split(' ')[0];
    const qName = /*`${region}_*/ `${sexOrient}`;
    const groupQueue: number[] = await this.cacheManager.get(qName);
    if (!groupQueue) {
      await this.cacheManager.set(qName, []);
    }

    if (groupQueue.includes(user.id)) {
      return State.Matching;
    }
    if (
      user.group &&
      user.group.createdAt >
        new Date(new Date().getTime() - 1000 * 60 * 60 * 63)
    ) {
      return State.Blurting;
    }
    if (user.group) {
      return State.End;
    }
    return State.Start;
  }

  async registerGroupQueue(id: number): Promise<State> {
    const state = await this.getBlurtingState(id);
    if (state == State.Matching || state == State.Blurting) {
      return state;
    }

    try {
      const user = await this.userService.findUserByVal('id', id);
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      //const region = user.userInfo.region.split(' ')[0];
      const qName = /*`${region}_*/ `${sexOrient}`;
      const groupQueue: number[] = await this.cacheManager.get(qName);

      if (groupQueue.length < 2) {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return State.Start;
      }

      if (sexOrient.endsWith('homo') || sexOrient.endsWith('bisexual')) {
        if (groupQueue.length >= 5) {
          const groupIds = groupQueue.slice(0, 5);

          groupIds.push(id);
          await this.createGroup(groupIds);
          await this.cacheManager.set(qName, groupQueue.slice(5));
          return State.Blurting;
        } else {
          groupQueue.push(id);
          await this.cacheManager.set(qName, groupQueue);
          return State.Start;
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
        await this.createGroup(groupIds);
        return State.Blurting;
      } else {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return State.Start;
      }
    } catch (err) {
      console.log(err);
      const user = await this.userService.findUserByVal('id', id);
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      //const region = user.userInfo.region.split(' ')[0];
      const qName = /*`${region}_*/ `${sexOrient}`;

      const groupQueue: number[] = await this.cacheManager.get(qName);
      if (groupQueue.includes(id)) {
        return State.Matching;
      }
      groupQueue.push(id);
      await this.cacheManager.set(qName, groupQueue);
      return State.Start;
    }
  }

  getOppositeQueueName(queue: string): string {
    if (queue === 'male') return 'female';
    else if (queue === 'female') return 'male';
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
      where: { question },
      order: { postedAt: 'ASC', reply: { createdAt: 'DESC' } },
      relations: ['question', 'user', 'reply', 'reply.user'],
    });

    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const iLike = await this.likeRepository.find({
          where: {
            answerId: answerEntity.id,
            userId: id,
          },
        });

        const room = answerEntity.user
          ? await this.chatService.findCreatedRoom([id, answerEntity.user.id])
          : null;
        const user = answerEntity.user
          ? await this.userService.findUserByVal('id', answerEntity.user.id)
          : null;

        return BlurtingAnswerDto.ToDto(
          answerEntity,
          room?.id,
          user,
          iLike.length > 0 ? true : false,
          answerEntity.allLikes,
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

  async checkAllAnswered(questionId: number) {
    const answers = await this.answerRepository.find({
      where: {
        question: { id: questionId },
      },
    });
    return answers.length === 6;
  }

  async postAnswer(
    userId: number,
    questionId: number,
    answer: string,
  ): Promise<number | boolean> {
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

    await this.answerRepository.save(answerEntity);
    if (this.checkAllAnswered(questionId) && question.no / 3 !== 0) {
      const users = await this.userService.getGroupUsers(userId);
      await this.rQ.add(
        {
          group: question.group,
          no: question.no + 1,
          users: users.map((u) => u.id),
        },
        { delay: 10 * 60 * 1000 },
      );
    }
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

  async getProfile(id: number, other: number): Promise<BlurtingProfileDto> {
    const userInfo = await this.userService.getUserProfile(other, []);
    const room = await this.chatService.findCreatedRoom([id, other]);
    return BlurtingProfileDto.ToDto(userInfo, room?.id);
  }

  async likeAnswer(userId: number, answerId: number): Promise<boolean> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['user', 'user.group', 'question', 'question.group'],
    });
    if (!answer) throw new NotFoundException('answer not found');

    const like = await this.likeRepository.findOne({
      where: { answerId, userId },
    });
    if (!like) {
      answer.allLikes++;
      await Promise.all([
        this.likeRepository.save(
          this.likeRepository.create({ answerId, userId }),
        ),
        this.answerRepository.save(answer),
      ]);
      return true;
    } else {
      answer.allLikes--;
      await Promise.all([
        this.likeRepository.delete({ answerId, userId }),
        this.answerRepository.save(answer),
      ]);
      return false;
    }
  }

  async getGroupInfo(userId: number): Promise<OtherPeopleInfoDto[]> {
    const groupUsers = await this.userService.getGroupUsers(userId);
    const reports = await this.reportRepository.find({
      where: { reportedUser: In(groupUsers.map((user) => user.id)) },
      relations: ['reportedUser'],
    });
    const { sex: userSex, sexOrient: userSexOrient } = groupUsers.find(
      (user) => user.id === userId,
    ).userInfo;
    const filteredSex: Sex[] = [];

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
          reported: reports.some(
            (report) => report.reportedUser.id === user.id,
          ),
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

  async makeArrow(userId: number, toId: number, day: number): Promise<void> {
    const user = await this.userService.findUserByVal('id', userId);
    const question = await this.questionRepository.find({
      where: {
        group: user.group,
      },
      order: {
        no: 'DESC',
      },
    });
    if (question.length / 3 < day)
      throw new BadRequestException(day + ' part가 끝나지 않았습니다.');

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
        fromId: arrow.from?.id ?? -1,
        toId: userId,
        day: arrow.no,
        username: arrow.from?.userNickname,
        userSex: arrow.from?.userInfo.sex,
      };
    });

    const receiveDto = receiveArrows.map((arrow) => {
      return {
        fromId: arrow.from?.id ?? -1,
        toId: userId,
        day: arrow.no,
        username: arrow.from?.userNickname,
        userSex: arrow.from?.userInfo.sex,
      };
    });
    return { iSended: sendDto, iReceived: receiveDto };
  }

  async getFinalArrow(userId: number): Promise<ArrowResultResponseDto> {
    const user = await this.userService.findUserByVal('id', userId);
    const arrowDtos = await this.getArrows(userId);
    const finalSend = arrowDtos.iSended[arrowDtos.iSended.length - 1];
    const finalRecieves = arrowDtos.iReceived;
    let matched;

    if (finalSend == undefined || finalSend == null || finalSend?.day != 3) {
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
      othername: matched.length > 0 ? finalSend?.username : null,
      othersex: matched.length > 0 ? finalSend?.userSex : null,
    };
  }
}
