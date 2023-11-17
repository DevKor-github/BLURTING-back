import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common';
import { Room, Chatting, SocketUser } from './models';
import { Model } from 'mongoose';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import {
  ChatDto,
  RoomInfoDto,
  ChatUserDto,
  RoomChatDto,
} from 'src/dtos/chat.dto';
import { UserService } from 'src/user/user.service';
import { FcmService } from 'src/firebase/fcm.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  async validateSocket(client: Socket) {
    const authHeader = client.handshake.headers['authorization'];
    const authAuth = client.handshake.auth['authorization'];
    let token;

    if (authHeader && authHeader != undefined) {
      token = authHeader.split(' ')[1];
    } else if (authAuth && authAuth != undefined) {
      token = authAuth.split(' ')[1];
    } else {
      client.disconnect(true);
      return false;
    }

    try {
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
        connection: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      });
    } else {
      // update socketId for user
      await this.socketUserModel.updateOne(
        { userId: userId },
        {
          socketId: socketId,
          connection: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
        },
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
        hasRead: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
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

  addChat(chatData: ChatDto) {
    this.chattingModel.create(chatData);
  }

  async getChatRooms(userId: number): Promise<RoomInfoDto[]> {
    const rooms = await this.roomModel
      .find({ 'users.userId': userId })
      .select('id users -_id');

    const roomInfo = await Promise.all(
      rooms.map(async (room) => {
        return await this.getChatRoom(room, userId);
      }),
    );

    return roomInfo.sort((a, b) => {
      if (a.latest_time == null) return -1;
      if (b.latest_time == null) return 1;
      return b.latest_time.getTime() - a.latest_time.getTime();
    });
  }

  async getChatRoom(room: Room, userId: number) {
    const user = room.users.find((user) => user.userId == userId);
    const otherUser = room.users.find((user) => user.userId != userId);
    const otherUserInfo = await this.socketUserModel.findOne({
      userId: otherUser.userId,
    });
    const latestChat = await this.chattingModel
      .find({ roomId: room.id })
      .sort({ createdAt: -1 })
      .limit(1);

    return RoomInfoDto.ToDto(
      room.id,
      user.hasRead,
      otherUserInfo,
      latestChat[0],
    );
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

    return RoomChatDto.ToDto(otherUser, chats);
  }

  async getOtherProfile(roomId: string, userId: number) {
    const room = await this.roomModel.findOne({
      id: roomId,
      'users.userId': userId,
    });
    if (room == null) {
      throw new UnauthorizedException();
    }

    const otherUser = room.users.find((user) => user.userId != userId);
    return await this.userService.getUserProfile(
      otherUser.userId,
      otherUser.userImage,
    );
  }

  async updateReadTime(roomId: string, userId: number) {
    await this.roomModel.findOneAndUpdate(
      { id: roomId, 'users.userId': userId },
      {
        $set: {
          'users.$.hasRead': new Date(
            new Date().getTime() + 9 * 60 * 60 * 1000,
          ),
        },
      },
    );
  }

  pushCreateRoom(userId: number) {
    this.fcmService.sendPush(
      userId,
      '새로운 귓속말',
      '새로운 귓속말을 시작합니다!',
    );
  }

  async pushNewChat(roomId: string) {
    const room = await this.roomModel.findOne({
      id: roomId,
    });
    room.users.map((user) => {
      const socketId = this.findUserSocketId(user.userId);
      if (!socketId)
        this.fcmService.sendPush(
          user.userId,
          '새로운 귓속말',
          '새로운 귓속말이 도착했습니다!',
        );
    });
  }
}
