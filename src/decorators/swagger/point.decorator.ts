import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PointHistoryDto } from 'src/dtos/point.dto';

type PointEndpoints =
  | 'checkPoint'
  | 'startChat'
  | 'getRandomNickname'
  | 'adToPoint'
  | 'getAddPointHistory'
  | 'getSubPointHistory';

export function Docs(endpoint: PointEndpoints) {
  switch (endpoint) {
    case 'checkPoint':
      return applyDecorators(
        ApiResponse({
          description: '포인트 차감 가능 여부',
          schema: {
            example: false,
            type: 'boolean',
          },
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '포인트 차감 가능 여부',
          description: '포인트 차감 가능 여부 판단',
        }),
      );
    case 'startChat':
      return applyDecorators(
        ApiCreatedResponse({
          description: '포인트 차감 성공 시',
          schema: {
            example: { point: 10 },
            properties: {
              point: {
                type: 'number',
                description: '수정된 포인트 값',
              },
            },
          },
        }),
        ApiResponse({
          description: '포인트 차감 실패 시',
          schema: {
            example: false,
            type: 'boolean',
          },
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiBody({
          description: '상대 유저 아이디',
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
              },
            },
          },
        }),
        ApiOperation({
          summary: '귓속말 걸기',
          description: '귓속말 걸었을 때 포인트 차감 가능 여부 판단',
        }),
      );
    case 'getRandomNickname':
      return applyDecorators(
        ApiCreatedResponse({
          description: '포인트 차감 성공 시',
          schema: {
            example: { point: 10 },
            properties: {
              point: {
                type: 'number',
                description: '수정된 포인트 값',
              },
            },
          },
        }),
        ApiResponse({
          description: '포인트 차감 실패 시',
          schema: {
            example: false,
            type: 'boolean',
          },
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '닉네임 랜덤',
          description: '닉네임 랜덤 돌리기 포인트 차감 가능 여부 판단',
        }),
      );
    case 'adToPoint':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
        }),
        ApiResponse({
          description: '광고 후 포인트 지급',
          schema: {
            example: { point: 10 },
            properties: {
              point: {
                type: 'number',
                description: '수정된 포인트 값',
              },
            },
          },
        }),
      );
    case 'getAddPointHistory':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiResponse({
          description: '지급 내역',
          type: Array<PointHistoryDto>,
        }),
      );
    case 'getSubPointHistory':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiResponse({
          description: '사용 내역',
          type: Array<PointHistoryDto>,
        }),
      );
  }
}
