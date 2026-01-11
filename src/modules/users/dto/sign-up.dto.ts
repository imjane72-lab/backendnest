import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ description: '이메일' })
  @IsNotEmpty()
  @IsEmail({}, {message: '올바른 이메일 형식이 아닙니다.'})
  email: string;

  @ApiProperty({ description: '비밀번호 (8자 이상, 영문, 숫자, 특수문자 포함' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, {message: '비밀번호는 최소 8자 이상이어야 합니다.'})
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/, {message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'})
  password: string;

  @ApiProperty({ description: '서비스 이용약관 동의' })
  @IsNotEmpty()
  @IsBoolean()
  serviceAgreed: boolean;

  @ApiProperty({ description: '개인정보 처리방침 약관 동의' })
  @IsNotEmpty()
  @IsBoolean()
  privacyAgreed: boolean;

  @ApiProperty({ description: '마케팅 및 광고 수신 동의 (선택)', required: false})
  @IsOptional()
  @IsBoolean()
  marketingAgreed?: boolean;
}
