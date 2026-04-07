import { Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { Types } from 'mongoose';
import { config } from '../../../config/config';
import { Md5HashService } from '../../../shared/services/md5-hash.service';
import { OrganizationEntityDatasource } from '../../admin/organizations/datasources/organization-entity.datasource';
import { UserEntityDatasource } from '../datasources/user-entity.datasource';
import {
  AccountStatus,
  UserDocument,
  UserEntity,
} from '../entities/user.entity';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { ConfirmAccountInputDto } from './dtos/confirm-account-input.dto';
import { ConfirmAccountOutputDto } from './dtos/confirm-account-output.dto';

type InviteTokenPayload = {
  u: string;
  o: string;
  c: string;
  e: number;
};

@Injectable()
export class ConfirmAccountUsecase {
  constructor(
    private readonly userDatasource: UserEntityDatasource,
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly md5HashService: Md5HashService,
  ) {}

  async execute(
    input: ConfirmAccountInputDto,
  ): Promise<ConfirmAccountOutputDto> {
    const invite = this.tryParseInviteToken(input.hash);
    if (invite) {
      return await this.confirmViaInviteToken(invite, input);
    }

    return await this.confirmViaLegacySignedHash(input);
  }

  private toPublicUser(doc: UserDocument): ConfirmAccountOutputDto {
    const withTimestamps = doc as UserDocument & {
      createdAt?: Date;
      updatedAt?: Date;
    };
    const createdAt =
      withTimestamps.createdAt ??
      (typeof doc.get === 'function' ? doc.get('createdAt') : undefined);
    const updatedAt =
      withTimestamps.updatedAt ??
      (typeof doc.get === 'function' ? doc.get('updatedAt') : undefined);

    return {
      _id: doc._id.toString(),
      organizationId: doc.organizationId.toString(),
      role: doc.role,
      accountStatus: doc.accountStatus,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      createdAt: createdAt?.toISOString(),
      updatedAt: updatedAt?.toISOString(),
    };
  }

  private tryParseInviteToken(raw: string): InviteTokenPayload | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const json = Buffer.from(trimmed, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      const obj = parsed as Record<string, unknown>;
      const { u, o, c, e } = obj;
      if (
        typeof u === 'string' &&
        typeof o === 'string' &&
        typeof c === 'string' &&
        typeof e === 'number'
      ) {
        return { u, o, c, e };
      }
    } catch {
      return null;
    }

    return null;
  }

  private optionalProfileFields(
    input: ConfirmAccountInputDto,
  ): Partial<Pick<UserEntity, 'firstName' | 'lastName' | 'phoneNumber'>> {
    const fields: Partial<
      Pick<UserEntity, 'firstName' | 'lastName' | 'phoneNumber'>
    > = {};
    if (input.firstName !== undefined) {
      fields.firstName = input.firstName.trim();
    }
    if (input.lastName !== undefined) {
      fields.lastName = input.lastName.trim();
    }
    if (input.phoneNumber !== undefined) {
      fields.phoneNumber = input.phoneNumber.trim();
    }
    return fields;
  }

  private async confirmViaInviteToken(
    invite: InviteTokenPayload,
    input: ConfirmAccountInputDto,
  ): Promise<ConfirmAccountOutputDto> {
    if (Date.now() > invite.e) {
      throw new InvalidDataException('O convite expirou.');
    }

    if (
      !Types.ObjectId.isValid(invite.u) ||
      !Types.ObjectId.isValid(invite.o)
    ) {
      throw new InvalidDataException('Token de convite inválido.');
    }

    const organizationId = new Types.ObjectId(invite.o);
    const userId = new Types.ObjectId(invite.u);

    const organization =
      await this.organizationDatasource.findById(organizationId);
    if (!organization) {
      throw new InvalidDataException('Organização não encontrada.');
    }

    const user = await this.userDatasource.findById(userId);
    if (!user) {
      throw new InvalidDataException('Usuário não encontrado.');
    }

    if (user.organizationId.toString() !== organizationId.toString()) {
      throw new InvalidDataException(
        'O usuário não pertence à organização informada.',
      );
    }

    if (
      user.confirmation == null ||
      !this.constantTimeEqualHex(String(user.confirmation), invite.c)
    ) {
      throw new InvalidDataException(
        'Token de convite inválido ou já utilizado.',
      );
    }

    if (
      user.confirmationExpiresAt != null &&
      +user.confirmationExpiresAt < Date.now()
    ) {
      throw new InvalidDataException('O convite expirou.');
    }

    const passwordPlain = `${config.security.passwordMd5Salt}${input.password}`;
    const passwordHash = this.md5HashService.encrypt(passwordPlain);
    const profile = this.optionalProfileFields(input);

    const updated = await this.userDatasource.update(userId, {
      $set: {
        password: passwordHash,
        accountStatus: AccountStatus.ACTIVE,
        ...profile,
      },
      $unset: {
        confirmation: 1,
        confirmationExpiresAt: 1,
      },
    });

    if (!updated) {
      throw new InvalidDataException('Não foi possível atualizar o usuário.');
    }

    return this.toPublicUser(updated);
  }

  private async confirmViaLegacySignedHash(
    input: ConfirmAccountInputDto,
  ): Promise<ConfirmAccountOutputDto> {
    const hash = input.hash;
    const parts = hash.split('.');
    if (parts.length !== 3) {
      throw new InvalidDataException(
        'Dados de confirmação inválidos ou hash incorreto.',
      );
    }

    const [userIdStr, organizationIdStr, signature] = parts;
    if (!userIdStr || !organizationIdStr || !signature) {
      throw new InvalidDataException(
        'Dados de confirmação inválidos ou hash incorreto.',
      );
    }

    const signedPayload = `${config.security.confirmAccountHashSecret}${userIdStr}:${organizationIdStr}`;
    if (!this.md5HashService.decrypt(signature, signedPayload)) {
      throw new InvalidDataException(
        'Dados de confirmação inválidos ou hash incorreto.',
      );
    }

    if (
      !Types.ObjectId.isValid(userIdStr) ||
      !Types.ObjectId.isValid(organizationIdStr)
    ) {
      throw new InvalidDataException('Identificadores inválidos.');
    }

    const organizationId = new Types.ObjectId(organizationIdStr);
    const userId = new Types.ObjectId(userIdStr);

    const organization =
      await this.organizationDatasource.findById(organizationId);
    if (!organization) {
      throw new InvalidDataException('Organização não encontrada.');
    }

    const user = await this.userDatasource.findById(userId);
    if (!user) {
      throw new InvalidDataException('Usuário não encontrado.');
    }

    if (user.organizationId.toString() !== organizationId.toString()) {
      throw new InvalidDataException(
        'O usuário não pertence à organização informada.',
      );
    }

    const passwordPlain = `${config.security.passwordMd5Salt}${input.password}`;
    const passwordHash = this.md5HashService.encrypt(passwordPlain);
    const profile = this.optionalProfileFields(input);
    const updated = await this.userDatasource.update(userId, {
      password: passwordHash,
      accountStatus: AccountStatus.ACTIVE,
      ...profile,
    });

    if (!updated) {
      throw new InvalidDataException('Não foi possível atualizar o usuário.');
    }

    return this.toPublicUser(updated);
  }

  private constantTimeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }
}
