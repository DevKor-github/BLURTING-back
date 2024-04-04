import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReplyDto } from 'src/blurting/dtos';
import { BlurtingAnswerEntity, ReplyEntity, UserEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingReplyRepository {
  constructor(
    @InjectRepository(ReplyEntity)
    private readonly replyRepository: Repository<ReplyEntity>,
  ) {}

  async insert(info: ReplyDto): Promise<void> {
    const replyEntity = this.replyRepository.create({
      user: { id: info.userId } as UserEntity,
      answer: { id: info.answerId } as BlurtingAnswerEntity,
      content: info.content,
    });
    await this.replyRepository.save(replyEntity);
  }
}
