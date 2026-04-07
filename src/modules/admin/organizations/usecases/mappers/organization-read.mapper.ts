import { OrganizationDocument } from '../../entities/organization.entity';
import { OrganizationListItemDto } from '../dtos/list-organizations-output.dto';

function timestampToIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

export function mapOrganizationDocumentToListItem(
  doc: OrganizationDocument,
): OrganizationListItemDto {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    ownerId: doc.ownerId != null ? String(doc.ownerId) : null,
    planType: doc.planType,
    createdAt: timestampToIso(doc.get('createdAt')),
    updatedAt: timestampToIso(doc.get('updatedAt')),
  };
}
