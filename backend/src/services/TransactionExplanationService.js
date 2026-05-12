import { PaymentTypeClassifierService } from "./PaymentTypeClassifierService.js";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

export class TransactionExplanationService {
  static explain(transaction = {}, options = {}) {
    const paymentType = PaymentTypeClassifierService.classify(transaction);
    const recurringGroup = options.recurringIndex?.get(transaction.id);
    const dateText = formatDate(transaction.date);
    const subject = transaction.counterpartyName || transaction.merchantName || transaction.merchant || transaction.description || "destino não identificado";

    let base = "";

    if (paymentType.group === "PIX") {
      base = transaction.direction === "IN"
        ? `PIX recebido de ${subject}`
        : `PIX enviado para ${subject}`;
    } else if (paymentType.group === "TRANSFER") {
      base = transaction.direction === "IN"
        ? "Entrada recebida via transferência"
        : `Transferência enviada para ${subject}`;
    } else if (paymentType.group === "CARD_BILL") {
      base = "Pagamento de fatura detectado";
    } else if (paymentType.group === "CREDIT") {
      base = `Compra provável no crédito${subject ? ` em ${subject}` : ""}`;
    } else if (paymentType.group === "DEBIT") {
      base = `Compra provável no débito${subject ? ` em ${subject}` : ""}`;
    } else if (paymentType.group === "BOLETO") {
      base = "Saída classificada como possível pagamento de boleto ou conta";
    } else if (paymentType.group === "REFUND") {
      base = "Estorno detectado pela descrição";
    } else if (paymentType.group === "CASH") {
      base = "Saque detectado pela descrição";
    } else if (paymentType.group === "DEPOSIT") {
      base = "Depósito detectado pela descrição";
    } else {
      base = transaction.explanation || `${paymentType.label} ${paymentType.qualifier}`;
    }

    if (dateText) {
      base = `${base} em ${dateText}.`;
    } else {
      base = `${base}.`;
    }

    if (recurringGroup?.kind === "SUBSCRIPTION") {
      base += " Assinatura provável com padrão recorrente.";
    } else if (recurringGroup) {
      base += " Transação recorrente detectada.";
    }

    if (transaction.needsReview) {
      base += " Classificação incerta, recomenda-se revisar.";
    }

    return base.trim();
  }
}
