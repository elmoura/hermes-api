import { Types } from 'mongoose';
import { Md5HashService } from '../../../shared/services/md5-hash.service';
import { OrganizationEntityDatasource } from '../../admin/organizations/datasources/organization-entity.datasource';
import { AccountStatus, UserRoles } from '../entities/user.entity';
import { UserEntityDatasource } from '../datasources/user-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { ConfirmAccountUsecase } from './confirm-account.usecase';

describe('ConfirmAccountUsecase', () => {
  const userDatasourceMock = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const organizationDatasourceMock = {
    findById: jest.fn(),
  };

  const md5HashServiceMock = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const usecase = new ConfirmAccountUsecase(
    userDatasourceMock as unknown as UserEntityDatasource,
    organizationDatasourceMock as unknown as OrganizationEntityDatasource,
    md5HashServiceMock as unknown as Md5HashService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    md5HashServiceMock.decrypt.mockReturnValue(true);
    md5HashServiceMock.encrypt.mockReturnValue('hashed-pass');
  });

  function confirmHash(userId: Types.ObjectId, organizationId: Types.ObjectId) {
    return `${userId.toString()}.${organizationId.toString()}.sig`;
  }

  function inviteToken(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
    confirmation: string,
    expMs: number,
  ) {
    return Buffer.from(
      JSON.stringify({
        u: userId.toString(),
        o: organizationId.toString(),
        c: confirmation,
        e: expMs,
      }),
      'utf8',
    ).toString('base64url');
  }

  const confirmationHex = 'a1b2c3d4e5f6789012345678abcdef12';

  function updatedUserDoc(
    userId: Types.ObjectId,
    organizationId: Types.ObjectId,
    overrides: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      role: UserRoles;
    }> = {},
  ) {
    return {
      _id: userId,
      organizationId,
      role: overrides.role ?? UserRoles.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      firstName: overrides.firstName ?? 'Owner',
      lastName: overrides.lastName ?? 'User',
      email: overrides.email ?? 'a@b.com',
      phoneNumber: overrides.phoneNumber ?? '+5511999999999',
      password: 'must-not-leak',
    };
  }

  describe('fluxo legado (hash assinado userId.orgId.sig)', () => {
    it('deve confirmar conta e atualizar senha', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
        name: 'Org',
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId,
        role: UserRoles.ADMIN,
        accountStatus: AccountStatus.PENDING_CONFIRMATION,
        email: 'a@b.com',
      });

      userDatasourceMock.update.mockResolvedValue(
        updatedUserDoc(userId, organizationId),
      );

      const result = await usecase.execute({
        hash: confirmHash(userId, organizationId),
        password: 'senha1234',
      });

      expect(md5HashServiceMock.decrypt).toHaveBeenCalled();
      expect(md5HashServiceMock.encrypt).toHaveBeenCalledWith(
        expect.stringContaining('senha1234'),
      );
      expect(userDatasourceMock.update).toHaveBeenCalledWith(userId, {
        password: 'hashed-pass',
        accountStatus: AccountStatus.ACTIVE,
      });
      expect(result).toEqual({
        _id: userId.toString(),
        organizationId: organizationId.toString(),
        role: UserRoles.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        firstName: 'Owner',
        lastName: 'User',
        email: 'a@b.com',
        phoneNumber: '+5511999999999',
        createdAt: undefined,
        updatedAt: undefined,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('deve persistir firstName, lastName e phoneNumber quando informados', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId,
        accountStatus: AccountStatus.PENDING_CONFIRMATION,
      });

      userDatasourceMock.update.mockResolvedValue(
        updatedUserDoc(userId, organizationId, {
          firstName: 'Ana',
          lastName: 'Silva',
          phoneNumber: '+5511999999999',
        }),
      );

      const result = await usecase.execute({
        hash: confirmHash(userId, organizationId),
        password: 'senha1234',
        firstName: ' Ana ',
        lastName: ' Silva ',
        phoneNumber: ' +5511999999999 ',
      });

      expect(userDatasourceMock.update).toHaveBeenCalledWith(userId, {
        password: 'hashed-pass',
        accountStatus: AccountStatus.ACTIVE,
        firstName: 'Ana',
        lastName: 'Silva',
        phoneNumber: '+5511999999999',
      });
      expect(result.firstName).toBe('Ana');
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar InvalidDataException quando o formato do hash for inválido', async () => {
      await expect(
        usecase.execute({ hash: 'bad', password: 'senha1234' }),
      ).rejects.toBeInstanceOf(InvalidDataException);

      expect(md5HashServiceMock.decrypt).not.toHaveBeenCalled();
    });

    it('deve lançar InvalidDataException quando a assinatura não confere', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      md5HashServiceMock.decrypt.mockReturnValue(false);

      await expect(
        usecase.execute({
          hash: confirmHash(userId, organizationId),
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });

    it('deve lançar quando a organização não existir', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue(null);

      await expect(
        usecase.execute({
          hash: confirmHash(userId, organizationId),
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });

    it('deve lançar quando o usuário não existir', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });
      userDatasourceMock.findById.mockResolvedValue(null);

      await expect(
        usecase.execute({
          hash: confirmHash(userId, organizationId),
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });

    it('deve lançar quando o usuário não pertencer à organização', async () => {
      const organizationId = new Types.ObjectId();
      const otherOrgId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId: otherOrgId,
      });

      await expect(
        usecase.execute({
          hash: confirmHash(userId, organizationId),
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });

    it('deve lançar quando a atualização não retornar documento', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId,
      });

      md5HashServiceMock.encrypt.mockReturnValue('h');
      userDatasourceMock.update.mockResolvedValue(null);

      await expect(
        usecase.execute({
          hash: confirmHash(userId, organizationId),
          password: 'senha1234',
        }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });
  });

  describe('fluxo convite (token base64 = invite-user)', () => {
    it('deve definir senha e limpar confirmation quando o token for válido', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const exp = Date.now() + 60 * 60 * 1000;
      const token = inviteToken(userId, organizationId, confirmationHex, exp);

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId,
        confirmation: confirmationHex,
        confirmationExpiresAt: new Date(exp + 1000),
      });

      userDatasourceMock.update.mockResolvedValue(
        updatedUserDoc(userId, organizationId, {
          firstName: 'João',
          lastName: 'Souza',
          phoneNumber: '+5511888888888',
        }),
      );

      const result = await usecase.execute({
        hash: token,
        password: 'senha1234',
        firstName: 'João',
        lastName: 'Souza',
        phoneNumber: '+5511888888888',
      });

      expect(md5HashServiceMock.decrypt).not.toHaveBeenCalled();
      expect(userDatasourceMock.update).toHaveBeenCalledWith(userId, {
        $set: {
          password: 'hashed-pass',
          accountStatus: AccountStatus.ACTIVE,
          firstName: 'João',
          lastName: 'Souza',
          phoneNumber: '+5511888888888',
        },
        $unset: {
          confirmation: 1,
          confirmationExpiresAt: 1,
        },
      });
      expect(result.firstName).toBe('João');
      expect(result).not.toHaveProperty('password');
    });

    it('deve lançar quando o convite estiver expirado (campo e)', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const exp = Date.now() - 1000;
      const token = inviteToken(userId, organizationId, confirmationHex, exp);

      await expect(
        usecase.execute({ hash: token, password: 'senha1234' }),
      ).rejects.toBeInstanceOf(InvalidDataException);

      expect(userDatasourceMock.findById).not.toHaveBeenCalled();
    });

    it('deve lançar quando confirmation no banco não conferir com o token', async () => {
      const organizationId = new Types.ObjectId();
      const userId = new Types.ObjectId();
      const exp = Date.now() + 3600000;
      const token = inviteToken(userId, organizationId, confirmationHex, exp);

      organizationDatasourceMock.findById.mockResolvedValue({
        _id: organizationId,
      });

      userDatasourceMock.findById.mockResolvedValue({
        _id: userId,
        organizationId,
        confirmation: 'b2c3d4e5f6789012345678abcdef12a1',
      });

      await expect(
        usecase.execute({ hash: token, password: 'senha1234' }),
      ).rejects.toBeInstanceOf(InvalidDataException);
    });
  });
});
