import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('app_store_connect_transaction')
export class AppStoreConnectTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transactionId: string;

  @Column()
  price: number;

  @Column()
  isDone: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
