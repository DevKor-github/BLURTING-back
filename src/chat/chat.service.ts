import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common';
import { Room, Chatting } from './models';
import { Model } from 'mongoose';
import { ChatDto, ChatUserDto } from 'src/dtos/chat.dto';
import { UnauthorizedException } from '@nestjs/common/exceptions';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
  ) {}

  async newChatRoom(userObj: ChatUserDto[]) {
    const roomId =
      Math.floor(Math.random() * 100000).toString() +
      userObj[0].userId +
      userObj[1].userId;

    const exist = await this.roomModel.exists({ users: userObj });
    if (!exist) {
      await this.roomModel.create({
        id: roomId,
        users: userObj,
        connected: true,
      });
    }
    console.log(roomId);
    return roomId;
  }

  addChat(chatData: ChatDto) {
    this.chattingModel.create(chatData);
  }

  async getChatRooms(userId: number) {
    const rooms = await this.roomModel
      .find()
      .where('users.userId')
      .equals(userId)
      .select('id users -_id');
    return rooms;
  }

  async getChats(roomId: string, userId: number) {
    const exist = this.roomModel.exists({
      roomId: roomId,
      'users.userId': userId,
    });

    if (!exist) {
      throw new UnauthorizedException();
    }
    const chats = await this.chattingModel
      .find()
      .where('roomId')
      .equals(roomId)
      .select('userId userNickname chat createdAt -_id');
    return chats;
  }
}
