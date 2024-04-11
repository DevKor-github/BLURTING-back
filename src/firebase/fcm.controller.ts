import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationListDto } from './dtos/notificationList.dto';
import { AuthGuard } from '@nestjs/passport';
import { FcmService } from './fcm.service';
import { JwtPayload } from 'src/interfaces/auth';
import { User } from 'src/decorators/accessUser.decorator';
import { Docs } from 'src/decorators/swagger/fcm.decorator';

@Controller('fcm')
@ApiTags('fcm')
export class fcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Get()
  @UseGuards(AuthGuard('access'))
  @Docs('getNotificationList')
  async getNotificationList(
    @User() user: JwtPayload,
  ): Promise<NotificationListDto[]> {
    return await this.fcmService.getNotificationList(user.id);
  }

  @Get('/disable')
  @UseGuards(AuthGuard('access'))
  @Docs('disableNotification')
  async disableNotification(@User() user: JwtPayload): Promise<void> {
    await this.fcmService.disableNotification(user.id);
  }

  @Get('/check')
  @UseGuards(AuthGuard('access'))
  @Docs('checkNotification')
  async checkNotification(@User() user: JwtPayload): Promise<boolean> {
    return await this.fcmService.checkNotification(user.id);
  }
}
