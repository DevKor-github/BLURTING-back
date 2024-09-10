import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ChatService } from 'src/domain/chat/chat.service';
import { UserService } from 'src/domain/user/user.service';
import { PointHistoryDto } from 'src/domain/dtos/point.dto';
import { PointHistoryEntity, UserEntity } from 'src/domain/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PointService {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PointHistoryEntity)
    private readonly pointRepository: Repository<PointHistoryEntity>,
    @InjectDataSource()
    private readonly datasource: DataSource,
  ) {}

  async checkResPoint(id: number, point: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user.point >= point;
  }

  async updatePoint(id: number, point: number): Promise<number | false> {
    let result;
    await this.datasource.manager.transaction(
      'SERIALIZABLE',
      async (manager) => {
        const user = await manager.findOne(UserEntity, { where: { id } });
        if (user.point + point < 0) {
          result = false;
        }
        await manager.update(UserEntity, { id }, { point: user.point + point });
        result = user.point + point;
      },
    );
    return result;
  }

  async recordPointHistory(
    id: number,
    point: number,
    history: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    const record = this.pointRepository.create({
      type: point > 0,
      history: history,
      updatedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      user: user,
    });
    this.pointRepository.save(record);
  }

  async getPointHistory(
    id: number,
    type: boolean,
  ): Promise<Array<PointHistoryDto>> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    const records = await this.pointRepository.find({
      where: { type: type, user: user },
      order: { updatedAt: 'DESC' },
    });

    return records.map((record) => new PointHistoryDto(record));
  }

  async giveSignupPoint(userId: number): Promise<number | false> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user.point == 0) {
      const updatedPoint = await this.updatePoint(userId, 20);
      if (updatedPoint) {
        const history = '회원가입 기념 20p가 적립 되었습니다.';
        this.recordPointHistory(userId, 20, history);
        return updatedPoint;
      }
      return false;
    }
    return false;
  }

  async checkChatPoint(users: number[]): Promise<false | number> {
    const room = await this.chatService.findCreatedRoom(users);
    if (
      !room ||
      room == null ||
      (room.connectedAt != null &&
        new Date().getTime() - room.connectedAt.getTime() > 1000 * 60 * 60 * 15)
    ) {
      const point = await this.updatePoint(users[0], -40);
      if (point) {
        const other = await this.userRepository.findOne({
          where: { id: users[1] },
        });
        const history = `${other.userNickname}님께 귓속말을 걸고 40p가 사용 되었습니다.`;
        this.recordPointHistory(users[0], -40, history);
      }
      return point;
    }

    return false;
  }

  async checkNicknamePoint(userId: number): Promise<number | false> {
    const point = await this.updatePoint(userId, -40);
    if (point) {
      const nickname = await this.userService.pickRandomNickname();
      await this.userService.updateUser(userId, 'userNickname', nickname);
      await this.userService.updateUserSocket(userId, 'userNickname', nickname);
      const history = `닉네임 뽑기를 하고 40p가 사용 되었습니다.`;
      this.recordPointHistory(userId, -40, history);
    }
    return point;
  }

  async giveBlurtingPoint(userId: number): Promise<number | false> {
    const updatedPoint = await this.updatePoint(userId, 10);
    if (updatedPoint) {
      const history = '100자 이상 답변하여 10p가 지급 되었습니다.';
      this.recordPointHistory(userId, 10, history);
      return updatedPoint;
    }
    return false;
  }

  async giveAdPoint(userId: number): Promise<number | false> {
    const updatedPoint = await this.updatePoint(userId, 10);
    if (updatedPoint) {
      const history = '광고 시청으로 10p가 지급 되었습니다.';
      this.recordPointHistory(userId, 10, history);
      return updatedPoint;
    }
    return false;
  }
}
