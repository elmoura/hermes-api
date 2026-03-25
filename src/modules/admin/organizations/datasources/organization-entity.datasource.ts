import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  OrganizationDocument,
  OrganizationEntity,
  OrganizationPlanTypes,
} from '../entities/organization.entity';

type CreateOrganizationInput = {
  name: string;
  planType: OrganizationPlanTypes;
};

@Injectable()
export class OrganizationEntityDatasource {
  constructor(
    @InjectModel(OrganizationEntity.name)
    private readonly organizationModel: Model<OrganizationEntity>,
  ) {}

  async create(
    input: CreateOrganizationInput,
    session?: ClientSession,
  ): Promise<OrganizationDocument> {
    const [organization] = await this.organizationModel.create([input], {
      session,
    });

    return organization;
  }

  async findById(id: Types.ObjectId): Promise<OrganizationDocument | null> {
    return this.organizationModel.findById(id).exec();
  }

  async updateOwnerId(
    organizationId: Types.ObjectId,
    ownerId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<OrganizationDocument | null> {
    return this.organizationModel.findByIdAndUpdate(
      organizationId,
      { ownerId },
      { returnDocument: 'after', session },
    );
  }
}
