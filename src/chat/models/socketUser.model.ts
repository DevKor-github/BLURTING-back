import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
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
    enum: Sex,
  })
  @IsEnum(Sex)
  userSex: Sex;
}

export const SocketUserSchema = SchemaFactory.createForClass(SocketUser);
