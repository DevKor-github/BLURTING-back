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
    let id = client.handshake.query['id'];
    if (Array.isArray(id)) {
      id = id[0];
    }
    const userId = parseInt(id, 10);
    this.chatService.updateSocketUser(userId, client.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    //소켓 유저 socket 비우기
    let id = client.handshake.query['id'];
    if (Array.isArray(id)) {
      id = id[0];
    }
    const userId = parseInt(id, 10);
    this.chatService.updateSocketUser(userId, null);
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() users: number[],
  ) {
    const roomId = await this.chatService.newChatRoom(users);
    client.join(roomId);

    const socketId = await this.chatService.findUserSocketId(users[1]);
    if (socketId) {
      client.to(socketId).emit('invite_chat', roomId);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
  }

  @SubscribeMessage('send_chat')
  handleChatting(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatData: ChatDto,
  ) {
    this.chatService.addChat(chatData);
    client.broadcast.to(chatData.roomId).emit('new_chat', chatData);
  }
}
