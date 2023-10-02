import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { UserInfoEntity } from 'src/entities/userInfo.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from 'src/dtos/createUser.dto';
import { CreateUserInfoDto } from 'src/dtos/createUserInfo.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserInfoEntity)
    private readonly userInfoRepository: Repository<UserInfoEntity>,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async createUser(user: CreateUserDto){
    let { userId, userHash, userName, email, phoneNumber } = user;
    const nickname = "츄츄";
    userHash = bcrypt.hashSync(userHash, 10);
    return await this.userRepository.save({
      userId: userId, 
      userHash: userHash, 
      userName: userName, 
      userNickname: nickname, 
      email: email, 
      phoneNumber: phoneNumber 
    });
  }

  async createUserInfo(info: CreateUserInfoDto, user: UserEntity){
    const { sex, sexOrient, region, religion, drink, cigarette, height, major, mbti, character, hobby, university } = info;
    return await this.userInfoRepository.save({
      sex: sex, 
      sexOrient: sexOrient, 
      region: region, 
      religion: religion, 
      drink: drink, 
      cigarette: cigarette, 
      height: height, 
      major: major, 
      mbti: mbti, 
      character: character, 
      hobby: hobby, 
      university: university,
      user: user,
    });
  }

  async findUserById(userId: string) {
    const user = await this.userRepository.findOne({where: { userId }});
    if (user) {
      throw new BadRequestException('이미 사용 중인 아이디입니다.');
    }
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({where: { email }});
    if (user) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }
    return user;
  }

  async findUserByPhone(phoneNumber: string) {
    const user = await this.userRepository.findOne({where: { phoneNumber }});
    if (user) {
      throw new BadRequestException('이미 사용 중인 전화번호입니다.');
    }
    return user;
  }
}
