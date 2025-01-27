import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HotTopicService } from './hotTopic.service';
import { AuthGuard } from '@nestjs/passport';
import { HotTopicDocs } from 'src/decorators/swagger/hotTopic.decorator';
import { PagedResponse } from 'src/common/pagedResponse.dto';
import type { HotTopicSumResponseDto } from './dtos/HotTopicSumResponse.dto';
import type { HotTopicInfoResponseDto } from './dtos/HotTopicInfoResponse.dto';
import { User } from 'src/decorators/accessUser.decorator';
import type { JwtPayload } from 'src/interfaces/auth';
import { PageQuery } from 'src/common/pageQuery.dto';
import { HotTopicRequestDto } from './dtos/HotTopicRequest.dto';
import { HotTopicAnswerRequestDto } from './dtos/HotTopicAnswerRequest.dto';

@Controller('hot-topic')
@ApiTags('hot-topic')
@HotTopicDocs
export class HotTopicController {
  constructor(private readonly hotTopicService: HotTopicService) {}

  @UseGuards(AuthGuard('access'))
  @Get('/latest')
  async getHotTopic(
    @User() user: JwtPayload,
  ): Promise<HotTopicSumResponseDto[]> {
    return this.hotTopicService.getHotTopic(user.id);
  }

  @UseGuards(AuthGuard('access'))
  @Get('/:id')
  async getHotTopicById(
    @Param('id') id: number,
    @User() user: JwtPayload,
  ): Promise<HotTopicInfoResponseDto> {
    return this.hotTopicService.getHotTopicById(id, user.id);
  }
  @UseGuards(AuthGuard('access'))
  @Get('/')
  async getAllHotTopic(
    @Query() pageQuery: PageQuery,
    @User() user: JwtPayload,
  ): Promise<PagedResponse<HotTopicSumResponseDto>> {
    return this.hotTopicService.getAllHotTopic(
      pageQuery.page,
      pageQuery.pageSize,
      user.id,
    );
  }

  @UseGuards(AuthGuard('access'))
  @Post('/question')
  async postQuestion(@Body() body: HotTopicRequestDto): Promise<void> {
    return this.hotTopicService.postQuestion(body);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/answer')
  async postAnswer(
    @Body() body: HotTopicAnswerRequestDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.hotTopicService.postAnswer(body, user.id);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/like/:id')
  async postLike(
    @User() user: JwtPayload,
    @Param('id') id: number,
  ): Promise<boolean> {
    return this.hotTopicService.postLike(user.id, id);
  }

  @UseGuards(AuthGuard('access'))
  @Post('/like/answer/:id')
  async postAnswerLike(
    @User() user: JwtPayload,
    @Param('id') id: number,
  ): Promise<boolean> {
    return this.hotTopicService.postAnswerLike(user.id, id);
  }
}
