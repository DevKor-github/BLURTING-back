import { Controller, Post, Req, UseGuards, Body, Get } from '@nestjs/common';
import { EventService } from './event.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from 'src/interfaces/auth';
import { Request } from 'express';
import { EventRegisterDto } from './dtos/event.dto';
import { UserService } from 'src/user/user.service';

@Controller('event')
export class EventController {
  constructor(
    private readonly eventService: EventService,
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
    description: '매칭 전 0, 매칭 완료 1, 매칭 중 2, 블러팅 끝 3',
  })
  async getMatching(@Req() req: Request) {
    const { id } = req.user as JwtPayload;
    const user = await this.userService.findUserByVal('id', id);
    const isMatching = await this.eventService.isMatching(user);

    if (isMatching) {
      return 2;
    }
    if (
      user.group &&
      user.group.createdAt > new Date(new Date().getTime() - 1000 * 60 * 15)
    ) {
      return 1;
    }
    if (user.group) {
      return 3;
    }
    return 0;
  }

  @UseGuards(AuthGuard('access'))
  @Post('/register')
  @ApiOperation({ summary: '코드와 테이블 번호를 쓰고 등록을 눌렀을 때' })
  @ApiCreatedResponse({
    description:
      '큐에 등록시 0 , 그룹이 있으면 1, 매칭 중이면 2, 블러팅 끝났으면 3',
  })
  async registerGroupQueue(
    @Req() req: Request,
    @Body() body: EventRegisterDto,
  ): Promise<0 | 1 | 2 | 3> {
    const { id } = req.user as JwtPayload;

    await this.eventService.setTable(id, body.table);

    return await this.eventService.registerGroupQueue(id);
  }
}
