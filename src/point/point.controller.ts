import { Controller, Req, Res, Get, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { PointService } from './point.service';

@Controller('point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

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
  @ApiCreatedResponse({
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
  @ApiOperation({
    summary: '귓속말 걸기',
    description: '귓속말 걸었을 때 포인트 차감 가능 여부 판단',
  })
  @Get('/chat')
  async startChat(@Req() req: Request, @Res() res: Response) {
    const { id } = req.user as JwtPayload;
    const updatedPoint = await this.pointService.updatePoint(id, -10);
    if (updatedPoint) {
      return res.json({ point: updatedPoint.point });
    }
    return res.send(false);
  }
}
