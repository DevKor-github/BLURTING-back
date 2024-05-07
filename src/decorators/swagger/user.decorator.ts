import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateProfileDto, UserProfileDto } from 'src/dtos/user.dto';

type UserEndpoints =
  | 'setNotificationToken'
  | 'testNotification'
  | 'getUserProfile'
  | 'updateProfile'
  | 'deleteUser'
  | 'getUserPoint'
  | 'getUserAccount'
  | 'getUserSex';

export function Docs(endpoint: UserEndpoints) {
  switch (endpoint) {
    case 'setNotificationToken':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiBody({
          description: 'firebase 알림 토큰',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
              },
            },
          },
        }),
        ApiOperation({
          summary: '알림 설정',
          description: 'firebase token 저장',
        }),
      );
    case 'testNotification':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiBody({
          description: 'firebase 알림 토큰',
          schema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
              },
              text: {
                type: 'string',
              },
              type: {
                type: 'string',
                example: 'whisper/blurting',
              },
            },
          },
        }),
        ApiOperation({
          summary: '알림 테스트',
          description: 'firebase 테스트',
        }),
      );
    case 'getUserProfile':
      return applyDecorators(
        ApiCreatedResponse({
          description: 'get user profile',
          type: UserProfileDto,
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '내 프로필',
          description: '내 프로필 보기',
        }),
      );
    case 'updateProfile':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiBody({
          description: '수정할 유저 정보 json',
          type: UpdateProfileDto,
        }),
        ApiOperation({
          summary: '프로필 정보 수정',
          description: '프로필 정보 수정하기',
        }),
      );
    case 'deleteUser':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '유저 삭제',
          description: '유저 삭제하기',
        }),
      );
    case 'getUserPoint':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '유저 포인트',
          description: '현재 포인트 확인하기',
        }),
      );
    case 'getUserAccount':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '설정 - 계정/정보',
          description: '설정에서 계정/정보 클릭 시 나오는 내용',
        }),
        ApiResponse({
          description: 'email, phoneNumber',
          schema: {
            properties: {
              email: { type: 'string' },
              phoneNumber: { type: 'string' },
            },
          },
        }),
      );
    case 'getUserSex':
      return applyDecorators(
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asdas.asdasd.asd',
        }),
        ApiOperation({
          summary: '유저 성별',
        }),
        ApiResponse({
          description: 'sex',
          type: 'string',
        }),
      );
  }
}
