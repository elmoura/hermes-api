import { Module } from '@nestjs/common';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { UsersModule } from '@modules/users/users.module';
import { OrganizationMembersController } from './organization-members.controller';
import { RemoveOrganizationMemberUsecase } from './usecases/remove-organization-member.usecase';
import { UpdateOrganizationMemberRoleUsecase } from './usecases/update-organization-member-role.usecase';

@Module({
  imports: [UsersModule],
  controllers: [OrganizationMembersController],
  providers: [
    TenantJwtAuthGuard,
    TenantOrgAdminGuard,
    UpdateOrganizationMemberRoleUsecase,
    RemoveOrganizationMemberUsecase,
  ],
})
export class OrganizationMembersModule {}
