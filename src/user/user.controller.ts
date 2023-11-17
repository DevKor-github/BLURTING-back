import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FcmService } from 'src/firebase/fcm.service';
import { JwtPayload } from 'src/interfaces/auth';
import { UserProfileDto } from 'src/dtos/user.dto';
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
  @Post()
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
    const image = await this.userService.getUserImage(id);
    const profile = await this.userService.getUserProfile(id, image);
    return res.json(profile);
  }
}
