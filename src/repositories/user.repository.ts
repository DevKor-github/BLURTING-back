import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Sex, SexOrient } from 'src/common/enums';
import { UserEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findOneById(id: number): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['group', 'userInfo'],
    });
  }

  async selectRandom(
    count: number,
    id: number,
    sex: Sex[],
    sexOrient: SexOrient,
  ) {
    const seed =
      new Date().getMonth().toString() +
      new Date().getDay().toString() +
      id.toString();
    await this.userRepository.query(
      `SELECT setseed(${Number(seed) / 10 ** seed.length})`,
    );

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userInfo', 'userInfo')
      .where('user.token IS NOT NULL')
      .andWhere('user.id != :id', { id: id })
      .andWhere('userInfo.sex IN(:...sex)', { sex: sex })
      .andWhere('userInfo.sexOrient = :sexOrient', { sexOrient: sexOrient })
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();

    return users;
  }
}
