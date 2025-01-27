import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export type ValidationEndpoints =
  | 'purchaseValidation'
  | 'admobValidation'
  | 'appleValidation';

export function ValidationDocs(endpoint: ValidationEndpoints) {
  switch (endpoint) {
    case 'purchaseValidation':
      return applyDecorators(
        ApiOperation({
          summary: 'purchase validation',
        }),
        ApiParam({
          name: 'productId',
          description: '상품 Id',
          required: true,
          type: String,
        }),
        ApiParam({
          name: 'token',
          description: 'token',
          required: true,
          type: String,
        }),
        ApiOkResponse({
          description: 'purchase validation success, 보상 지급',
        }),
        ApiBadRequestResponse({
          description:
            'purchase validation fail, 보상 미지급,구매 취소 / 대기중 / 이미 리워드 지급 / 에러',
        }),
      );
    case 'admobValidation':
      return applyDecorators(
        ApiOperation({
          summary: 'admob validation',
          description: 'VSS callback url입니다.',
        }),
        ApiOkResponse({
          description: 'admob validation success, 보상 지급',
        }),
        ApiBadRequestResponse({
          description: 'admob validation fail',
        }),
      );
    case 'appleValidation':
      return applyDecorators(
        ApiOperation({
          summary: '애플 앱스토어 보상 받기',
          description: '앱스토어 결제 transaction Id를 통해 계정에 보상 지급',
        }),
        ApiParam({
          name: 'transactionId',
          description: '앱스토어 결제 transaction Id',
          required: true,
          type: String,
        }),

        ApiOkResponse({
          type: Number,
          description: '보상 받기 성공, 지급된 포인트량',
        }),
        ApiBadRequestResponse({ description: '이미 포인트 받음' }),
        ApiNotFoundResponse({
          description: 'transactionId에 해당하는 결제 기록 X',
        }),
      );
  }
}
