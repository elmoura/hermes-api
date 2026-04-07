import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TenantJwtPayload } from './tenant-jwt-payload';

@Injectable()
export class TenantJwtService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Emite access token (login futuro ou testes). Usa o mesmo segredo que o `JwtModule` (env `JWT_SECRET`).
   */
  signAccessToken(userId: string, organizationId: string): string {
    const payload: TenantJwtPayload = { sub: userId, org: organizationId };
    return this.jwtService.sign(payload);
  }

  async verifyAccessToken(token: string): Promise<TenantJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<TenantJwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
