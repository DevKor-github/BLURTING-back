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
import { AddChatDto, ChatDto, InRoomDto } from 'src/dtos/chat.dto';
import { ChatService } from './chat.service';
import { ReportService } from 'src/report/report.service';
import { ReportingRequestDto } from 'src/report/dtos/reportingRequest.dto';

@WebSocketGateway({ namespace: 'whisper' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly reportService: ReportService,
  ) {}

  @WebSocketServer()
  private server: Server;

  afterInit() {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const validated = await this.chatService.validateSocket(client);
    if (!validated) return;

    this.chatService.updateSocketUser(client.data.userId, client.id);
    const chatRooms = await this.chatService.getChatRooms(client.data.userId);
    for (const room of chatRooms) {
      client.join(`${room.roomId}_list`);
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
    @MessageBody() user: number,
  ) {
    const users: number[] = [user, client.data.userId];
    const room = await this.chatService.findCreatedRoom(users);
    if (room) {
      const roomId = room.id;
      client.emit('create_room', roomId);
    } else {
      const roomId = await this.chatService.createChatRoom(users);
      const createUser = await this.chatService.findUserSocket(
        client.data.userId,
      );
      const socketUser = await this.chatService.findUserSocket(user);
      if (socketUser) {
        this.server.to(socketUser.socketId).emit('invite_chat', {
          roomId: roomId,
          nickname: createUser.userNickname,
          sex: createUser.userSex,
        });
      } else {
        this.chatService.pushCreateRoom(user);
      }

      client.join(`${roomId}_list`);
      client.emit('create_room', {
        roomId: roomId,
        nickname: socketUser.userNickname,
      });
    }
  }

  @SubscribeMessage('reconnect_chat')
  async reconnectChat(@MessageBody() roomId: string) {
    this.chatService.reConnectChat(roomId);
    this.server.to(`${roomId}_list`).emit('reconnect_chat', roomId);
    this.server.to(roomId).emit('reconnect_chat', roomId);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(`${roomId}_list`);
  }

  @SubscribeMessage('in_room')
  async handleInOutChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() inRoomDto: InRoomDto,
  ) {
    const adapter = this.server.adapter as any;
    if (
      !inRoomDto.inRoom &&
      adapter.rooms.get(inRoomDto.roomId) &&
      adapter.rooms.get(inRoomDto.roomId) != undefined
    ) {
      if ((await adapter.rooms.get(inRoomDto.roomId).size) == 2) {
        this.chatService.updateAllReadTime(inRoomDto.roomId);
      } else {
        this.chatService.updateReadTime(inRoomDto.roomId, client.data.userId);
      }
    } else {
      this.chatService.updateReadTime(inRoomDto.roomId, client.data.userId);
    }

    if (inRoomDto.inRoom) {
      await client.leave(`${inRoomDto.roomId}_list`);
      await client.join(inRoomDto.roomId);
      client.to(inRoomDto.roomId).emit('read_all', inRoomDto.roomId);
    } else {
      this.server.to(inRoomDto.roomId).emit('out_room', inRoomDto.roomId);
      await client.leave(inRoomDto.roomId);
      await client.join(`${inRoomDto.roomId}_list`);
    }
  }

  @SubscribeMessage('send_chat')
  async handleChatting(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatData: AddChatDto,
  ) {
    const addChat: ChatDto = {
      ...chatData,
      createdAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      userId: client.data.userId,
    };
    const adapter = this.server.adapter as any;
    let read = true;
    if (
      adapter.rooms.get(chatData.roomId) &&
      adapter.rooms.get(chatData.roomId) != undefined
    ) {
      this.chatService.addChat(addChat);
      if (adapter.rooms.get(chatData.roomId).size < 2) {
        read = false;
        client
          .to(`${chatData.roomId}_list`)
          .emit('new_chat', { ...addChat, read: read });
        await this.chatService.pushNewChat(chatData.roomId, client.data.userId);
      }
      this.server
        .to(chatData.roomId)
        .emit('new_chat', { ...addChat, read: read });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await this.chatService.leaveChatRoom(client.data.userId, roomId);
    await this.server
      .to(roomId)
      .emit('leave_room', { roomId: roomId, userId: client.data.userId });
    await this.server
      .to(`${roomId}_list`)
      .emit('leave_room', { roomId: roomId, userId: client.data.userId });

    await client.leave(`${roomId}_list`);
  }

  @SubscribeMessage('report')
  async handleReport(
    @ConnectedSocket() client: Socket,
    @MessageBody() reportDto: ReportingRequestDto,
  ) {
    await this.chatService.disconnectChatRoom([
      reportDto.reportingId,
      client.data.userId,
    ]);
    await this.reportService.reportUser(
      client.data.userId,
      reportDto.reportingId,
      reportDto.reason,
    );

    const room = await this.chatService.findCreatedRoom([
      reportDto.reportingId,
      client.data.userId,
    ]);
    await this.server.to(room.id).emit('report', room.id);
  }
}
