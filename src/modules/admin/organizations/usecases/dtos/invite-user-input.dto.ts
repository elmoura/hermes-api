import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { UserRoles } from '@modules/users/entities/user.entity';

export class InviteUserInputDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsIn(Object.values(UserRoles))
  role: UserRoles;
}
