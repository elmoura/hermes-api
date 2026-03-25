import { Types } from 'mongoose';
import { EmailService } from '@shared/services/email.service';
import { Md5HashService } from '@shared/services/md5-hash.service';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { InviteUserUsecase } from './invite-user.usecase';

describe('InviteUserUsecase', () => {
  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  const userDatasourceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const md5HashServiceMock = {
    randomMd5Token: jest.fn().mockReturnValue('md5tokenhex'),
  };

  const emailServiceMock = {
    sendInviteEmail: jest.fn(),
  };

  const usecase = new InviteUserUsecase(
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    userDatasourceMock as unknown as UserEntityDatasource,
    md5HashServiceMock as unknown as Md5HashService,
    emailServiceMock as unknown as EmailService,
  );

  const organizationId = new Types.ObjectId();

  const baseCommand = {
    organizationId: organizationId.toString(),
    email: 'novo@empresa.com',
    role: UserRoles.MEMBER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    md5HashServiceMock.randomMd5Token.mockReturnValue('md5tokenhex');
    organizationDatasourceMock.findById.mockResolvedValue({
      _id: organizationId,
      name: 'Org',
    });
    userDatasourceMock.findByEmail.mockResolvedValue(null);
    userDatasourceMock.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      organizationId,
    });
  });

  it('deve criar usuário pendente, salvar confirmation e enviar e-mail', async () => {
    const newUserId = new Types.ObjectId();
    userDatasourceMock.create.mockResolvedValue({
      _id: newUserId,
      organizationId,
    });

    await usecase.execute(baseCommand);

    expect(md5HashServiceMock.randomMd5Token).toHaveBeenCalled();
    expect(userDatasourceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'novo@empresa.com',
        organizationId,
        role: UserRoles.MEMBER,
        accountStatus: AccountStatus.PENDING_CONFIRMATION,
        confirmation: 'md5tokenhex',
      }),
    );
    expect(emailServiceMock.sendInviteEmail).toHaveBeenCalledWith(
      'novo@empresa.com',
      expect.stringContaining('set-password?token='),
    );
  });

  it('deve atualizar confirmation quando o e-mail já existe na mesma organização', async () => {
    const existingId = new Types.ObjectId();
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: existingId,
      organizationId,
      email: 'novo@empresa.com',
    });
    userDatasourceMock.update.mockResolvedValue({ _id: existingId });

    await usecase.execute(baseCommand);

    expect(userDatasourceMock.create).not.toHaveBeenCalled();
    expect(userDatasourceMock.update).toHaveBeenCalledWith(
      existingId,
      expect.objectContaining({
        confirmation: 'md5tokenhex',
        confirmationExpiresAt: expect.any(Date),
        role: UserRoles.MEMBER,
      }),
    );
  });

  it('deve atualizar role ao reconvidar usuário existente na mesma organização', async () => {
    const existingId = new Types.ObjectId();
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: existingId,
      organizationId,
      email: 'novo@empresa.com',
      role: UserRoles.MEMBER,
    });
    userDatasourceMock.update.mockResolvedValue({ _id: existingId });

    await usecase.execute({ ...baseCommand, role: UserRoles.ADMIN });

    expect(userDatasourceMock.update).toHaveBeenCalledWith(
      existingId,
      expect.objectContaining({ role: UserRoles.ADMIN }),
    );
  });

  it('deve lançar quando o id da organização for inválido', async () => {
    await expect(
      usecase.execute({
        organizationId: 'invalid',
        email: 'a@b.com',
        role: UserRoles.MEMBER,
      }),
    ).rejects.toBeInstanceOf(InvalidDataException);
  });

  it('deve usar a role informada ao convidar', async () => {
    const newUserId = new Types.ObjectId();
    userDatasourceMock.create.mockResolvedValue({
      _id: newUserId,
      organizationId,
    });

    await usecase.execute({
      ...baseCommand,
      role: UserRoles.ADMIN,
    });

    expect(userDatasourceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRoles.ADMIN,
      }),
    );
  });

  it('deve lançar quando o e-mail existir em outra organização', async () => {
    userDatasourceMock.findByEmail.mockResolvedValue({
      _id: new Types.ObjectId(),
      organizationId: new Types.ObjectId(),
    });

    await expect(
      usecase.execute({ ...baseCommand, role: UserRoles.MEMBER }),
    ).rejects.toBeInstanceOf(InvalidDataException);
  });
});
