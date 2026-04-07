import { ApiProperty } from '@nestjs/swagger';

export class LoginOutputDto {
  @ApiProperty({ description: 'JWT de acesso (tenant: sub + org)' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}
