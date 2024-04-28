import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiRequestTimeoutResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  SignupTokenResponseDto,
  SignupPhoneRequestDto,
  SignupUserRequestDto,
  TokenResponseDto,
} from 'src/auth/dtos';

export function CheckCodeDocs() {
  return applyDecorators(
    ApiConflictResponse({ description: '사용 중 전화번호' }),
    ApiBadRequestResponse({ description: 'invalid signup token' }),
    ApiUnauthorizedResponse({ description: '인증번호 오류' }),
    ApiRequestTimeoutResponse({ description: '인증번호 시간 초과' }),
    ApiCreatedResponse({ description: '성공', type: SignupTokenResponseDto }),
    ApiQuery({
      name: 'code',
      description: '인증번호',
      type: String,
      example: '010123',
    }),
    ApiBody({ description: 'phone', type: SignupPhoneRequestDto }),
  );
}

export function CheckMailDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '이메일 인증',
      description: '이메일 인증',
    }),
    ApiQuery({
      name: 'code',
      description: '인증 코드',
      type: String,
      example: '123456',
    }),
    ApiQuery({
      name: 'email',
      description: '이메일',
      type: String,
      example: '123456@korea.ac.kr',
    }),
  );
}

export function SignupDocs() {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'invalid signup token or invalid info',
    }),
    ApiConflictResponse({ description: '이미 가입된 정보' }),
    ApiNotAcceptableResponse({ description: '10초 내 재요청' }),
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiBody({
      description: '유저 정보 차례대로 하나씩',
      type: SignupUserRequestDto,
    }),
    ApiOperation({
      summary: '회원가입',
      description:
        'signup token과 body의 정보로 회원가입 진행 및 signup token 재발행',
    }),
  );
}

export function SignupStartDocs() {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
    ApiOperation({
      summary: '회원가입 시작',
      description: '첫 signup token 발행',
    }),
  );
}

export function SignupPhoneNumberDocs() {
  return applyDecorators(
    ApiOperation({ summary: '휴대폰 인증 요청' }),
    ApiBadRequestResponse({
      description: 'invalid signup token 또는 전화번호 오류',
    }),
    ApiConflictResponse({ description: '사용 중 전화번호' }),
    ApiNotAcceptableResponse({ description: '10초 내 재요청' }),
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
  );
}

export function SignupImageDocs() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'invalid signup token' }),
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
  );
}

export function SignupEmailDocs() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'invalid signup token or invalid email',
    }),
    ApiConflictResponse({ description: '이미 가입된 이메일' }),
    ApiNotAcceptableResponse({ description: '10초 내 재요청' }),
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
  );
}

export function SignupBackDocs() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'invalid signup token',
    }),
    ApiCreatedResponse({
      description: 'new signup token',
      type: SignupTokenResponseDto,
    }),
    ApiOperation({
      summary: '회원가입 뒤로가기',
      description: '이전 signup token 발행',
    }),
  );
}

export function LoginDocs() {
  return applyDecorators(ApiOperation({ deprecated: true }));
}

export function RefreshDocs() {
  return applyDecorators(
    ApiCreatedResponse({
      description: 'new access token',
      type: TokenResponseDto,
    }),
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiOperation({
      summary: 'accesstoken 갱신',
      description: 'refresh token으로 access token 갱신',
    }),
  );
}

export function AlreadyRegisteredDocs() {
  return applyDecorators(
    ApiNotFoundResponse({ description: '없는 번호' }),
    ApiNotAcceptableResponse({ description: '10초 내 재요청' }),
  );
}

export function AlreadyCheckDocs() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'invalid code' }),
    ApiRequestTimeoutResponse({ description: '3분지남' }),
    ApiCreatedResponse({ description: '성공', type: TokenResponseDto }),
    ApiQuery({
      name: 'code',
      description: '인증번호',
      type: String,
      example: '010123',
    }),
    ApiBody({ description: 'phone', type: SignupPhoneRequestDto }),
  );
}

type GeoEndPoints = 'name' | 'geo';
export function geocodingDocs(endpoint: GeoEndPoints) {
  switch (endpoint) {
    case 'name':
      return applyDecorators(
        ApiQuery({
          name: 'name',
          description: '검색할 지역 이름',
          type: String,
          example: '성북구',
        }),
        ApiOkResponse({
          description: '검색한 지역 이름에 대한 지역 리스트',
          type: [String],
        }),
        ApiOperation({
          summary: '이름 기반 시군구 검색',
          description: '이름 형식 기반 LIKE 연산, 시군구 리스트 반환',
        }),
      );
    case 'geo':
      return applyDecorators(
        ApiQuery({
          name: 'geo',
          description: '검색할 지역 위도, 경도',
          type: String,
          example: 'point(127.0164 37.4984)',
        }),
        ApiOperation({
          summary: '좌표 기반 시군구 검색',
          description:
            'Point(경도, 위도) 형식으로 좌표를 입력하면 해당 좌표 주변 시군구 리스트 반환',
        }),
        ApiOkResponse({
          description: '검색한 좌표에 대한 지역 리스트',
          type: [String],
        }),
      );
  }
}
