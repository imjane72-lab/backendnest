import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from '../services';
import { SignInDto, SignUpDto } from '../dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 일반 회원가입
  @Post()
  @UsePipes(new ValidationPipe())
  signUp(@Body() body: SignUpDto) {
    this.usersService.signUp(body);
  }

  // 일반 로그인
  @Post()
  @UsePipes(new ValidationPipe())
  signIn(@Body() body: SignInDto) {
    this.usersService.signIn(body);
  }
}
