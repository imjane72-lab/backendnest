import { Controller, Get, Patch, Post } from '@nestjs/common';
import { UserPrfoileService } from '../services';

@Controller('user/:userId/profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserPrfoileService) {}

  // 조회 - 프로필 정보
  @Get()
  getProfile() {
    this.userProfileService.getProfile();
  }

  // 생성 프로필 정보
  @Post()
  createProfile() {
    this.userProfileService.createProfile();
  }

  // 수정 - 프로필 정보
  @Patch()
  updateprofile() {
    this.userProfileService.updateprofile();
  }

  //
}
