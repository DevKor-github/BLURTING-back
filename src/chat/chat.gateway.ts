import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatDto, ChatUserDto } from 'src/dtos/chat.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: 'whisper' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}

  afterInit() {}

  handleConnection() {}

  handleDisconnect() {}

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() userObj: ChatUserDto[],
  ) {
    const roomId = await this.chatService.newChatRoom(userObj);

    client.join(roomId);
    client.broadcast.to(roomId).emit('join_chat', userObj);
  }

  @SubscribeMessage('chatting')
  handleChatting(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatData: ChatDto,
  ) {
    this.chatService.addChat(chatData);

    client.broadcast.to(chatData.roomId).emit('new_chat', {
      userNickname: chatData.userNickname,
      chat: chatData.chat,
    });
  }
}
