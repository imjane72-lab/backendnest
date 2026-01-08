import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '../services';
import { SignInDto, SignUpDto } from '../dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 일반 회원가입
  @Post()
  @UsePipes(new ValidationPipe())
  signUp(@Body() body: SignUpDto) {
    this.userService.signUp(body);
  }

  // 일반 로그인
  @Post()
  @UsePipes(new ValidationPipe())
  signIn(@Body() body: SignInDto) {
    this.userService.signIn(body);
  }
}
