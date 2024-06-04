import { Controller, Post, Body, Get, Delete, UseGuards } from '@nestjs/common';
import { FcmService } from 'src/firebase/fcm.service';
import { JwtPayload } from 'src/interfaces/auth';
import { UpdateProfileDto, UserProfileDto } from 'src/dtos/user.dto';
import { UserService } from './user.service';
import { AccessGuard } from 'src/auth/guard/access.guard';
import { Docs } from 'src/decorators/swagger/user.decorator';
import { User } from 'src/decorators/accessUser.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  @UseGuards(AccessGuard)
  @Docs('setNotificationToken')
  @Post('/notification')
  async setNotificationToken(
    @User() user: JwtPayload,
    @Body() notificationToken: { token: string },
  ): Promise<void> {
    const { id } = user;
    await this.userService.createSocketUser(id);
    await this.fcmService.enableNotification(id, notificationToken.token);
  }

  @UseGuards(AccessGuard)
  @Docs('testNotification')
  @Post('/testfcm')
  async testNotification(
    @User() user: JwtPayload,
    @Body() notification: { title: string; text: string; type: string },
  ): Promise<void> {
    const { id } = user;
    await this.fcmService.sendPush(id, notification.text, notification.type);
  }

  @UseGuards(AccessGuard)
  @Docs('getUserProfile')
  @Get('/profile')
  async getUserProfile(@User() user: JwtPayload): Promise<UserProfileDto> {
    const { id } = user;
    const images = await this.userService.getUserImages(id);
    const profile = await this.userService.getUserProfile(id, images);
    return profile;
  }

  @UseGuards(AccessGuard)
  @Docs('updateProfile')
  @Post('/update')
  async updateProfile(
    @User() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<void> {
    const { id } = user;

    for (const key in updateProfileDto) {
      if (key != 'images') {
        this.userService.updateUserInfo(id, key, updateProfileDto[key]);
      } else {
        this.userService.updateUserImages(id, updateProfileDto.images);
      }
    }
  }

  @UseGuards(AccessGuard)
  @Docs('deleteUser')
  @Delete()
  async deleteUser(@User() user: JwtPayload): Promise<void> {
    const { id } = user;

    await this.userService.deleteUser(id);
  }

  @UseGuards(AccessGuard)
  @Docs('getUserPoint')
  @Get()
  async getUserPoint(@User() user: JwtPayload): Promise<{ point: number }> {
    const { id } = user;

    const foundUser = await this.userService.findUserByVal('id', id);
    return { point: foundUser.point };
  }

  @UseGuards(AccessGuard)
  @Docs('getUserAccount')
  @Get('/account')
  async getUserAccount(@User() user: JwtPayload) {
    const { id } = user;

    const foundUser = await this.userService.findUserByVal('id', id);
    return { phoneNumber: foundUser.phoneNumber };
  }

  @UseGuards(AccessGuard)
  @Docs('getUserSex')
  @Get('/sex')
  async getUserSex(@User() user: JwtPayload) {
    const { id } = user;

    const foundUser = await this.userService.findUserByVal('id', id);
    return { sex: foundUser.userInfo.sex };
  }
}
