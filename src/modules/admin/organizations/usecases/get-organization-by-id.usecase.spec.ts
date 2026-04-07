import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { OrganizationPlanTypes } from '../entities/organization.entity';
import { GetOrganizationByIdUsecase } from './get-organization-by-id.usecase';

describe('GetOrganizationByIdUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  let usecase: GetOrganizationByIdUsecase;

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new GetOrganizationByIdUsecase(
      organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    );
  });

  it('deve lançar InvalidDataException quando o id não é ObjectId válido', async () => {
    await expect(usecase.execute('x')).rejects.toBeInstanceOf(
      InvalidDataException,
    );
    expect(organizationDatasourceMock.findById).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundException quando não existir', async () => {
    const id = new Types.ObjectId().toString();
    organizationDatasourceMock.findById.mockResolvedValue(null);

    await expect(usecase.execute(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve retornar detalhe quando existir', async () => {
    const oid = new Types.ObjectId();
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: oid,
      name: 'Mercury',
      ownerId: new Types.ObjectId().toString(),
      planType: OrganizationPlanTypes.BUSINESS,
      get: (k: string) =>
        k === 'createdAt'
          ? new Date('2024-01-01T00:00:00.000Z')
          : new Date('2024-01-02T00:00:00.000Z'),
    });

    const out = await usecase.execute(oid.toString());

    expect(out._id).toBe(oid.toString());
    expect(out.name).toBe('Mercury');
    expect(out.planType).toBe(OrganizationPlanTypes.BUSINESS);
  });
});
