import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types, UpdateQuery } from 'mongoose';
import {
  AccountStatus,
  UserDocument,
  UserEntity,
  UserRoles,
} from '../entities/user.entity';

type CreateUserInput = Omit<UserEntity, '_id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class UserEntityDatasource {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserEntity>,
  ) {}

  async create(
    input: CreateUserInput,
    session?: ClientSession,
  ): Promise<UserDocument> {
    const [user] = await this.userModel.create([input], { session });

    return user;
  }

  async findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /** Administradores ativos (para regra do último admin). */
  async countActiveAdminsInOrganization(
    organizationId: Types.ObjectId,
  ): Promise<number> {
    return this.userModel
      .countDocuments({
        organizationId,
        role: UserRoles.ADMIN,
        accountStatus: AccountStatus.ACTIVE,
      })
      .exec();
  }

  /**
   * Lista usuários da organização com paginação; exclui campos sensíveis no documento retornado.
   */
  async findByOrganizationIdPaginated(
    organizationId: Types.ObjectId,
    params: { page: number; pageSize: number },
  ): Promise<{ items: UserDocument[]; total: number }> {
    const filter = { organizationId };
    const skip = (params.page - 1) * params.pageSize;

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -confirmation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(params.pageSize)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async update(
    userId: Types.ObjectId,
    data: Partial<Omit<UserEntity, '_id'>> | UpdateQuery<UserDocument>,
    session?: ClientSession,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, data, { returnDocument: 'after', session })
      .exec();
  }
}
