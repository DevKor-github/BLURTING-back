import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

export type ValidationEndpoints = 'purchaseValidation' | 'admobValidation';

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
  }
}
