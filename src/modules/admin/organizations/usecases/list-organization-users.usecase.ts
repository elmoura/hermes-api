import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserEntityDatasource } from '@modules/users/datasources/user-entity.datasource';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { InvalidDataException } from '../exceptions/invalid-data.exception';
import { ListOrganizationUsersQueryDto } from './dtos/list-organization-users-query.dto';
import { ListOrganizationUsersOutputDto } from './dtos/list-organization-users-output.dto';
import { mapUserDocumentToListItem } from './mappers/organization-user-read.mapper';

@Injectable()
export class ListOrganizationUsersUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
    private readonly userDatasource: UserEntityDatasource,
  ) {}

  async execute(
    organizationId: string,
    query: ListOrganizationUsersQueryDto,
  ): Promise<ListOrganizationUsersOutputDto> {
    if (!Types.ObjectId.isValid(organizationId)) {
      throw new InvalidDataException('Identificador de organização inválido.');
    }

    const orgObjectId = new Types.ObjectId(organizationId);
    const organization =
      await this.organizationDatasource.findById(orgObjectId);
    if (!organization) {
      throw new NotFoundException('Organização não encontrada.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } =
      await this.userDatasource.findByOrganizationIdPaginated(orgObjectId, {
        page,
        pageSize,
      });

    return {
      items: items.map(mapUserDocumentToListItem),
      page,
      pageSize,
      total,
    };
  }
}
