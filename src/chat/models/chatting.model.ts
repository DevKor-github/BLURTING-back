import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import { Room } from './room.model';

const options: SchemaOptions = {
  collection: 'chatting',
  timestamps: true,
};

@Schema(options)
export class Chatting extends Document {
  @Prop({
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  roomId: Room['id'];

  @Prop({
    required: true,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @Prop({
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  userNickname: string;

  @Prop({
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  chat: string;

  @Prop({
    required: true,
    type: Date,
  })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;
}

export const ChattingSchema = SchemaFactory.createForClass(Chatting);
