import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FcmService } from 'src/firebase/fcm.service';
import { JwtPayload } from 'src/interfaces/auth';
import { UpdateProfileDto, UserProfileDto } from 'src/dtos/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  @UseGuards(AuthGuard('access'))
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '알림 설정',
    description: 'firebase token 저장',
  })
  @Post('/notification')
  async setNotificationToken(
    @Req() req: Request,
    @Body() notificationToken: string,
  ) {
    const { id } = req.user as JwtPayload;
    this.fcmService.enableNotification(id, notificationToken);
  }

  @UseGuards(AuthGuard('access'))
  @ApiCreatedResponse({
    description: 'get user profile',
    type: UserProfileDto,
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '내 프로필',
    description: '내 프로필 보기',
  })
  @Get('/profile')
  async getUserProfile(
    @Req() req: Request,
    @Param('userId') userId: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const images = await this.userService.getUserImages(id);
    const profile = await this.userService.getUserProfile(id, images);
    return res.json(profile);
  }

  @UseGuards(AuthGuard('access'))
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiBody({
    description: '수정할 유저 정보 json',
    type: UpdateProfileDto,
  })
  @ApiOperation({
    summary: '프로필 정보 수정',
    description: '프로필 정보 수정하기',
  })
  @Post('/update')
  async updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    try {
      for (const key in updateProfileDto) {
        if (key != 'images') {
          this.userService.updateUserInfo(id, key, updateProfileDto[key]);
        } else {
          this.userService.updateUserImages(id, updateProfileDto.images);
        }
      }
      return res.sendStatus(201);
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  @UseGuards(AuthGuard('access'))
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '유저 삭제',
    description: '유저 삭제하기',
  })
  @Delete()
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      await this.userService.deleteUser(id);
      return res.sendStatus(204);
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
