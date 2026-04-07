import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus } from '@modules/users/entities/user.entity';
import { TenantJwtService } from '../tenant-jwt.service';

function extractBearer(authorization?: string): string | undefined {
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return undefined;
  }
  return authorization.slice(7).trim();
}

/**
 * Valida JWT de tenant (`sub` + `org`) e confere o utilizador na BD com a org do path.
 * Não aceita a API key de staff — apenas tokens emitidos para utilizadores do tenant.
 */
@Injectable()
export class TenantJwtAuthGuard implements CanActivate {
  constructor(
    private readonly tenantJwt: TenantJwtService,
    private readonly userDatasource: UserEntityDatasource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractBearer(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException();
    }

    const rawOrgId = request.params.organizationId;
    const organizationId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
    if (!organizationId) {
      throw new ForbiddenException();
    }

    const payload = await this.tenantJwt.verifyAccessToken(token);
    if (payload.org !== organizationId) {
      throw new ForbiddenException();
    }

    if (!Types.ObjectId.isValid(payload.sub)) {
      throw new UnauthorizedException();
    }

    const user = await this.userDatasource.findById(
      new Types.ObjectId(payload.sub),
    );
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.organizationId.toString() !== organizationId) {
      throw new ForbiddenException();
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException();
    }

    request.tenantUser = user;
    return true;
  }
}
