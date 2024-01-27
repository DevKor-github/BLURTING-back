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
} from '@nestjs/swagger';
import { SignupTokenResponseDto, TokenResponseDto } from 'src/auth/dtos';
import { CreateUserDto } from 'src/dtos/user.dto';

export function CheckCodeDocs() {
  return applyDecorators(
    ApiQuery({
      name: 'code',
      description: '인증번호',
      type: String,
      example: '010123',
    }),
    ApiConflictResponse({ description: '사용 중 전화번호' }),
    ApiBadRequestResponse({ description: 'invalid signup token' }),
    ApiUnauthorizedResponse({ description: '인증번호 오류' }),
    ApiRequestTimeoutResponse({ description: '인증번호 시간 초과' }),
    ApiCreatedResponse({ description: '성공', type: SignupTokenResponseDto }),
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
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiBody({
      description: '유저 정보 차례대로 하나씩',
      type: CreateUserDto,
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
  );
}
