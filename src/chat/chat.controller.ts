import { Controller, Param, Req, Res, Get, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { ChatService } from './chat.service';
import { RoomChatDto, RoomInfoDto } from 'src/dtos/chat.dto';
import { UserProfileDto } from 'src/dtos/user.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard('access'))
  @ApiCreatedResponse({
    description: 'user chatting room list',
    type: [RoomInfoDto],
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '채팅방 리스트',
    description: '유저가 포함된 귓속말 채팅방 리스트 반환',
  })
  @Get('/rooms')
  async getChatRooms(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const rooms: RoomInfoDto[] = await this.chatService.getChatRooms(id);
    return res.json(rooms);
  }

  @UseGuards(AuthGuard('access'))
  @ApiCreatedResponse({
    description: 'get chatting list',
    type: RoomChatDto,
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '채팅 리스트',
    description: '방마다 채팅 리스트와 상대 정보 반환',
  })
  @Get('/:roomId')
  async getChats(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const chats = await this.chatService.getChats(roomId, id);
    return await res.json(chats);
  }

  @UseGuards(AuthGuard('access'))
  @ApiCreatedResponse({
    description: 'get user profile',
    type: UserProfileDto,
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '상대 프로필',
    description: '채팅방에서 상대 프로필 보기',
  })
  @Get('/profile/:roomId')
  async getOtherProfile(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const profile = await this.chatService.getOtherProfile(roomId, id);
    return res.json(profile);
  }

  // 채팅방 나가기
}
