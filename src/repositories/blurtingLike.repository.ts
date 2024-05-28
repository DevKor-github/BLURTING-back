import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LikeEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BlurtingLikeRepository {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
  ) {}

  async findOne(answerId: number, userId: number): Promise<LikeEntity> {
    return await this.likeRepository.findOne({
      where: { answerId, userId },
    });
  }

  async insert(answerId: number, userId: number): Promise<void> {
    const likeEntity = this.likeRepository.create({ answerId, userId });
    await this.likeRepository.save(likeEntity);
  }

  async delete(answerId: number, userId: number): Promise<void> {
    await this.likeRepository.delete({ answerId, userId });
  }

  async countByUserId(id: number): Promise<number> {
    const likes = await this.likeRepository.count({
      where: { answer: { user: { id } } },
    });
    return likes;
  }
}
