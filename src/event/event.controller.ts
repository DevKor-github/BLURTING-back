import {
  Controller,
  Post,
  Req,
  UseGuards,
  Body,
  Get,
  NotFoundException,
  Param,
  Res,
  HttpException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { Request, Response } from 'express';
import { EventRegisterDto } from './dtos/event.dto';
import { UserService } from 'src/user/user.service';
import {
  AnswerDto,
  BlurtingAnswerDto,
  BlurtingPageDto,
} from 'src/dtos/blurtingPage.dto';
import { BlurtingService } from 'src/blurting/blurting.service';
import { UserProfileDto } from 'src/dtos/user.dto';
import { OtherPeopleInfoDto } from 'src/blurting/dtos/otherPeopleInfo.dto';
import { ArrowInfoResponseDto } from 'src/blurting/dtos/arrowInfoResponse.dto';
import { AccessGuard } from 'src/auth/guard/acces.guard';

@Controller('event')
@ApiTags('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly blurtingService: BlurtingService,
  ) {}

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
    description: '매칭 전 0, 매칭 완료 1, 매칭 중 2, 블러팅 끝 3',
  })
  async getMatching(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const isMatching = await this.eventService.isMatching(user);
    const eventUser = await this.eventService.getEventInfo(user);

    if (isMatching) {
      return 2;
    }
    if (
      eventUser?.group &&
      eventUser?.group?.createdAt >
        new Date(new Date().getTime() - 1000 * 60 * 15 + 1000 * 60 * 60 * 9)
    ) {
      return 1;
    }
    if (eventUser?.group) {
      return 3;
    }
    return 0;
  }

  @UseGuards(AuthGuard('access'))
  @Post('/register')
  @ApiOperation({ summary: '코드와 테이블 번호를 쓰고 등록을 눌렀을 때' })
  @ApiCreatedResponse({
    description:
      '큐에 등록시 0 , 그룹이 있으면 1, 매칭 중이면 2, 블러팅 끝났으면 3',
  })
  async registerGroupQueue(
    @Req() req: Request,
    @Body() body: EventRegisterDto,
  ): Promise<0 | 1 | 2 | 3> {
    const { id } = req.user as JwtPayload;

    await this.eventService.setTable(id, body.table);

    return await this.eventService.registerGroupQueue(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/latest')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '이벤트 블러팅 최신 질문 탭',
    description: '마지막 질문 관련 정보 및 답변 반환',
  })
  @ApiResponse({
    description: '마지막 Q&A 정보 반환',
    type: BlurtingAnswerDto,
  })
  async getBlurting(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const eventUser = await this.eventService.getEventInfo(user);
    if (eventUser.group == null) throw new NotFoundException();
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      eventUser.group,
      0,
    );
    return blurtingPage;
  }

  @UseGuards(AuthGuard('access'))
  @Get('/result')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '지난 블러팅',
    description: '블러팅 끝나고 누구랑 매칭되었는지 반환',
  })
  @ApiResponse({
    description: '매칭된 유저 정보 반환, 없으면 null 반환',
    type: UserProfileDto,
  })
  async getBlurtingResult(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const eventUser = await this.eventService.getEventInfo(user);

    if (
      // debug
      eventUser.group.createdAt >
      new Date(new Date().getTime() + 1000 * 60 * 60 * 9 - 1000 * 60 * 5)
    ) {
      throw new HttpException('화살 보내기가 끝나지 않았습니다', 400);
    }

    const matchedUser = this.eventService.getFinalArrow(id);
    return matchedUser;
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
    name: 'day 0으로 보내주세요',
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
    return await this.eventService.makeArrow(id, toId, day);
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
    return await this.eventService.getArrows(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/group-info')
  @ApiOperation({
    summary: '이벤트 그룹 정보',
    description: '그룹 정보',
  })
  @ApiUnauthorizedResponse({ description: '토큰 만료' })
  @ApiOkResponse({
    description: '그룹 정보',
    type: [OtherPeopleInfoDto],
  })
  async getGroupInfo(@Req() req: Request): Promise<OtherPeopleInfoDto[]> {
    const { id } = req.user as JwtPayload;
    return await this.eventService.getGroupInfo(id);
  }

  @UseGuards(AccessGuard)
  @Get('/meeting/check')
  @ApiOperation({
    summary: '미팅 선택 가능한지 확인',
  })
  async checkMeeting(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const eventUser = await this.eventService.getEventInfo(user);
    if (eventUser?.wantToJoin == null) {
      return true;
    } else {
      return false;
    }
  }

  @UseGuards(AccessGuard)
  @Get('/end')
  @ApiOperation({
    summary: '이벤트 끝 (state 3-> 0)',
  })
  async endEvent(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    return await this.eventService.endEvent(id);
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
    summary: '이벤트 블러팅 질문 탭',
    description: '선택 질문 관련 정보 및 답변 반환',
  })
  @ApiResponse({
    description: '선택 Q&A 정보 반환',
    type: BlurtingPageDto,
  })
  async getBlurtingNo(@Req() req: Request, @Param('no') no: number) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const eventUser = await this.eventService.getEventInfo(user);
    if (eventUser?.group == null) throw new NotFoundException();
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      eventUser.group,
      no,
    );
    return blurtingPage;
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
  async postAnswer(
    @Req() req: Request,
    @Body() answerDto: AnswerDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const { questionId, answer } = answerDto;
    await this.blurtingService.postAnswer(id, questionId, answer);
    return res.sendStatus(201);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/meeting/:answer')
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '실제 미팅 선택',
    description: '실제로 만나겠습니까? 예/아니오',
  })
  @ApiParam({
    name: '미팅 원하는지 여부',
    description: 'yes / no',
    type: String,
  })
  async answerMeeting(@Req() req: Request, @Param('answer') answer: string) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const eventUser = await this.eventService.getEventInfo(user);
    const matchedUser = await this.eventService.getFinalMatchedUser(id);
    if (!matchedUser) throw new NotFoundException();

    const matchedEventUser = await this.eventService.getEventInfo(matchedUser);

    if (answer === 'no') {
      return await this.eventService.wantToJoin(id, false);
    } else {
      this.eventService.wantToJoin(id, true);

      if (matchedEventUser.wantToJoin) {
        await this.eventService.sendDiscordMessage(
          user.userNickname +
            ' / 테이블 번호 : ' +
            eventUser.table +
            '    &&&   ' +
            matchedUser.userNickname +
            ' / 테이블 번호 : ' +
            matchedEventUser.table,
        );
      }
    }
  }

  @Post('/message')
  async postMessage(@Req() req: Request) {
    await this.eventService.sendDiscordMessage(req.body.content);
  }
}
