import UserEntity from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
class AuthMailEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  isValid: boolean;

  @Column()
  code: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity, () => undefined)
  user: UserEntity;
}

export default AuthMailEntity;
