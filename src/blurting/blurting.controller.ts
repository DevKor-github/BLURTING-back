import {
  Controller,
  UseGuards,
  Get,
  Post,
  Req,
  Res,
  Body,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BlurtingService } from './blurting.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';
import { AnswerDto, BlurtingPageDto } from 'src/dtos/blurtingPage.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('blurting')
export class BlurtingController {
  constructor(
    private readonly blurtingService: BlurtingService,
    private readonly userService: UserService,
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
    description: '매칭 완료 시 true, 매칭 중이거나 전일 시 false',
  })
  async getMatching(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    if (user.group == null || user.group == undefined) {
      return res.send(false);
    } else {
      return res.send(true);
    }
  }

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
    const blurtingPage = await this.blurtingService.getBlurting(user.group, 0);
    return res.json(blurtingPage);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/:no')
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
  async getBlurtingNo(
    @Req() req: Request,
    @Param() no: number,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const blurtingPage = await this.blurtingService.getBlurting(user.group, no);
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
  @ApiCreatedResponse({ description: '답변 업로드 성공' })
  async postAnswer(
    @Req() req: Request,
    @Body() answerDto: AnswerDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const { questionId, answer } = answerDto;
    if (await this.blurtingService.postAnswer(id, questionId, answer)) {
      res.sendStatus(201);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/register')
  @ApiBadRequestResponse({ description: '이미 큐에 있음' })
  @ApiConflictResponse({ description: '이미 블러팅 그룹이 있음' })
  @ApiCreatedResponse({
    description: '큐에 등록 시 false, 그룹이 만들어졌을 시 true',
  })
  async registerGroupQueue(@Req() req: Request) {
    const { id } = req.user as JwtPayload;

    await this.blurtingService.registerGroupQueue(id);
  }
}
