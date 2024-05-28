import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AnswerRequestDto,
  ArrowInfoResponseDto,
  OtherPeopleInfoDto,
  ReplyRequestDto,
  BlurtingProfileDto,
  BlurtingPageDto,
} from 'src/blurting/dtos';

export function BlurtingStateDocs() {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiCreatedResponse({
      description: '매칭 전 0, 블러팅 중 1, 매칭 중 2, 블러팅 끝 3',
    }),
  );
}

export function BlurtingDocs() {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiOperation({
      summary: '블러팅 질문 탭',
      description: '질문 관련 정보 및 답변 반환',
    }),
    ApiResponse({
      description: 'Q&A 정보 반환',
      type: BlurtingPageDto,
    }),
  );
}

export function AnswerDocs() {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiBody({
      description: '블러팅 답변 정보 json',
      type: AnswerRequestDto,
    }),
    ApiOperation({
      summary: '블러팅 답변 업로드',
      description: '질문에 대한 답변 등록',
    }),
    ApiCreatedResponse({
      description: '답변 업로드 성공 시',
      schema: {
        example: { point: 10 },
        properties: {
          point: {
            type: 'number',
            description: '수정된 포인트 값',
          },
        },
      },
    }),
  );
}

export function ReplyDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '블러팅 답글 달기',
    }),
    ApiCreatedResponse({ description: '잘 됨' }),
    ApiUnauthorizedResponse({
      description: '토큰 X',
    }),
    ApiParam({
      name: 'answerId',
      type: Number,
      description: '답글 달 답변 id',
    }),
    ApiBody({
      type: ReplyRequestDto,
    }),
  );
}

export function LikeDocs() {
  return applyDecorators(
    ApiParam({
      description: '좋아요 누를 답변 id',
      name: 'answerId',
      type: Number,
    }),
    ApiOperation({
      summary: '블러팅 답변 좋아요 / 해제',
      description: '이미 좋아요 눌러져 있으면 해제/아니면 누르기',
    }),
    ApiUnauthorizedResponse({ description: '토큰 만료' }),
    ApiOkResponse({
      description: '좋아요 됐으면 TRUE, 해제 됐으면 FALSE',
      type: Boolean,
    }),
    ApiNotFoundResponse({ description: 'answerId 오류' }),
  );
}

export function MakeArrowDocs() {
  return applyDecorators(
    ApiParam({
      description: '화살표 받을 사람 id',
      name: 'toId',
      type: Number,
    }),
    ApiParam({
      description: 'day',
      name: 'day, 1,2,3으로 보내주세요',
      type: Number,
    }),
    ApiOperation({
      summary: '화살표 보내기',
      description: '화살표 보내기',
    }),
    ApiUnauthorizedResponse({ description: '토큰 만료' }),
    ApiOkResponse({
      description: '화살표 보내기 성공',
    }),
  );
}

export function GetArrowsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '내 화살표 보기',
      description: '내 화살표 보기',
    }),
    ApiUnauthorizedResponse({ description: '토큰 만료' }),
    ApiOkResponse({
      description: '내 화살표 보기 성공',
      type: ArrowInfoResponseDto,
    }),
  );
}

export function OtherProfileDocs() {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiParam({
      name: 'other',
      description: '다른 사람 id',
      type: Number,
    }),
    ApiOperation({
      summary: '블러팅에서 프로필 가져오기',
      description: '블러팅에서 다른 사람 프로필 보기',
    }),
    ApiResponse({
      description: '다른 사람 정보 반환(room 있으면 string, 없으면 null)',
      type: BlurtingProfileDto,
    }),
  );
}

export function GroupMemberDocs() {
  return applyDecorators(
    ApiOperation({
      summary: '그룹 정보',
      description: '그룹 정보',
    }),
    ApiUnauthorizedResponse({ description: '토큰 만료' }),
    ApiOkResponse({
      description: '그룹 정보',
      type: [OtherPeopleInfoDto],
    }),
  );
}

export function ResultDocs() {
  return applyDecorators(
    ApiHeader({
      name: 'authorization',
      required: true,
      example: 'Bearer asdas.asdasd.asd',
    }),
    ApiOperation({
      summary: '지난 블러팅',
      description: '블러팅 끝나고 누구랑 매칭되었는지 반환',
    }),
    ApiResponse({
      description: '매칭된 유저 정보 반환',
      schema: {
        properties: {
          myname: { type: 'string' },
          mysex: { type: 'string' },
          othername: { type: 'string' },
          othersex: { type: 'string' },
        },
      },
    }),
  );
}
