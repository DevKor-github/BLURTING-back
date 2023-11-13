import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as firebase from 'firebase-admin';
import * as path from 'path';
import { SocketUser } from 'src/chat/models';

@Injectable()
export class FcmService {
  constructor(
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
  ) {
    firebase.initializeApp({
      credential: firebase.credential.cert(
        path.join('src/firebase/', 'firebase.json'),
      ),
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
      const user = await this.socketUserModel.findOne({
        where: { userId: userId },
      });
      if (user.notificationToken) {
        await firebase
          .messaging()
          .send({
            notification: { title, body },
            data: {},
            token: user.notificationToken,
          })
          .catch((error: any) => {
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
