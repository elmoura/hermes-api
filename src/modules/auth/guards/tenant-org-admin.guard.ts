import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';

/**
 * Exige utilizador autenticado pelo {@link TenantJwtAuthGuard}: owner da org ou admin ativo.
 */
@Injectable()
export class TenantOrgAdminGuard implements CanActivate {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.tenantUser;
    if (!user) {
      throw new ForbiddenException();
    }

    const rawOrgId = request.params.organizationId;
    const organizationId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Identificador de organização inválido.');
    }

    const org = await this.organizationDatasource.findById(
      new Types.ObjectId(organizationId),
    );
    if (!org) {
      throw new NotFoundException('Organização não encontrada.');
    }

    const ownerIdStr = org.ownerId != null ? String(org.ownerId) : '';
    const isOwner = ownerIdStr.length > 0 && ownerIdStr === user._id.toString();
    const isAdmin =
      user.role === UserRoles.ADMIN &&
      user.accountStatus === AccountStatus.ACTIVE;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException();
    }

    request.tenantOrganization = org;
    return true;
  }
}
