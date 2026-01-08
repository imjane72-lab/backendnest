import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ description: '이메일' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ description: '비밀번호' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: '서비스 이용약관 동의 여부' })
  @IsNotEmpty()
  @IsBoolean()
  serviceAgreed: boolean;

  @ApiProperty({ description: '개인정보 처리방침 약관 동의 여부' })
  @IsNotEmpty()
  @IsBoolean()
  privacyAgreed: boolean;

  @ApiProperty({ description: '마케팅 및 광고 수신 약관 동의 여부' })
  @IsOptional()
  @IsBoolean()
  marketingAgreed: boolean;
}
