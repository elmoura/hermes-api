import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginUsecase } from './usecases/login.usecase';

describe('AuthController', () => {
  let controller: AuthController;

  const loginUsecaseMock = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUsecase,
          useValue: loginUsecaseMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('deve delegar login ao usecase', async () => {
    loginUsecaseMock.execute.mockResolvedValue({
      accessToken: 'jwt',
      tokenType: 'Bearer',
    });

    const result = await controller.login({
      email: 'a@b.com',
      password: 'senha1234',
    });

    expect(loginUsecaseMock.execute).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'senha1234',
    });
    expect(result).toEqual({
      accessToken: 'jwt',
      tokenType: 'Bearer',
    });
  });
});
