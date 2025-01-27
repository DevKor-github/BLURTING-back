import { UserEntity } from 'src/domain/entities';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ToCheckEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;
}
