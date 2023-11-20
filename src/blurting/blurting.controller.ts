import {
  Controller,
  UseGuards,
  Get,
  Post,
  Req,
  Res,
  Body,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BlurtingService } from './blurting.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/user/user.service';
import { AnswerDto } from 'src/dtos/blurtingPage.dto';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@Controller('blurting')
export class BlurtingController {
  constructor(
    private readonly blurtingService: BlurtingService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard('access'))
  @Get()
  async getBlurting(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const blurtingPage = await this.blurtingService.getBlurting(user.group);
    return res.json(blurtingPage);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/answer')
  async postAnswer(
    @Req() req: Request,
    @Body() answerDto: AnswerDto,
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const { questionId, answer } = answerDto;
    if (await this.blurtingService.postAnswer(id, questionId, answer)) {
      res.sendStatus(200);
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
