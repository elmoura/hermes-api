import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrganizationPlanTypes } from '../../entities/organization.entity';

class OwnerInputDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('BR')
  phoneNumber: string;
}

export class CreateOrganizationInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(OrganizationPlanTypes)
  planType: OrganizationPlanTypes;

  @ValidateNested()
  @Type(() => OwnerInputDto)
  owner: OwnerInputDto;
}
