# OneDrive Sync Flow

## Visão geral

O usuário exporta o CSV do banco e envia o arquivo para a pasta do OneDrive. O backend busca novos CSVs, reaproveita a pipeline de importação já existente e persiste o resultado no MongoDB.

## Fluxo

1. Usuário conecta a conta Microsoft via OAuth2.
2. Backend recebe `authorization code`.
3. Backend troca `code` por `access_token` e `refresh_token`.
4. Tokens são criptografados e associados ao usuário.
5. `GET /api/onedrive/files` lista CSVs da pasta monitorada.
6. `POST /api/onedrive/sync`:
   - lista arquivos CSV
   - ignora `fileId` já importado
   - baixa conteúdo
   - reaproveita `LedgerImportService`
   - calcula `fileHash`
   - roda normalização, categorização e deduplicação
   - grava `ImportBatch`
   - grava `LedgerTransaction`
   - invalida cache de resumo
   - atualiza dashboard

## Deduplicação

- por `fileId` do OneDrive
- por `fileHash`
- por `transactionHash`

## Estrutura de pastas

- `Entrada`: lidos para sincronização
- `Processados`: fase futura com permissão de escrita
- `Erros`: fase futura com permissão de escrita
- `Arquivo`: retenção futura

## Tratamento de erro

- token expirado sem refresh válido -> conexão marcada como `EXPIRED`
- CSV inválido -> sincronização registra `ERROR`
- arquivo já importado -> `IGNORED`

## Fontes refletidas no dashboard

- `MANUAL`
- `CSV_IMPORT`
- `ONEDRIVE_CSV`
- `OPEN_FINANCE`
- `ALL`
