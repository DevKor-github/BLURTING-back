import {
  Controller,
  UseGuards,
  Get,
  Post,
  Req,
  Res,
  Body,
  Param,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BlurtingService } from './blurting.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';
import { AnswerDto, BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BlurtingProfileDto } from 'src/dtos/user.dto';
import { ArrowInfoResponseDto } from './dtos/arrowInfoResponse.dto';
import { OtherPeopleInfoDto } from './dtos/otherPeopleInfo.dto';

@Controller('blurting')
@ApiTags('blurting')
export class BlurtingController {
  constructor(
    private readonly blurtingService: BlurtingService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard('access'))
  @Get('/latest')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '블러팅 최신 질문 탭',
    description: '마지막 질문 관련 정보 및 답변 반환',
  })
  @ApiResponse({
    description: '마지막 Q&A 정보 반환',
    type: BlurtingPageDto,
  })
  async getBlurting(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      user.group,
      0,
    );
    return res.json(blurtingPage);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/answer')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiBody({
    description: '블러팅 답변 정보 json',
    type: AnswerDto,
  })
  @ApiOperation({
    summary: '블러팅 답변 업로드',
    description: '질문에 대한 답변 등록',
  })
  @ApiCreatedResponse({
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
  })
  async postAnswer(
    @Req() req: Request,
    @Body() answerDto: AnswerDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const { questionId, answer } = answerDto;
    try {
      const point = await this.blurtingService.postAnswer(
        id,
        questionId,
        answer,
      );
      if (point) {
        return res.status(201).json({ point: point });
      } else {
        return res.sendStatus(201);
      }
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/register')
  @ApiCreatedResponse({
    description: '큐에 등록시 0 , 그룹이 있으면 1, 매칭 중이면 2',
  })
  async registerGroupQueue(@Req() req: Request): Promise<0 | 1 | 2> {
    const { id } = req.user as JwtPayload;

    return await this.blurtingService.registerGroupQueue(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/profile/:other')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiParam({
    name: 'other',
    description: '다른 사람 id',
    type: Number,
  })
  @ApiOperation({
    summary: '블러팅에서 프로필 가져오기',
    description: '블러팅에서 다른 사람 프로필 보기',
  })
  @ApiResponse({
    description: '다른 사람 정보 반환(room 있으면 string, 없으면 null)',
    type: BlurtingProfileDto,
  })
  async getBlurtingProfile(
    @Req() req: Request,
    @Param('other') other: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const profile = await this.blurtingService.getProfile(id, other);
    return res.json(profile);
  }

  @UseGuards(AuthGuard('access'))
  @Put('/like/:answerId')
  @ApiParam({
    description: '좋아요 누를 답변 id',
    name: 'answerId',
    type: Number,
  })
  @ApiOperation({
    summary: '블러팅 답변 좋아요 / 해제',
    description: '이미 좋아요 눌러져 있으면 해제/아니면 누르기',
  })
  @ApiUnauthorizedResponse({ description: '토큰 만료' })
  @ApiOkResponse({
    description: '좋아요 됐으면 TRUE, 해제 됐으면 FALSE',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'answerId 오류' })
  async likeAnswer(@Req() req: Request, @Param('answerId') answerId: number) {
    const { id } = req.user as JwtPayload;
    return await this.blurtingService.likeAnswer(id, answerId);
  }
  @UseGuards(AuthGuard('access'))
  @Post('/arrow/:toId/:day')
  @ApiParam({
    description: '화살표 받을 사람 id',
    name: 'toId',
    type: Number,
  })
  @ApiParam({
    description: 'day',
    name: 'day, 1,2,3으로 보내주세요',
    type: Number,
  })
  @ApiOperation({
    summary: '화살표 보내기',
    description: '화살표 보내기',
  })
  @ApiUnauthorizedResponse({ description: '토큰 만료' })
  @ApiOkResponse({
    description: '화살표 보내기 성공',
  })
  async makeArrow(
    @Req() req: Request,
    @Param('toId') toId: number,
    @Param('day') day: number,
  ) {
    const { id } = req.user as JwtPayload;
    return await this.blurtingService.makeArrow(id, toId, day);
  }
  @UseGuards(AuthGuard('access'))
  @Get('/arrow')
  @ApiOperation({
    summary: '내 화살표 보기',
    description: '내 화살표 보기',
  })
  @ApiUnauthorizedResponse({ description: '토큰 만료' })
  @ApiOkResponse({
    description: '내 화살표 보기 성공',
    type: ArrowInfoResponseDto,
  })
  async getArrows(@Req() req: Request): Promise<ArrowInfoResponseDto> {
    const { id } = req.user as JwtPayload;
    return await this.blurtingService.getArrows(id);
  }
  @UseGuards(AuthGuard('access'))
  @Get('/group-info')
  @ApiOperation({
    summary: '그룹 정보',
    description: '그룹 정보',
  })
  @ApiUnauthorizedResponse({ description: '토큰 만료' })
  @ApiOkResponse({
    description: '그룹 정보',
    type: [OtherPeopleInfoDto],
  })
  async getGroupInfo(@Req() req: Request): Promise<OtherPeopleInfoDto[]> {
    const { id } = req.user as JwtPayload;
    return await this.blurtingService.getGroupInfo(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get()
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '매칭 여부 확인',
    description: '블러팅 탭 클릭 시 매칭 여부 반환',
  })
  @ApiCreatedResponse({
    description: '매칭 완료 시 1, 전일 시 0, 매칭 중이면 2',
  })
  async getMatching(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    if (user.group) {
      return 1;
    }
    const isMatching = await this.blurtingService.isMatching(user);
    if (isMatching == true) {
      return 2;
    }
    return 0;
  }

  @UseGuards(AuthGuard('access'))
  @Get('/:no')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiParam({
    name: 'no',
    description: 'n번째 질문',
    type: Number,
  })
  @ApiOperation({
    summary: '블러팅 질문 탭',
    description: '선택 질문 관련 정보 및 답변 반환',
  })
  @ApiResponse({
    description: '선택 Q&A 정보 반환',
    type: BlurtingPageDto,
  })
  async getBlurtingNo(@Req() req: Request, @Param('no') no: number) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    if (user.group == null) throw new NotFoundException();
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      user.group,
      no,
    );
    return blurtingPage;
  }
}
