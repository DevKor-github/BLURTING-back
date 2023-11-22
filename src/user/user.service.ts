import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hobby, Character, Nickname } from 'src/common/enums';
import { CharacterMask, HobbyMask } from 'src/common/const';
import {
  BlurtingGroupEntity,
  UserEntity,
  UserInfoEntity,
  UserImageEntity,
} from 'src/entities';
import { SocketUser } from 'src/chat/models';
import { UserProfileDto } from 'src/dtos/user.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInfoEntity)
    private readonly userInfoRepository: Repository<UserInfoEntity>,
    @InjectRepository(UserImageEntity)
    private readonly userImageRepository: Repository<UserImageEntity>,
    @InjectModel(SocketUser.name)
    private readonly socketUserModel: Model<SocketUser>,
  ) {}

  async createUser() {
    const nicknames = Object.values(Nickname);
    const rand = Math.floor(Math.random() * 100000);
    const index = rand % nicknames.length;
    const nickname = nicknames[index].toString() + rand.toString();
    const user = await this.userRepository.create({ userNickname: nickname });
    return await this.userRepository.save(user);
  }

  async createUserInfo(user: UserEntity) {
    const userInfoEntity = await this.userInfoRepository.create({ user: user });
    const userInfo = await this.userInfoRepository.save(userInfoEntity);
    this.updateUser(user.id, 'userInfo', userInfo);
    return userInfo;
  }

  async updateUser(
    id: number,
    field: string,
    value: string | UserInfoEntity | BlurtingGroupEntity,
  ) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    user[field] = value;
    return this.userRepository.save(user);
  }

  async updateUserInfo(
    id: number,
    field: string,
    value: string | Array<Character> | Array<Hobby>,
  ) {
    let maskedValue: number = 0;

    switch (field) {
      case 'character':
        for (const item of value) {
          maskedValue |=
            CharacterMask[
              Object.keys(Character).find((key) => Character[key] == item)
            ];
        }
        this.userInfoRepository.update(id, { character: maskedValue });
        break;
      case 'hobby':
        for (const item of value) {
          maskedValue |=
            HobbyMask[Object.keys(Hobby).find((key) => Hobby[key] == item)];
        }
        this.userInfoRepository.update(id, { hobby: maskedValue });
        break;
      default:
        this.userInfoRepository.update(id, { [field]: value });
    }
  }

  async updateUserImages(userId: number, images: string[]) {
    if (images.length < 1) return;

    await this.userImageRepository.delete({ user: { id: userId } });
    const entities = images.map((image, i) =>
      this.userImageRepository.create({
        user: { id: userId },
        no: i,
        url: image,
      }),
    );
    await this.userImageRepository.save(entities);
    await this.socketUserModel.updateOne(
      { userId: userId },
      {
        userImage: images[0],
      },
    );
  }

  async findUserByVal(field: string, value: string | number) {
    const validatedUser = await this.userRepository.findOne({
      where: { [field]: value },
    });
    if (!validatedUser) return validatedUser;
    else {
      const user = await this.userRepository.findOne({
        where: {
          id: validatedUser.id,
          phoneNumber: validatedUser.phoneNumber,
          email: validatedUser.email,
        },
        relations: ['userInfo', 'group'],
      });
      return user;
    }
  }

  async findCompleteUserByPhone(phone: string) {
    const user = await this.userRepository.findOne({
      where: {
        phoneNumber: phone,
        email: Not(IsNull()),
      },
    });
    return user;
  }

  async findUser(field: string, value: string | number) {
    const user = await this.userRepository.findOne({
      where: { [field]: value },
      relations: ['userInfo', 'group'],
    });
    const userInfo = await this.userInfoRepository.findOne({
      where: { [field]: value },
    });
    return { ...user, ...userInfo };
  }

  async getUserImages(userId: number) {
    const userImages = await this.userImageRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: {
        no: 'ASC',
      },
    });
    const userImgeUrl = userImages.map((image) => {
      return image.url;
    });
    return userImgeUrl ?? null;
  }

  async getUserProfile(userId: number, image: string[]) {
    const userInfo = await this.userInfoRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    return await UserProfileDto.ToDto(userInfo, image);
  }

  async deleteUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    await this.userRepository.remove(user);
    const socketUser = await this.socketUserModel.findOneAndDelete({
      userId: userId,
    });
    // TODO: socket 에러 처리...?
  }
}
