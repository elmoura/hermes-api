import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config/config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantJwtModule } from './modules/auth/tenant-jwt.module';
import { OrganizationsModule } from './modules/admin/organizations/organizations.module';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';
import { UsersModule } from './modules/users/users.module';
import { WhatsappModule } from '@modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    TenantJwtModule,
    AuthModule,
    WhatsappModule,
    MongooseModule.forRoot(config.mongoUri),
    OrganizationsModule,
    UsersModule,
    OrganizationMembersModule,
  ],
  controllers: [],
})
export class AppModule {}
