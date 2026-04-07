import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';

export type RemoveOrganizationMemberCommand = {
  organizationId: string;
  targetUserId: string;
  /** Utilizador autenticado; revogação aplica-se a **outros** membros. */
  actorUserId: string;
};

/**
 * Revogação soft: `accountStatus` → `inactive` (auditoria; sem hard delete).
 */
@Injectable()
export class RemoveOrganizationMemberUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly userDatasource: UserEntityDatasource,
  ) {}

  async execute(input: RemoveOrganizationMemberCommand): Promise<void> {
    const { organizationId, targetUserId, actorUserId } = input;

    if (!Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestException('Identificador de organização inválido.');
    }
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Identificador de utilizador inválido.');
    }
    if (!Types.ObjectId.isValid(actorUserId)) {
      throw new BadRequestException(
        'Identificador do utilizador autenticado inválido.',
      );
    }

    if (actorUserId === targetUserId) {
      throw new ForbiddenException(
        'Não é possível revogar o próprio acesso por este endpoint.',
      );
    }

    const orgObjectId = new Types.ObjectId(organizationId);
    const targetObjectId = new Types.ObjectId(targetUserId);

    const organization =
      await this.organizationDatasource.findById(orgObjectId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    const target = await this.userDatasource.findById(targetObjectId);
    if (!target || target.organizationId.toString() !== organizationId) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const ownerIdStr =
      organization.ownerId != null ? String(organization.ownerId) : '';
    if (ownerIdStr && target._id.toString() === ownerIdStr) {
      throw new BadRequestException(
        'Não é possível revogar o acesso do proprietário da organização.',
      );
    }

    if (
      target.role === UserRoles.ADMIN &&
      target.accountStatus === AccountStatus.ACTIVE
    ) {
      const activeAdmins =
        await this.userDatasource.countActiveAdminsInOrganization(orgObjectId);
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Não é possível revogar o último administrador ativo da organização.',
        );
      }
    }

    const updated = await this.userDatasource.update(targetObjectId, {
      accountStatus: AccountStatus.INACTIVE,
    });
    if (!updated) {
      throw new BadRequestException('Não foi possível revogar o acesso.');
    }
  }
}
