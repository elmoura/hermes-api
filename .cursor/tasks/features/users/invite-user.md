Crie um endpoint com a seguinte estrutura para confirmação de conta. Utilizaremos um link que expira na implementação.

## Contrato
Request:
URL: POST - /organizations/:organizationId/invite-user/
Body:
```
{
    email: string
}
```

Response:
StatusCode: 204

## Plano de implementação

1. Verifique se o usuario pertence àquela organização, caso não, jogue um erro
2. Crie um hash md5 aleatório (utilize um service de criptografia corretamente configurado)
3. Envie um e-mail de convite para o e-mail informado, incluindo um link que contêm um hash md5 criptografado em base64 (implementação de link que expira)
3. Salve o hash md5 num campo `confirmation` da collection `users`
4. Retorne 204