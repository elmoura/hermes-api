import { OrganizationPlanTypes } from '../../entities/organization.entity';
import { UserRoles } from '../../../../users/entities/user.entity';

class OrganizationOwnerOutputDto {
  _id: string;
  organizationId: string;
  role: UserRoles;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber: string;
}

export class CreateOrganizationOutputDto {
  _id: string;
  name: string;
  ownerId: string;
  planType: OrganizationPlanTypes;
  owner: OrganizationOwnerOutputDto;
}
