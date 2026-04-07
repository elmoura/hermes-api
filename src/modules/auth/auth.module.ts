import { Module } from '@nestjs/common';
import { UsersModule } from '@modules/users/users.module';
import { TenantJwtModule } from './tenant-jwt.module';
import { AuthController } from './auth.controller';
import { LoginUsecase } from './usecases/login.usecase';

@Module({
  imports: [TenantJwtModule, UsersModule],
  controllers: [AuthController],
  providers: [LoginUsecase],
})
export class AuthModule {}
