import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as firebase from 'firebase-admin';
import { SocketUser } from 'src/chat/models';

@Injectable()
export class FcmService {
  constructor(
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
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

  async sendPush(userId: number, title: string, body: string) {
    try {
      const socketUser = await this.socketUserModel.findOne({ userId: userId });
      if (socketUser.notificationToken) {
        await firebase
          .messaging()
          .send({
            notification: { title, body },
            data: {},
            token: socketUser.notificationToken,
          })
          .catch((error: any) => {
            console.log(error);
            if (error.code == 404 || error.code == 400) {
              this.disableNotification(userId);
            }
          });
      }
    } catch (error) {
      return error;
    }
  }
}
