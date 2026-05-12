function findTop(items = [], selector = (item) => item.amount || 0) {
  return items.slice().sort((left, right) => selector(right) - selector(left))[0] || null;
}

export class NubankStatementInterpreter {
  static applies({ profileContext, transactions = [], merchantAnalysis = {}, paymentMethodAnalysis = {} }) {
    const profileBank = String(profileContext?.profile?.primaryBank || "").toUpperCase();
    const transactionMatch = transactions.some((item) => String(item.bank || "").toUpperCase().includes("NUBANK"));
    return profileBank.includes("NUBANK") || transactionMatch || String(paymentMethodAnalysis.dominantMethod?.paymentMethod || "").toUpperCase() === "CREDIT";
  }

  static interpret(payload = {}) {
    const {
      summary = {},
      pixAnalysis = {},
      paymentMethodAnalysis = {},
      merchantAnalysis = {},
      recurrenceAnalysis = {}
    } = payload;

    const alerts = [];
    const recommendations = [];
    const observations = [];

    if ((paymentMethodAnalysis.creditVsDebit?.creditAmount || 0) > (paymentMethodAnalysis.creditVsDebit?.debitAmount || 0) * 1.5) {
      alerts.push({
        level: "warning",
        title: "Crédito domina o período",
        message: "O volume em crédito ficou bem acima do débito. Vale revisar concentração em fatura e parcelamentos."
      });
    }

    if ((pixAnalysis.totalPixSent || 0) > (summary.totalExpenses || 0) * 0.45) {
      alerts.push({
        level: "info",
        title: "PIX com peso alto nas saídas",
        message: "As saídas via PIX representam parcela relevante do período e merecem acompanhamento por contraparte."
      });
    }

    const topMerchant = findTop(merchantAnalysis.topMerchants || [], (item) => item.amount || 0);
    if (topMerchant) {
      observations.push(`${topMerchant.merchant} foi o estabelecimento com maior peso entre as saídas do período.`);
    }

    const topSubscription = findTop(recurrenceAnalysis.subscriptions || [], (item) => item.totalAmount || 0);
    if (topSubscription) {
      recommendations.push({
        title: "Revisar assinaturas recorrentes",
        message: `${topSubscription.merchant} aparece como assinatura recorrente relevante e pode ser um ponto rápido de otimização.`
      });
    }

    if ((paymentMethodAnalysis.creditVsDebit?.billPayments || 0) > 0) {
      recommendations.push({
        title: "Conectar compras e pagamentos de fatura",
        message: "Houve pagamentos de fatura no período. Cruzar compras, parcelas e datas de pagamento melhora a leitura de caixa."
      });
    }

    return {
      alerts,
      recommendations,
      observations
    };
  }
}
