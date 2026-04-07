import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { mapUserDocumentToListItem } from '@modules/admin/organizations/usecases/mappers/organization-user-read.mapper';
import { OrganizationUserListItemDto } from '@modules/admin/organizations/usecases/dtos/list-organization-users-output.dto';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';

export type UpdateOrganizationMemberRoleCommand = {
  organizationId: string;
  targetUserId: string;
  /** Utilizador autenticado (JWT); só pode alterar papéis de **outros** membros. */
  actorUserId: string;
  role: UserRoles;
};

@Injectable()
export class UpdateOrganizationMemberRoleUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly userDatasource: UserEntityDatasource,
  ) {}

  async execute(
    input: UpdateOrganizationMemberRoleCommand,
  ): Promise<OrganizationUserListItemDto> {
    const { organizationId, targetUserId, actorUserId, role: newRole } = input;

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
        'Não é possível alterar o próprio papel por este endpoint.',
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
    if (
      ownerIdStr &&
      target._id.toString() === ownerIdStr &&
      newRole === UserRoles.MEMBER
    ) {
      throw new BadRequestException(
        'O proprietário da organização não pode ser rebaixado a membro.',
      );
    }

    if (target.role === newRole) {
      return mapUserDocumentToListItem(target);
    }

    if (
      newRole === UserRoles.MEMBER &&
      target.role === UserRoles.ADMIN &&
      target.accountStatus === AccountStatus.ACTIVE
    ) {
      const activeAdmins =
        await this.userDatasource.countActiveAdminsInOrganization(orgObjectId);
      if (activeAdmins <= 1) {
        throw new BadRequestException(
          'Não é possível remover o último administrador ativo da organização.',
        );
      }
    }

    const updated = await this.userDatasource.update(targetObjectId, {
      role: newRole,
    });
    if (!updated) {
      throw new BadRequestException('Não foi possível atualizar o papel.');
    }

    return mapUserDocumentToListItem(updated);
  }
}
