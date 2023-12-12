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

  // TODO : create socketUser when user signup
  async updateSocketUser(userId: number, socketId: string) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });

    if (socketUser == null) {
      // create socketUser
      const user = await this.userService.findUserByVal('id', userId);
      const userImages = await this.userService.getUserImages(userId);

      // TODO: BAN WITHOUT SEX
      await this.socketUserModel.create({
        socketId: socketId,
        notificationToken: null,
        userId: userId,
        userNickname: user.userNickname,
        userSex: user.userInfo.sex ?? 'F',
        userImage: userImages.length ? userImages[0] : null,
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

  async findUserSocket(userId: number) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });
    return socketUser;
  }

  async createChatRoom(users: number[]) {
    const userObj: ChatUserDto[] = [];
    const roomId =
      Math.floor(Math.random() * 100000).toString() + users[0] + users[1];

    for (const id of users) {
      userObj.push({
        userId: id,
        hasRead: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
        blur: 0,
        isDeleted: false,
      });
    }

    const room = await this.roomModel.create({
      id: roomId,
      users: userObj,
      blur: 0,
      connected: true,
      connectedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
    room.users[1].blur = 1;
    await room.save();

    return roomId;
  }

  async reConnectChat(roomId: string) {
    await this.roomModel.findOneAndUpdate(
      { where: { id: roomId } },
      { connectedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000) },
    );
  }

  async findCreatedRoom(users: number[]): Promise<Room | null> {
    return await this.roomModel
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

  async leaveChatRoom(userId: number, roomId: string) {
    await this.roomModel.findOneAndUpdate(
      { id: roomId, 'users.userId': userId },
      {
        $set: {
          'users.$.isDeleted': true,
        },
        connected: false,
      },
    );
  }

  async disconnectChatRoom(users: number[]) {
    await this.roomModel.findOneAndUpdate(
      {
        users: {
          $all: [
            { $elemMatch: { userId: users[0] } },
            { $elemMatch: { userId: users[1] } },
          ],
        },
      },
      {
        connected: false,
      },
    );
  }

  addChat(chatData: ChatDto) {
    this.chattingModel.create(chatData);
  }

  async getChatRooms(userId: number): Promise<RoomInfoDto[]> {
    const rooms = await this.roomModel
      .find({
        users: {
          $elemMatch: {
            userId: userId,
            isDeleted: false,
          },
        },
      })
      .select('id users connected -_id');

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
    const otherUserIndex = room.users.findIndex(
      (user) => user.userId !== userId,
    );
    const otherUser = room.users[otherUserIndex];
    const otherSocketUser = await this.socketUserModel.findOne({
      userId: otherUser.userId,
    });

    const blurChange = await this.updateBlurStep(room, otherUserIndex);

    const chats = await this.chattingModel
      .find()
      .where('roomId')
      .equals(roomId)
      .select('userId userNickname chat createdAt -_id');

    return RoomChatDto.ToDto(
      otherUser,
      otherSocketUser,
      room,
      blurChange,
      chats,
    );
  }

  async findOtherUser(roomId: string, userId: number) {
    const room = await this.roomModel.findOne({
      id: roomId,
      'users.userId': userId,
    });
    if (room == null) {
      throw new UnauthorizedException();
    }

    const otherUser = room.users.find((user) => user.userId != userId);
    return otherUser;
  }

  async getOtherProfile(roomId: string, userId: number) {
    const otherUser = await this.findOtherUser(roomId, userId);
    const userImages = await this.userService.getUserImages(otherUser.userId);
    return {
      ...(await this.userService.getUserProfile(otherUser.userId, userImages)),
      blur: otherUser.blur,
    };
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

  async updateAllReadTime(roomId: string) {
    await this.roomModel.findOneAndUpdate(
      { id: roomId },
      {
        $set: {
          'users.$[].hasRead': new Date(
            new Date().getTime() + 9 * 60 * 60 * 1000,
          ),
        },
      },
    );
  }

  async updateBlurStep(room: Room, index: number) {
    const chatCount = await this.chattingModel.count({ roomId: room.id });
    console.log(chatCount);
    let blurChange = true;

    switch (room.users[index].blur) {
      case 0:
        room.users[index].blur += 1;
        break;
      case 1:
        if (chatCount > 20) {
          room.users[index].blur += 1;
        } else {
          blurChange = false;
        }
        break;
      case 2:
        if (chatCount > 50) {
          room.users[index].blur += 1;
        } else {
          blurChange = false;
        }
        break;
      case 3:
        if (chatCount > 100) {
          room.users[index].blur += 1;
        } else {
          blurChange = false;
        }
        break;
      default:
        blurChange = false;
        break;
    }
    await room.save();

    if (blurChange) {
      return room.users[index].blur;
    }
  }

  pushCreateRoom(userId: number) {
    this.fcmService.sendPush(
      userId,
      '새로운 귓속말',
      '지금 귓속말을 시작해보세요!',
      'whisper',
    );
  }

  async pushNewChat(roomId: string, userId: number) {
    const room = await this.roomModel.findOne({
      id: roomId,
    });
    const otherUser = room.users.find((user) => user.userId != userId);
    this.fcmService.sendPush(
      otherUser.userId,
      '새로운 귓속말',
      '새로운 귓속말이 도착했습니다!',
      'whisper',
    );
  }
}
