import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus, UserRoles } from '@modules/users/entities/user.entity';

export class OrganizationUserListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'ana@empresa.com' })
  email: string;

  @ApiProperty({ enum: UserRoles })
  role: UserRoles;

  @ApiProperty({
    enum: AccountStatus,
    description:
      'Ex.: `pending_confirmation` para convite não confirmado; `active` após confirmação.',
  })
  accountStatus: AccountStatus;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  lastName: string;

  @ApiProperty({
    example: '+5511999999999',
    description: 'E.164',
  })
  phoneNumber: string;

  @ApiProperty({ description: 'ISO 8601' })
  createdAt: string;

  @ApiProperty({ description: 'ISO 8601' })
  updatedAt: string;
}

export class ListOrganizationUsersOutputDto {
  @ApiProperty({ type: [OrganizationUserListItemDto] })
  items: OrganizationUserListItemDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({
    example: 3,
    description: 'Total de usuários da organização',
  })
  total: number;
}
