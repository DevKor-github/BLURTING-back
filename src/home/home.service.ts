import { Injectable } from '@nestjs/common';
import { HomeInfoResponseDto, RandomUserDto } from './dtos/homInfoResponse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Chatting } from 'src/chat/models';
import { Model } from 'mongoose';
import {
  BlurtingAnswerRepository,
  BlurtingArrowRepository,
  BlurtingLikeRepository,
  UserRepository,
} from 'src/repositories';
import { compareDateGroupExist, getDateTimeOfNow } from 'src/common/util/time';
import { AnswerWithQuestionDto } from './dtos';
import { UserService } from 'src/user/user.service';
import { Sex, SexOrient } from 'src/common/enums';

@Injectable()
export class HomeService {
  constructor(
    private readonly likeRepository: BlurtingLikeRepository,
    private readonly arrowRepository: BlurtingArrowRepository,
    private readonly userRepository: UserRepository,
    private readonly answerRepository: BlurtingAnswerRepository,
    @InjectModel(Chatting.name)
    private readonly chattingModel: Model<Chatting>,
    private readonly userService: UserService,
  ) {}

  async likeAnswer(userId: number, answerId: number) {
    const like = await this.likeRepository.findOne(answerId, userId);
    if (like) {
      await Promise.all([
        this.likeRepository.delete(answerId, userId),
        this.answerRepository.updateLikes(answerId, false),
      ]);
    } else {
      await Promise.all([
        this.likeRepository.insert(answerId, userId),
        this.answerRepository.updateLikes(answerId, true),
      ]);
    }
  }

  async getHomeInfo(userId: number): Promise<HomeInfoResponseDto> {
    const likes = await this.likeRepository.countByUserId(userId);

    let matchedArrows: number = 0;
    const arrows = await this.arrowRepository.findAll();
    const arrowSet = new Set();
    arrows.forEach((arrow) => {
      if (arrow.from?.id && arrow.to?.id) {
        const forwardKey = `${arrow.from.id}-${arrow.to.id}-${arrow.group.id}-${arrow.no}`;
        const reverseKey = `${arrow.to.id}-${arrow.from.id}-${arrow.group.id}-${arrow.no}`;

        if (arrowSet.has(reverseKey)) {
          matchedArrows++;
          arrowSet.delete(reverseKey);
        } else {
          arrowSet.add(forwardKey);
        }
      }
    });

    const user = await this.userRepository.findOneById(userId);
    let seconds = -1;
    if (user.group && compareDateGroupExist(user.group.createdAt)) {
      const timeOffset =
        getDateTimeOfNow().getTime() - user.group.createdAt.getTime();
      seconds = 8 * 60 * 60 * 1000 - (timeOffset % (8 * 60 * 60 * 1000));
    }

    const chats = await this.chattingModel.find();

    const startDayTime = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
    startDayTime.setHours(5, 0, 0, 0);
    let answers = await this.answerRepository.findTop(startDayTime);
    if (answers.length < 3) {
      answers = await this.answerRepository.findTop(new Date(2023, 0, 1));
    }
    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const iLike = await this.likeRepository.findOne(
          answerEntity.id,
          userId,
        );

        return AnswerWithQuestionDto.ToDto(
          answerEntity,
          null,
          iLike ? true : false,
        );
      }),
    );

    return {
      answers: answersDto,
      seconds,
      arrows: arrows.length,
      matchedArrows,
      chats: chats.length,
      likes,
    };
  }

  async getRandomUsers(userId: number): Promise<RandomUserDto[]> {
    const user = await this.userRepository.findOneById(userId);
    let oppositeSex: Sex[];
    if (user.userInfo.sexOrient == SexOrient.Bisexual) {
      oppositeSex = [Sex.Female, Sex.Male];
    } else if (user.userInfo.sexOrient == SexOrient.Homosexual) {
      oppositeSex = [user.userInfo.sex];
    } else if (user.userInfo.sex == Sex.Female) {
      oppositeSex = [Sex.Male];
    } else {
      oppositeSex = [Sex.Female];
    }

    const randomUsers = await this.userRepository.selectRandom(
      3,
      userId,
      oppositeSex,
      user.userInfo.sexOrient,
    );
    return Promise.all(
      randomUsers.map(async (user) => {
        const images = await this.userService.getUserImages(user.id);
        return new RandomUserDto(user, images);
      }),
    );
  }
}
