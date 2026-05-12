# File Reconciliation Architecture

## Visão geral

O módulo de conciliação por arquivos do Open_Finance trata o OneDrive como **caixa de entrada operacional** e o MongoDB como **fonte principal de verdade**. O arquivo CSV é apenas a matéria-prima de ingestão. Depois do parsing, cada linha é normalizada para o formato `LedgerTransaction`, reconciliada com o histórico existente e persistida no banco principal.

## Papéis de cada componente

- OneDrive: origem de arquivos para importação futura, nunca banco principal.
- CSV: fonte bruta dos lançamentos exportados pelos bancos.
- MongoDB: persistência principal de lotes, transações, histórico e métricas do dashboard.
- ImportBatch: representa o lote de ingestão do arquivo.
- LedgerTransaction: representa a transação normalizada e reconciliada.

## Arquivo bruto vs transação normalizada

- Arquivo bruto:
  - contém colunas heterogêneas por banco
  - pode ter delimitador e formato decimal diferentes
  - não é confiável para consulta analítica direta
- Transação normalizada:
  - tem schema estável
  - possui `transactionHash`
  - já passou por categorização e classificação de duplicidade
  - alimenta dashboard, relatórios e filtros

## Fluxo de importação

1. Usuário envia CSV manualmente ou aponta pasta OneDrive.
2. Backend valida extensão e tamanho.
3. `csvParser` detecta delimitador e lê cabeçalhos/linhas.
4. `csvColumnDetector` sugere mapeamento.
5. `transactionNormalizer` converte cada linha para `LedgerTransaction` em memória.
6. `transactionFingerprint` gera hash único por transação.
7. `ReconciliationService` compara com o histórico do usuário.
8. `CategoryClassifierService` sugere categoria.
9. Frontend exibe prévia, duplicados e conflitos.
10. Usuário confirma.
11. Backend cria `ImportBatch` e persiste apenas linhas permitidas.
12. Dashboard passa a considerar `LedgerTransaction`.

## Fluxo de conciliação

1. Comparar hash exato.
2. Comparar identificadores fortes: `externalId` e `documentNumber`.
3. Comparar combinação semântica:
   - mesma data
   - mesmo valor
   - mesma descrição normalizada
   - mesmo banco/conta
   - mesma forma de pagamento
4. Classificar:
   - `NEW`
   - `DUPLICATE`
   - `POSSIBLE_DUPLICATE`
   - `CONFLICT`

## Fluxo do dashboard

- `FinancialSyncService.dashboardSummary` agrega:
  - lançamentos manuais
  - ledger importado por CSV
  - arquivos sincronizados via OneDrive
- Novos indicadores:
  - total importado por CSV
  - arquivos processados
  - duplicados evitados

## Prevenção de duplicidades

- hash SHA-256 por transação normalizada
- uso de `externalId` e `documentNumber` como fatores fortes
- validação intra-arquivo
- validação contra histórico já persistido
- `fileHash` por lote para evitar reimportação do mesmo CSV

## Categorização automática

O classificador usa regras por palavras-chave sobre descrição normalizada e contraparte. A categoria sugerida pode vir do CSV, ser inferida automaticamente ou cair em `Outros`.

## Histórico de importações

Cada arquivo confirmado gera um `ImportBatch` com:

- origem
- provedor
- nome/hash do arquivo
- mapeamento aplicado
- total de linhas
- linhas importadas
- duplicadas
- linhas com conflito

## OneDrive futuro

Estrutura padrão preparada:

- `/FinSync-Ledger/Entrada`
- `/FinSync-Ledger/Processados`
- `/FinSync-Ledger/Erros`
- `/FinSync-Ledger/Arquivo`

Próximos passos:

- listar arquivos CSV
- detectar novos arquivos
- ignorar `fileHash` já conhecido
- mover para `Processados`
- registrar falhas em `Erros`
