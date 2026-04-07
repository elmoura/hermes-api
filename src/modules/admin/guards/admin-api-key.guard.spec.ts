import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';

function createContext(authorization?: string): ExecutionContext {
  const mock = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization },
      }),
    }),
  };
  return mock as unknown as ExecutionContext;
}

describe('AdminApiKeyGuard', () => {
  const guard = new AdminApiKeyGuard();

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  it('lança 401 quando ADMIN_API_KEY não está definida', () => {
    expect(() => guard.canActivate(createContext('Bearer qualquer'))).toThrow(
      UnauthorizedException,
    );
  });

  it('lança 401 quando o header Authorization está ausente', () => {
    process.env.ADMIN_API_KEY = 'segredo';
    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('lança 401 quando não é Bearer', () => {
    process.env.ADMIN_API_KEY = 'segredo';
    expect(() => guard.canActivate(createContext('Basic x'))).toThrow(
      UnauthorizedException,
    );
  });

  it('lança 401 quando a chave não confere', () => {
    process.env.ADMIN_API_KEY = 'segredo';
    expect(() => guard.canActivate(createContext('Bearer outro'))).toThrow(
      UnauthorizedException,
    );
  });

  it('retorna true quando Bearer confere (comparação em tempo constante)', () => {
    process.env.ADMIN_API_KEY = 'segredo-exato';
    expect(guard.canActivate(createContext('Bearer segredo-exato'))).toBe(true);
  });

  it('aceita prefixo Bearer case-insensitive', () => {
    process.env.ADMIN_API_KEY = 'k';
    expect(guard.canActivate(createContext('bearer k'))).toBe(true);
  });
});
