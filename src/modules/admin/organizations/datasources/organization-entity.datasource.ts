import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
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

  /**
   * Lista organizações com paginação por offset e filtro opcional por nome (contém, case-insensitive).
   */
  async findManyPaginated(params: {
    page: number;
    pageSize: number;
    nameContains?: string;
  }): Promise<{ items: OrganizationDocument[]; total: number }> {
    const filter: QueryFilter<OrganizationEntity> = {};
    const trimmed = params.nameContains?.trim();
    if (trimmed) {
      filter.name = {
        $regex: OrganizationEntityDatasource.escapeRegex(trimmed),
        $options: 'i',
      };
    }

    const skip = (params.page - 1) * params.pageSize;

    const [items, total] = await Promise.all([
      this.organizationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.pageSize)
        .exec(),
      this.organizationModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  private static escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
