import { OrganizationPlanTypes } from '../entities/organization.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { ListOrganizationsUsecase } from './list-organizations.usecase';
import { Types } from 'mongoose';

describe('ListOrganizationsUsecase', () => {
  const organizationDatasourceMock = {
    findManyPaginated: jest.fn(),
  };

  let usecase: ListOrganizationsUsecase;

  beforeEach(() => {
    jest.clearAllMocks();
    usecase = new ListOrganizationsUsecase(
      organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    );
  });

  it('deve listar com paginação padrão e mapear itens', async () => {
    const oid = new Types.ObjectId();
    organizationDatasourceMock.findManyPaginated.mockResolvedValue({
      items: [
        {
          _id: oid,
          name: 'Acme',
          ownerId: undefined,
          planType: OrganizationPlanTypes.STARTER,
          get: (k: string) =>
            k === 'createdAt'
              ? new Date('2024-01-01T00:00:00.000Z')
              : new Date('2024-01-02T00:00:00.000Z'),
        },
      ],
      total: 1,
    });

    const result = await usecase.execute({});

    expect(organizationDatasourceMock.findManyPaginated).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      nameContains: undefined,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]._id).toBe(oid.toString());
    expect(result.items[0].name).toBe('Acme');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(1);
  });

  it('deve repassar page, pageSize e name ao datasource', async () => {
    organizationDatasourceMock.findManyPaginated.mockResolvedValue({
      items: [],
      total: 0,
    });

    await usecase.execute({
      page: 2,
      pageSize: 10,
      name: '  Mercury ',
    });

    expect(organizationDatasourceMock.findManyPaginated).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      nameContains: '  Mercury ',
    });
  });
});
