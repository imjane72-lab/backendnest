import { Module } from '@nestjs/common';
import { UserProfileController, UsersController } from '../users/controllers';
import { UserPrfoileService, UsersService } from '../users/services';

@Module({
  controllers: [UsersController, UserProfileController],
  providers: [UsersService, UserPrfoileService],
})
export class UsersModule {}
