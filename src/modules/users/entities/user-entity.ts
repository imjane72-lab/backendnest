import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';
import { BadRequestException } from '@nestjs/common';

export enum AuthProvider {
  LOCAL = 'local',
  KAKAO = 'kakao',
  GOOGLE = 'google',
  NAVER = 'naver',
}

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  // local 회원가입만 필수, 소셜 로그인은 null
  @Column({ nullable: true, select: false }) // select: false로 기본 조회 시 제외
  password?: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  // 소셜 로그인 시 제공자의 고유 ID
  @Column({ nullable: true })
  providerId?: string;

  @Column()
  serviceAgreed: boolean;

  @Column()
  privacyAgreed: boolean;

  @Column()
  marketingAgreed: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @OneToOne(() => UserProfileEntity, (profile) => profile.user, {
    cascade: true,
    eager: true,
  }) // user 조회시 profile 자동 로드
  profile: UserProfileEntity;

  // 데이터 무결성 검증
  @BeforeInsert()
  @BeforeUpdate()
  validateProviderDate() {
    // local 회원가입은 비밀번호 필수
    if (this.provider === AuthProvider.LOCAL && !this.password) {
      throw new BadRequestException('일반 회원가입은 비밀번호가 필요합니다.');
    }

    // 소셜 로그인은 providerId 필수
    if (this.provider !== AuthProvider.LOCAL && !this.providerId) {
      throw new BadRequestException('올바른 이메일 형식이 아닙니다.');
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new BadRequestException('올바른 이메일 형식이 아닙니다.');
    }
  }
}
