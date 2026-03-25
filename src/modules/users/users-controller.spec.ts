import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatus, UserRoles } from './entities/user.entity';
import { InvalidDataException } from './exceptions/invalid-data.exception';
import { UsersController } from './users.controller';
import { ConfirmAccountUsecase } from './usecases/confirm-account.usecase';

describe('UsersController', () => {
  let controller: UsersController;

  const confirmAccountUsecaseMock = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: ConfirmAccountUsecase,
          useValue: confirmAccountUsecaseMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('deve confirmar conta e retornar usuário sem senha', async () => {
    const output = {
      _id: 'user-id',
      organizationId: 'org-id',
      role: UserRoles.MEMBER,
      accountStatus: AccountStatus.ACTIVE,
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'a@b.com',
      phoneNumber: '+5511999999999',
    };
    confirmAccountUsecaseMock.execute.mockResolvedValue(output);

    const result = await controller.confirmAccount({
      hash: 'a.b.sig',
      password: 'senha1234',
    });

    expect(confirmAccountUsecaseMock.execute).toHaveBeenCalledWith({
      hash: 'a.b.sig',
      password: 'senha1234',
    });
    expect(result).toEqual(output);
    expect(result).not.toHaveProperty('password');
  });

  it('deve converter InvalidDataException para BadRequestException', async () => {
    confirmAccountUsecaseMock.execute.mockRejectedValue(
      new InvalidDataException('dados inválidos'),
    );

    await expect(
      controller.confirmAccount({ hash: 'x', password: 'senha1234' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
