import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { HomeInfoResponseDto, likeHomeAnswerDto } from 'src/home/dtos';
import { RandomUserDto } from 'src/home/dtos/homInfoResponse.dto';

type HomeEndPoints = 'default' | 'like' | 'version' | 'random';
export function Docs(endpoint: HomeEndPoints) {
  switch (endpoint) {
    case 'default':
      return applyDecorators(
        ApiOperation({
          summary: '홈화면 정보',
          description:
            '홈화면 정보 반환 그룹에 없으면 SECONDS : -1 (밀리세컨드 단위), 질문은 새벽5시 기준 3개 (그보다 적으면 적게) [0, 1, 2] 순서 123등 ',
        }),
        ApiOkResponse({ type: HomeInfoResponseDto }),
      );
    case 'like':
      return applyDecorators(
        ApiOperation({
          summary: '좋아요',
          description: '좋아요',
        }),
        ApiBody({
          type: likeHomeAnswerDto,
        }),
      );
    case 'version':
      return applyDecorators(
        ApiOperation({
          summary: '버전 정보',
          description: 'latestVersion: 최신 버전 정보 반환',
        }),
      );
    case 'random':
      return applyDecorators(
        ApiOperation({
          summary: '오늘의 인연',
        }),
        ApiResponse({ type: RandomUserDto, isArray: true }),
      );
  }
}
