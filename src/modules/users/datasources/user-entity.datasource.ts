import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types, UpdateQuery } from 'mongoose';
import { UserDocument, UserEntity } from '../entities/user.entity';

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
