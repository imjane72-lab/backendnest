import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user-entity';

@Entity()
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: true, type: 'text'})
  nickname: string;

  @Column({nullable: true})
  biography: string;

  @OneToOne(() => UserEntity, (user) => user.profile, {onDelete: 'CASCADE'}) // 사용자가 삭제되면 프로필도 자동 삭제
  @JoinColumn()
  user: UserEntity;
}
