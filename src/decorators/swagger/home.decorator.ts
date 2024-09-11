import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UserProfileDto } from 'src/domain/dtos/user.dto';
import { HomeInfoResponseDto, likeHomeAnswerDto } from 'src/domain/home/dtos';
import { RandomUserDto } from 'src/domain/home/dtos/homInfoResponse.dto';

type HomeEndPoints = 'default' | 'like' | 'version' | 'random' | 'otherProfile';
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
          summary: '버전 정보, 프로필 업데이트 필요 여부',
          description:
            'latestVersion: 최신 버전 정보 반환, updateProfile: 프로필 업데이트 필요 여부',
        }),
      );
    case 'random':
      return applyDecorators(
        ApiOperation({
          summary: '오늘의 인연',
        }),
        ApiResponse({ type: RandomUserDto, isArray: true }),
      );
    case 'otherProfile':
      return applyDecorators(
        ApiOperation({
          summary: '다른 사용자 프로필 정보',
        }),
        ApiParam({
          name: 'other',
          description: '다른 사람 id',
          type: Number,
        }),
        ApiResponse({ type: UserProfileDto }),
      );
  }
}
