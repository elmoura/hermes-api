# Autenticação das rotas admin (Hermes API)

## Modelo

Rotas internas usadas pelo **backoffice (`zeus-web-admin`)** e por **integrações server-to-server** são protegidas por **API key de serviço**:

- Variável de ambiente: **`ADMIN_API_KEY`** (valor secreto, rotação manual ou via secret manager).
- Envio na requisição: header **`Authorization: Bearer <ADMIN_API_KEY>`** (mesmo esquema HTTP Bearer usado pelo Swagger em `BearerAuth`).

Não há JWT de usuário staff nesta camada: o backoffice pode enviar esta chave nas chamadas administrativas até existir fluxo de login staff com token próprio.

## Comportamento

| Situação | HTTP |
| --- | --- |
| `ADMIN_API_KEY` não configurada no servidor | `401 Unauthorized` |
| Header ausente, formato inválido ou chave incorreta | `401 Unauthorized` |
| Bearer válido | Segue para o handler (validação de payload, regras de negócio, etc.) |

Mensagens de erro são genéricas (`Unauthorized`), sem expor se a chave existe ou qual parte falhou.

## Rotas protegidas

- `GET /admin/organizations`
- `GET /admin/organizations/:organizationId`
- `GET /admin/organizations/:organizationId/users`
- `POST /admin/organizations`
- `POST /organizations/:organizationId/invite-user`

## Swagger

Authorize com o esquema **admin-api-key** (botão "Authorize" em `/docs`).
