import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthProvider } from '../entities/user-entity';
import { ApiProperty } from '@nestjs/swagger';

export class SocialSignInDto {
  @ApiProperty({
    description: '소셜 로그인 제공자 (KAKAO, GOOGLE, NAVER',
    enum: AuthProvider,
  })
  @IsNotEmpty()
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ description: '소셜 로그인 제공자의 고유 ID' })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({ description: '이메일' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '닉네임 (선택)', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '프로필 이미지 URL (선택)', required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: '서비스 이용약관 동의' })
  @IsNotEmpty()
  @IsBoolean()
  serviceAgreed: boolean;

  @ApiProperty({ description: '개인정보 처리방침 동의' })
  @IsNotEmpty()
  @IsBoolean()
  privacyAgreed: boolean;

  @ApiProperty({ description: '마케팅 수신 동의 (선택)', required: false })
  @IsOptional()
  @IsBoolean()
  marketingAgreed?: boolean;
}
