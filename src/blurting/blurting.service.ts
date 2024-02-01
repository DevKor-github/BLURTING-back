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
import { Between, In, Repository } from 'typeorm';
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

    const questions = [
      '연인을 볼 때 가장 중요한 외적 요소 1가지는?',
      '연인을 볼 때 가장 중요한 내적 요소 1가지는?',
      '선호하는 데이트 유형과 이유는?',
      '본인의 현재 플레이리스트에 있는 곡 세 개로 자신을 소개해주세요!',
      '본인의 인생 영화와 그 이유를 알려주세요',
      '본인이 연인과 공유하고 싶은 취미는?',
      '2024년 상반기에 달성하고 싶은 목표3가지를 공유해주세요!',
      '애인의 남사친/여사친은 어디까지 허용 가능하시나요?',
      '연인에게서 절대 용납할 수 없는 잘못이 있다면 무엇인가요?',
      '지금 현재 연애하고 싶다고 느끼는 이유가 무엇인가요?',
      '본인이 선호하는 연인의 옷 스타일을 설명해주세요!',
      '소개팅을 받을 때 상대에 대해 가장 궁금한 부분은 어떤 것인가요?',
      '연인을 볼 때 가장 중요한 것을 순서대로 말해주세요: 인성, 학력, 궁합, 재력, 얼굴',
      '좋아하는 이성에게 호감을 표현하는 본인만의 방법이 있나요?',
      '본인이 선호하는 연인과의 연락빈도와 그 이유를 알려주세요!',
      '연인과의 싸움은 어떻게 해결하는 것을 선호하시나요?',
      '선호하는 데이트 빈도와 그 이유는 무엇인가요?',
      '데이트 계획은 어떻게 세우는 걸 선호하시나요?',
      '데이트 비용은 어떻게 정산하는 것을 선호하시나요?',
      '내 맞춤법이 틀렸을 때 애인이 어떻게 반응하면 좋을 것 같나요?',
      '본인의 옷 스타일을 설명해주세요!',
      '내가 아플 때 애인에게 바라는 것이 있나요?',
      '기념일은 어디까지 챙기고 싶은가요?',
      '이별에도 지켜야 한다고 생각하는 예의가 있다면 무엇인가요?',
      '애인에게 질투가 많은 편인가요?',
      '고민이 있을 때 애인에게 이야기하는 편인가요?',
      '연애를 인생에서 몇 순위로 생각하나요?',
      '연인 사이에 가장 중요하다고 생각하는 게 무엇인가요?',
      '썸의 기간은 어느 정도가 적당하다고 생각하나요?',
      '장거리 연애 어느 정도 거리까지 할 수 있나요?',
      '연인이 지출하는 데이트 비용이 적은 거 같아 속상하다면 어떻게 대처할 것 같나요?',
      '애인의 이전 연애 횟수가 많다면 어떻게 생각하시나요?',
      '이성들과 함께 여행 가는 애인, 용납할 수 있나요?',
      '내 인생에서 가장 중요한 가치는 무엇인가요?',
      '결혼하고 싶은 이성, 연애하고 싶은 이성의 차이는 무엇이라고 생각하시나요?',
      '당신의 전공에 대해 이야기 해주세요!',
      '사랑의 정의가 뭐라고 생각하시나요?',
      '최근 관심사에 대해 설명해주세요!',
      '좋아하는 음악 장르는 무엇인가요?',
      '집에서 심심할 때 주로 무슨 일을 하나요?',
      '이상형은 무엇인가요?',
      '연하 동갑 연상 중 어떤 연애를 선호하시나요?',
      '이성을 볼 때 가장 중요한 3가지는 무엇인가요?',
      '결혼하고 싶은 나이는 언제인가요? 이유를 설명해주세요!',
      '나의 성격을 소개해주세요!',
      '내 인생 좌우명은 무엇인가요?',
      '나를 표현할 수 있는 키워드를 적어주세요!',
      '배워본 운동이 있다면 무엇인가요?',
      '처음 해본 아르바이트는 어떤 일이었나요?',
      '지금 당장 해보고 싶은 것이 있나요?',
      '인생의 터닝포인트가 있었다면 어떤 사건이었나요?',
      '추천하고 싶은 책을 설명해주세요!',
      '해보고 싶은 직업이 있다면 무엇인가요?',
      '배우고 싶은 외국어가 있다면 무엇인가요?',
      '좋아하는 영화 장르와 그 이유를 설명해주세요!',
      '최근 재미있게 본 드라마를 이야기해주세요!',
      '좋아하는 배우가 있다면 누구인가요?',
      '내가 가진 가장 쓸모 없는 물건과 얻게 된 경로를 알려주세요!',
      '나만의 스트레스 해소법은 무엇인가요?',
      '요즘 고민이 있다면 어떤 고민인가요?',
      '좋아하는 날씨와 추억을 알려주세요!',
      '가장 인상적이었던 여행지는 어디인가요?',
      '가고 싶은 여행지는 어디인가요?',
      '좋아하는 음식과 식당을 추천해주세요!',
      '싫어하거나 못 먹는 음식이 있나요?',
      '본인과 친해질 수 있는 방법을 알려주세요!',
      '친해지고 싶어지는 사람의 특징을 말해주세요!',
      '만나보고 싶은 사람이 있다면 어떤 성격인가요?',
      '당신이 활발한 시간은 낮인가요 밤인가요?',
      '당신은 낯을 가리는 편인가요?',
      '집에서 노는 걸 좋아하는 편인가요?',
      '몇 살까지 살고 싶은지, 그 이유는 무엇인가요?',
      '연락할 때 전화와 문자 중 무엇을 더 선호하나요?',
      '주말에 주로 무엇을 하면서 시간을 보내나요?',
      '아침에 일어나면 가장 먼저 하는 일은 무엇인가요?',
      '자기전에 마지막으로 하는 일은 무엇인가요?',
      '하루에 평균 몇시간동안 수면을 취하나요?',
      '넷플릭스에서 추천하는 드라마나 영화가 있나요?',
      '주량이 어느 정도인가요? 술을 좋아하시나요?',
      '좋아하는 술이 있나요?',
      '나의 버킷리스트 중 하나를 알려주세요!',
      '남기고 싶은 유언이 있다면 무엇인가요?',
      '내가 가진 것 중 가장 소중한 것을 말해주세요!',
      '지금 당신의 TMI 하나를 알려주세요!',
    ];

    const selected = [];
    for (let i = 0; i < 9; ++i) {
      let rand = 0;
      do {
        rand = Math.floor(Math.random() * questions.length);
      } while (selected.includes(questions[rand]));

      selected.push(questions[rand]);
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
    const region = user.userInfo.region.split(' ')[0];
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
      if (
        user.group &&
        user.group.createdAt <
          new Date(new Date().getTime() - 1000 * 60 * 60 * 63)
      ) {
        return 3;
      }
      if (user.group) {
        return 1;
      }
      const sexOrient = this.userService.getUserSexOrient(user.userInfo);
      const region = user.userInfo.region.split(' ')[0];
      const qName = /*`${region}_*/ `${sexOrient}`;

      let groupQueue: number[] = await this.cacheManager.get(qName);
      if (!groupQueue) {
        await this.cacheManager.set(qName, []);
        groupQueue = await this.cacheManager.get(qName);
      }
      if (groupQueue.includes(id)) {
        return 2;
      }

      if (groupQueue.length < 2) {
        groupQueue.push(id);
        await this.cacheManager.set(qName, groupQueue);
        return 0;
      }
      if (sexOrient.endsWith('homo')) {
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
      const region = user.userInfo.region.split(' ')[0];
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

    this.fcmService.sendPush(
      toId,
      `${user.userNickname}님이 당신에게 화살을 보냈습니다!`,
      'blurting',
    );
    const newEntity = this.notificationRepository.create({
      user: { id: userId },
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
    const selectedUser = await this.arrowRepository.findOne({
      where: { from: { id: userId } },
      order: { no: 'DESC' },
    });
    if (selectedUser.to == null) {
      return null;
    }

    const arrow = await this.arrowRepository.findOne({
      where: {
        from: { id: selectedUser.to.id },
        createdAt: Between(
          user.group.createdAt,
          new Date(user.group.createdAt.getTime() + 72 * 6 * 6 * 1000),
        ),
        no: 3,
      },
    });
    if (arrow.to == null) {
      return null;
    }

    return {
      myname: user.userNickname,
      mysex: user.userInfo.sex,
      othername: selectedUser.to.userNickname,
      othersex: selectedUser.to.userInfo.sex,
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
    const newReply = this.replyRepository.create({
      user: { id: userId },
      answer: { id: answerId },
      content,
    });
    await this.replyRepository.save(newReply);
  }
}
