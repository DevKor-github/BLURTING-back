import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeInfoResponseDto } from './dtos/homInfoResponse.dto';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';
import { JwtPayload } from 'src/interfaces/auth';
import { Request } from 'express';

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
}
