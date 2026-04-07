import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRoles } from '@modules/users/entities/user.entity';
import { TenantJwtAuthGuard } from '@modules/auth/guards/tenant-jwt-auth.guard';
import { TenantOrgAdminGuard } from '@modules/auth/guards/tenant-org-admin.guard';
import { OrganizationMembersController } from './organization-members.controller';
import { RemoveOrganizationMemberUsecase } from './usecases/remove-organization-member.usecase';
import { UpdateOrganizationMemberRoleUsecase } from './usecases/update-organization-member-role.usecase';

describe('OrganizationMembersController', () => {
  let controller: OrganizationMembersController;

  const updateRoleMock = { execute: jest.fn() };
  const removeMemberMock = { execute: jest.fn() };

  const orgId = '507f1f77bcf86cd799439011';
  const userId = '507f1f77bcf86cd799439012';
  const actorId = new Types.ObjectId();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationMembersController],
      providers: [
        {
          provide: UpdateOrganizationMemberRoleUsecase,
          useValue: updateRoleMock,
        },
        {
          provide: RemoveOrganizationMemberUsecase,
          useValue: removeMemberMock,
        },
      ],
    })
      .overrideGuard(TenantJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantOrgAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(OrganizationMembersController);
  });

  it('deve chamar updateMemberRole com actorUserId', async () => {
    updateRoleMock.execute.mockResolvedValue({
      _id: userId,
      email: 'a@b.com',
      role: UserRoles.ADMIN,
    });

    const req = {
      tenantUser: { _id: actorId },
    } as Express.Request & { tenantUser: { _id: Types.ObjectId } };

    const result = await controller.updateMemberRole(req, orgId, userId, {
      role: UserRoles.ADMIN,
    });

    expect(updateRoleMock.execute).toHaveBeenCalledWith({
      organizationId: orgId,
      targetUserId: userId,
      actorUserId: actorId.toString(),
      role: UserRoles.ADMIN,
    });
    expect(result.role).toBe(UserRoles.ADMIN);
  });

  it('deve chamar removeMember com actorUserId', async () => {
    removeMemberMock.execute.mockResolvedValue(undefined);

    const req = {
      tenantUser: { _id: actorId },
    } as Express.Request & { tenantUser: { _id: Types.ObjectId } };

    await controller.removeMember(req, orgId, userId);

    expect(removeMemberMock.execute).toHaveBeenCalledWith({
      organizationId: orgId,
      targetUserId: userId,
      actorUserId: actorId.toString(),
    });
  });
});
