import { ApiProperty } from '@nestjs/swagger';

export class NotificationListDto {
  @ApiProperty({ description: '알림 message' })
  message: string;

  @ApiProperty({ description: '날짜', example: '20/12/2012' })
  date: string;

  @ApiProperty({ description: '시간', example: '15:00:00' })
  time: string;
}
