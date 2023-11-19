import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document, SchemaOptions } from 'mongoose';
import { ChatUserDto } from 'src/dtos/chat.dto';

const options: SchemaOptions = {
  id: false,
  collection: 'room',
};

const ChatUser = new MongooseSchema(
  {
    userId: { required: true, type: Number },
    hasRead: { required: true, type: Date },
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
    type: Number,
    default: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  blur: number;

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  connected: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
