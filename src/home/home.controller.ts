import { Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeInfoResponseDto } from './dtos/homInfoResponse.dto';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';
import { JwtPayload } from 'src/interfaces/auth';
import { Request } from 'express';
import { likeHomeAnswerDto } from './dtos/likeHomeAnswer.dto';

@Controller('home')
@ApiTags('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('/')
  @UseGuards(AuthGuard('access'))
  @ApiOperation({
    summary: '홈화면 정보',
    description:
      '홈화면 정보 반환 그룹에 없으면 SECONDS : -1 (밀리세컨드 단위), 질문은 새벽5시 기준 3개 (그보다 적으면 적게) [0, 1, 2] 순서 123등 ',
  })
  @ApiOkResponse({ type: HomeInfoResponseDto })
  async getHomeInfo(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    return await this.homeService.getHomeInfo(id);
  }

  @Put('/like')
  @UseGuards(AuthGuard('access'))
  @ApiOperation({
    summary: '좋아요',
    description: '좋아요',
  })
  @ApiBody({
    type: likeHomeAnswerDto,
  })
  async like(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const { answerId } = req.body as likeHomeAnswerDto;
    return await this.homeService.like(id, answerId);
  }

  @Get('/version')
  @ApiOperation({
    summary: '버전 정보',
    description: 'latestVersion: 최신 버전 정보 반환',
  })
  async getVersion() {
    return { latestVersion: '1.3.0' };
  }
}
