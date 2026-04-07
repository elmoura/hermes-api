import { ApiProperty } from '@nestjs/swagger';
import { OrganizationPlanTypes } from '../../entities/organization.entity';

export class OrganizationDetailOutputDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: 'Mercury' })
  name: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    nullable: true,
    description: 'ID do usuário owner, se definido.',
  })
  ownerId: string | null;

  @ApiProperty({ enum: OrganizationPlanTypes })
  planType: OrganizationPlanTypes;

  @ApiProperty({ description: 'ISO 8601' })
  createdAt: string;

  @ApiProperty({ description: 'ISO 8601' })
  updatedAt: string;
}
