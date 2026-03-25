import 'dotenv/config';

export const config = {
  mongoUri: process.env.MONGO_URI ?? '',
  mail: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM ?? 'no-reply@falae.ai',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  security: {
    confirmAccountHashSecret: process.env.CONFIRM_ACCOUNT_HASH_SECRET ?? '',
    passwordMd5Salt: process.env.PASSWORD_MD5_SALT ?? '',
    inviteTokenTtlMs: (() => {
      const n = Number(process.env.INVITE_TOKEN_TTL_MS);
      return Number.isFinite(n) && n > 0 ? n : 48 * 60 * 60 * 1000;
    })(),
  },
};
