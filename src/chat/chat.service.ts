import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common';
import { Room, Chatting, SocketUser } from './models';
import { Model } from 'mongoose';
import { AddChatDto, RoomInfoDto, ChatUserDto } from 'src/dtos/chat.dto';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { UserService } from 'src/user/user.service';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
    private readonly userService: UserService,
  ) {}

  async validateSocket(client: Socket) {
    const authHeader = client.handshake.headers['authorization'];

    if (!authHeader || authHeader == undefined) {
      client.disconnect(true);
      return false;
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
      client.data.userId = decoded['id'];
    } catch (error) {
      client.disconnect(true);
      return false;
    }

    return true;
  }

  async updateSocketUser(userId: number, socketId: string) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });

    if (socketUser == null) {
      // create socketUser
      const user = await this.userService.findUser('id', userId);
      await this.socketUserModel.create({
        socketId: socketId,
        userId: userId,
        userNickname: user.userNickname,
        userSex: user.sex,
      });
    } else {
      // update socketId for user
      await this.socketUserModel.updateOne(
        { userId: userId },
        { socketId: socketId },
      );
    }
  }

  async findUserSocketId(userId: number) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });
    return socketUser.socketId;
  }

  async newChatRoom(users: number[]) {
    const room = await this.findCreatedRoom(users);
    if (room) {
      return room.id;
    }

    const userObj: ChatUserDto[] = [];
    const roomId =
      Math.floor(Math.random() * 100000).toString() + users[0] + users[1];

    for (const id of users) {
      const userImage = await this.userService.getUserImage(id);
      userObj.push({
        userId: id,
        userImage: userImage,
        hasRead: new Date(),
        isDeleted: false,
      });
    }

    await this.roomModel.create({
      id: roomId,
      users: userObj,
      connected: true,
    });
    return roomId;
  }

  async findCreatedRoom(users: number[]): Promise<Room | null> {
    return this.roomModel
      .findOne({
        users: {
          $all: [
            { $elemMatch: { userId: users[0] } },
            { $elemMatch: { userId: users[1] } },
          ],
        },
      })
      .exec();
  }

  addChat(chatData: AddChatDto) {
    this.chattingModel.create(chatData);
  }

  async getChatRooms(userId: number): Promise<RoomInfoDto[]> {
    const rooms = await this.roomModel
      .find({ 'users.userId': userId })
      .select('id users -_id');

    const roomInfo = await Promise.all(
      rooms.map(async (room) => {
        const user = room.users.find((user) => user.userId == userId);
        const otherUser = room.users.find((user) => user.userId != userId);
        const otherUserInfo = await this.socketUserModel.findOne({
          userId: otherUser.userId,
        });
        const latestChat = await this.chattingModel
          .findOne({ roomId: room.id })
          .sort({ createdAt: -1 })
          .limit(1);

        return RoomInfoDto.ToDto(
          room.id,
          user.hasRead,
          otherUserInfo,
          latestChat,
        );
      }),
    );

    return roomInfo;
  }

  async getChats(roomId: string, userId: number) {
    const room = await this.roomModel.findOne({
      id: roomId,
      'users.userId': userId,
    });
    if (room == null) {
      throw new UnauthorizedException();
    }

    const otherUser = room.users.find((user) => user.userId != userId);

    const chats = await this.chattingModel
      .find()
      .where('roomId')
      .equals(roomId)
      .select('userId userNickname chat createdAt -_id');

    return { userId: otherUser.userId, userImage: otherUser.userImage, chats };
  }
}
