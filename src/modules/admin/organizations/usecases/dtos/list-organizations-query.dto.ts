import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListOrganizationsQueryDto {
  @ApiPropertyOptional({
    description: 'Página (base 1).',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página (máximo 100).',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description:
      'Filtra organizações cujo nome contém o texto (case-insensitive).',
    example: 'Mercury',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
