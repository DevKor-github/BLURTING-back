import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class AuthPhoneNumberEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  isValid: boolean;

  @Column()
  code: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @CreateDateColumn()
  createdAt: Date;
}
