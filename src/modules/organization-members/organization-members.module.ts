import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { GetOrganizationByIdUsecase } from '@modules/admin/organizations/usecases/get-organization-by-id.usecase';
import { ListOrganizationUsersUsecase } from '@modules/admin/organizations/usecases/list-organization-users.usecase';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import {
  OrganizationEntity,
  OrganizationSchema,
} from '@modules/admin/organizations/entities/organization.entity';
import { UsersModule } from '@modules/users/users.module';
import { OrganizationMembersController } from './organization-members.controller';
import { RemoveOrganizationMemberUsecase } from './usecases/remove-organization-member.usecase';
import { UpdateOrganizationMemberRoleUsecase } from './usecases/update-organization-member-role.usecase';
import { ConnectMetaOauthUsecase } from './usecases/connect-meta-oauth.usecase';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: OrganizationEntity.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [OrganizationMembersController],
  providers: [
    TenantJwtAuthGuard,
    TenantOrgAdminGuard,
    OrganizationEntityDatasource,
    GetOrganizationByIdUsecase,
    ListOrganizationUsersUsecase,
    ConnectMetaOauthUsecase,
    UpdateOrganizationMemberRoleUsecase,
    RemoveOrganizationMemberUsecase,
  ],
})
export class OrganizationMembersModule {}
