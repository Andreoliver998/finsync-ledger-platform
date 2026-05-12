# OneDrive Ledger Strategy

## Objetivo

Usar o OneDrive como ponto de entrada para extratos CSV sem transformá-lo em banco principal.

## Estrutura de pastas

- `/FinSync-Ledger/Entrada`
- `/FinSync-Ledger/Processados`
- `/FinSync-Ledger/Erros`
- `/FinSync-Ledger/Arquivo`

## Estratégia operacional

- `Entrada`: arquivos aguardando leitura
- `Processados`: arquivos importados com sucesso
- `Erros`: arquivos com falha de parsing, validação ou conciliação crítica
- `Arquivo`: retenção histórica opcional

## Regras futuras

- sincronizar apenas arquivos `.csv`
- calcular `fileHash` antes de importar
- ignorar arquivos já registrados em `ImportBatch`
- registrar `fileId`, `fileName`, timestamps e status
- nunca confiar no OneDrive como origem de consulta analítica

## Integração Microsoft Graph

Próxima fase:

1. OAuth Microsoft
2. seleção de pasta pelo usuário
3. leitura incremental
4. movimentação de arquivos processados
5. telemetria de sincronização

## Segurança

- não logar tokens
- não expor arquivo bruto publicamente
- limitar escopo de leitura à pasta escolhida
- sempre vincular cada sincronização ao `userId` autenticado
