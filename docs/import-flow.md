# Import Flow

## Como usar

1. Abrir `Conciliação CSV`
2. Selecionar arquivo `.csv`
3. Informar banco e conta se necessário
4. Executar leitura do arquivo
5. Revisar mapeamento sugerido
6. Ver prévia e alertas de duplicidade
7. Confirmar importação
8. Consultar histórico
9. Validar dashboard atualizado

## Como exportar CSV do banco

- gerar extrato em CSV no internet banking
- garantir UTF-8 quando o banco oferecer essa opção
- evitar editar o arquivo manualmente antes da importação

## Como o sistema evita duplicados

- `fileHash` por arquivo
- `transactionHash` por linha
- comparação com histórico já persistido
- detecção de duplicidade dentro do próprio arquivo

## Como categorias são sugeridas

Regras por palavras-chave sobre descrição normalizada e contraparte:

- `UBER`, `99`, `POSTO` -> `Transporte`
- `MERCADO`, `SUPERMERCADO`, `ATACADAO` -> `Alimentação`
- `IFOOD`, `RESTAURANTE`, `LANCHONETE` -> `Alimentação`
- `GOOGLE`, `NETFLIX`, `SPOTIFY` -> `Assinaturas`
- `FARMACIA`, `DROGARIA` -> `Saúde`
- `PIX RECEBIDO`, `TRANSFERENCIA RECEBIDA`, `SALARIO` -> `Receita`
- `BOLETO`, `PAGAMENTO` -> `Pagamentos`

## Como o dashboard é atualizado

Após confirmação:

- cria `ImportBatch`
- persiste `LedgerTransaction`
- filtros por mês/ano/categoria/origem passam a considerar os novos lançamentos
- cards de arquivos processados e duplicados evitados são recalculados
