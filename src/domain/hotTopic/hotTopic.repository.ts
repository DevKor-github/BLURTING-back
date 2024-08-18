import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, Repository } from 'typeorm';
import { HotTopicQuestionEntity } from './entities/hotTopicQuestion.entity';
import { HotTopicAnswerEntity } from './entities/hotTopicAnswer.entity';
import { HotTopicLikeEntity } from './entities/hotTopicLike.entity';
import { HotTopicAnswerLikeEntity } from './entities/hotTopicAnswerLike.entity';
import { HotTopicSumResponseDto } from './dtos/HotTopicSumResponse.dto';
import { PagedResponse } from 'src/common/pagedResponse.dto';
import { HotTopicInfoResponseDto } from './dtos/HotTopicInfoResponse.dto';
import type { HotTopicRequestDto } from './dtos/HotTopicRequest.dto';
import type { HotTopicAnswerRequestDto } from './dtos/HotTopicAnswerRequest.dto';

@Injectable()
export class HotTopicRepository {
  private readonly hotTopicRepository: Repository<HotTopicQuestionEntity>;
  private readonly hotTopicAnswerRepository: Repository<HotTopicAnswerEntity>;
  private readonly hotTopicLikeRepository: Repository<HotTopicLikeEntity>;
  private readonly hotTopicAnswerLikeRepository: Repository<HotTopicAnswerLikeEntity>;
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.hotTopicAnswerLikeRepository = this.dataSource.getRepository(
      HotTopicAnswerLikeEntity,
    );
    this.hotTopicLikeRepository =
      this.dataSource.getRepository(HotTopicLikeEntity);
    this.hotTopicAnswerRepository =
      this.dataSource.getRepository(HotTopicAnswerEntity);
    this.hotTopicRepository = this.dataSource.getRepository(
      HotTopicQuestionEntity,
    );
  }

  async getHotTopicById(
    id: number,
    userId: number,
  ): Promise<HotTopicInfoResponseDto> {
    const question = await this.hotTopicRepository.findOne({
      where: { id },
      relations: ['answers', 'answers.likes', 'answers.user', 'likes'],
    });
    const answerEntities = await this.hotTopicAnswerRepository.find({
      where: {
        questionId: id,
        parentId: null,
      },
      relations: ['likes', 'user', 'childs', 'childs.likes', 'childs.user'],
    });
    const likes = await this.hotTopicLikeRepository.count({
      where: { hotTopicId: id },
    });
    const replies = question.answers.length;
    const uids = question.answers.map((a) => a.userId);
    const uidSet = new Set(uids);
    const participants = uidSet.size;
    const answers = question.answers;
    answers.sort((a, b) => b.likes.length - a.likes.length);
    const best = answers[0];
    return new HotTopicInfoResponseDto(
      question,
      likes,
      replies,
      participants,
      best,
      question.likes.some((like) => like.userId === userId),
      answerEntities.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
      userId,
    );
  }

  async getLatestSums(userId: number): Promise<HotTopicSumResponseDto[]> {
    const questions = await this.hotTopicRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['answers', 'answers.likes', 'answers.user', 'likes'],
      take: 3,
    });
    const dtos = [];
    Promise.all(
      questions.map(async (q) => {
        const likes = await this.hotTopicLikeRepository.count({
          where: { hotTopicId: q.id },
        });
        const replies = q.answers.length;
        const uids = q.answers.map((a) => a.userId);
        const uidSet = new Set(uids);
        const participants = uidSet.size;
        const answers = q.answers;
        answers.sort((a, b) => b.likes.length - a.likes.length);
        const best = answers[0];
        const dto = new HotTopicSumResponseDto(
          q,
          likes,
          replies,
          participants,
          best,
          q.likes.some((like) => like.userId === userId),
        );
        dtos.push(dto);
      }),
    );
    return dtos;
  }

  async getHotTopics(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<PagedResponse<HotTopicSumResponseDto>> {
    const [questions, count] = await this.hotTopicRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: ['answers', 'answers.likes', 'answers.user', 'likes'],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const dtos = [];
    Promise.all(
      questions.map(async (q) => {
        const likes = await this.hotTopicLikeRepository.count({
          where: { hotTopicId: q.id },
        });
        const replies = q.answers.length;
        const uids = q.answers.map((a) => a.userId);
        const uidSet = new Set(uids);
        const participants = uidSet.size;
        const answers = q.answers;
        answers.sort((a, b) => b.likes.length - a.likes.length);
        const best = answers[0];
        const dto = new HotTopicSumResponseDto(
          q,
          likes,
          replies,
          participants,
          best,
          q.likes.some((like) => like.userId === userId),
        );
        dtos.push(dto);
      }),
    );
    return new PagedResponse(dtos, count, page, pageSize);
  }

  async postQuestion(body: HotTopicRequestDto): Promise<void> {
    const entity = this.hotTopicRepository.create({
      question: body.question,
      createdBy: body.createdBy,
    });
    await this.hotTopicRepository.save(entity);
  }

  async postAnswer(
    body: HotTopicAnswerRequestDto,
    userId: number,
  ): Promise<void> {
    const entity = this.hotTopicAnswerRepository.create({
      answer: body.content,
      parentId: body.parentId ?? null,
      userId: userId,
      questionId: body.topicId,
    });
    await this.hotTopicAnswerRepository.save(entity);
  }

  async postLike(userId: number, id: number): Promise<boolean> {
    const exists = await this.hotTopicLikeRepository.findOne({
      where: { hotTopicId: id, userId },
    });
    if (exists) {
      await this.hotTopicLikeRepository.remove(exists);
      return false;
    }

    const entity = this.hotTopicLikeRepository.create({
      hotTopicId: id,
      userId,
    });
    await this.hotTopicLikeRepository.save(entity);
    return true;
  }

  async postAnswerLike(userId: number, id: number): Promise<boolean> {
    const exists = await this.hotTopicAnswerLikeRepository.findOne({
      where: { answerId: id, userId },
    });
    if (exists) {
      await this.hotTopicAnswerLikeRepository.remove(exists);
      return false;
    }

    const entity = this.hotTopicAnswerLikeRepository.create({
      answerId: id,
      userId,
    });
    await this.hotTopicAnswerLikeRepository.save(entity);
    return true;
  }
}
