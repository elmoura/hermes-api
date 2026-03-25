Crie um endpoint com a seguinte estrutura para confirmação de conta:

## Contrato
Request:
URL: PATCH - /users/confirm-account
Body:
```
{
    hash: string
    password: string
}
```

Response:
StatusCode: 204

## Plano de implementação

1. Receberemos a request, validando o input do usuário
2. Trate com um erro 400 caso o usuário ou a organização não existam, ou caso o usuário não pertença àquela organização
3. Crie um Service para criptografia hash md5 (configure as keys necessárias com env) 
4. Caso o usuário exista para aquela organização, salve a senha enviada criptografada com md5 no mongodb na collection `users`