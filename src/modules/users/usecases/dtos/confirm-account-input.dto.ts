import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * `hash` aceita:
 * - token do convite (base64url com payload JSON `u`, `o`, `c`, `e`), igual ao query `token` do link de convite;
 * - hash legado da criação de organização (`userId.orgId.assinatura` MD5).
 */
export class ConfirmAccountInputDto {
  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsString()
  @MinLength(8)
  phoneNumber?: string;
}
