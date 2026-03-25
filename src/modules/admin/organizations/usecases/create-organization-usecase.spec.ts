import { Types } from 'mongoose';
import { EmailService } from '@shared/services/email.service';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { UserRoles } from '@modules/users/entities/user.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { OrganizationPlanTypes } from '../entities/organization.entity';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { CreateOrganizationUsecase } from './create-organization.usecase';

describe('CreateOrganizationUsecase', () => {
  const organizationDatasourceMock = {
    create: jest.fn(),
    updateOwnerId: jest.fn(),
  };

  const userDatasourceMock = {
    create: jest.fn(),
  };

  const emailServiceMock = {
    sendSetPasswordEmail: jest.fn(),
  };

  const sessionMock = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const connectionMock = {
    startSession: jest.fn().mockResolvedValue(sessionMock),
  };

  const usecase = new CreateOrganizationUsecase(
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    userDatasourceMock as unknown as UserEntityDatasource,
    emailServiceMock as unknown as EmailService,
    connectionMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar organização e owner com sucesso', async () => {
    const organizationId = new Types.ObjectId();
    const ownerId = new Types.ObjectId();

    organizationDatasourceMock.create.mockResolvedValue({
      _id: organizationId,
      name: 'Mercury',
      planType: OrganizationPlanTypes.BUSINESS,
    });

    userDatasourceMock.create.mockResolvedValue({
      _id: ownerId,
      organizationId,
      role: UserRoles.ADMIN,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana@empresa.com',
      phoneNumber: '+5511999999999',
    });

    organizationDatasourceMock.updateOwnerId.mockResolvedValue({
      _id: organizationId,
      name: 'Mercury',
      ownerId: ownerId.toString(),
      planType: OrganizationPlanTypes.BUSINESS,
    });

    const output = await usecase.execute({
      name: 'Mercury',
      planType: OrganizationPlanTypes.BUSINESS,
      owner: {
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@empresa.com',
        phoneNumber: '+5511999999999',
      },
    });

    expect(connectionMock.startSession).toHaveBeenCalled();
    expect(sessionMock.startTransaction).toHaveBeenCalled();
    expect(sessionMock.commitTransaction).toHaveBeenCalled();
    expect(sessionMock.endSession).toHaveBeenCalled();
    expect(emailServiceMock.sendSetPasswordEmail).toHaveBeenCalledWith(
      'ana@empresa.com',
      'Ana',
      ownerId.toString(),
      organizationId.toString(),
    );
    expect(output.owner.role).toBe(UserRoles.ADMIN);
    expect(output.ownerId).toBe(ownerId.toString());
  });

  it('deve fazer rollback quando ocorrer erro', async () => {
    organizationDatasourceMock.create.mockRejectedValue(
      new Error('db failure'),
    );

    await expect(
      usecase.execute({
        name: 'Mercury',
        planType: OrganizationPlanTypes.STARTER,
        owner: {
          firstName: 'Ana',
          lastName: 'Silva',
          email: 'ana@empresa.com',
          phoneNumber: '+5511999999999',
        },
      }),
    ).rejects.toBeInstanceOf(InvalidDataException);

    expect(sessionMock.abortTransaction).toHaveBeenCalled();
    expect(sessionMock.endSession).toHaveBeenCalled();
    expect(sessionMock.commitTransaction).not.toHaveBeenCalled();
  });
});
