import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_CONFIRMATION = 'pending_confirmation',
  BLOCKED = 'blocked',
}

export enum UserRoles {
  MEMBER = 'member',
  ADMIN = 'admin',
}

@Schema({ collection: 'users', timestamps: true })
export class UserEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrganizationEntity', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, enum: UserRoles })
  role: UserRoles;

  @Prop({ required: true, enum: AccountStatus })
  accountStatus: AccountStatus;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  confirmation?: string;

  @Prop()
  confirmationExpiresAt?: Date;

  @Prop({ required: true })
  phoneNumber: string;
}

export type UserDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);
