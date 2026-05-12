# CSV Reconciliation Rules

## Formatos suportados

- UTF-8
- separador `,`
- separador `;`
- campos com aspas
- decimal brasileiro com vírgula
- decimal com ponto
- data `dd/MM/yyyy`
- data `yyyy-MM-dd`

## Mapeamento sugerido

- `Data`, `Date` -> `date`
- `Descrição`, `Historico`, `Histórico`, `Lançamento` -> `description`
- `Valor`, `Amount` -> `amount`
- `Saldo`, `Balance` -> `balanceAfter`
- `Tipo`, `Type` -> `type`
- `Documento`, `Doc`, `ID` -> `documentNumber`
- `Categoria` -> `category`

## Geração do hash

Componentes:

- `userId`
- `date`
- `amount`
- `normalizedDescription`
- `bank`
- `accountName`
- `paymentMethod`
- `documentNumber` se existir
- `externalId` se existir

Normalização:

- remover acentos
- remover caracteres irrelevantes
- colapsar espaços
- converter para uppercase

## Classificação

- `NEW`: sem colisão relevante
- `DUPLICATE`: hash igual ou identificador forte equivalente
- `POSSIBLE_DUPLICATE`: mesma descrição e valor com data próxima
- `CONFLICT`: mesmo identificador forte com divergência ou variação suspeita

## Tratamento de `POSSIBLE_DUPLICATE`

- durante o preview, a linha é exibida como suspeita e aponta a transação provável já existente
- na confirmação do lote, a linha continua sendo importada para `LedgerTransaction`
- a transação persistida recebe:
  - `reconciliationStatus = POSSIBLE_DUPLICATE`
  - `status = REVIEWED`
  - `matchedTransactionId` quando houver base histórica correspondente
- isso permite revisão posterior sem perder o vínculo com o arquivo CSV ou OneDrive que originou o lançamento

## Status operacionais

- `REVIEWED`: transação importada, mas ainda pendente de decisão manual por suspeita de duplicidade
- `PENDING`: transação pendente de revisão operacional
- `CONFIRMED`: transação revisada e mantida como válida no ledger
- `DISCARDED`: transação descartada como duplicata e excluída dos agregados e métricas operacionais

## Revisão manual de duplicatas

- a fila manual consulta `GET /api/ledger/reconciliation/review`
- apenas itens com `reconciliationStatus = POSSIBLE_DUPLICATE` e `status = REVIEWED` ou `PENDING` aparecem na revisão
- o usuário pode:
  - confirmar a transação, mantendo o lançamento e promovendo o status para `CONFIRMED`
  - descartar a duplicata, preservando rastreabilidade e marcando `DISCARDED`
- toda decisão grava `reviewedAt` e invalida os resumos do mês afetado

## Persistência

- só o usuário autenticado acessa seus lotes
- o arquivo bruto não vira origem de consulta
- o banco principal sempre é MongoDB via Prisma
