import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatService } from 'src/chat/chat.service';
import { PointHistoryEntity, UserEntity } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class PointService {
  constructor(
    private readonly chatService: ChatService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PointHistoryEntity)
    private readonly pointRepository: Repository<PointHistoryEntity>,
  ) {}

  async checkChatPoint(users: number[]) {
    const room = await this.chatService.findCreatedRoom(users);
    if (
      !room ||
      room == null ||
      (room.connectedAt != null &&
        new Date().getTime() - room.connectedAt.getTime() > 1000 * 60 * 60 * 15)
    ) {
      const point = await this.updatePoint(users[0], -10);
      if (point) {
        const other = await this.userRepository.findOne({
          where: { id: users[1] },
        });
        const history = `${other.userNickname}님께 귓속말을 걸고 10p가 사용 되었습니다.`;
        this.recordPointHistory(users[0], -10, history);
      }
      return point;
    }

    return false;
  }

  async updatePoint(id: number, point: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    user.point += point;
    if (user.point < 0) {
      return false;
    }
    return await this.userRepository.save(user);
  }

  async recordPointHistory(id: number, point: number, history: string) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    const record = this.pointRepository.create({
      type: point > 0,
      history: history,
      updatedAt: new Date(new Date().getTime() + 9 * 60 * 60 * 1000),
      user: user,
    });
    this.pointRepository.save(record);
  }
}
