import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { RoomChatDto, RoomInfoDto } from 'src/domain/chat/dtos';
import { UserProfileDto } from 'src/domain/dtos/user.dto';

type ChatEndpoints = 'getChatRooms' | 'getChats' | 'getUserProfile';
export function Docs(endpoint: ChatEndpoints) {
  switch (endpoint) {
    case 'getChatRooms':
      return applyDecorators(
        ApiCreatedResponse({
          description: 'user chatting room list',
          type: [RoomInfoDto],
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer asa.asd.sa',
        }),
        ApiOperation({
          summary: '채팅방 리스트',
          description: '유저가 포함된 귓속말 채팅방 리스트 반환',
        }),
      );
    case 'getChats':
      return applyDecorators(
        ApiCreatedResponse({
          description: 'chatting list',
          type: RoomChatDto,
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer as.asd.asd',
        }),
        ApiOperation({
          summary: '채팅 리스트',
          description: '방마다 채팅 리스트와 상대 정보 반환',
        }),
        ApiParam({
          name: 'roomId',
          description: '채팅방 아이디',
          required: true,
          type: String,
          example: 'asdasd',
        }),
      );
    case 'getUserProfile':
      return applyDecorators(
        ApiCreatedResponse({
          description: 'user profile',
          type: UserProfileDto,
        }),
        ApiHeader({
          name: 'authorization',
          required: true,
          example: 'Bearer as.asd.asd',
        }),
        ApiOperation({
          summary: '상대 프로필',
          description: '채팅방에서 상대 프로필 보기',
        }),
        ApiParam({
          name: 'roomId',
          description: '채팅방 아이디',
          required: true,
          type: String,
          example: 'asdasd',
        }),
      );
  }
}
