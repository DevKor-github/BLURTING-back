import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as firebase from 'firebase-admin';
import { SocketUser } from 'src/domain/chat/models';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/domain/entities';
import { Repository } from 'typeorm';
import { NotificationListDto } from './dtos/notificationList.dto';

@Injectable()
export class FcmService {
  constructor(
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {
    const firebaseKey = {
      type: process.env.FCM_TYPE,
      projectId: process.env.FCM_PROJECT_ID,
      privateKeyId: process.env.FCM_PRIVATE_KEY_ID,
      privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      clientId: process.env.FCM_CLIENT_ID,
      authUri: process.env.FCM_AUTH_URI,
      tokenUri: process.env.FCM_TOKEN_URI,
      authProviderX509CertUrl: process.env.FCM_AUTH_CERT_URL,
      clientX509CertUrl: process.env.FCM_CLIENT_CERT_URL,
    };

    firebase.initializeApp({
      credential: firebase.credential.cert(firebaseKey),
    });
  }

  async enableNotification(
    userId: number,
    notificationToken: string,
  ): Promise<void> {
    await this.socketUserModel.updateOne(
      { userId: userId },
      { notificationToken: notificationToken },
    );
  }

  async disableNotification(userId: number): Promise<void> {
    await this.socketUserModel.updateOne(
      { userId: userId },
      { notificationToken: null },
    );
  }

  async checkNotification(userId: number): Promise<boolean> {
    const user = await this.socketUserModel.findOne({ userId: userId });
    return user.notificationToken != null;
  }

  async sendPush(userId: number, body: string, type: string) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });
    if (socketUser.notificationToken) {
      try {
        await firebase.messaging().send({
          notification: {
            body: body,
          },
          data: { type: type },
          android: {
            notification: {
              channelId: 'blurting_project',
              priority: 'high',
            },
          },
          token: socketUser.notificationToken,
        });
      } catch (error) {
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          this.disableNotification(userId);
        }
      }
    }
  }

  async getNotificationList(userId: number): Promise<NotificationListDto[]> {
    const result = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    return result.map((notification) => new NotificationListDto(notification));
  }
}
