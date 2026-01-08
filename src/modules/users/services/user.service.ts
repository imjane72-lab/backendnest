import { Injectable } from '@nestjs/common';
import { SignInDto, SignUpDto } from '../dto';

@Injectable()
export class UserService {
  // 일반 회원가입
  signUp(payload: SignUpDto) {}

  // 일반 로그인
  signIn(payload: SignInDto) {}
}
