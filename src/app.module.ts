import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from './config/config';
import { OrganizationsModule } from './modules/admin/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot(config.mongoUri),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [],
})
export class AppModule {}
