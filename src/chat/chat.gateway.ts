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
import { Server, Socket } from 'socket.io';
import { ChatDto } from 'src/dtos/chat.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: 'whisper' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  private server: Server;

  afterInit() {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const validated = await this.chatService.validateSocket(client);
    if (!validated) return;

    this.chatService.updateSocketUser(client.data.userId, client.id);

    const chatRooms = await this.chatService.getChatRooms(client.data.userId);
    for (const room of chatRooms) {
      client.join(room.id);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const validated = await this.chatService.validateSocket(client);
    if (!validated) return;

    this.chatService.updateSocketUser(client.data.userId, null);
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