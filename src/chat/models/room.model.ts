import { IsBoolean, IsNotEmpty, IsString, IsDate } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document, SchemaOptions } from 'mongoose';
import { ChatUserDto } from 'src/chat/dtos';

const options: SchemaOptions = {
  id: false,
  collection: 'room',
};

const ChatUser = new MongooseSchema(
  {
    userId: { required: true, type: Number },
    hasRead: { required: true, type: Date },
    blur: { require: true, type: Number, default: 0 },
    isDeleted: { required: true, type: Boolean, default: false },
  },
  { _id: false },
);

@Schema(options)
export class Room extends Document {
  @Prop({
    unique: true,
    required: true,
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @Prop({
    required: true,
    type: [ChatUser],
    default: [],
  })
  @IsNotEmpty()
  users: ChatUserDto[];

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  connected: boolean;

  @Prop({
    required: false,
    type: Date,
    default: null,
  })
  @IsDate()
  connectedAt: Date;

  @Prop({
    required: false,
    type: Boolean,
    default: null,
  })
  @IsDate()
  freeExpired: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
