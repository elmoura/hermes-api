/** Claims do access token emitido para utilizadores do produto tenant (adonis-web). */
export type TenantJwtPayload = {
  /** ObjectId do utilizador */
  sub: string;
  /** ObjectId da organização (tenant) */
  org: string;
};
