import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  BlurtingGroupEntity,
  BlurtingQuestionEntity,
  BlurtingPreQuestionEntity,
} from 'src/domain/entities';
import { UserService } from 'src/domain/user/user.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Sex, SexOrient } from 'src/common/enums';
import { FcmService } from 'src/domain/firebase/fcm.service';
import { ChatService } from 'src/domain/chat/chat.service';
import { PointService } from 'src/domain/point/point.service';
import {
  OtherPeopleInfoDto,
  BlurtingProfileDto,
  BlurtingAnswerDto,
  BlurtingPageDto,
  ArrowResultResponseDto,
} from './dtos';
import { QUESTION1, QUESTION2, QUESTION3 } from 'src/common/const';
import { State } from 'src/common/enums/blurtingstate.enum';
import {
  BlurtingAnswerRepository,
  BlurtingArrowRepository,
  BlurtingGroupRepository,
  BlurtingLikeRepository,
  BlurtingPreQuestionRepository,
  BlurtingQuestionRepository,
  BlurtingReplyRepository,
  NotificationRepository,
  ReportRepository,
} from 'src/domain/repositories';

@Injectable()
export class BlurtingService {
  constructor(
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly pointService: PointService,
    private readonly groupRepository: BlurtingGroupRepository,
    private readonly questionRepository: BlurtingQuestionRepository,
    private readonly answerRepository: BlurtingAnswerRepository,
    private readonly notificationRepository: NotificationRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('renewaledBlurting') private readonly rQ: Queue,
    private readonly fcmService: FcmService,
    private readonly likeRepository: BlurtingLikeRepository,
    private readonly arrowRepository: BlurtingArrowRepository,
    private readonly reportRepository: ReportRepository,
    private readonly replyRepository: BlurtingReplyRepository,
    private readonly blurtingPreQuestionRepository: BlurtingPreQuestionRepository,
  ) {}

  async processPreQuestions(
    group: BlurtingGroupEntity,
    no: number,
    users: number[],
  ): Promise<void> {
    const questionToProcess = await this.blurtingPreQuestionRepository.findOne(
      group.id,
      no,
    );
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
    await this.blurtingPreQuestionRepository.updateToUpload(
      questionToProcess.id,
    );
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

  async addPreQuestions(group: BlurtingGroupEntity): Promise<void> {
    const selected1: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION1.length);
      } while (selected1.find((e) => e.question == QUESTION1[rand]));
      await this.blurtingPreQuestionRepository.insert({
        groupId: group.id,
        no: i + 1,
        question: QUESTION1[rand],
      });
    }

    const selected2: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION2.length);
      } while (selected2.find((e) => e.question == QUESTION2[rand]));
      await this.blurtingPreQuestionRepository.insert({
        groupId: group.id,
        no: i + 4,
        question: QUESTION2[rand],
      });
    }

    const selected3: BlurtingPreQuestionEntity[] = [];
    for (let i = 0; i < 3; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * QUESTION3.length);
      } while (selected3.find((e) => e.question == QUESTION3[rand]));
      await this.blurtingPreQuestionRepository.insert({
        groupId: group.id,
        no: i + 7,
        question: QUESTION3[rand],
      });
    }
  }

  async createGroup(users: number[]): Promise<void> {
    const group = await this.groupRepository.insert();
    await Promise.all(
      users.map(async (id) => {
        await this.userService.updateUser(id, 'group', group);
        await this.fcmService.sendPush(
          id,
          '그룹 매칭이 완료되었습니다!',
          'blurting',
        );
        await this.notificationRepository.insert(
          id,
          '그룹 매칭이 완료되었습니다!',
        );
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
    await this.questionRepository.insert({
      groupId: group.id,
      question,
      no,
    });
  }

  async getBlurtingState(id: number): Promise<State> {
    const user = await this.userService.findUserByVal('id', id);
    const sexOrient = this.userService.getUserSexOrient(user.userInfo);
    //const region = user.userInfo.region.split(' ')[0];
    const qName = `${sexOrient}_beta`;
    const groupQueue: number[] = await this.cacheManager.get(qName);
    if (!groupQueue) {
      await this.cacheManager.set(qName, []);
    }

    if (groupQueue.includes(user.id)) {
      return State.Matching;
    }
    if (user.group && (await this.checkPartOver(user.group.id))) {
      return State.Arrowing;
    }
    if (user.group && this.checkGroupOver(user.group.id)) {
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
      const qName = `${sexOrient}_beta`;
      let groupQueue: number[] = await this.cacheManager.get(qName);
      if (!groupQueue) {
        await this.cacheManager.set(qName, []);
        groupQueue = [];
      }
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

      if (sexOrient == 'female' || sexOrient == 'male') {
        const oppositeSexorient = this.getOppositeQueueName(sexOrient);
        const oppositeQueueName = `${oppositeSexorient}_beta`;
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
          await this.cacheManager.set(
            oppositeQueueName,
            oppositeQueue.slice(3),
          );
          const groupIds = firstGroupIds.concat(secondGroupIds);
          await this.createGroup(groupIds);
          return State.Blurting;
        } else {
          groupQueue.push(id);
          await this.cacheManager.set(qName, groupQueue);
          return State.Start;
        }
      }
    } catch (err) {
      const user = await this.userService.findUserByVal('id', id);
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      //const region = user.userInfo.region.split(' ')[0];
      const qName = `${sexOrient}_beta`;

      let groupQueue: number[] = await this.cacheManager.get(qName);
      if (!groupQueue) {
        await this.cacheManager.set(qName, []);
        groupQueue = [];
      }
      if (groupQueue.includes(id)) {
        return State.Matching;
      }
      groupQueue.push(id);
      await this.cacheManager.set(qName, groupQueue);
      return State.Start;
    }
  }

  getOppositeQueueName(queue: 'male' | 'female'): string {
    return queue === 'male' ? 'female' : 'male';
  }

  async getBlurting(
    id: number,
    group: BlurtingGroupEntity,
    no: number,
  ): Promise<BlurtingPageDto> {
    let question: BlurtingQuestionEntity;
    if (no == 0) {
      question = await this.questionRepository.findLatestByGroup(group.id);
    } else {
      question = await this.questionRepository.findOneByGroup(group.id, no);
    }

    if (!question) {
      throw new BadRequestException('invalid question no');
    }

    const answers = await this.answerRepository.findByQuestion(question.id);

    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const iLike = await this.likeRepository.findOne(answerEntity.id, id);

        const room = answerEntity.user
          ? await this.chatService.findCreatedRoom([id, answerEntity.user.id])
          : null;

        return BlurtingAnswerDto.ToDto(
          answerEntity,
          room?.id,
          iLike ? true : false,
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

  async checkAllAnswered(questionId: number): Promise<boolean> {
    const answers = await this.answerRepository.findByQuestion(questionId);
    return answers.length === 6;
  }

  async checkPartOver(groupId: number): Promise<boolean> {
    const question = await this.questionRepository.findLatestByGroup(groupId);

    if (question.no % 3 === 0) {
      return (
        (await this.checkAllAnswered(question.id)) ||
        question.createdAt.getTime() - new Date().getTime() > 60 * 60 * 1000
      );
    }
    return (
      false ||
      question.createdAt.getTime() - new Date().getTime() > 60 * 60 * 1000
    );
  }

  async checkGroupOver(groupId: number): Promise<boolean> {
    const question = await this.questionRepository.findLatestByGroup(groupId);
    if (question.no === 9) {
      return await this.checkAllAnswered(question.id);
    }
    return false;
  }

  async postAnswer(
    userId: number,
    questionId: number,
    answer: string,
  ): Promise<number | boolean> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new BadRequestException('존재하지 않는 질문입니다.');
    }

    const user = await this.userService.findUserByVal('id', userId);
    await this.answerRepository.insert({
      userId,
      questionId,
      answer,
      userSex: user.userInfo.sex,
    });
    if (this.checkAllAnswered(questionId) && question.no % 3 !== 0) {
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
    if (!(await this.answerRepository.existsByUser(userId, questionId))) {
      return await this.pointService.giveBlurtingPoint(userId);
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
    const answer = await this.answerRepository.findById(answerId);
    if (!answer) throw new NotFoundException('answer not found');

    const like = await this.likeRepository.findOne(answerId, userId);
    if (!like) {
      await Promise.all([
        this.likeRepository.insert(answerId, userId),
        this.answerRepository.updateLikes(answerId, true),
      ]);
      return true;
    } else {
      await Promise.all([
        this.likeRepository.delete(answerId, userId),
        this.answerRepository.updateLikes(answerId, false),
      ]);
      return false;
    }
  }

  async getGroupInfo(userId: number): Promise<OtherPeopleInfoDto[]> {
    const groupUsers = await this.userService.getGroupUsers(userId);
    const reports = await this.reportRepository.findAllReported(userId);
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
      .map((user) => ({
        userId: user.id,
        userNickname: user.userNickname,
        userSex: user.userInfo.sex,
        reported: reports.some((report) => report.reportedUser.id === user.id),
      }));
    return result;
  }

  async addReply(
    userId: number,
    content: string,
    answerId: number,
  ): Promise<void> {
    const user = await this.userService.findUserByVal('id', userId);
    const answer = await this.answerRepository.findById(answerId);
    if (!user || !answer)
      throw new NotFoundException('user or answer not found');

    await this.replyRepository.insert({ userId, answerId, content });
    if (answer.user.id !== userId) {
      await this.fcmService.sendPush(
        answer.user.id,
        `${answer.question.no}번째 나의 답변에 댓글이 달렸습니다!`,
        'blurting',
      );
    }
  }

  async makeArrow(userId: number, toId: number, part: number): Promise<void> {
    const user = await this.userService.findUserByVal('id', userId);
    const question = await this.questionRepository.findByGroup(user.group.id);
    if (question.length / 3 < part)
      throw new BadRequestException(part + ' part가 끝나지 않았습니다.');

    const arrow = await this.arrowRepository.findOneFromId(
      userId,
      user.group.id,
    );
    const no = part;
    if (arrow && arrow.no >= part) {
      throw new BadRequestException('이미 화살표 존재');
    }
    await this.arrowRepository.insert({
      fromId: userId,
      toId,
      groupId: user.group.id,
      no,
    });
    if (toId == -1 || toId == userId) return;
    await this.fcmService.sendPush(
      toId,
      `${user.userNickname}님이 당신에게 화살을 보냈습니다!`,
      'blurting',
    );
    await this.notificationRepository.insert(
      toId,
      `${user.userNickname}님이 당신에게 화살을 보냈습니다!`,
    );
  }

  async getArrows(userId: number): Promise<ArrowResultResponseDto> {
    const user = await this.userService.findUserByVal('id', userId);
    if (!user.group)
      return { matching: false, matchedWith: null, iReceived: [] };

    let matchedWith = null;
    let matching = false;
    const question = await this.questionRepository.findLatestByGroup(
      user.group.id,
    );
    const part = Math.floor(question.no / 3);

    const sendArrow = await this.arrowRepository.findFromId(
      userId,
      user.group.id,
      part,
    );
    if (!sendArrow) {
      return { matching: false, matchedWith: null, iReceived: [] };
    }
    const receiveArrows = await this.arrowRepository.findToId(
      userId,
      user.group.id,
      part,
    );

    const receiveDto = await Promise.all(
      receiveArrows.map(async (arrow) => {
        if (sendArrow.to === arrow.from) {
          matching = true;
          const images = await this.userService.getUserImages(arrow.from?.id);
          matchedWith = await this.userService.getUserProfile(
            arrow.from?.id,
            images,
          );
        }
        return {
          fromId: arrow.from?.id ?? -1,
          nickname: arrow.from?.userNickname,
          sex: arrow.from?.userInfo.sex,
        };
      }),
    );
    if (!matching) {
      let user;
      if (sendArrow && sendArrow.to) {
        const images = await this.userService.getUserImages(sendArrow.to.id);
        user = await this.userService.getUserProfile(sendArrow.to.id, images);
      }
      return {
        matching,
        matchedWith: sendArrow.to ? user : null,
        iReceived: receiveDto,
      };
    }

    return { matching, matchedWith, iReceived: receiveDto };
  }
}
