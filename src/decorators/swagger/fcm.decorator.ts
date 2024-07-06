import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { NotificationListDto } from 'src/domain/firebase/dtos/notificationList.dto';

type FcmEndpoints =
  | 'getNotificationList'
  | 'disableNotification'
  | 'checkNotification';
export function Docs(endpoint: FcmEndpoints) {
  switch (endpoint) {
    case 'getNotificationList':
      return applyDecorators(
        ApiOkResponse({
          type: [NotificationListDto],
        }),
      );
    case 'disableNotification':
      return applyDecorators(
        ApiOperation({ summary: '유저 FCM 토큰 NULL로 변경' }),
        ApiOkResponse({ description: '알림 비활성화 성공' }),
      );
    case 'checkNotification':
      return applyDecorators(ApiOperation({ summary: '알림 설정 유무 확인' }));
  }
}
