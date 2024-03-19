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
} from '@nestjs/common';
import { EventService } from './event.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
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
        new Date(new Date().getTime() - 1000 * 60 * 15)
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
    if (eventUser.group == null) throw new NotFoundException();
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
    const matchedUser = this.blurtingService.getFinalArrow(id);
    return matchedUser;
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

    if (answer === 'yes') {
      // 디코로 보내기
    }
  }
}
