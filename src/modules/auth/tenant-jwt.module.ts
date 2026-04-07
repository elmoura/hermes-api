import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { config, getJwtSecret } from '@config/config';
import { TenantJwtService } from './tenant-jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (): { secret: string; signOptions: SignOptions } => ({
        secret: getJwtSecret() || 'dev-only-jwt-secret',
        signOptions: {
          expiresIn: config.security.jwtExpiresIn as NonNullable<
            SignOptions['expiresIn']
          >,
        },
      }),
    }),
  ],
  providers: [TenantJwtService],
  exports: [TenantJwtService, JwtModule],
})
export class TenantJwtModule {}
