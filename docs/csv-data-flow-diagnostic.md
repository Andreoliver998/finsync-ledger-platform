# CSV Data Flow Diagnostic

Data do diagnóstico: 2026-05-09 / 2026-05-10  
Ambiente: local  
Banco principal: MongoDB via Prisma

## Resumo executivo

O pipeline de CSV está parcialmente funcional:

- o upload manual cria `ImportBatch`
- o OneDrive baixa arquivo e chama o fluxo de importação
- o CSV é parseado e normalizado quando há linhas válidas
- `LedgerTransaction` é persistida

O problema principal não é uma única falha, mas a combinação de quatro gargalos:

1. o único arquivo OneDrive real conectado no ambiente local está vazio de dados
2. `TransactionsPage` e `Dashboard` priorizam filtros mensais e escondem histórico antigo
3. `Reports` e `IA Financeira` usam apenas o resumo mensal herdado de `dashboardSummary`
4. não existe uma camada analítica dedicada ao `LedgerTransaction` para merchants, recorrência, timeline anual, qualidade de importação e uso provável de cartão

## Verificações obrigatórias

1. O CSV está sendo baixado do OneDrive?  
Sim. `OneDriveFileService.downloadFileContent` retornou conteúdo real do arquivo `Nubank.csv`.

2. O CSV está sendo parseado?  
Sim. O arquivo é processado por `parseCsv`.

3. Quantas linhas foram detectadas?  
No arquivo OneDrive real do ambiente local: `0` linhas de dados.  
O arquivo contém apenas cabeçalho e linha vazia.

4. Quantas viraram `LedgerTransaction`?  
No banco local atual do usuário real: `0`.

5. Quantas foram descartadas como `DUPLICATE`?  
Nenhuma persistida como `DUPLICATE` no banco atual.  
Duplicidade hoje é tratada no preview/import e refletida em `ImportBatch.duplicatedRows`.

6. Quantas foram marcadas como `POSSIBLE_DUPLICATE`?  
No estado atual do banco: `0`.

7. Quantas ficaram `DISCARDED`?  
`0`.

8. O dashboard está consultando `LedgerTransaction`?  
Sim. `FinancialSyncService.dashboardSummary` e `DashboardMetricsService.getExtendedMetrics` consultam `prisma.ledgerTransaction`.

9. A página Transações está consultando `LedgerTransaction`?  
Sim, indiretamente por `GET /api/dashboard/all-transactions`, que mistura `manualTransaction` com `ledgerTransaction`.

10. Relatórios usam `LedgerTransaction` ou só dados antigos?  
Usam o resumo de `FinancialSyncService.dashboardSummary`, portanto herdam apenas a visão agregada do período filtrado e não uma camada analítica própria do ledger.

11. IA Financeira usa `LedgerTransaction` ou só dados mockados/beta?  
Usa `BetaModuleService.financialAi`, que depende de `reports()` e, por consequência, do mesmo resumo mensal agregado. Não há uso analítico profundo do ledger.

12. O filtro de mês/ano está escondendo dados antigos desde 2020?  
Sim.

- `TransactionsPage` inicia com mês e ano atuais
- `DashboardPage` inicia com mês e ano atuais
- `ReportsPage` e `FinancialAiPage` consomem endpoints sem filtro explícito, herdando o comportamento padrão mensal do backend

## Contagens reais do banco

### ImportBatch

- total: `1`

Arquivos processados:

1. `Nubank.csv` — `ONEDRIVE_CSV` / `ONEDRIVE`

### LedgerTransaction

- total: `0`

### Quantidade por source

- nenhum registro persistido no momento

Observação:

- antes desta correção, o ledger persistia `source = CSV_IMPORT`
- a implementação desta entrega passou a persistir a origem operacional real para novos imports

### Quantidade por status

- nenhum status persistido no momento

### Quantidade por reconciliationStatus

- nenhum `reconciliationStatus` persistido no momento

### Período mínimo/máximo das transações

- não há transações persistidas no ledger neste momento

Observação:

- não há histórico desde 2020 dentro do MongoDB local atual
- o arquivo OneDrive conectado neste ambiente não contém linhas úteis

### Categorias detectadas

- nenhuma categoria persistida ainda

### Bancos detectados

- nenhum banco persistido no ledger ainda

## Diagnóstico do OneDrive real do ambiente local

Conexão encontrada:

- usuário: `andreoliver756@gmail.com`
- status: `CONNECTED`
- pasta monitorada: `/FinSync-Ledger/Entrada`

Arquivo encontrado:

- `C:\Users\andre\OneDrive\FinSync-Ledger\Entrada\Nubank.csv`
- tamanho: `37` bytes

Conteúdo observado:

- cabeçalho: `Data,Valor,Identificador,Descrição`
- nenhuma linha de transação

Conclusão:

- o OneDrive está funcionando
- o arquivo importado com `0` linhas não representa bug de persistência
- o arquivo real do ambiente está vazio de dados

## Onde os dados estão parando hoje

### 1. OneDrive

O pipeline chega ao fim, mas o arquivo sincronizado no ambiente local não tem transações.

### 2. Importação

O pipeline persiste `LedgerTransaction`, mas ainda não gera estrutura analítica própria o suficiente para:

- merchants
- recorrência
- linha do tempo anual
- insights financeiros reais
- qualidade consolidada de importação
- uso provável de cartão

### 3. TransactionsPage

Problemas atuais:

- inicia filtrada no mês atual
- não oferece intervalo livre
- não filtra por arquivo importado
- não filtra por valor mínimo/máximo
- carrega conjunto limitado e filtra muito no cliente

### 4. Dashboard

Problemas atuais:

- inicia no mês atual
- não tem visão “Todo o período”
- não tem cards globais específicos do ledger
- não mostra top estabelecimentos nem evolução anual desde 2020

### 5. Reports

Problemas atuais:

- página beta simples
- apenas top categorias e métricas resumidas do período
- não há relatórios mensais, anuais, por merchant, por arquivo, recorrência ou anomalia

### 6. IA Financeira

Problemas atuais:

- serviço usa insights genéricos
- não usa recorrência, merchants, crescimento por categoria, padrões históricos ou prováveis assinaturas

### 7. Conciliação

Problemas atuais:

- revisão manual já existe
- falta visão consolidada de qualidade da importação por lote e aproveitamento total

## Causa raiz

Os CSVs não estão “de enfeite” por falha de persistência pura. O problema central é:

- o ledger é importado
- mas os módulos principais ainda não tratam `LedgerTransaction` como fonte analítica central e histórica

Em resumo:

- ingestão existe
- analytics históricos ainda não existem de forma suficiente
- filtros padrão escondem o histórico
- o CSV do OneDrive atual está vazio
