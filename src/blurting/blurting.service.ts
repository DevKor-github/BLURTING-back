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
  UserInfoEntity,
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
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(BLurtingArrowEntity)
    private readonly arrowRepository: Repository<BLurtingArrowEntity>,
    @InjectRepository(ReportEntity)
    private readonly reportRepository: Repository<ReportEntity>,
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
          '그룹 매칭이 완료되었습니다.',
          'blurting',
        );
      }),
    );

    const questions = [
      '연인을 볼 때 가장 중요한 외적 요소 1가지는?',
      '연인을 볼 때 가장 중요한 내적 요소 1가지는?',
      '선호하는 데이트 유형과 이유는? ( 맛집탐방 / 집돌이 / 예술(전시회, 뮤지컬, 영화) / 액티비티 (실내 클라이밍,등 ) )',
      '본인의 현재 플레이리스트에 있는 곡 세 개로 자신을 소개해주세요',
      '본인의 인생 영화와 그 이유를 알려주세요',
      '본인이 연인과 공유하고 싶은 취미는?',
      '2024년 상반기에 달성하고 싶은 목표3가지를 공유해주세요!',
      '애인의 남사친/여사친은 어디까지 허용 가능하시나요? ( 둘이서 점심/ 둘이서 저녁 / 둘이서 술 / 기타 )',
      '연인에게서 절대 용납할 수 없는 잘못이 있나요 ? (ex. 거짓말, 연락두절, 등)',
      '지금 현재 연애하고 싶다고 느끼는 이유가 무엇인가요?',
      '본인이 선호하는 연인의 옷 스타일을 설명해주세요',
      '소개팅을 받을 때 상대에 대해 가장 궁금한 부분은 어떤 것인가요?',
      '연인을 볼 때 가장 중요한 것을 순서대로 말해주세요: 인성, 학력, 궁합, 재력, 얼굴',
      '좋아하는 이성에게 호감을 표현하는 본인만의 방법이 있나요? ( 적극적으로 다가간다 vs 눈치 채줄 때까지 기다린다 )',
      '본인이 선호하는 연인과의 연락빈도와 그 이유를 알려주세요 ( 밸런스게임: 일주일 이상 연락 없어도 상관 없음 vs. 연락을 30분이라도 안 보면 서운해함 )',
      '연인과의 싸움은 어떻게 해결하는 것을 선호하시나요?( 밸런스 게임 : 싸우면 풀릴 때까지 대화 요구하는 애인  vs 싸우면 연락두절되는 애인)',
      '선호하는 데이트 빈도와 그 이유는? (밸런스 게임: 한달에 하루 데이트 vs 매일 1시간 데이트)',
      '데이트 계획은 어떻게 세우는 걸 선호하시나요? ( 밸런스 게임 : 철저히 짜온 데이트 계획을 무조건 따라야 하는 애인 vs 아무 계획 없이 오는 애인 )',
      '데이트 비용은 어떻게 정산하는 것을 선호하시나요?(밸런스 게임: 원단위 까지 철저히 더치페이 vs 번갈아가며 한쪽이 계산 )',
      '맞춤법 틀리면 바로 지적하는 애인(여기선 되가 아니라 돼야..) vs 자기가 맞춤법 틀리는 애인(공부헸어?)',
      '작심삼일이고 매사에 게으른 애인 vs 갓생에 목숨 거는 애인(나랑 같이 새벽 5시 미라클 모닝하자~)',
      '손해봐도 화 안 내는 애인 (계산 이상하게 해도 그냥 웃으면서 넘김) vs 알뜰살뜰한 애인 (식당 가면 인스타 스토리 공유해서 공짜 음료수 꼭 받음)',
      '헛소리하면 차단하는 애인 vs 맨날 만약에 게임 지옥인 애인',
      '아파도 절대 말 안해주는 애인 vs 안 아파보이는데 계속 아프다고 찡찡대는 애인',
      '매일 설레는 데이트 vs 친구 같이 편안한 데이트',
      '기념일 하나도 안 챙기는 애인 vs 아무도 모르는 이상한 기념일 다 챙기는 애인(삽겹살 데이, 인삼데이 등등)',
      '길에서 전 애인을 마주친다면..? 못본 척 지나간다 vs 다가가서 인사한다',
      '어떤게 더 최악인지 이유와 함께 알려주세요: 환승 이별 vs 잠수 이별',
      '어떤게 더 최악인지 이유와 함께 알려주세요: 한달씩 만난 전애인이 3명 있는 애인 vs 5년 만난 전애인이 있는 애인',
      '모든 사람에게 친절한 애인 vs 모든 사람에게 무뚝뚝한 애인 ( 나 포함 )',
      '내가 무조건 1순위인 애인 vs 다른 게 1순위인 애인 (가족/ 커리어/ 등)',
      '연인이 1년간 외국으로 유학을 간다. 이때 나의 선택은?: 응원해주며 기다린다 vs 헤어진다',
      '자기 고민을 전부 나와 공유하는 애인 vs 고민이 있어도 절대 말 안해주는 애인',
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
    await this.queue.add(
      { group, question: null },
      { delay: 9 * questionDelay },
    );
  }

  async deleteGroup(group: BlurtingGroupEntity) {
    const users = await this.userService.getGroupUsers(group.id);
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

    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const like = await this.likeRepository.findOne({
          where: {
            answerId: answerEntity.id,
            userId: id,
          },
        });
        let iLike = false;
        if (like) iLike = true;

        if (answerEntity.user == null) {
          return BlurtingAnswerDto.ToDto(answerEntity, null, null, iLike);
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
        return BlurtingAnswerDto.ToDto(answerEntity, roomId, user, iLike);
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
    const sexOrient = this.getUserSexOrient(user.userInfo);

    const groupQueue: number[] = await this.cacheManager.get(sexOrient);
    if (!groupQueue) return false;
    if (groupQueue.includes(user.id)) {
      return true;
    }
    return false;
  }

  async registerGroupQueue(id: number) {
    const user = await this.userService.findUserByVal('id', id);
    if (user.group) {
      return 1;
    }
    const sexOrient = this.getUserSexOrient(user.userInfo);

    const groupQueue: number[] = await this.cacheManager.get(sexOrient);
    if (groupQueue.includes(id)) {
      return 2;
    }
    if (groupQueue.length < 2) {
      groupQueue.push(id);
      await this.cacheManager.set(sexOrient, groupQueue);
      return 0;
    }
    if (sexOrient.endsWith('homo')) {
      if (groupQueue.length >= 5) {
        const groupIds = groupQueue.slice(0, 5);
        groupIds.push(id);
        await this.createGroup(groupIds);
        await this.cacheManager.set(sexOrient, groupQueue.slice(5));
        return 1;
      } else {
        groupQueue.push(id);
        await this.cacheManager.set(sexOrient, groupQueue);
        return 0;
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
      return 1;
    } else {
      groupQueue.push(id);
      await this.cacheManager.set(sexOrient, groupQueue);
      return 0;
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

  async likeAnswer(userId: number, answerId: number) {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['user', 'user.group', 'question', 'question.group'],
    });
    if (!answer) throw new NotFoundException('answer not found');
    const user = await this.userService.findUser('id', userId);
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
      if (user.group.id == answer.question.group.id) answer.groupLikes++;
      answer.allLikes++;
      await this.likeRepository.save(newLike);
      await this.answerRepository.save(answer);
      return true;
    } else {
      await this.likeRepository.delete({
        answerId,
        userId,
      });
      if (user.group.id == answer.question.group.id) answer.groupLikes--;
      answer.allLikes--;
      await this.answerRepository.save(answer);
      return false;
    }
  }

  async makeArrow(userId: number, toId: number) {
    const user = await this.userService.findUserByVal('id', userId);

    const arrow = await this.arrowRepository.findOne({
      where: {
        from: { id: userId },
        group: user.group,
      },
      order: { no: 'DESC' },
    });
    let no = 1;
    if (arrow) no = arrow.no + 1;

    const newArrow = this.arrowRepository.create({
      from: { id: userId },
      to: toId === -1 ? null : { id: toId },
      group: user.group,
      no: no,
    });

    await this.arrowRepository.save(newArrow);

    this.fcmService.sendPush(
      toId,
      `${user.userNickname}님이 당신에게 화살표를 보냈습니다!`,
      'blurting',
    );
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
}
