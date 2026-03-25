## Descrição

Siga extritamente as rules já adicionadas para desenvolver essa tarefa. Não cometa erros. Criaremos um endpoint para a entidade `organizations` que possui as seguintes propriedades:

```
{
    _id: ObjectId,
    name: string,
    ownerId: string,
    planType: 'starter' | 'business' | 'enterprise' // Crie o Enum OrganizationPlanTypes na implementação
    createdAt: timestamp, // Utilize a funcionalidade nativa do MongoDb para isso
    updatedAt: timestamp, // Utilize a funcionalidade nativa do MongoDb para isso
}
```

No caminho, utilizaremos também a entidade `users` que terá as seguintes propriedades:

```
{
    _id: ObjectId,
    organizationId: ObjectId,
    role: "user" | "admin", // Criar enum UserRoles na implementação
    firstName: string,
    lastName: string,
    email: string,
    password?: string,
    phoneNumber: string,
    createdAt: timestamp, // Utilize a funcionalidade nativa do MongoDb para isso
    updatedAt: timestamp, // Utilize a funcionalidade nativa do MongoDb para isso
}
```

Crie um endpoint POST HTTP para a entidade

A URL da chamada será: `POST - /admin/organizations` e receberá o seguinte body:

```
{
    name: string,
    planType: OrganizationPlanTypes, // Enum criado anteriormente
    owner: {
        firstName: string,
        lastName: string,
        email: string,
        phoneNumber: string
    }
}
```

O endpoint seguirá os seguintes passos:
1. Recebe chamada HTTP e valida campos do body com `class-validator`
2. Abre uma transaction no MongoDb
3. Cria a `organization` (que gera o ID da organização)
4. Cria um `user` com as informações de owner informadas, vinculado à organização
5. Atualiza o ownerId da `organization`
6. Envia um e-mail para definição de senha do usuário (Crie um EmailService usando nodemailer para isso)
7. Retorna o body com os campos abaixos para o usuário:
```
{
    _id: string,
    name: string,
    ownerId: string,
    planType: string,
    owner: {
        _id:  string,
        organizationId: ObjectId,
        role: "admin",
        firstName: string,
        lastName: string,
        email: string,
        password?: string,
        phoneNumber: string,        
    }
}
```