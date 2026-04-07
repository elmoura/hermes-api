import { Injectable } from '@nestjs/common';
import { OrganizationEntityDatasource } from '../datasources/organization-entity.datasource';
import { ListOrganizationsQueryDto } from './dtos/list-organizations-query.dto';
import { ListOrganizationsOutputDto } from './dtos/list-organizations-output.dto';
import { mapOrganizationDocumentToListItem } from './mappers/organization-read.mapper';

@Injectable()
export class ListOrganizationsUsecase {
  constructor(
    private readonly organizationDatasource: OrganizationEntityDatasource,
  ) {}

  async execute(
    query: ListOrganizationsQueryDto,
  ): Promise<ListOrganizationsOutputDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { items, total } =
      await this.organizationDatasource.findManyPaginated({
        page,
        pageSize,
        nameContains: query.name,
      });

    return {
      items: items.map(mapOrganizationDocumentToListItem),
      page,
      pageSize,
      total,
    };
  }
}
