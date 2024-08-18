import { Injectable } from '@nestjs/common';
import { HotTopicRepository } from './hotTopic.repository';
import type { HotTopicSumResponseDto } from './dtos/HotTopicSumResponse.dto';
import type { HotTopicInfoResponseDto } from './dtos/HotTopicInfoResponse.dto';
import type { PagedResponse } from 'src/common/pagedResponse.dto';
import type { HotTopicRequestDto } from './dtos/HotTopicRequest.dto';
import type { HotTopicAnswerRequestDto } from './dtos/HotTopicAnswerRequest.dto';

@Injectable()
export class HotTopicService {
  constructor(private readonly hotTopicRepository: HotTopicRepository) {}
  async getHotTopic(userId: number): Promise<HotTopicSumResponseDto[]> {
    return this.hotTopicRepository.getLatestSums(userId);
  }

  async getHotTopicById(
    id: number,
    userId: number,
  ): Promise<HotTopicInfoResponseDto> {
    return this.hotTopicRepository.getHotTopicById(id, userId);
  }

  async getAllHotTopic(
    page: number,
    pageSize: number,
    userId: number,
  ): Promise<PagedResponse<HotTopicSumResponseDto>> {
    return this.hotTopicRepository.getHotTopics(userId, page, pageSize);
  }
  async postQuestion(body: HotTopicRequestDto): Promise<void> {
    return this.hotTopicRepository.postQuestion(body);
  }
  async postAnswer(
    body: HotTopicAnswerRequestDto,
    userId: number,
  ): Promise<void> {
    return this.hotTopicRepository.postAnswer(body, userId);
  }

  async postLike(userId: number, id: number): Promise<boolean> {
    return this.hotTopicRepository.postLike(userId, id);
  }
  async postAnswerLike(userId: number, id: number): Promise<boolean> {
    return this.hotTopicRepository.postAnswerLike(userId, id);
  }
}
