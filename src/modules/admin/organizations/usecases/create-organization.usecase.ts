import { Inject, Injectable } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EmailService } from '../../../../shared/services/email.service';
import { UserEntityDatasource } from '../../../users/datasources/user-entity.datasource';
import { AccountStatus, UserRoles } from '../../../users/entities/user.entity';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { CreateOrganizationInputDto } from './dtos/create-organization-input.dto';
import { CreateOrganizationOutputDto } from './dtos/create-organization-output.dto';
import { InvalidDataException } from '../exceptions/invalid-data.exception';

@Injectable()
export class CreateOrganizationUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly userDatasource: UserEntityDatasource,
    private readonly emailService: EmailService,
    @Inject(getConnectionToken()) private readonly connection: Connection,
  ) {}

  async execute(
    input: CreateOrganizationInputDto,
  ): Promise<CreateOrganizationOutputDto> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();

      const organization = await this.organizationDatasource.create(
        {
          name: input.name,
          planType: input.planType,
        },
        session,
      );

      const owner = await this.userDatasource.create(
        {
          organizationId: organization._id,
          role: UserRoles.ADMIN,
          accountStatus: AccountStatus.PENDING_CONFIRMATION,
          firstName: input.owner.firstName,
          lastName: input.owner.lastName,
          email: input.owner.email,
          phoneNumber: input.owner.phoneNumber,
        },
        session,
      );

      const organizationWithOwner =
        await this.organizationDatasource.updateOwnerId(
          organization._id,
          owner._id,
          session,
        );

      if (!organizationWithOwner) {
        throw new InvalidDataException(
          'Organização não encontrada para atualização do owner.',
        );
      }

      await session.commitTransaction();
      await this.emailService.sendSetPasswordEmail(
        owner.email,
        owner.firstName,
        owner._id.toString(),
        organization._id.toString(),
      );

      return {
        _id: organizationWithOwner._id.toString(),
        name: organizationWithOwner.name,
        ownerId: organizationWithOwner.ownerId ?? owner._id.toString(),
        planType: organizationWithOwner.planType,
        owner: {
          _id: owner._id.toString(),
          organizationId: owner.organizationId.toString(),
          role: owner.role,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          password: owner.password,
          phoneNumber: owner.phoneNumber,
        },
      };
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof InvalidDataException) {
        throw error;
      }

      console.error(error);
      throw new InvalidDataException('Não foi possível criar a organização.');
    } finally {
      await session.endSession();
    }
  }
}
