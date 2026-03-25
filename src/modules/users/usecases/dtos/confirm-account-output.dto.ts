import { AccountStatus, UserRoles } from '../../entities/user.entity';

/** Resposta pública do usuário após confirmação (sem senha). */
export class ConfirmAccountOutputDto {
  _id: string;
  organizationId: string;
  role: UserRoles;
  accountStatus: AccountStatus;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
  updatedAt?: string;
}
