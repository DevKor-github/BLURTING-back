import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/users.entity';
import { UserInfoEntity } from 'src/entities/userInfo.entity';
import { Repository } from 'typeorm';
import { Nickname } from 'src/common/enums/nickname.enum';
import { Character, CharacterMask } from 'src/common/enums/character.enum';
import { Hobby, HobbyMask } from 'src/common/enums/hobby.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInfoEntity)
    private readonly userInfoRepository: Repository<UserInfoEntity>,
  ) {}

  private readonly logger = new Logger(UserService.name);

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

  async updateUser(id: number, field: string, value: string) {
    this.userRepository.update(id, { [field]: value });
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
    });
    return user;
  }
}
