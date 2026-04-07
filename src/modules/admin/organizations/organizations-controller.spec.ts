import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvalidDataException } from './exceptions/invalid-data.exception';
import { OrganizationPlanTypes } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { UserRoles } from '@modules/users/entities/user.entity';
import { InviteUserUsecase } from './usecases/invite-user.usecase';
import { ListOrganizationsUsecase } from './usecases/list-organizations.usecase';
import { GetOrganizationByIdUsecase } from './usecases/get-organization-by-id.usecase';
import { ListOrganizationUsersUsecase } from './usecases/list-organization-users.usecase';
import { AccountStatus } from '@modules/users/entities/user.entity';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const createOrganizationUsecaseMock = {
    execute: jest.fn(),
  };

  const inviteUserUsecaseMock = {
    execute: jest.fn(),
  };

  const listOrganizationsUsecaseMock = {
    execute: jest.fn(),
  };

  const getOrganizationByIdUsecaseMock = {
    execute: jest.fn(),
  };

  const listOrganizationUsersUsecaseMock = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: CreateOrganizationUsecase,
          useValue: createOrganizationUsecaseMock,
        },
        {
          provide: InviteUserUsecase,
          useValue: inviteUserUsecaseMock,
        },
        {
          provide: ListOrganizationsUsecase,
          useValue: listOrganizationsUsecaseMock,
        },
        {
          provide: GetOrganizationByIdUsecase,
          useValue: getOrganizationByIdUsecaseMock,
        },
        {
          provide: ListOrganizationUsersUsecase,
          useValue: listOrganizationUsersUsecaseMock,
        },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    jest.clearAllMocks();
  });

  it('deve listar organizações', async () => {
    listOrganizationsUsecaseMock.execute.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });

    const result = await controller.list({ page: 1, pageSize: 20 });

    expect(listOrganizationsUsecaseMock.execute).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(0);
  });

  it('deve obter organização por id', async () => {
    getOrganizationByIdUsecaseMock.execute.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Mercury',
      ownerId: null,
      planType: OrganizationPlanTypes.BUSINESS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await controller.getById('507f1f77bcf86cd799439011');

    expect(getOrganizationByIdUsecaseMock.execute).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(result.name).toBe('Mercury');
  });

  it('deve propagar NotFoundException ao obter organização inexistente', async () => {
    getOrganizationByIdUsecaseMock.execute.mockRejectedValue(
      new NotFoundException('Organização não encontrada.'),
    );

    await expect(
      controller.getById('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve listar usuários da organização', async () => {
    listOrganizationUsersUsecaseMock.execute.mockResolvedValue({
      items: [
        {
          _id: '507f1f77bcf86cd799439012',
          email: 'a@b.com',
          role: UserRoles.MEMBER,
          accountStatus: AccountStatus.ACTIVE,
          firstName: 'Ana',
          lastName: 'Silva',
          phoneNumber: '+5511999999999',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    const result = await controller.listOrganizationUsers(
      '507f1f77bcf86cd799439011',
      { page: 1, pageSize: 20 },
    );

    expect(listOrganizationUsersUsecaseMock.execute).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      { page: 1, pageSize: 20 },
    );
    expect(result.total).toBe(1);
  });

  it('deve propagar NotFoundException ao listar usuários de organização inexistente', async () => {
    listOrganizationUsersUsecaseMock.execute.mockRejectedValue(
      new NotFoundException('Organização não encontrada.'),
    );

    await expect(
      controller.listOrganizationUsers('507f1f77bcf86cd799439011', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve retornar resultado ao criar organização', async () => {
    createOrganizationUsecaseMock.execute.mockResolvedValue({
      _id: 'org-id',
      name: 'Mercury',
      ownerId: 'owner-id',
      planType: OrganizationPlanTypes.BUSINESS,
      owner: {
        _id: 'owner-id',
        organizationId: 'org-id',
        role: 'admin',
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@empresa.com',
        phoneNumber: '+5511999999999',
      },
    });

    const response = await controller.create({
      name: 'Mercury',
      planType: OrganizationPlanTypes.BUSINESS,
      owner: {
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@empresa.com',
        phoneNumber: '+5511999999999',
      },
    });

    expect(createOrganizationUsecaseMock.execute).toHaveBeenCalled();
    expect(response._id).toBe('org-id');
  });

  it('deve converter InvalidDataException para BadRequestException', async () => {
    createOrganizationUsecaseMock.execute.mockRejectedValue(
      new InvalidDataException('dados inválidos'),
    );

    await expect(
      controller.create({
        name: 'Mercury',
        planType: OrganizationPlanTypes.BUSINESS,
        owner: {
          firstName: 'Ana',
          lastName: 'Silva',
          email: 'ana@empresa.com',
          phoneNumber: '+5511999999999',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve convidar usuário com 204', async () => {
    inviteUserUsecaseMock.execute.mockResolvedValue(undefined);

    await controller.inviteUser('org-id', { email: 'a@b.com' });

    expect(inviteUserUsecaseMock.execute).toHaveBeenCalledWith({
      organizationId: 'org-id',
      email: 'a@b.com',
      role: undefined,
    });
  });

  it('deve repassar role ao convidar', async () => {
    inviteUserUsecaseMock.execute.mockResolvedValue(undefined);

    await controller.inviteUser('org-id', {
      email: 'a@b.com',
      role: UserRoles.ADMIN,
    });

    expect(inviteUserUsecaseMock.execute).toHaveBeenCalledWith({
      organizationId: 'org-id',
      email: 'a@b.com',
      role: UserRoles.ADMIN,
    });
  });

  it('deve propagar erro do convite (InvalidDataException é BadRequestException)', async () => {
    inviteUserUsecaseMock.execute.mockRejectedValue(
      new InvalidDataException('falha'),
    );

    await expect(
      controller.inviteUser('org-id', { email: 'a@b.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
