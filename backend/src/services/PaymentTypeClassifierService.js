function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function detectedLabel(confidenceLabel) {
  if (confidenceLabel === "detectado") return "detectado pela descrição";
  if (confidenceLabel === "provável") return "provavelmente";
  return "precisa revisão";
}

export class PaymentTypeClassifierService {
  static classify(transaction = {}) {
    const operationType = transaction.operationType || null;
    const paymentMethod = transaction.paymentMethod || null;
    const confidenceLabel = transaction.confidenceLabel || "precisa revisar";
    const direction = transaction.direction || (transaction.signedAmount >= 0 ? "IN" : "OUT");

    if (operationType === "PIX") {
      return {
        group: "PIX",
        label: direction === "IN" ? "PIX recebido" : "PIX enviado",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "TRANSFER") {
      return {
        group: "TRANSFER",
        label: direction === "IN" ? "Transferência recebida" : "Transferência enviada",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "CARD_BILL") {
      return {
        group: "CARD_BILL",
        label: "Pagamento de fatura",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "BILL_PAYMENT") {
      return {
        group: "BOLETO",
        label: "Boleto / conta",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "WITHDRAWAL") {
      return {
        group: "CASH",
        label: "Saque",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "DEPOSIT") {
      return {
        group: "DEPOSIT",
        label: "Depósito",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (operationType === "REFUND") {
      return {
        group: "REFUND",
        label: "Estorno",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    if (paymentMethod === "DEBIT") {
      return {
        group: "DEBIT",
        label: "Compra no débito",
        qualifier: confidenceLabel === "detectado" ? "detectado pela descrição" : "provável"
      };
    }

    if (paymentMethod === "CREDIT") {
      return {
        group: "CREDIT",
        label: "Compra no crédito",
        qualifier: confidenceLabel === "detectado" ? "detectado pela descrição" : "provável"
      };
    }

    if (paymentMethod === "BOLETO") {
      return {
        group: "BOLETO",
        label: "Pagamento por boleto",
        qualifier: detectedLabel(confidenceLabel)
      };
    }

    return {
      group: paymentMethod || "OTHER",
      label: transaction.signedAmount >= 0 ? "Entrada" : "Saída",
      qualifier: detectedLabel(confidenceLabel)
    };
  }

  static summarize(transactions = []) {
    const buckets = new Map();

    for (const transaction of transactions) {
      const payment = this.classify(transaction);
      const current = buckets.get(payment.group) || {
        group: payment.group,
        label: payment.label,
        count: 0,
        totalAmount: 0,
        income: 0,
        expenses: 0
      };

      current.count += 1;
      current.totalAmount += Math.abs(transaction.signedAmount || 0);

      if ((transaction.signedAmount || 0) >= 0) {
        current.income += Math.abs(transaction.signedAmount || 0);
      } else {
        current.expenses += Math.abs(transaction.signedAmount || 0);
      }

      buckets.set(payment.group, current);
    }

    return Array.from(buckets.values())
      .sort((left, right) => right.totalAmount - left.totalAmount)
      .map((item) => ({
        ...item,
        formattedTotal: formatCurrency(item.totalAmount)
      }));
  }
}
