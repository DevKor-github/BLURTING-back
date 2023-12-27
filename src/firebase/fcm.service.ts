import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as firebase from 'firebase-admin';
import { SocketUser } from 'src/chat/models';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/entities';
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
    const firebase_key = {
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
      credential: firebase.credential.cert(firebase_key),
    });
  }

  async enableNotification(userId: number, notificationToken: string) {
    return await this.socketUserModel.updateOne(
      { userId: userId },
      { notificationToken: notificationToken },
    );
  }

  async disableNotification(userId: number) {
    await this.socketUserModel.updateOne(
      { userId: userId },
      { notificationToken: null },
    );
  }

  async checkNotification(userId: number): Promise<boolean> {
    const user = await this.socketUserModel.findOne({ userId: userId });
    if (user.notificationToken != null) {
      return true;
    } else {
      return false;
    }
  }

  async sendPush(userId: number, body: string, type: string) {
    try {
      const socketUser = await this.socketUserModel.findOne({ userId: userId });
      if (socketUser.notificationToken) {
        await firebase
          .messaging()
          .send({
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
          })
          .catch((error: any) => {
            console.log(error);
            if (error.code == 404 || error.code == 400) {
              this.disableNotification(userId);
            }
          });
        const newEntity = this.notificationRepository.create({
          user: { id: userId },
          body: body,
        });
        await this.notificationRepository.insert(newEntity);
      }
    } catch (error) {
      return error;
    }
  }

  async getNotificationList(userId: number): Promise<NotificationListDto[]> {
    const result = await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    const timezoneAcceptedData = result.map((notification) => {
      return {
        createdAt: new Date(
          notification.createdAt.getTime() + 9 * 60 * 60 * 1000,
        ),
        body: notification.body,
      };
    });

    return timezoneAcceptedData.map((notification) => {
      return {
        message: notification.body,
        date: notification.createdAt.toLocaleDateString('en-GB'),
        time: notification.createdAt.toLocaleTimeString('en-GB'),
      };
    });
  }
}
