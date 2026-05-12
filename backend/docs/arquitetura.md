# Arquitetura do Backend

## Stack

- Node.js
- Express
- Prisma ORM
- MongoDB
- JWT
- Zod

## Camadas

- `routes`: define endpoints.
- `controllers`: recebe requisição e retorna resposta.
- `services`: contém regras de negócio.
- `validators`: valida os dados de entrada.
- `middlewares`: autenticação, erro, segurança e logs.
- `lib`: clientes externos, como Prisma.
- `config`: configurações de ambiente.

## Entidades

- User
- Card
- Category
- Transaction

## Fluxo básico

Frontend → API Express → Controller → Service → Prisma → MongoDB
