import { normalizeTransactionDescription } from "../utils/transactionFingerprint.js";
import { MerchantExtractionService } from "./MerchantExtractionService.js";

const IGNORED_TOKENS = new Set([
  "COMPRA",
  "CARTAO",
  "CARTAO",
  "DEBITO",
  "CREDITO",
  "PAGAMENTO",
  "PAGTO",
  "PIX",
  "TRANSFERENCIA",
  "TRANSFERENCIA",
  "TED",
  "DOC",
  "RECEBIDO",
  "ENVIADO",
  "PARCELA",
  "PARCELADO",
  "FATURA",
  "CONTA",
  "BANCO",
  "SAQUE",
  "DEPOSITO",
  "AJUSTE",
  "ESTORNO",
  "TARIFA"
]);

function cleanupToken(token) {
  return String(token || "")
    .replace(/^\d+$/, "")
    .replace(/^[A-Z]{0,2}\d+$/, "")
    .trim();
}

export class MerchantAnalyticsService {
  static detectMerchant(transaction) {
    const extracted = MerchantExtractionService.extract(transaction);
    if (extracted.merchantName || extracted.counterpartyName) {
      return extracted.merchantName || extracted.counterpartyName;
    }

    const base = transaction.counterpartyName
      || transaction.normalizedDescription
      || normalizeTransactionDescription(transaction.description || "");

    const tokens = String(base || "")
      .split(/\s+/)
      .map(cleanupToken)
      .filter(Boolean)
      .filter((token) => !IGNORED_TOKENS.has(token));

    const merchant = tokens.slice(0, 4).join(" ").trim();

    return merchant || String(transaction.description || "Sem estabelecimento").slice(0, 60);
  }

  static rank(transactions = []) {
    const merchantMap = new Map();

    for (const transaction of transactions) {
      const merchant = this.detectMerchant(transaction);
      const current = merchantMap.get(merchant) || {
        merchant,
        totalAmount: 0,
        expenses: 0,
        income: 0,
        count: 0,
        lastTransactionAt: null
      };

      current.count += 1;
      current.totalAmount += Math.abs(transaction.signedAmount);

      if (transaction.signedAmount < 0) {
        current.expenses += Math.abs(transaction.signedAmount);
      } else {
        current.income += Math.abs(transaction.signedAmount);
      }

      if (!current.lastTransactionAt || new Date(transaction.date) > new Date(current.lastTransactionAt)) {
        current.lastTransactionAt = transaction.date;
      }

      merchantMap.set(merchant, current);
    }

    return Array.from(merchantMap.values()).sort((left, right) => {
      if (right.expenses !== left.expenses) {
        return right.expenses - left.expenses;
      }

      return right.count - left.count;
    });
  }
}
