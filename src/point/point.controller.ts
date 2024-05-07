import { Controller, Body, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { PointService } from './point.service';
import { UserService } from 'src/user/user.service';
import { PointHistoryDto } from 'src/dtos/point.dto';
import { ReportService } from 'src/report/report.service';
import { User } from 'src/decorators/accessUser.decorator';
import { AccessGuard } from 'src/auth/guard/acces.guard';
import { Docs } from 'src/decorators/swagger/point.decorator';

@Controller('point')
@ApiTags('point')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly reportService: ReportService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(AccessGuard)
  @Get('/check')
  @Docs('checkPoint')
  async checkPoint(@User() user: JwtPayload): Promise<boolean> {
    return await this.pointService.checkResPoint(user.id, 40);
  }

  @UseGuards(AccessGuard)
  @Post('/chat')
  @Docs('startChat')
  async startChat(
    @User() user: JwtPayload,
    @Body() other: { id: number },
  ): Promise<{ point: number } | boolean> {
    const { id } = user;
    const report = await this.reportService.checkReport([id, other.id]);
    if (report) return false;

    const updatedPoint = await this.pointService.checkChatPoint([id, other.id]);
    if (updatedPoint) {
      return { point: updatedPoint as number };
    }
    return false;
  }

  @UseGuards(AccessGuard)
  @Get('/nickname')
  @Docs('getRandomNickname')
  async getRandomNickname(
    @User() user: JwtPayload,
  ): Promise<{ point: number; nickname: string } | boolean> {
    const updatedPoint = await this.pointService.checkNicknamePoint(user.id);
    if (updatedPoint) {
      const userEntity = await this.userService.findUserByVal('id', user.id);
      return {
        point: updatedPoint as number,
        nickname: userEntity.userNickname,
      };
    }
    return false;
  }

  @UseGuards(AccessGuard)
  @Get('/ad')
  @Docs('adToPoint')
  async adToPoint(
    @User() user: JwtPayload,
  ): Promise<{ point: number | boolean }> {
    const updatedPoint = await this.pointService.giveAdPoint(user.id);
    return { point: updatedPoint };
  }

  @UseGuards(AccessGuard)
  @Get('/add')
  @Docs('getAddPointHistory')
  async getAddPointHistory(
    @User() user: JwtPayload,
  ): Promise<PointHistoryDto[]> {
    return await this.pointService.getPointHistory(user.id, true);
  }

  @UseGuards(AccessGuard)
  @Get('/sub')
  @Docs('getSubPointHistory')
  async getSubPointhHistory(
    @User() user: JwtPayload,
  ): Promise<PointHistoryDto[]> {
    return await this.pointService.getPointHistory(user.id, false);
  }
}
