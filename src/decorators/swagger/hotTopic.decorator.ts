import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { HotTopicInfoResponseDto } from 'src/domain/hotTopic/dtos/HotTopicInfoResponse.dto';
import { HotTopicSumResponseDto } from 'src/domain/hotTopic/dtos/HotTopicSumResponse.dto';
import type { HotTopicController } from 'src/domain/hotTopic/hotTopic.controller';
import type { MethodNames } from 'src/interfaces/util';
import { ApiPagination } from './page.decorator';
import { HotTopicRequestDto } from 'src/domain/hotTopic/dtos/HotTopicRequest.dto';
import { HotTopicAnswerRequestDto } from 'src/domain/hotTopic/dtos/HotTopicAnswerRequest.dto';

type HotTopicEndpoints = MethodNames<HotTopicController>;

const HotTopicDocsMap: Record<HotTopicEndpoints, MethodDecorator[]> = {
  getHotTopic: [
    ApiOperation({
      summary: '최근 세개 핫토픽 가져옴',
    }),
    ApiOkResponse({
      type: [HotTopicSumResponseDto],
    }),
  ],
  getHotTopicById: [
    ApiOperation({
      summary: 'id에 맞는 핫토픽 가져옴',
    }),
    ApiParam({
      name: 'id',
      description: '핫토픽 id',
      type: Number,
      required: true,
    }),
    ApiOkResponse({
      type: HotTopicInfoResponseDto,
    }),
  ],
  getAllHotTopic: [
    ApiOperation({
      summary: '핫토픽 시간 내림차순 가져옴, pagination',
    }),
    ApiPagination(),
    ApiOkResponse({
      type: [HotTopicSumResponseDto],
    }),
  ],
  postQuestion: [
    ApiOperation({
      summary: '질문 작성',
    }),
    ApiCreatedResponse({ description: '질문 작성 성공' }),
    ApiBody({ type: HotTopicRequestDto }),
  ],
  postAnswer: [
    ApiOperation({
      summary: '답변 작성',
    }),
    ApiCreatedResponse({ description: '답변 작성 성공' }),
    ApiBody({ type: HotTopicAnswerRequestDto }),
  ],
  postLike: [
    ApiOperation({
      summary: '좋아요',
      description: '좋아요 상태에서 호출 시 false, 안좋아요에서 호출 시 true',
    }),
    ApiCreatedResponse({ type: Boolean }),
    ApiParam({
      name: 'id',
      description: '핫토픽 id',
      type: Number,
      required: true,
    }),
  ],
  postAnswerLike: [
    ApiOperation({
      summary: '답변 좋아요',
      description: '좋아요 상태에서 호출 시 false, 안좋아요에서 호출 시 true',
    }),
    ApiCreatedResponse({ type: Boolean }),
    ApiParam({
      name: 'id',
      description: '핫토픽 답변 id',
      type: Number,
      required: true,
    }),
  ],
};
export function HotTopicDocs(target) {
  for (const key in HotTopicDocsMap) {
    const methodDecorators =
      HotTopicDocsMap[key as keyof typeof HotTopicDocsMap];

    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
    if (descriptor) {
      for (const decorator of methodDecorators) {
        decorator(target.prototype, key, descriptor);
      }
      Object.defineProperty(target.prototype, key, descriptor);
    }
  }
  return target;
}
