import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { FcmService } from 'src/firebase/fcm.service';
import { JwtPayload } from 'src/interfaces/auth';

@Controller('user')
export class UserController {
  constructor(private readonly fcmService: FcmService) {}

  @UseGuards(AuthGuard('access'))
  @Post()
  async setNotificationToken(
    @Req() req: Request,
    @Body() notificationToken: string,
  ) {
    const { id } = req.user as JwtPayload;
    this.fcmService.enableNotification(id, notificationToken);
  }
}
