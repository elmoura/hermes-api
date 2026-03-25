import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum OrganizationPlanTypes {
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

@Schema({ collection: 'organizations', timestamps: true })
export class OrganizationEntity {
  @Prop({ required: true })
  name: string;

  @Prop()
  ownerId?: string;

  @Prop({
    required: true,
    enum: OrganizationPlanTypes,
  })
  planType: OrganizationPlanTypes;
}

export type OrganizationDocument = HydratedDocument<OrganizationEntity>;
export const OrganizationSchema =
  SchemaFactory.createForClass(OrganizationEntity);
