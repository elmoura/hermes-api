import { Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { config } from '@config/config';
import { EmailService } from '@shared/services/email.service';
import { Md5HashService } from '@shared/services/md5-hash.service';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';

export type InviteUserCommand = {
  organizationId: string;
  email: string;
  /** Padrão: `member` quando omitido. */
  role?: UserRoles;
};

@Injectable()
export class InviteUserUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly userDatasource: UserEntityDatasource,
    private readonly md5HashService: Md5HashService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: InviteUserCommand): Promise<void> {
    if (!Types.ObjectId.isValid(input.organizationId)) {
      throw new InvalidDataException('Organização inválida.');
    }

    const organizationId = new Types.ObjectId(input.organizationId);
    const organization =
      await this.organizationDatasource.findById(organizationId);
    if (!organization) {
      throw new InvalidDataException('Organização não encontrada.');
    }

    const { email } = input;
    const role = input.role ?? UserRoles.MEMBER;
    const existing = await this.userDatasource.findByEmail(email);

    if (
      existing &&
      existing.organizationId.toString() !== organizationId.toString()
    ) {
      throw new InvalidDataException(
        'Este e-mail já está cadastrado em outra organização.',
      );
    }

    const confirmation = this.md5HashService.randomMd5Token();
    const confirmationExpiresAt = new Date(
      Date.now() + config.security.inviteTokenTtlMs,
    );

    let invitedUserId: Types.ObjectId;

    if (existing) {
      const updated = await this.userDatasource.update(existing._id, {
        confirmation,
        confirmationExpiresAt,
        role,
      });
      if (!updated) {
        throw new InvalidDataException('Não foi possível atualizar o convite.');
      }
      invitedUserId = existing._id;
    } else {
      const created = await this.userDatasource.create({
        organizationId,
        role,
        accountStatus: AccountStatus.PENDING_CONFIRMATION,
        firstName: 'Convidado',
        lastName: 'Pendente',
        email,
        phoneNumber: '+00000000000',
        confirmation,
        confirmationExpiresAt,
      });
      invitedUserId = created._id;
    }

    const tokenPayload = {
      u: invitedUserId.toString(),
      o: organizationId.toString(),
      c: confirmation,
      e: confirmationExpiresAt.getTime(),
    };
    const token = Buffer.from(JSON.stringify(tokenPayload), 'utf8').toString(
      'base64url',
    );
    const inviteUrl = `${config.mail.frontendUrl}/set-password?token=${encodeURIComponent(token)}`;

    await this.emailService.sendInviteEmail(email, inviteUrl);
  }
}
