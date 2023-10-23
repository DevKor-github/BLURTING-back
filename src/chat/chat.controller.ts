import {
  Controller,
  Param,
  Req,
  Res,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { ChatService } from './chat.service';
import { ChatDto, ChatUserDto } from 'src/dtos/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // new room test
  @Post('/join')
  async joinChat(@Body() users: ChatUserDto[], @Res() res: Response) {
    return await res.send(this.chatService.newChatRoom(users));
  }

  // add chat test
  @Post('/add')
  async addChat(@Body() chatData: ChatDto, @Res() res: Response) {
    return await res.send(this.chatService.addChat(chatData));
  }

  // 내 채팅방 가져오기
  @UseGuards(AuthGuard('access'))
  @Get('/rooms')
  async getChatRooms(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const rooms = await this.chatService.getChatRooms(id);
    console.log(rooms);
    return res.json(rooms);
  }

  // 이전 채팅 가져오기
  @UseGuards(AuthGuard('access'))
  @Get('/:roomId')
  async getChats(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const chats = await this.chatService.getChats(roomId, id);
    console.log(chats);
    return await res.json(chats);
  }

  // 채팅방 나가기
}
