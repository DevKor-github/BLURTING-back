import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sex, SexOrient, Hobby, Character, Nickname } from 'src/common/enums';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUsersInGroup(groupId: number) {
    const users = await this.userRepository.find({
      where: { group: { id: groupId } },
      relations: ['userInfo', 'group'],
    });
    return users;
  }

  async getGroupUsers(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['group'],
    });
    if (!user.group) return [];

    const users = await this.userRepository.find({
      where: { group: user.group },
      relations: ['userInfo', 'group'],
    });
    return users;
  }

  async createUser() {
    const nicknames = Object.values(Nickname).filter((key) => {
      return isNaN(Number(key));
    });
    let rand = Math.floor(Math.random() * 1000);
    const index = rand % nicknames.length;
    rand = Math.floor(Math.random() * 1000);
    const nickname = nicknames[index].toString() + rand.toString();
    const user = this.userRepository.create({
      userNickname: nickname,
      point: 0,
    });
    return await this.userRepository.save(user);
  }

  async createUserInfo(user: UserEntity) {
    const userInfoEntity = await this.userInfoRepository.create({ user: user });
    const userInfo = await this.userInfoRepository.save(userInfoEntity);
    this.updateUser(user.id, 'userInfo', userInfo);
    return userInfo;
  }

  async createSocketUser(userId: number) {
    const socketUser = await this.socketUserModel.findOne({ userId: userId });
    if (socketUser) return;
    const user = await this.findUserByVal('id', userId);
    const userImages = await this.getUserImages(userId);

    // TODO: BAN WITHOUT SEX
    await this.socketUserModel.create({
      socketId: null,
      notificationToken: null,
      userId: userId,
      userNickname: user.userNickname,
      userSex: user.userInfo.sex ?? 'F',
      userImage: userImages.length ? userImages[0] : null,
      connection: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
    });
  }

  async updateUser(
    id: number,
    field: string,
    value: string | UserInfoEntity | BlurtingGroupEntity,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['group'],
    });
    user[field] = value;
    return this.userRepository.save(user);
  }

  async saveUsers(users: UserEntity[]) {
    return await this.userRepository.save(users);
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

  async findUserByPhone(phone: string) {
    const user = await this.userRepository.findOne({
      where: { phoneNumber: phone, email: Not(IsNull()) },
      relations: ['userInfo', 'group'],
    });
    return user;
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

  getUserSexOrient(info: UserInfoEntity) {
    if (info.sex === Sex.Male) {
      if (info.sexOrient === SexOrient.Homosexual) {
        return 'male_homo';
      } else {
        return 'male';
      }
    } else if (info.sex === Sex.Female) {
      if (info.sexOrient === SexOrient.Homosexual) {
        return 'female_homo';
      } else {
        return 'female';
      }
    }
  }

  async deleteUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userInfo'],
    });

    const sexOrient = this.getUserSexOrient(user.userInfo);
    const region = user.userInfo.region.split(' ')[0];
    const qName = `${region}_${sexOrient}`;
    const groupQueue: number[] = await this.cacheManager.get(qName);
    const idx = groupQueue.indexOf(user.id);
    if (idx > -1) groupQueue.splice(idx, 1);
    await this.cacheManager.set(qName, groupQueue);

    await this.userRepository.remove(user);
    await this.socketUserModel.updateOne(
      { userId: userId },
      { isDeleted: true },
    );
  }
}
