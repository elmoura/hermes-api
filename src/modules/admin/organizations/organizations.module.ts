import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from '../../../shared/services/email.service';
import { Md5HashService } from '../../../shared/services/md5-hash.service';
import { UserEntityDatasource } from '../../users/datasources/user-entity.datasource';
import { UserEntity, UserSchema } from '../../users/entities/user.entity';
import { OrganizationEntityDatasource } from './datasources/organization-entity.datasource';
import {
  OrganizationEntity,
  OrganizationSchema,
} from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { CreateOrganizationUsecase } from './usecases/create-organization.usecase';
import { InviteUserUsecase } from './usecases/invite-user.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrganizationEntity.name, schema: OrganizationSchema },
      { name: UserEntity.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationEntityDatasource,
    UserEntityDatasource,
    CreateOrganizationUsecase,
    InviteUserUsecase,
    Md5HashService,
    EmailService,
  ],
})
export class OrganizationsModule {}
