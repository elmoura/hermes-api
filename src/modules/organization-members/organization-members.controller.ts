import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { OrganizationUserListItemDto } from '@modules/admin/organizations/usecases/dtos/list-organization-users-output.dto';
import { UpdateMemberRoleInputDto } from './usecases/dtos/update-member-role-input.dto';
import { RemoveOrganizationMemberUsecase } from './usecases/remove-organization-member.usecase';
import { UpdateOrganizationMemberRoleUsecase } from './usecases/update-organization-member-role.usecase';

@ApiTags('Organização (tenant)')
@ApiBearerAuth('tenant-jwt')
@Controller('organizations')
export class OrganizationMembersController {
  constructor(
    private readonly updateMemberRoleUsecase: UpdateOrganizationMemberRoleUsecase,
    private readonly removeMemberUsecase: RemoveOrganizationMemberUsecase,
  ) {}

  @Patch(':organizationId/members/:userId')
  @UseGuards(TenantJwtAuthGuard, TenantOrgAdminGuard)
  @ApiOperation({
    summary: 'Alterar papel de um membro (admin / member)',
    description:
      'Requer JWT de utilizador do tenant (não a API key de staff). Owner ou admin ativo pode alterar outros membros; o owner não pode ser rebaixado; não se pode remover o último admin ativo.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (deve coincidir com o claim `org` do JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do utilizador alvo (mesma organização)',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({ type: UpdateMemberRoleInputDto })
  @ApiResponse({
    status: 200,
    description: 'Papel atualizado ou já era o pedido (idempotente)',
    type: OrganizationUserListItemDto,
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({
    description: 'Sem permissão ou org/token incoerentes',
  })
  @ApiNotFoundResponse({
    description: 'Organização ou utilizador não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Regra de negócio (owner / último admin)',
  })
  async updateMemberRole(
    @Req() req: Request,
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleInputDto,
  ): Promise<OrganizationUserListItemDto> {
    const actor = req.tenantUser;
    if (!actor) {
      throw new ForbiddenException();
    }
    return await this.updateMemberRoleUsecase.execute({
      organizationId,
      targetUserId: userId,
      actorUserId: actor._id.toString(),
      role: body.role,
    });
  }

  @Delete(':organizationId/members/:userId')
  @HttpCode(204)
  @UseGuards(TenantJwtAuthGuard, TenantOrgAdminGuard)
  @ApiOperation({
    summary: 'Revogar acesso de um membro à organização (soft)',
    description:
      'Requer JWT de utilizador do tenant. Define `accountStatus` como `inactive`. Não remove o owner nem o último admin ativo.',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'ID da organização (deve coincidir com o claim `org` do JWT)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID do utilizador alvo',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiNoContentResponse({ description: 'Acesso revogado' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({
    description: 'Sem permissão ou org/token incoerentes',
  })
  @ApiNotFoundResponse({
    description: 'Organização ou utilizador não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Regra de negócio (owner / último admin)',
  })
  async removeMember(
    @Req() req: Request,
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    const actor = req.tenantUser;
    if (!actor) {
      throw new ForbiddenException();
    }
    await this.removeMemberUsecase.execute({
      organizationId,
      targetUserId: userId,
      actorUserId: actor._id.toString(),
    });
  }
}
