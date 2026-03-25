import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvalidDataException } from './exceptions/invalid-data.exception';
import { OrganizationPlanTypes } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { UserRoles } from '@modules/users/entities/user.entity';
import { InviteUserUsecase } from './usecases/invite-user.usecase';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  const createOrganizationUsecaseMock = {
    execute: jest.fn(),
  };

  const inviteUserUsecaseMock = {
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
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    jest.clearAllMocks();
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
