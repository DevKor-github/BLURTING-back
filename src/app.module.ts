import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './domain/user/user.module';
import { AuthModule } from './domain/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { S3Module } from './domain/s3/s3.module';
import { GeocodingModule } from './domain/geocoding/geocoding.module';
import { ChatModule } from './domain/chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { FcmModule } from './domain/firebase/fcm.module';
import { BlurtingModule } from './domain/blurting/blurting.module';
import { PointModule } from './domain/point/point.module';
import { BullModule } from '@nestjs/bull';
import { HomeModule } from './domain/home/home.module';
import { ReportModule } from './domain/report/report.module';
import { ValidationModule } from './domain/validation/validation.module';
import { HotTopicModule } from './domain/hotTopic/hotTopic.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    AuthModule,
    ScheduleModule.forRoot(),
    S3Module,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PW,
        },
      },
    }),
    GeocodingModule,
    BlurtingModule,
    ChatModule,
    FcmModule,
    PointModule,
    HotTopicModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    HomeModule,
    ReportModule,
    ValidationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
