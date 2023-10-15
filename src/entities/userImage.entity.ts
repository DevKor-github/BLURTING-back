import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UserEntity } from 'src/entities';

@Entity('users')
export class UserImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  no: number;

  @ManyToOne(() => UserEntity)
  user: UserEntity;
}
