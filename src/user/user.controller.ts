import { Controller, Body, Post, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/dtos/createUser.dto';
import { CreateUserInfoDto } from 'src/dtos/createUserInfo.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private readonly logger = new Logger(UserService.name);

  @Post('/signup')
  async signup(@Body() { UserDto, InfoDto }: { UserDto: CreateUserDto, InfoDto: CreateUserInfoDto }){
    
    this.logger.debug(UserDto);
    const {userId, email, phoneNumber} = UserDto;
    
    await this.userService.findUserById(userId);
    await this.userService.findUserByEmail(email);
    await this.userService.findUserByPhone(phoneNumber);
    
    const user = await this.userService.createUser(UserDto);
    await this.userService.createUserInfo(InfoDto, user);

    return user;
  }

}
