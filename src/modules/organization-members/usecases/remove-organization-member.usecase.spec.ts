import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { RemoveOrganizationMemberUsecase } from './remove-organization-member.usecase';

describe('RemoveOrganizationMemberUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  const userDatasourceMock = {
    findById: jest.fn(),
    countActiveAdminsInOrganization: jest.fn(),
    update: jest.fn(),
  };

  const usecase = new RemoveOrganizationMemberUsecase(
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    userDatasourceMock as unknown as UserEntityDatasource,
  );

  const organizationId = new Types.ObjectId();
  const actorId = new Types.ObjectId();
  const targetId = new Types.ObjectId();

  const baseInput = {
    organizationId: organizationId.toString(),
    targetUserId: targetId.toString(),
    actorUserId: actorId.toString(),
  };

  const makeTarget = (overrides: Partial<Record<string, unknown>> = {}) => ({
    _id: targetId,
    organizationId,
    email: 't@x.com',
    role: UserRoles.MEMBER,
    accountStatus: AccountStatus.ACTIVE,
    firstName: 'A',
    lastName: 'B',
    phoneNumber: '+100',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: organizationId,
      ownerId: new Types.ObjectId().toString(),
    });
    userDatasourceMock.findById.mockResolvedValue(makeTarget());
    userDatasourceMock.update.mockResolvedValue(
      makeTarget({ accountStatus: AccountStatus.INACTIVE }),
    );
  });

  it('deve rejeitar revogação sobre si próprio', async () => {
    await expect(
      usecase.execute({
        ...baseInput,
        targetUserId: actorId.toString(),
        actorUserId: actorId.toString(),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('não deve revogar o owner', async () => {
    const ownerStr = targetId.toString();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: organizationId,
      ownerId: ownerStr,
    });
    userDatasourceMock.findById.mockResolvedValue(
      makeTarget({ role: UserRoles.ADMIN }),
    );

    await expect(usecase.execute(baseInput)).rejects.toMatchObject({
      status: 400,
    });
    expect(userDatasourceMock.update).not.toHaveBeenCalled();
  });

  it('não deve revogar o último admin ativo', async () => {
    userDatasourceMock.findById.mockResolvedValue(
      makeTarget({ role: UserRoles.ADMIN }),
    );
    userDatasourceMock.countActiveAdminsInOrganization.mockResolvedValue(1);

    await expect(usecase.execute(baseInput)).rejects.toMatchObject({
      status: 400,
    });
    expect(userDatasourceMock.update).not.toHaveBeenCalled();
  });

  it('deve definir accountStatus inactive em caso válido', async () => {
    userDatasourceMock.countActiveAdminsInOrganization.mockResolvedValue(2);

    await usecase.execute(baseInput);

    expect(userDatasourceMock.update).toHaveBeenCalledWith(targetId, {
      accountStatus: AccountStatus.INACTIVE,
    });
  });
});
