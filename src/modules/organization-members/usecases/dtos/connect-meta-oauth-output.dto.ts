import { ApiProperty } from '@nestjs/swagger';

export class ConnectMetaOauthOutputDto {
  @ApiProperty()
  connected: boolean;

  @ApiProperty({ nullable: true })
  facebookBusinessId: string | null;

  @ApiProperty({ nullable: true, description: 'ISO 8601' })
  tokenExpiresAt: string | null;
}
