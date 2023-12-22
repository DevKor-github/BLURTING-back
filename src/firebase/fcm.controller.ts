import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { NotificationListDto } from './dtos/notificationList.dto';
import { AuthGuard } from '@nestjs/passport';
import { FcmService } from './fcm.service';
import { Request, Response } from 'express';
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

  @Get('/disable')
  @ApiOperation({ summary: '유저 FCM 토큰 NULL로 변경' })
  @ApiOkResponse({ description: '알림 비활성화 성공' })
  @UseGuards(AuthGuard('access'))
  async disableNotification(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    await this.fcmService.disableNotification(id);
    return res.sendStatus(200);
  }
}
