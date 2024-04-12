import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common';
import { Room, Chatting, SocketUser } from './models';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { NotificationEntity } from 'src/entities';
import { getDateTimeOfNow } from 'src/common/util/time';
import { UserProfileDtoWithBlur } from 'src/dtos/user.dto';
import { BLUR_CHANGE_LIMIT, MESSAGES } from 'src/common/const';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  async validateSocket(client: Socket): Promise<boolean> {
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

  async updateSocketUser(userId: number, socketId: string): Promise<void> {
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
        connection: getDateTimeOfNow(),
      });
    } else {
      // update socketId for user
      await this.socketUserModel.updateOne(
        { userId: userId },
        {
          socketId: socketId,
          connection: getDateTimeOfNow(),
        },
      );
    }
  }

  async findUserSocket(userId: number): Promise<SocketUser> {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });
    return socketUser;
  }

  async createChatRoom(userIds: number[]) {
    const roomId = Date.now();
    const users: ChatUserDto[] = userIds.map((userId) => ({
      userId,
      hasRead: getDateTimeOfNow(),
      blur: 0,
      isDeleted: false,
    }));

    const room = await this.roomModel.create({
      id: roomId,
      users: users,
      blur: 0,
      connected: true,
      connectedAt: getDateTimeOfNow(),
    });
    await room.save();

    return roomId;
  }

  async reConnectChat(roomId: string): Promise<void> {
    await this.roomModel.findOneAndUpdate(
      { where: { id: roomId } },
      { connectedAt: getDateTimeOfNow() },
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

  async leaveChatRoom(userId: number, roomId: string): Promise<void> {
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

  async disconnectChatRoom(users: number[]): Promise<void> {
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

  addChat(chatData: ChatDto): void {
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

    const roomInfoArr = await Promise.all(
      rooms.map((room) => this.getChatRoom(room, userId)),
    );

    return roomInfoArr.sort((a, b) => {
      if (a.latest_time == null) return -1;
      if (b.latest_time == null) return 1;
      return b.latest_time.getTime() - a.latest_time.getTime();
    });
  }

  async getChatRoom(room: Room, userId: number): Promise<RoomInfoDto> {
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

  async getChats(roomId: string, userId: number): Promise<RoomChatDto> {
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

    const blurChange = await this.checkBlurChange(room, otherUserIndex);

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

  async findOtherUser(roomId: string, userId: number): Promise<ChatUserDto> {
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

  async getOtherProfile(
    roomId: string,
    userId: number,
  ): Promise<UserProfileDtoWithBlur> {
    const otherUser = await this.findOtherUser(roomId, userId);
    const userImages = await this.userService.getUserImages(otherUser.userId);
    const userProfile = await this.userService.getUserProfile(
      otherUser.userId,
      userImages,
    );
    const blur = await this.updateBlurStep(roomId, otherUser.userId);

    return UserProfileDtoWithBlur.extendUserProfileDto(userProfile, blur);
  }

  async updateReadTime(roomId: string, userId: number): Promise<void> {
    await this.roomModel.findOneAndUpdate(
      { id: roomId, 'users.userId': userId },
      {
        $set: {
          'users.$.hasRead': getDateTimeOfNow(),
        },
      },
    );
  }

  async updateAllReadTime(roomId: string): Promise<void> {
    await this.roomModel.findOneAndUpdate(
      { id: roomId },
      {
        $set: {
          'users.$[].hasRead': getDateTimeOfNow(),
        },
      },
    );
  }

  async checkBlurChange(room: Room, index: number): Promise<number> {
    const chatCount = await this.chattingModel.count({ roomId: room.id });

    const currentBlurLv = room.users[index].blur;
    if (chatCount > BLUR_CHANGE_LIMIT[currentBlurLv]) {
      return room.users[index].blur + 1;
    }
    return null;
  }

  async updateBlurStep(roomId: string, otherUser: number): Promise<number> {
    const room = await this.roomModel.findOne({ id: roomId });
    const index = room.users.findIndex((user) => user.userId == otherUser);
    room.users[index].blur = await this.checkBlurChange(room, index);

    await room.save();

    return room.users[index].blur;
  }

  async pushCreateRoom(userId: number): Promise<void> {
    this.fcmService.sendPush(userId, MESSAGES.START_WHISPER, 'whisper');
    const newEntity = this.notificationRepository.create({
      user: { id: userId },
      body: MESSAGES.START_WHISPER_NOTIFICATION,
    });
    await this.notificationRepository.insert(newEntity);
  }

  async pushNewChat(roomId: string, userId: number): Promise<void> {
    const room = await this.roomModel.findOne({
      id: roomId,
    });
    const otherUser = room.users.find((user) => user.userId != userId);
    this.fcmService.sendPush(otherUser.userId, MESSAGES.NEW_MESSAGE, 'whisper');
  }
}
