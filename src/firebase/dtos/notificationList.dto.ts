import { ApiProperty } from '@nestjs/swagger';
import { applyTimeZone } from 'src/common/util/time';
import { NotificationEntity } from 'src/entities';

export class NotificationListDto {
  @ApiProperty({ description: '알림 message' })
  message: string;

  @ApiProperty({ description: '날짜', example: '20/12/2012' })
  date: string;

  @ApiProperty({ description: '시간', example: '15:00:00' })
  time: string;

  constructor(entity: NotificationEntity) {
    const dateWithTimezone = applyTimeZone(entity.createdAt);
    const date = dateWithTimezone
      .toISOString()
      .split('T')[0]
      .split(':')
      .slice(0, 2)
      .join(':');
    const time = dateWithTimezone.toLocaleTimeString('en-GB');
    return { message: entity.body, date, time };
  }
}
