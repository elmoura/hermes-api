# API da organização (contexto tenant)

Rotas em que **membros da organização** gerem utilizadores **sem** a API key de staff do backoffice (`ADMIN_API_KEY`). A autenticação é o **JWT de utilizador** do produto tenant (claim `sub` = userId, `org` = organizationId).

## Autenticação

| Requisito | Detalhe |
| --- | --- |
| Header | `Authorization: Bearer <access_token>` emitido para o utilizador (mesmo segredo que `JWT_SECRET` / `TenantJwtService`). |
| Path | O `organizationId` no URL **deve** coincidir com o claim `org` do token. |
| Utilizador | Deve existir na coleção `users`, com `organizationId` igual ao do path e `accountStatus` **active**. |

Enviar **apenas** a API key de staff (sem JWT válido de tenant) nestas rotas resulta em **401** — não é o fluxo de gestão staff; o backoffice global continua em rotas `/admin/...` e em [admin-auth.md](./admin-auth.md).

## Autorização (gestão de membros)

Após `TenantJwtAuthGuard`, o `TenantOrgAdminGuard` exige uma destas condições:

- **Owner** da organização (`user._id` igual a `organization.ownerId`), ou
- **Administrador ativo** (`role === admin` e `accountStatus === active`).

## Rotas

| Método | Caminho | Descrição |
| --- | --- | --- |
| `PATCH` | `/organizations/:organizationId/members/:userId` | Alterar papel `admin` \| `member` de **outro** membro. |
| `DELETE` | `/organizations/:organizationId/members/:userId` | Revogação **soft**: `accountStatus` → `inactive` para **outro** membro. |

### Regras comuns

- Não alterar / não revogar o **owner** (rebaixar owner ou apagar owner → 400).
- Não deixar a organização **sem** pelo menos um **admin ativo** (rebaixar ou revogar o último admin → 400).
- Não usar estes endpoints para alterar o **próprio** papel ou revogar o **próprio** acesso (403).
- `PATCH` com o mesmo `role` já efetivo → **200** (idempotente).

## Swagger

Tag: **Organização (tenant)** — ver `/docs` no ambiente da API.
