import type { UserDocument } from '@modules/users/entities/user.entity';
import { OrganizationUserListItemDto } from '../dtos/list-organization-users-output.dto';

export function mapUserDocumentToListItem(
  doc: UserDocument,
): OrganizationUserListItemDto {
  return {
    _id: doc._id.toString(),
    email: doc.email,
    role: doc.role,
    accountStatus: doc.accountStatus,
    firstName: doc.firstName,
    lastName: doc.lastName,
    phoneNumber: doc.phoneNumber,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
