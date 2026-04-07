import type { OrganizationDocument } from '@modules/admin/organizations/entities/organization.entity';
import type { UserDocument } from '@modules/users/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      tenantUser?: UserDocument;
      tenantOrganization?: OrganizationDocument;
    }
  }
}

export {};
