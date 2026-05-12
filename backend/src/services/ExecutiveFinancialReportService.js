import { UserFinancialProfileService } from "./UserFinancialProfileService.js";

export class ExecutiveFinancialReportService {
  static build(payload = {}) {
    const { statementReading = {}, questionAnswers = {}, rankings = {}, confidence = {}, profileContext = {} } = payload;
    const summary = statementReading.summary || {};
    const topExpense = rankings.topExpenses?.[0];
    const topIncome = rankings.topIncome?.[0];
    const topMerchant = rankings.topMerchants?.[0];
    const highestMonth = rankings.expensiveMonths?.[0];
    const fmt = (value) => UserFinancialProfileService.formatCurrency(value, profileContext);
    const fmtDate = (value) => UserFinancialProfileService.formatDate(value, profileContext);
    const risks = [];
    const opportunities = [];
    const reviewPoints = [];

    if (confidence.lowConfidence > 0) {
      risks.push(`${confidence.lowConfidence} transações têm baixa confiança de leitura.`);
    }
    if (questionAnswers.anomaly?.answer) {
      risks.push(questionAnswers.anomaly.answer);
    }
    if (questionAnswers.cardBill?.answer && !/não/i.test(questionAnswers.cardBill.answer)) {
      reviewPoints.push(questionAnswers.cardBill.answer);
    }
    if (statementReading.subscriptions?.length) {
      opportunities.push(`Foram encontradas ${statementReading.subscriptions.length} assinaturas prováveis para revisar custo recorrente.`);
    }
    if (statementReading.recurring?.length) {
      opportunities.push(`Há ${statementReading.recurring.length} padrões recorrentes que podem ser usados para planejamento mensal.`);
    }
    if (confidence.needsReview > 0) {
      reviewPoints.push(`${confidence.needsReview} transações ainda precisam de revisão manual.`);
    }

    const narrative = UserFinancialProfileService.buildMessage(profileContext, {
      direct: `entre ${fmtDate(summary.periodStart)} e ${fmtDate(summary.periodEnd)}, seu extrato somou ${summary.transactionCount || 0} transações, com ${fmt(summary.totalMoved || 0)} movimentados e saldo líquido de ${fmt(summary.netAmount || 0)}. ${topExpense ? `Seu maior gasto foi ${topExpense.description}, no valor de ${fmt(topExpense.amount)}.` : ""}`.trim(),
      didactic: [
        `Entre ${fmtDate(summary.periodStart)} e ${fmtDate(summary.periodEnd)}, o extrato analisado somou ${summary.transactionCount || 0} transações.`,
        `O volume movimentado foi de ${fmt(summary.totalMoved || 0)}, com ${fmt(summary.totalIncome || 0)} em entradas e ${fmt(summary.totalExpenses || 0)} em saídas.`,
        `O saldo líquido ficou em ${fmt(summary.netAmount || 0)}.`,
        topExpense ? `A principal saída foi ${topExpense.description}, no valor de ${fmt(topExpense.amount)}.` : null,
        topIncome ? `A maior entrada foi ${topIncome.description}, no valor de ${fmt(topIncome.amount)}.` : null,
        topMerchant ? `${topMerchant.merchant} foi a contraparte mais frequente no período.` : null,
        highestMonth ? `O mês com maior gasto foi ${highestMonth.label || highestMonth.month}.` : null
      ].filter(Boolean).join(" "),
      executive: [
        `${summary.transactionCount || 0} transações foram analisadas entre ${fmtDate(summary.periodStart)} e ${fmtDate(summary.periodEnd)}.`,
        `${fmt(summary.totalMoved || 0)} foram movimentados, com resultado líquido de ${fmt(summary.netAmount || 0)}.`,
        topExpense ? `${topExpense.description} liderou as saídas com ${fmt(topExpense.amount)}.` : null,
        topIncome ? `${topIncome.description} liderou as entradas com ${fmt(topIncome.amount)}.` : null
      ].filter(Boolean).join(" "),
      consultive: [
        `Entre ${fmtDate(summary.periodStart)} e ${fmtDate(summary.periodEnd)}, identificamos ${summary.transactionCount || 0} transações no seu extrato.`,
        `O volume movimentado foi de ${fmt(summary.totalMoved || 0)}, com ${fmt(summary.totalIncome || 0)} em entradas e ${fmt(summary.totalExpenses || 0)} em saídas.`,
        `O saldo líquido ficou em ${fmt(summary.netAmount || 0)}.`,
        topExpense ? `Seu maior gasto no período foi ${topExpense.description}, no valor de ${fmt(topExpense.amount)}.` : null,
        topIncome ? `A principal entrada foi ${topIncome.description}, no valor de ${fmt(topIncome.amount)}.` : null,
        topMerchant ? `${topMerchant.merchant} apareceu como contraparte recorrente.` : null,
        highestMonth ? `${highestMonth.label || highestMonth.month} concentrou o maior nível de despesas.` : null
      ].filter(Boolean).join(" "),
      neutral: [
        `Entre ${fmtDate(summary.periodStart)} e ${fmtDate(summary.periodEnd)}, o extrato analisado somou ${summary.transactionCount || 0} transações.`,
        `O volume movimentado foi de ${fmt(summary.totalMoved || 0)}, com ${fmt(summary.totalIncome || 0)} em entradas e ${fmt(summary.totalExpenses || 0)} em saídas.`,
        `O saldo líquido ficou em ${fmt(summary.netAmount || 0)}.`,
        topExpense ? `A principal saída foi ${topExpense.description}, no valor de ${fmt(topExpense.amount)}.` : null,
        topIncome ? `A maior entrada foi ${topIncome.description}, no valor de ${fmt(topIncome.amount)}.` : null,
        topMerchant ? `${topMerchant.merchant} foi a contraparte mais frequente no período.` : null,
        highestMonth ? `O mês com maior gasto foi ${highestMonth.label || highestMonth.month}.` : null
      ].filter(Boolean).join(" ")
    });

    return {
      period: {
        start: summary.periodStart || null,
        end: summary.periodEnd || null
      },
      totals: {
        moved: summary.totalMoved || 0,
        income: summary.totalIncome || 0,
        expenses: summary.totalExpenses || 0,
        net: summary.netAmount || 0
      },
      narrative,
      risks,
      opportunities,
      reviewPoints,
      topExpense,
      topIncome
    };
  }
}
