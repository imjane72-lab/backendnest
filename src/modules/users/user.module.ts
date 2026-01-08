import { Module } from '@nestjs/common';
import { UserProfileController, UserController } from '../controllers;
import { UserPrfoileService, UserService } from '../services;

@Module({
  controllers: [UserController, UserProfileController],
  providers: [UserService, UserPrfoileService],
})
export class UserModule {}
