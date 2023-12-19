import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { NotificationListDto } from './dtos/notificationList.dto';
import { AuthGuard } from '@nestjs/passport';
import { FcmService } from './fcm.service';
import { Request } from 'express';
import { JwtPayload } from 'src/interfaces/auth';

@Controller('fcm')
export class fcmController {
  constructor(private readonly fcmService: FcmService) {}
  @Get()
  @ApiOkResponse({ type: [NotificationListDto] })
  @UseGuards(AuthGuard('access'))
  async getNotificationList(
    @Req() req: Request,
  ): Promise<NotificationListDto[]> {
    const { id } = req.user as JwtPayload;
    return await this.fcmService.getNotificationList(id);
  }
}
