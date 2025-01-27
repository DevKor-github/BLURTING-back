import { Controller, Param, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { ChatService } from './chat.service';
import { RoomChatDto, RoomInfoDto } from 'src/domain/chat/dtos';
import { UserProfileDto } from 'src/domain/dtos/user.dto';
import { Docs } from 'src/decorators/swagger/chat.decorator';
import { User } from 'src/decorators/accessUser.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard('access'))
  @Get('/rooms')
  @Docs('getChatRooms')
  async getChatRooms(@User() user: JwtPayload): Promise<RoomInfoDto[]> {
    return await this.chatService.getChatRooms(user.id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/:roomId')
  @Docs('getChats')
  async getChats(
    @User() user: JwtPayload,
    @Param('roomId') roomId: string,
  ): Promise<RoomChatDto> {
    return await this.chatService.getChats(roomId, user.id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/profile/:roomId')
  @Docs('getUserProfile')
  async getOtherProfile(
    @User() user: JwtPayload,
    @Param('roomId') roomId: string,
  ): Promise<UserProfileDto> {
    return await this.chatService.getOtherProfile(roomId, user.id);
  }
}
