import {
  Controller,
  Req,
  Res,
  Body,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { PointService } from './point.service';
import { PointHistoryDto } from 'src/dtos/point.dto';
import { ReportService } from 'src/report/report.service';

@Controller('point')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly reportService: ReportService,
  ) {}

  @UseGuards(AuthGuard('access'))
  @ApiResponse({
    description: '포인트 차감 가능 여부',
    schema: {
      example: false,
      type: 'boolean',
    },
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiOperation({
    summary: '포인트 차감 가능 여부',
    description: '포인트 차감 가능 여부 판단',
  })
  @Get('/check')
  async checkPoint(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const point = await this.pointService.checkResPoint(id, 10);
    return res.send(point);
  }

  @UseGuards(AuthGuard('access'))
  @ApiCreatedResponse({
    description: '포인트 차감 성공 시',
    schema: {
      example: { point: 10 },
      properties: {
        point: {
          type: 'number',
          description: '수정된 포인트 값',
        },
      },
    },
  })
  @ApiResponse({
    description: '포인트 차감 실패 시',
    schema: {
      example: false,
      type: 'boolean',
    },
  })
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiBody({
    description: '상대 유저 아이디',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
        },
      },
    },
  })
  @ApiOperation({
    summary: '귓속말 걸기',
    description: '귓속말 걸었을 때 포인트 차감 가능 여부 판단',
  })
  @Post('/chat')
  async startChat(
    @Req() req: Request,
    @Body() other: { id: number },
    @Res() res: Response,
  ) {
    const { id } = req.user as JwtPayload;
    const report = await this.reportService.checkReport([id, other.id]);
    if (report) {
      return res.send(false);
    }

    const updatedPoint = await this.pointService.checkChatPoint([id, other.id]);
    if (updatedPoint) {
      return res.json({ point: updatedPoint.point });
    }
    return res.send(false);
  }

  @UseGuards(AuthGuard('access'))
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiResponse({
    description: '지급 내역',
    type: Array<PointHistoryDto>,
  })
  @Get('/add')
  async getAddPointhHistory(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      const history = await this.pointService.getPointHistory(id, true);
      return res.json(history);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }

  @UseGuards(AuthGuard('access'))
  @ApiHeader({
    name: 'authorization',
    required: true,
    example: 'Bearer asdas.asdasd.asd',
  })
  @ApiResponse({
    description: '사용 내역',
    type: Array<PointHistoryDto>,
  })
  @Get('/sub')
  async getSubPointhHistory(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    try {
      const history = await this.pointService.getPointHistory(id, false);
      return res.json(history);
    } catch (error) {
      console.log(error);
      return res.status(error.status).json(error);
    }
  }
}
