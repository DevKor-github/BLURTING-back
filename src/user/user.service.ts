import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hobby, Character, Nickname } from 'src/common/enums';
import { CharacterMask, HobbyMask } from 'src/common/const';
import {
  BlurtingGroupEntity,
  UserEntity,
  UserInfoEntity,
  UserImageEntity,
} from 'src/entities';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInfoEntity)
    private readonly userInfoRepository: Repository<UserInfoEntity>,
    @InjectRepository(UserImageEntity)
    private readonly userImageRepository: Repository<UserImageEntity>,
  ) {}

  async createUser() {
    const nicknames = Object.values(Nickname);
    const rand = Math.floor(Math.random() * 100000);
    const index = rand % nicknames.length;
    const nickname = nicknames[index].toString() + rand.toString();
    const user = this.userRepository.create({ userNickname: nickname });
    return this.userRepository.save(user);
  }

  async createUserInfo(user: UserEntity) {
    const userInfo = this.userInfoRepository.create({ user: user });
    return this.userInfoRepository.save(userInfo);
  }

  async updateUser(
    id: number,
    field: string,
    value: string | BlurtingGroupEntity,
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
      case 'image':
        break;
      default:
        this.userInfoRepository.update(id, { [field]: value });
    }
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

  async getUserImage(userId: number) {
    const userImage = await this.userImageRepository.find({
      where: { user: { id: userId }, no: 1 },
      relations: ['user'],
    });

    return userImage ? userImage['url'] : null;
  }
}
