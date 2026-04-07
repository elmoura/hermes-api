import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { ListOrganizationUsersUsecase } from './list-organization-users.usecase';

describe('ListOrganizationUsersUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  const userDatasourceMock = {
    findByOrganizationIdPaginated: jest.fn(),
  };

  const usecase = new ListOrganizationUsersUsecase(
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    userDatasourceMock as unknown as UserEntityDatasource,
  );

  const orgId = new Types.ObjectId('507f1f77bcf86cd799439011');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar InvalidDataException quando o id não é ObjectId válido', async () => {
    await expect(usecase.execute('invalid', {})).rejects.toBeInstanceOf(
      InvalidDataException,
    );
    expect(
      userDatasourceMock.findByOrganizationIdPaginated,
    ).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando a organização não existe', async () => {
    organizationDatasourceMock.findById.mockResolvedValue(null);

    await expect(usecase.execute(orgId.toString(), {})).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(
      userDatasourceMock.findByOrganizationIdPaginated,
    ).not.toHaveBeenCalled();
  });

  it('deve retornar lista paginada mapeada', async () => {
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: orgId,
      name: 'Org',
    });

    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const updatedAt = new Date('2024-01-02T00:00:00.000Z');

    userDatasourceMock.findByOrganizationIdPaginated.mockResolvedValue({
      items: [
        {
          _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
          email: 'a@b.com',
          role: UserRoles.ADMIN,
          accountStatus: AccountStatus.ACTIVE,
          firstName: 'Ana',
          lastName: 'Silva',
          phoneNumber: '+5511999999999',
          createdAt,
          updatedAt,
        },
      ],
      total: 1,
    });

    const result = await usecase.execute(orgId.toString(), {
      page: 1,
      pageSize: 20,
    });

    expect(organizationDatasourceMock.findById).toHaveBeenCalledWith(orgId);
    expect(
      userDatasourceMock.findByOrganizationIdPaginated,
    ).toHaveBeenCalledWith(orgId, { page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].email).toBe('a@b.com');
    expect(result.items[0].createdAt).toBe(createdAt.toISOString());
    expect(result.items[0]).not.toHaveProperty('password');
    expect(result.items[0]).not.toHaveProperty('confirmation');
  });

  it('deve usar page e pageSize padrão', async () => {
    organizationDatasourceMock.findById.mockResolvedValue({ _id: orgId });
    userDatasourceMock.findByOrganizationIdPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await usecase.execute(orgId.toString(), {});

    expect(
      userDatasourceMock.findByOrganizationIdPaginated,
    ).toHaveBeenCalledWith(orgId, { page: 1, pageSize: 20 });
  });
});
