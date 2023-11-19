import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async updatePoint(id: number, point: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    user.point += point;
    if (user.point < 0) {
      return false;
    }
    return await this.userRepository.save(user);
  }
}
