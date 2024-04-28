import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';
import { JwtPayload } from 'src/interfaces/auth';
import { HomeInfoResponseDto, likeHomeAnswerDto } from './dtos';
import { User } from 'src/decorators/accessUser.decorator';
import { Docs } from 'src/decorators/swagger/home.decorator';

@Controller('home')
@ApiTags('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('/')
  @UseGuards(AuthGuard('access'))
  @Docs('default')
  async getHomeInfo(
    @User() userPayload: JwtPayload,
  ): Promise<HomeInfoResponseDto> {
    const { id } = userPayload;
    return await this.homeService.getHomeInfo(id);
  }

  @Put('/like')
  @UseGuards(AuthGuard('access'))
  @Docs('like')
  async likeAnswer(
    @User() userPayload: JwtPayload,
    @Body() answerBody: likeHomeAnswerDto,
  ): Promise<void> {
    const { id } = userPayload;
    const { answerId } = answerBody;
    await this.homeService.likeAnswer(id, answerId);
  }

  @Get('/version')
  @Docs('version')
  async getVersion() {
    return { latestVersion: '1.3.0' };
  }
}
