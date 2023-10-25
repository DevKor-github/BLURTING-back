import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatDto } from 'src/dtos/chat.dto';
import { ChatService } from './chat.service';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'whisper' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  private server: Server;

  afterInit() {}

  handleConnection(@ConnectedSocket() client: Socket) {
    //소켓 유저 설정
    const userId = parseInt(client.handshake.query['userId'][0], 10);
    this.chatService.updateSocketUser(userId, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    //소켓 유저 socket 비우기
    const userId = parseInt(client.handshake.query['userId'][0], 10);
    this.chatService.updateSocketUser(userId, null);
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() users: number[],
  ) {
    const roomId = await this.chatService.newChatRoom(users);
    client.join(roomId);

    const socketId = await this.chatService.findUserSocketId(users[1]);
    if (socketId == null) {
    } else {
      const targetSocket = this.server.sockets.sockets.get(socketId);
      targetSocket.join(roomId);
    }
  }

  @SubscribeMessage('chatting')
  handleChatting(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatData: ChatDto,
  ) {
    this.chatService.addChat(chatData);
    client.broadcast.to(chatData.roomId).emit('new_chat', chatData);
  }
}
