import { Injectable } from '@nestjs/common';
import { HomeInfoResponseDto } from './dtos/homInfoResponse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Chatting } from 'src/chat/models';
import { Model } from 'mongoose';
import { BlurtingAnswerDto } from 'src/blurting/dtos/pageResponse.dto';
import {
  BlurtingAnswerRepository,
  BlurtingArrowRepository,
  BlurtingLikeRepository,
  UserRepository,
} from 'src/repositories';

@Injectable()
export class HomeService {
  constructor(
    private readonly likeRepository: BlurtingLikeRepository,
    private readonly arrowRepository: BlurtingArrowRepository,
    private readonly userRepository: UserRepository,
    private readonly answerRepository: BlurtingAnswerRepository,
    @InjectModel(Chatting.name)
    private readonly chattingModel: Model<Chatting>,
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
    for (let i = 0; i < arrows.length; i++) {
      for (let j = i + 1; j < arrows.length; ++j) {
        if (
          arrows[i].from != null &&
          arrows[i].to != null &&
          arrows[j].from != null &&
          arrows[j].to != null &&
          arrows[i].from.id == arrows[j].to.id &&
          arrows[i].to.id == arrows[j].from.id
        ) {
          matchedArrows++;
        }
      }
    }

    const user = await this.userRepository.findOneById(userId);
    let seconds = -1;
    if (
      user.group &&
      user.group.createdAt >
        new Date(new Date().getTime() - 1000 * 60 * 60 * 63)
    ) {
      const timeOffset =
        new Date().getTime() +
        9 * 60 * 60 * 1000 -
        user.group.createdAt.getTime();
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

        return {
          question: answerEntity.question.question,
          ...BlurtingAnswerDto.ToDto(
            answerEntity,
            null,
            answerEntity.user,
            iLike ? true : false,
            answerEntity.allLikes,
          ),
        };
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
}
