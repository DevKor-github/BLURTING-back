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
    const user = await this.userService.findUser('id', id);
    const blurtingPage = await this.blurtingService.getBlurting(user.group);
    return res.send(blurtingPage);
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

  // for test
  @Post('/grouping')
  async grouping(@Body() users: number[]) {
    this.blurtingService.createGroup(users);
  }
}
