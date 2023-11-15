import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDate,
} from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import { Sex } from 'src/common/enums';

const options: SchemaOptions = {
  collection: 'socketUser',
  timestamps: true,
};

@Schema(options)
export class SocketUser extends Document {
  @Prop({
    type: String,
  })
  @IsString()
  socketId: string;

  @Prop({
    type: String,
  })
  @IsString()
  notificationToken: string;

  @Prop({
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @Prop({
    type: String,
  })
  @IsString()
  userNickname: string;

  @Prop({
    type: String,
    default: undefined,
    required: false,
    enum: Sex,
  })
  @IsEnum(Sex)
  userSex: Sex;

  @Prop({
    type: Date,
  })
  @IsDate()
  connection: Date;
}

export const SocketUserSchema = SchemaFactory.createForClass(SocketUser);
