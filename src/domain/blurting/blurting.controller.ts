import {
  Controller,
  UseGuards,
  Get,
  Post,
  Res,
  Body,
  Param,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { BlurtingService } from './blurting.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/interfaces/auth';
import { UserService } from 'src/domain/user/user.service';
import {
  AnswerRequestDto,
  OtherPeopleInfoDto,
  ReplyRequestDto,
  ArrowInfoResponseDto,
  BlurtingPageDto,
  BlurtingProfileDto,
  ArrowResultResponseDto,
} from 'src/domain/blurting/dtos';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AnswerDocs,
  BlurtingDocs,
  GetArrowsDocs,
  GroupMemberDocs,
  LikeDocs,
  MakeArrowDocs,
  BlurtingStateDocs,
  OtherProfileDocs,
  ReplyDocs,
  ResultDocs,
} from 'src/decorators/swagger/blurting.decorator';
import { User } from 'src/decorators/accessUser.decorator';
import { State } from 'src/common/enums/blurtingstate.enum';

@Controller('blurting')
@ApiTags('blurting')
export class BlurtingController {
  constructor(
    private readonly blurtingService: BlurtingService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AuthGuard('access'))
  @Get('/latest')
  @BlurtingDocs()
  async getBlurting(@User() userPayload: JwtPayload): Promise<BlurtingPageDto> {
    const { id } = userPayload;
    const user = await this.userService.findUserByVal('id', id);
    if (user.group == null) throw new NotFoundException();
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      user.group,
      0,
    );
    return blurtingPage;
  }

  @UseGuards(AuthGuard('access'))
  @Post('/answer')
  @AnswerDocs()
  async postAnswer(
    @User() userPayload: JwtPayload,
    @Body() answerDto: AnswerRequestDto,
    @Res() res: Response,
  ) {
    const { id } = userPayload;
    const { questionId, answer } = answerDto;
    const point = await this.blurtingService.postAnswer(id, questionId, answer);
    if (point) {
      return res.status(201).json({ point: point });
    } else {
      return res.sendStatus(201);
    }
  }

  @UseGuards(AuthGuard('access'))
  @Post('/register')
  @BlurtingStateDocs()
  async registerGroupQueue(@User() userPayload: JwtPayload): Promise<State> {
    const { id } = userPayload;
    return this.blurtingService.registerGroupQueue(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/profile/:other')
  @OtherProfileDocs()
  async getBlurtingProfile(
    @User() userPayload: JwtPayload,
    @Param('other') other: number,
  ): Promise<BlurtingProfileDto> {
    const { id } = userPayload;
    return this.blurtingService.getProfile(id, other);
  }

  @UseGuards(AuthGuard('access'))
  @Put('/like/:answerId')
  @LikeDocs()
  async likeAnswer(
    @User() userPayload: JwtPayload,
    @Param('answerId') answerId: number,
  ): Promise<boolean> {
    const { id } = userPayload;
    return this.blurtingService.likeAnswer(id, answerId);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/arrow/:toId/:day')
  @MakeArrowDocs()
  async makeArrow(
    @User() userPayload: JwtPayload,
    @Param('toId') toId: number,
    @Param('day') day: number,
  ): Promise<void> {
    const { id } = userPayload;
    return this.blurtingService.makeArrow(id, toId, day);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/arrow')
  @GetArrowsDocs()
  async getArrows(
    @User() userPayload: JwtPayload,
  ): Promise<ArrowInfoResponseDto> {
    const { id } = userPayload;
    return this.blurtingService.getArrows(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/group-info')
  @GroupMemberDocs()
  async getGroupInfo(
    @User() userPayload: JwtPayload,
  ): Promise<OtherPeopleInfoDto[]> {
    const { id } = userPayload;
    return this.blurtingService.getGroupInfo(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get()
  @BlurtingStateDocs()
  async getBlurtingState(@User() userPayload: JwtPayload): Promise<State> {
    const { id } = userPayload;
    return this.blurtingService.getBlurtingState(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/result')
  @ResultDocs()
  async getBlurtingResult(
    @User() userPayload: JwtPayload,
  ): Promise<ArrowResultResponseDto> {
    const { id } = userPayload;
    return this.blurtingService.getFinalArrow(id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/:no')
  @BlurtingDocs()
  @ApiParam({
    name: 'no',
    description: 'n번째 질문',
    type: Number,
  })
  async getBlurtingNo(
    @User() userPayload: JwtPayload,
    @Param('no') no: number,
  ): Promise<BlurtingPageDto> {
    const { id } = userPayload;
    const user = await this.userService.findUserByVal('id', id);
    if (user.group == null) throw new NotFoundException();
    const blurtingPage = await this.blurtingService.getBlurting(
      id,
      user.group,
      no,
    );
    return blurtingPage;
  }

  @UseGuards(AuthGuard('access'))
  @Post('/reply/:answerId')
  @ReplyDocs()
  async createReply(
    @User() userPayload: JwtPayload,
    @Param('answerId') answerId: number,
    @Body() body: ReplyRequestDto,
  ): Promise<void> {
    const { id } = userPayload;
    await this.blurtingService.addReply(id, body.content, answerId);
  }
}
