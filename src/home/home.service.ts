import { Injectable } from '@nestjs/common';
import { HomeInfoResponseDto } from './dtos/homInfoResponse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  BLurtingArrowEntity,
  BlurtingAnswerEntity,
  LikeEntity,
  UserEntity,
} from 'src/entities';
import { InjectModel } from '@nestjs/mongoose';
import { Chatting } from 'src/chat/models';
import { Model } from 'mongoose';
import { BlurtingAnswerDto } from 'src/dtos/blurtingPage.dto';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @InjectRepository(BLurtingArrowEntity)
    private readonly arrowRepository: Repository<BLurtingArrowEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BlurtingAnswerEntity)
    private readonly answerRepository: Repository<BlurtingAnswerEntity>,
    @InjectModel(Chatting.name)
    private readonly chattingModel: Model<Chatting>,
  ) {}
  async getHomeInfo(userId: number): Promise<HomeInfoResponseDto> {
    const likes = await this.likeRepository.count({
      where: { answer: { user: { id: userId } } },
    });

    const arrows = await this.arrowRepository.find();
    let matchedArrows: number = 0;
    for (let i = 0; i < arrows.length; i++) {
      for (let j = 0; j < arrows.length; ++j) {
        if (arrows[i].from == arrows[j].to && arrows[i].to == arrows[j].from)
          matchedArrows++;
      }
    }
    matchedArrows = Math.ceil(matchedArrows / 2);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['group'],
    });
    let seconds = -1;
    if (user.group) {
      const timeOffset = new Date().getTime() - user.group.createdAt.getTime();
      seconds = 8 * 60 * 60 * 1000 - (timeOffset % (8 * 60 * 60 * 1000));
    }
    const chats = await this.chattingModel.find();
    const startDayTime = new Date(new Date().getTime() - 5 * 60 * 60 * 1000);
    startDayTime.setHours(5, 0, 0, 0);
    const answers = await this.answerRepository.find({
      where: { postedAt: MoreThan(startDayTime) },
      order: {
        allLikes: 'DESC',
      },
      relations: ['user', 'user.userInfo', 'question'],
      take: 3,
    });
    const answersDto = await Promise.all(
      answers.map(async (answerEntity) => {
        const like = await this.likeRepository.findOne({
          where: {
            answerId: answerEntity.id,
            userId: userId,
          },
        });
        let iLike = false;
        if (like) iLike = true;
        return {
          question: answerEntity.question.question,
          ...BlurtingAnswerDto.ToDto(
            answerEntity,
            null,
            answerEntity.user,
            iLike,
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
