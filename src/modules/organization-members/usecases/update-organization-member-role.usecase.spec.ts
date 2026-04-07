import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '@modules/admin/organizations/datasources/organization-entity.datasource';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { UpdateOrganizationMemberRoleUsecase } from './update-organization-member-role.usecase';

describe('UpdateOrganizationMemberRoleUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  const userDatasourceMock = {
    findById: jest.fn(),
    countActiveAdminsInOrganization: jest.fn(),
    update: jest.fn(),
  };

  const usecase = new UpdateOrganizationMemberRoleUsecase(
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
    role: UserRoles.ADMIN,
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
    userDatasourceMock.update.mockImplementation((_id, data) =>
      Promise.resolve({
        ...makeTarget(),
        ...data,
      }),
    );
  });

  it('deve rejeitar organizationId inválido', async () => {
    await expect(
      usecase.execute({ ...baseInput, organizationId: 'bad' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve rejeitar targetUserId inválido', async () => {
    await expect(
      usecase.execute({ ...baseInput, targetUserId: 'bad' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve rejeitar actorUserId inválido', async () => {
    await expect(
      usecase.execute({ ...baseInput, actorUserId: 'bad' }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deve rejeitar alteração do próprio papel', async () => {
    await expect(
      usecase.execute({
        ...baseInput,
        targetUserId: actorId.toString(),
        actorUserId: actorId.toString(),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('deve retornar 404 se organização não existir', async () => {
    organizationDatasourceMock.findById.mockResolvedValue(null);
    await expect(usecase.execute(baseInput)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('deve retornar 404 se utilizador alvo não pertencer à org', async () => {
    userDatasourceMock.findById.mockResolvedValue(null);
    await expect(usecase.execute(baseInput)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('não deve rebaixar o owner a member', async () => {
    const ownerStr = targetId.toString();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: organizationId,
      ownerId: ownerStr,
    });
    userDatasourceMock.findById.mockResolvedValue(
      makeTarget({ role: UserRoles.ADMIN }),
    );

    await expect(
      usecase.execute({ ...baseInput, role: UserRoles.MEMBER }),
    ).rejects.toMatchObject({ status: 400 });
    expect(userDatasourceMock.update).not.toHaveBeenCalled();
  });

  it('deve ser idempotente quando o papel já é o pedido', async () => {
    userDatasourceMock.findById.mockResolvedValue(
      makeTarget({ role: UserRoles.ADMIN }),
    );

    const result = await usecase.execute({
      ...baseInput,
      role: UserRoles.ADMIN,
    });

    expect(result.role).toBe(UserRoles.ADMIN);
    expect(userDatasourceMock.update).not.toHaveBeenCalled();
  });

  it('deve impedir rebaixar o último admin ativo', async () => {
    userDatasourceMock.findById.mockResolvedValue(
      makeTarget({ role: UserRoles.ADMIN }),
    );
    userDatasourceMock.countActiveAdminsInOrganization.mockResolvedValue(1);

    await expect(
      usecase.execute({ ...baseInput, role: UserRoles.MEMBER }),
    ).rejects.toMatchObject({ status: 400 });
    expect(userDatasourceMock.update).not.toHaveBeenCalled();
  });

  it('deve atualizar o papel quando válido', async () => {
    userDatasourceMock.countActiveAdminsInOrganization.mockResolvedValue(2);

    const result = await usecase.execute({
      ...baseInput,
      role: UserRoles.ADMIN,
    });

    expect(userDatasourceMock.update).toHaveBeenCalledWith(targetId, {
      role: UserRoles.ADMIN,
    });
    expect(result.role).toBe(UserRoles.ADMIN);
  });
});
