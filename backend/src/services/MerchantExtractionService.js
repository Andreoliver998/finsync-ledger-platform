function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function cleanupName(value) {
  return String(value || "")
    .replace(/\b(BANCO|S A|SA|LTDA|EIRELI|ME|MEI)\b/gi, "")
    .replace(/\b(IP|AGENCIA|CONTA)\b.*$/i, "")
    .replace(/^\W+|\W+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameFromMatch(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return cleanupName(match[1]);
    }
  }
  return "";
}

function buildRawName(text, patterns = []) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match?.[1]) {
      return cleanupName(match[1]);
    }
  }
  return "";
}

function extractMerchantFromCard(text) {
  const cardName = buildNameFromMatch(text, [
    /COMPRA CARTAO\s+(.+)/i,
    /COMPRA NO CARTAO\s+(.+)/i,
    /COMPRA DEBITO\s+(.+)/i,
    /COMPRA CREDITO\s+(.+)/i
  ]);

  if (!cardName) {
    return "";
  }

  return cleanupName(cardName.split(/\b\d{1,2}\/\d{1,2}\b/i)[0]);
}

export class MerchantExtractionService {
  static extract(transaction = {}) {
    const rawText = [
      transaction.description,
      transaction.normalizedDescription,
      transaction.counterpartyName
    ]
      .filter(Boolean)
      .join(" ");
    const text = normalize(rawText);
    const direction = transaction.type === "DEBIT"
      ? "OUT"
      : transaction.type === "CREDIT"
        ? "IN"
        : Number(transaction.amount) > 0
          ? "IN"
          : "OUT";
    const paymentMethod = transaction.paymentMethod || (
      /\bPIX\b/i.test(text) ? "PIX" :
      /\bTED\b/i.test(text) ? "TED" :
      /\bDOC\b/i.test(text) ? "DOC" :
      /BOLETO/i.test(text) ? "BOLETO" :
      /FATURA|CARTAO|PARCELA/i.test(text) ? "CREDIT" :
      /DEBITO/i.test(text) ? "DEBIT" :
      /SAQUE|ATM/i.test(text) ? "CASH" :
      /TRANSFER/i.test(text) ? "TRANSFER" :
      null
    );

    let operationType = direction === "IN" ? "RECEIPT" : "PURCHASE";
    let counterpartyName = transaction.counterpartyName || "";
    let merchantName = "";
    let confidenceScore = 0.52;
    let explanation = direction === "IN" ? "Entrada identificada no extrato." : "Saída identificada no extrato.";
    const tags = [];

    const pixCounterparty = buildRawName(rawText, [
      /Pix\s*-\s*([^-\n]+?)\s*-\s*[•\d]/i,
      /Transfer[eê]ncia enviada pelo Pix\s*-\s*([^-\n]+?)\s*-\s*[•\d]/i,
      /Transfer[eê]ncia recebida pelo Pix\s*-\s*([^-\n]+?)\s*-\s*[•\d]/i
    ]) || buildNameFromMatch(text, [
      /PIX\s+-\s+(.+?)\s+-\s+\d/i,
      /PIX RECEBIDO DE\s+(.+)/i,
      /PIX RECEBIMENTO DE\s+(.+)/i,
      /PIX ENVIADO PARA\s+(.+)/i,
      /PIX PARA\s+(.+)/i,
      /RECEBIDO DE\s+(.+)/i
    ]);

    const transferCounterparty = buildRawName(rawText, [
      /Transfer[eê]ncia enviada pelo Pix\s*-\s*([^-\n]+?)\s*-\s*[•\d]/i,
      /Transfer[eê]ncia recebida pelo Pix\s*-\s*([^-\n]+?)\s*-\s*[•\d]/i,
      /Transfer[eê]ncia para\s+([^-\n]+?)\s*-\s*[•\d]/i,
      /TED para\s+([^-\n]+?)\s*-\s*[•\d]/i
    ]) || buildNameFromMatch(text, [
      /TRANSFERENCIA ENVIADA PELO PIX\s+(.+?)\s+\d/i,
      /TRANSFERENCIA RECEBIDA PELO PIX\s+(.+?)\s+\d/i,
      /TRANSFERENCIA PARA\s+(.+)/i,
      /TRANSFERENCIA RECEBIDA DE\s+(.+)/i,
      /TED PARA\s+(.+)/i,
      /TED DE\s+(.+)/i,
      /DOC PARA\s+(.+)/i,
      /DOC DE\s+(.+)/i
    ]);

    if (/PIX/i.test(text)) {
      operationType = "PIX";
      counterpartyName = counterpartyName || pixCounterparty;
      confidenceScore = counterpartyName ? 0.93 : 0.82;
      explanation = direction === "IN"
        ? `PIX recebido${counterpartyName ? ` de ${counterpartyName}` : ""}`.trim()
        : `PIX enviado${counterpartyName ? ` para ${counterpartyName}` : ""}`.trim();
      tags.push(direction === "IN" ? "pix_recebido" : "pix_enviado");
    } else if (/TRANSFER/i.test(text) || /\bTED\b/i.test(text) || /\bDOC\b/i.test(text)) {
      operationType = "TRANSFER";
      counterpartyName = counterpartyName || transferCounterparty;
      confidenceScore = counterpartyName ? 0.88 : 0.76;
      explanation = direction === "IN"
        ? `Transferência recebida${counterpartyName ? ` de ${counterpartyName}` : ""}`.trim()
        : `Transferência enviada${counterpartyName ? ` para ${counterpartyName}` : ""}`.trim();
      tags.push("transferencia");
    } else if (/FATURA|PAGAMENTO FATURA|PAGTO FATURA/i.test(text)) {
      operationType = "CARD_BILL";
      confidenceScore = 0.91;
      explanation = "Pagamento de fatura/cartão detectado.";
      tags.push("fatura_cartao");
    } else if (/BOLETO|CODIGO DE BARRAS|CONVENIO/i.test(text)) {
      operationType = "BILL_PAYMENT";
      confidenceScore = 0.82;
      explanation = "Pagamento de boleto ou conta detectado.";
      tags.push("boleto");
    } else if (/ESTORNO|REEMBOLSO|DEVOLUCAO|CASHBACK/i.test(text)) {
      operationType = "REFUND";
      confidenceScore = 0.9;
      explanation = "Estorno ou devolução detectado.";
      tags.push("estorno");
    } else if (/SAQUE|ATM|CAIXA ELETRONICO/i.test(text)) {
      operationType = "WITHDRAWAL";
      confidenceScore = 0.9;
      explanation = "Saque em dinheiro detectado.";
    } else if (/DEPOSITO/i.test(text)) {
      operationType = "DEPOSIT";
      confidenceScore = 0.86;
      explanation = "Depósito detectado.";
    } else {
      merchantName = extractMerchantFromCard(text);
      if (merchantName) {
        operationType = "PURCHASE";
        confidenceScore = 0.8;
        explanation = `Compra provável em ${merchantName}`.trim();
      }
    }

    if (!merchantName && !counterpartyName) {
      const fallback = buildNameFromMatch(text, [
        /PAGAMENTO BOLETO\s+(.+)/i,
        /PAGAMENTO\s+(.+)/i,
        /COMPRA\s+(.+)/i
      ]);
      merchantName = fallback || merchantName;
    }

    counterpartyName = cleanupName(counterpartyName);
    merchantName = cleanupName(merchantName);

    return {
      rawText,
      operationType,
      direction,
      paymentMethod,
      merchantName: merchantName || null,
      counterpartyName: counterpartyName || null,
      confidenceScore,
      explanation,
      tags
    };
  }
}
