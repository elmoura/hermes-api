import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { getAdminApiKey } from '@/config/config';

/**
 * Autenticação server-to-server para rotas admin (backoffice / integrações).
 * Espera `Authorization: Bearer <ADMIN_API_KEY>` (mesmo formato que o Swagger "Bearer").
 */
@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = getAdminApiKey();
    if (!expected) {
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7).trim();
    if (!this.secureCompare(token, expected)) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private secureCompare(received: string, expected: string): boolean {
    const a = Buffer.from(received, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }
}
