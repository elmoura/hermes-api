import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRoles } from '@modules/users/entities/user.entity';

export class UpdateMemberRoleInputDto {
  @ApiProperty({
    enum: UserRoles,
    description: 'Novo papel na organização (`admin` ou `member`).',
    example: UserRoles.ADMIN,
  })
  @IsEnum(UserRoles)
  role: UserRoles;
}
