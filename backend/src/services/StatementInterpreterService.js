import { LedgerAnalyticsService } from "./LedgerAnalyticsService.js";
import { PaymentTypeClassifierService } from "./PaymentTypeClassifierService.js";
import { RecurrenceDetectionService } from "./RecurrenceDetectionService.js";
import { TransactionExplanationService } from "./TransactionExplanationService.js";
import { ExecutiveFinancialReportService } from "./ExecutiveFinancialReportService.js";
import { UserFinancialProfileService } from "./UserFinancialProfileService.js";
import { FinancialInsightService } from "./FinancialInsightService.js";
import { NubankStatementInterpreter } from "./NubankStatementInterpreter.js";
import { FinancialAIContextBuilder } from "./FinancialAIContextBuilder.js";
import { FinancialAINarrativeService } from "./FinancialAINarrativeService.js";
import { FinancialAIInsightService } from "./FinancialAIInsightService.js";

function formatMonth(value) {
  const date = new Date(`${value}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function sumAbsolute(transactions = []) {
  return transactions.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
}

function buildSummary(transactions = [], overview = {}, context = {}) {
  const income = transactions.filter((item) => item.signedAmount > 0);
  const expenses = transactions.filter((item) => item.signedAmount < 0);
  const totalIncome = income.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
  const totalMoved = totalIncome + totalExpenses;
  const periodStart = transactions.length ? transactions[transactions.length - 1].date : null;
  const periodEnd = transactions.length ? transactions[0].date : null;
  const fmt = (value) => UserFinancialProfileService.formatCurrency(value, context);

  const simpleText = transactions.length
    ? UserFinancialProfileService.buildMessage(context, {
      direct: `seu maior bloco de movimentação no período somou ${fmt(totalMoved)}, com ${fmt(totalIncome)} em entradas e ${fmt(totalExpenses)} em saídas. O saldo líquido ficou em ${fmt(totalIncome - totalExpenses)}.`,
      didactic: `seu extrato mostra ${transactions.length} transações no período analisado. Foram movimentados ${fmt(totalMoved)}, sendo ${fmt(totalIncome)} em entradas e ${fmt(totalExpenses)} em saídas. O saldo líquido ficou em ${fmt(totalIncome - totalExpenses)}.`,
      executive: `${transactions.length} transações foram analisadas no período, com ${fmt(totalMoved)} movimentados, ${fmt(totalIncome)} em entradas, ${fmt(totalExpenses)} em saídas e saldo líquido de ${fmt(totalIncome - totalExpenses)}.`,
      consultive: `seu extrato mostra ${transactions.length} transações no período analisado. Foram movimentados ${fmt(totalMoved)}, sendo ${fmt(totalIncome)} em entradas e ${fmt(totalExpenses)} em saídas. O saldo líquido ficou em ${fmt(totalIncome - totalExpenses)}.`,
      neutral: `Seu extrato mostra ${transactions.length} transações no período analisado. Foram movimentados ${fmt(totalMoved)}, sendo ${fmt(totalIncome)} em entradas e ${fmt(totalExpenses)} em saídas. O saldo líquido ficou em ${fmt(totalIncome - totalExpenses)}.`
    })
    : "Ainda não há transações suficientes para leitura inteligente do extrato.";

  return {
    transactionCount: transactions.length,
    totalMoved,
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    periodStart,
    periodEnd,
    simpleText,
    overview
  };
}

function buildQuestionAnswers({ transactions, timeline, recurring, paymentBreakdown, rankings, overview, context }) {
  const monthly = timeline.monthly || [];
  const mostExpensiveMonth = monthly.slice().sort((a, b) => b.expenses - a.expenses)[0];
  const byDay = new Map();
  const fmt = (value) => UserFinancialProfileService.formatCurrency(value, context);
  const fmtDate = (value) => UserFinancialProfileService.formatDate(value, context);

  for (const transaction of transactions) {
    const key = new Date(transaction.date).toISOString().slice(0, 10);
    const current = byDay.get(key) || { day: key, moved: 0, income: 0, expenses: 0 };
    current.moved += Math.abs(transaction.signedAmount || 0);
    if ((transaction.signedAmount || 0) >= 0) current.income += Math.abs(transaction.signedAmount || 0);
    else current.expenses += Math.abs(transaction.signedAmount || 0);
    byDay.set(key, current);
  }

  const highestDay = Array.from(byDay.values()).sort((a, b) => b.moved - a.moved)[0];
  const pix = paymentBreakdown.find((item) => item.group === "PIX");
  const debit = paymentBreakdown.find((item) => item.group === "DEBIT");
  const credit = paymentBreakdown.find((item) => item.group === "CREDIT");
  const transfer = paymentBreakdown.find((item) => item.group === "TRANSFER");
  const cardBill = paymentBreakdown.find((item) => item.group === "CARD_BILL");
  const fees = transactions.filter((item) => item.category === "Tarifa bancária");
  const anomalies = overview.anomalies || [];
  const pixVsDebitText = pix && debit && pix.totalAmount > debit.totalAmount
    ? {
      direct: " Seu uso de PIX foi maior que o uso de débito no período.",
      didactic: " O uso de PIX foi maior que o uso de débito no período.",
      executive: " PIX superou débito no volume movimentado do período.",
      consultive: " Identificamos uso de PIX acima do débito no período.",
      neutral: " O uso de PIX foi maior que o uso de débito no período."
    }
    : null;

  return {
    whereMoneyWent: {
      question: "Para onde foi meu dinheiro?",
      answer: rankings.topCategories?.[0]
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `seu maior gasto no período foi em ${rankings.topCategories[0].category}, com ${fmt(rankings.topCategories[0].amount)}.`,
          didactic: `${rankings.topCategories[0].category} liderou as saídas com ${fmt(rankings.topCategories[0].amount)}.`,
          executive: `${rankings.topCategories[0].category} concentrou a maior saída do período, com ${fmt(rankings.topCategories[0].amount)}.`,
          consultive: `identificamos ${rankings.topCategories[0].category} como a principal categoria de saída, somando ${fmt(rankings.topCategories[0].amount)}.`,
          neutral: `${rankings.topCategories[0].category} liderou as saídas com ${fmt(rankings.topCategories[0].amount)}.`
        })
        : "Ainda não há saídas suficientes para responder."
    },
    whereMoneyCameFrom: {
      question: "De onde veio meu dinheiro?",
      answer: rankings.topIncome?.[0]
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `sua principal entrada foi ${rankings.topIncome[0].description}, somando ${fmt(rankings.topIncome[0].amount)}.`,
          didactic: `A principal entrada foi ${rankings.topIncome[0].description}, somando ${fmt(rankings.topIncome[0].amount)}.`,
          executive: `${rankings.topIncome[0].description} foi a maior origem de entrada, com ${fmt(rankings.topIncome[0].amount)}.`,
          consultive: `identificamos ${rankings.topIncome[0].description} como a principal origem de entrada, somando ${fmt(rankings.topIncome[0].amount)}.`,
          neutral: `A principal entrada foi ${rankings.topIncome[0].description}, somando ${fmt(rankings.topIncome[0].amount)}.`
        })
        : "Não houve entradas suficientes para identificar a principal origem."
    },
    highestMonth: {
      question: "Qual mês gastei mais?",
      answer: mostExpensiveMonth
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `seu mês de maior gasto foi ${formatMonth(mostExpensiveMonth.month)}, com ${fmt(mostExpensiveMonth.expenses)}.`,
          didactic: `${formatMonth(mostExpensiveMonth.month)} foi o mês com maior gasto, totalizando ${fmt(mostExpensiveMonth.expenses)}.`,
          executive: `${formatMonth(mostExpensiveMonth.month)} liderou as despesas com ${fmt(mostExpensiveMonth.expenses)}.`,
          consultive: `o pico de despesas aconteceu em ${formatMonth(mostExpensiveMonth.month)}, com ${fmt(mostExpensiveMonth.expenses)}.`,
          neutral: `${formatMonth(mostExpensiveMonth.month)} foi o mês com maior gasto, totalizando ${fmt(mostExpensiveMonth.expenses)}.`
        })
        : "Ainda não há histórico mensal suficiente."
    },
    highestDay: {
      question: "Qual dia teve maior movimentação?",
      answer: highestDay
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `o dia de maior movimentação foi ${fmtDate(highestDay.day)}, com ${fmt(highestDay.moved)}.`,
          didactic: `${fmtDate(highestDay.day)} concentrou ${fmt(highestDay.moved)} em movimentações.`,
          executive: `${fmtDate(highestDay.day)} foi o pico diário de movimentação, com ${fmt(highestDay.moved)}.`,
          consultive: `o maior volume diário apareceu em ${fmtDate(highestDay.day)}, com ${fmt(highestDay.moved)} em movimentações.`,
          neutral: `${fmtDate(highestDay.day)} concentrou ${fmt(highestDay.moved)} em movimentações.`
        })
        : "Ainda não há histórico diário suficiente."
    },
    biggestPurchases: {
      question: "Quais foram minhas maiores compras?",
      answer: rankings.topExpenses?.[0]
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `sua maior saída foi ${rankings.topExpenses[0].description}, no valor de ${fmt(rankings.topExpenses[0].amount)}.`,
          didactic: `A maior saída foi ${rankings.topExpenses[0].description}, no valor de ${fmt(rankings.topExpenses[0].amount)}.`,
          executive: `${rankings.topExpenses[0].description} foi a maior saída individual, no valor de ${fmt(rankings.topExpenses[0].amount)}.`,
          consultive: `a maior compra identificada foi ${rankings.topExpenses[0].description}, no valor de ${fmt(rankings.topExpenses[0].amount)}.`,
          neutral: `A maior saída foi ${rankings.topExpenses[0].description}, no valor de ${fmt(rankings.topExpenses[0].amount)}.`
        })
        : "Não houve compras suficientes para ranquear."
    },
    counterparties: {
      question: "Quais pessoas/empresas aparecem mais?",
      answer: rankings.topMerchants?.[0]
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `${rankings.topMerchants[0].merchant} apareceu ${rankings.topMerchants[0].count} vezes no seu extrato.`,
          didactic: `${rankings.topMerchants[0].merchant} apareceu ${rankings.topMerchants[0].count} vezes no período.`,
          executive: `${rankings.topMerchants[0].merchant} foi a contraparte mais recorrente, com ${rankings.topMerchants[0].count} ocorrências.`,
          consultive: `${rankings.topMerchants[0].merchant} foi a contraparte mais frequente do período, aparecendo ${rankings.topMerchants[0].count} vezes.`,
          neutral: `${rankings.topMerchants[0].merchant} apareceu ${rankings.topMerchants[0].count} vezes no período.`
        })
        : "Não foi possível identificar contrapartes frequentes."
    },
    pix: {
      question: "Quanto usei em PIX?",
      answer: pix ? UserFinancialProfileService.buildMessage(context, {
        direct: `seu uso de PIX somou ${fmt(pix.totalAmount)}.${pixVsDebitText?.direct || ""}`,
        didactic: `${fmt(pix.totalAmount)} passaram por PIX.${pixVsDebitText?.didactic || ""}`,
        executive: `PIX movimentou ${fmt(pix.totalAmount)} no período.${pixVsDebitText?.executive || ""}`,
        consultive: `identificamos ${fmt(pix.totalAmount)} em movimentações via PIX.${pixVsDebitText?.consultive || ""}`,
        neutral: `${fmt(pix.totalAmount)} passaram por PIX.${pixVsDebitText?.neutral || ""}`
      }) : "Não houve PIX detectado."
    },
    debit: {
      question: "Quanto usei em débito?",
      answer: debit ? UserFinancialProfileService.buildMessage(context, {
        direct: `seu uso de débito somou ${fmt(debit.totalAmount)}.`,
        didactic: `${fmt(debit.totalAmount)} foram classificados como débito.`,
        executive: `débito respondeu por ${fmt(debit.totalAmount)} no período.`,
        consultive: `identificamos ${fmt(debit.totalAmount)} classificados como débito.`,
        neutral: `${fmt(debit.totalAmount)} foram classificados como débito.`
      }) : "Não houve débito detectado com confiança suficiente."
    },
    credit: {
      question: "Quanto usei em crédito?",
      answer: credit ? UserFinancialProfileService.buildMessage(context, {
        direct: `seu uso de crédito somou ${fmt(credit.totalAmount)}.`,
        didactic: `${fmt(credit.totalAmount)} foram classificados como crédito.`,
        executive: `crédito respondeu por ${fmt(credit.totalAmount)} no período.`,
        consultive: `identificamos ${fmt(credit.totalAmount)} classificados como crédito.`,
        neutral: `${fmt(credit.totalAmount)} foram classificados como crédito.`
      }) : "Não houve crédito detectado com confiança suficiente."
    },
    transfer: {
      question: "Quanto usei em transferência?",
      answer: transfer ? UserFinancialProfileService.buildMessage(context, {
        direct: `suas transferências somaram ${fmt(transfer.totalAmount)}.`,
        didactic: `${fmt(transfer.totalAmount)} passaram por transferências.`,
        executive: `transferências movimentaram ${fmt(transfer.totalAmount)} no período.`,
        consultive: `identificamos ${fmt(transfer.totalAmount)} em transferências.`,
        neutral: `${fmt(transfer.totalAmount)} passaram por transferências.`
      }) : "Não houve transferências detectadas."
    },
    cardBill: {
      question: "Tive pagamento de fatura?",
      answer: cardBill ? UserFinancialProfileService.buildMessage(context, {
        direct: `detectamos ${cardBill.count} pagamentos de fatura, somando ${fmt(cardBill.totalAmount)}.`,
        didactic: `Sim. Foram detectados ${cardBill.count} pagamentos de fatura, somando ${fmt(cardBill.totalAmount)}.`,
        executive: `foram identificados ${cardBill.count} pagamentos de fatura, com total de ${fmt(cardBill.totalAmount)}.`,
        consultive: `sim. Houve ${cardBill.count} pagamentos de fatura no período, somando ${fmt(cardBill.totalAmount)}.`,
        neutral: `Sim. Foram detectados ${cardBill.count} pagamentos de fatura, somando ${fmt(cardBill.totalAmount)}.`
      }) : "Não houve pagamento de fatura detectado."
    },
    recurring: {
      question: "Tive gasto recorrente?",
      answer: recurring.length ? `Sim. Foram detectados ${recurring.length} padrões recorrentes.` : "Não houve recorrência forte suficiente neste filtro."
    },
    subscription: {
      question: "Tive assinatura?",
      answer: recurring.filter((item) => item.kind === "SUBSCRIPTION").length
        ? `Sim. Há ${recurring.filter((item) => item.kind === "SUBSCRIPTION").length} assinaturas prováveis.`
        : "Não houve assinatura clara detectada."
    },
    fees: {
      question: "Tive tarifa bancária?",
      answer: fees.length
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `detectamos ${fees.length} tarifas bancárias, somando ${fmt(sumAbsolute(fees))}.`,
          didactic: `Sim. Foram identificadas ${fees.length} tarifas bancárias, somando ${fmt(sumAbsolute(fees))}.`,
          executive: `${fees.length} tarifas bancárias foram identificadas, totalizando ${fmt(sumAbsolute(fees))}.`,
          consultive: `sim. Há ${fees.length} tarifas bancárias no período, somando ${fmt(sumAbsolute(fees))}.`,
          neutral: `Sim. Foram identificadas ${fees.length} tarifas bancárias, somando ${fmt(sumAbsolute(fees))}.`
        })
        : "Não houve tarifa bancária identificada."
    },
    anomaly: {
      question: "Existe algo fora do padrão?",
      answer: anomalies[0]
        ? UserFinancialProfileService.buildMessage(context, {
          direct: `${anomalies[0].description} ficou acima do seu padrão histórico e precisa revisão.`,
          didactic: `Sim. ${anomalies[0].description} ficou acima do padrão histórico e precisa revisão.`,
          executive: `${anomalies[0].description} superou o padrão histórico e exige revisão.`,
          consultive: `identificamos ${anomalies[0].description} acima do padrão histórico, o que recomenda revisão.`,
          neutral: `Sim. ${anomalies[0].description} ficou acima do padrão histórico e precisa revisão.`
        })
        : "Não foi encontrado gasto fora do padrão com evidência suficiente."
    }
  };
}

function buildRankings({ transactions, reports, timeline, paymentBreakdown }) {
  const dailyMap = new Map();

  for (const transaction of transactions) {
    const key = new Date(transaction.date).toISOString().slice(0, 10);
    const current = dailyMap.get(key) || { day: key, moved: 0, income: 0, expenses: 0 };
    current.moved += Math.abs(transaction.signedAmount || 0);
    if ((transaction.signedAmount || 0) >= 0) current.income += Math.abs(transaction.signedAmount || 0);
    else current.expenses += Math.abs(transaction.signedAmount || 0);
    dailyMap.set(key, current);
  }

  return {
    topExpenses: (reports.topPurchases || []).map((item) => ({
      id: item.id,
      description: item.description,
      amount: Math.abs(item.signedAmount || 0),
      category: item.category,
      explanation: item.explanation
    })),
    topIncome: (reports.topIncome || []).map((item) => ({
      id: item.id,
      description: item.description,
      amount: Math.abs(item.signedAmount || 0),
      category: item.category,
      explanation: item.explanation
    })),
    topMerchants: reports.byMerchant || [],
    topCategories: reports.byCategory || [],
    topPaymentMethods: paymentBreakdown,
    expensiveMonths: (timeline.monthly || [])
      .slice()
      .sort((a, b) => b.expenses - a.expenses)
      .map((item) => ({ ...item, label: formatMonth(item.month) }))
      .slice(0, 10),
    busyDays: Array.from(dailyMap.values())
      .sort((a, b) => b.moved - a.moved)
      .slice(0, 10)
  };
}

function buildConfidence(transactions = []) {
  const withMerchant = transactions.filter((item) => item.counterpartyName || item.merchantName || item.merchant).length;
  const withMethod = transactions.filter((item) => item.paymentMethod).length;
  const withCategory = transactions.filter((item) => item.category && item.category !== "Outros").length;
  const highConfidence = transactions.filter((item) => item.confidenceLabel === "detectado").length;
  const mediumConfidence = transactions.filter((item) => item.confidenceLabel === "provável").length;
  const lowConfidence = transactions.filter((item) => item.confidenceLabel === "precisa revisar").length;
  const needsReview = transactions.filter((item) => item.needsReview).length;

  return {
    totalTransactions: transactions.length,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    needsReview,
    classifiedPercent: transactions.length ? (withCategory / transactions.length) * 100 : 0,
    otherPercent: transactions.length ? ((transactions.length - withCategory) / transactions.length) * 100 : 0,
    merchantIdentifiedPercent: transactions.length ? (withMerchant / transactions.length) * 100 : 0,
    paymentMethodIdentifiedPercent: transactions.length ? (withMethod / transactions.length) * 100 : 0
  };
}

function buildTimeline(timeline = {}, transactions = []) {
  const monthly = timeline.monthly || [];
  const annual = timeline.annual || [];
  const monthsWithoutMovement = [];

  for (let index = 1; index < monthly.length; index += 1) {
    const previous = monthly[index - 1];
    const current = monthly[index];
    const prevDate = new Date(`${previous.month}-01T00:00:00.000Z`);
    const currentDate = new Date(`${current.month}-01T00:00:00.000Z`);
    const diffMonths = (currentDate.getUTCFullYear() - prevDate.getUTCFullYear()) * 12 + (currentDate.getUTCMonth() - prevDate.getUTCMonth());

    if (diffMonths > 1) {
      monthsWithoutMovement.push({
        from: previous.month,
        to: current.month,
        gapMonths: diffMonths - 1
      });
    }
  }

  const peaks = monthly.slice().sort((a, b) => b.expenses - a.expenses).slice(0, 5);

  return {
    monthly,
    annual,
    peaks,
    monthsWithoutMovement,
    transactionCount: transactions.length
  };
}

function resolvePersonaName(context = {}) {
  return context.profile?.preferredName || "André";
}

function resolveGreeting(context = {}) {
  const persona = resolvePersonaName(context);
  return `${persona}, neste período`;
}

function monthLabel(value, context = {}) {
  if (!value) return "";
  return new Intl.DateTimeFormat(context.profile?.locale || "pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}

function buildMoneyFlowAnalysis(transactions = [], context = {}) {
  const income = transactions.filter((item) => item.signedAmount > 0);
  const expenses = transactions.filter((item) => item.signedAmount < 0);
  const totalIncome = income.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
  const largestIncome = income.slice().sort((a, b) => Math.abs(b.signedAmount) - Math.abs(a.signedAmount))[0] || null;
  const largestExpense = expenses.slice().sort((a, b) => Math.abs(b.signedAmount) - Math.abs(a.signedAmount))[0] || null;

  return {
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    totalMoved: totalIncome + totalExpenses,
    largestIncome: largestIncome ? {
      id: largestIncome.id,
      description: largestIncome.description,
      amount: Math.abs(largestIncome.signedAmount || 0),
      date: largestIncome.date
    } : null,
    largestExpense: largestExpense ? {
      id: largestExpense.id,
      description: largestExpense.description,
      amount: Math.abs(largestExpense.signedAmount || 0),
      date: largestExpense.date
    } : null,
    headline: `${resolveGreeting(context)} entraram ${UserFinancialProfileService.formatCurrency(totalIncome, context)} e saíram ${UserFinancialProfileService.formatCurrency(totalExpenses, context)}.`
  };
}

function buildIncomeAnalysis(transactions = [], rankings = {}, context = {}) {
  const income = transactions.filter((item) => item.signedAmount > 0);
  const dayMap = new Map();

  for (const item of income) {
    const key = new Date(item.date).toISOString().slice(0, 10);
    const current = dayMap.get(key) || { day: key, amount: 0, count: 0 };
    current.amount += Math.abs(item.signedAmount || 0);
    current.count += 1;
    dayMap.set(key, current);
  }

  return {
    totalIncome: income.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0),
    topSources: rankings.topIncome || [],
    peakDays: Array.from(dayMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5),
    concentrationSource: rankings.topIncome?.[0] || null
  };
}

function buildExpenseAnalysis(transactions = [], rankings = {}, timeline = {}, context = {}) {
  const expenses = transactions.filter((item) => item.signedAmount < 0);
  const totalSpent = expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0);
  const days = new Set(expenses.map((item) => new Date(item.date).toISOString().slice(0, 10)));

  return {
    totalSpent,
    purchaseCount: expenses.length,
    topCategories: rankings.topCategories || [],
    topExpenses: rankings.topExpenses || [],
    expensiveMonths: rankings.expensiveMonths || [],
    averageDailyExpense: days.size ? totalSpent / days.size : 0,
    headline: rankings.topCategories?.[0]
      ? `${resolveGreeting(context)} sua principal categoria de despesa foi ${rankings.topCategories[0].category}.`
      : `${resolveGreeting(context)} ainda não há saídas suficientes para destacar uma categoria dominante.`
  };
}

function buildPixAnalysis(transactions = [], paymentBreakdown = [], rankings = {}, timeline = {}, context = {}) {
  const pixTransactions = transactions.filter((item) => item.operationType === "PIX" || item.paymentMethod === "PIX");
  const pixSent = pixTransactions.filter((item) => item.direction === "OUT");
  const pixReceived = pixTransactions.filter((item) => item.direction === "IN");
  const byPerson = new Map();
  const byMonth = new Map();

  for (const item of pixTransactions) {
    const name = item.counterpartyName || item.merchantName || item.description || "Contraparte não identificada";
    const current = byPerson.get(name) || {
      name,
      count: 0,
      sent: 0,
      received: 0,
      total: 0
    };
    current.count += 1;
    current.total += Math.abs(item.signedAmount || 0);
    if (item.direction === "IN") current.received += Math.abs(item.signedAmount || 0);
    else current.sent += Math.abs(item.signedAmount || 0);
    byPerson.set(name, current);

    const month = new Date(item.date).toISOString().slice(0, 7);
    const monthCurrent = byMonth.get(month) || { month, label: monthLabel(month, context), total: 0, count: 0 };
    monthCurrent.total += Math.abs(item.signedAmount || 0);
    monthCurrent.count += 1;
    byMonth.set(month, monthCurrent);
  }

  const largestPix = pixTransactions.slice().sort((a, b) => Math.abs(b.signedAmount || 0) - Math.abs(a.signedAmount || 0))[0] || null;

  return {
    totalPixSent: pixSent.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0),
    totalPixReceived: pixReceived.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0),
    people: Array.from(byPerson.values()).sort((a, b) => b.total - a.total).slice(0, 8),
    largestPix: largestPix ? {
      id: largestPix.id,
      amount: Math.abs(largestPix.signedAmount || 0),
      direction: largestPix.direction,
      description: largestPix.description,
      date: largestPix.date
    } : null,
    byMonth: Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month)),
    headline: pixTransactions.length
      ? `${resolveGreeting(context)} o PIX movimentou ${UserFinancialProfileService.formatCurrency(pixSent.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0) + pixReceived.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0), context)}.`
      : `${resolveGreeting(context)} não houve uso relevante de PIX no recorte analisado.`
  };
}

function buildMerchantAnalysis(transactions = [], rankings = {}, context = {}) {
  const expenses = transactions.filter((item) => item.signedAmount < 0);
  const topMerchants = rankings.topMerchants || [];
  const marketplaceKeywords = ["AMAZON", "MERCADO LIVRE", "SHOPEE", "IFOOD", "UBER", "MAGALU", "AMERICANAS"];
  const marketplaces = topMerchants.filter((item) =>
    marketplaceKeywords.some((keyword) => String(item.merchant || "").toUpperCase().includes(keyword))
  );

  return {
    topMerchants,
    marketplaces,
    purchaseCount: expenses.length,
    totalSpent: expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0),
    averageTicket: expenses.length
      ? expenses.reduce((sum, item) => sum + Math.abs(item.signedAmount || 0), 0) / expenses.length
      : 0,
    largestPurchase: rankings.topExpenses?.[0] || null,
    headline: topMerchants[0]
      ? `${resolveGreeting(context)} ${topMerchants[0].merchant} foi a empresa mais recorrente no extrato.`
      : `${resolveGreeting(context)} não foi possível destacar uma empresa dominante.`
  };
}

function buildPeopleAnalysis(transactions = [], context = {}) {
  const personMap = new Map();
  const likelyPerson = (value) => /\s/.test(String(value || "").trim()) || /^[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+$/u.test(String(value || "").trim());

  for (const item of transactions) {
    const name = item.counterpartyName || "";
    if (!likelyPerson(name)) {
      continue;
    }

    const current = personMap.get(name) || {
      name,
      count: 0,
      sent: 0,
      received: 0,
      largestAmount: 0,
      lastDate: item.date
    };

    current.count += 1;
    current.largestAmount = Math.max(current.largestAmount, Math.abs(item.signedAmount || 0));
    current.lastDate = new Date(current.lastDate) > new Date(item.date) ? current.lastDate : item.date;
    if (item.direction === "IN") current.received += Math.abs(item.signedAmount || 0);
    else current.sent += Math.abs(item.signedAmount || 0);
    personMap.set(name, current);
  }

  const topPeople = Array.from(personMap.values()).sort((a, b) => (b.sent + b.received) - (a.sent + a.received)).slice(0, 8);

  return {
    topPeople,
    totalSent: topPeople.reduce((sum, item) => sum + item.sent, 0),
    totalReceived: topPeople.reduce((sum, item) => sum + item.received, 0),
    headline: topPeople[0]
      ? `${resolveGreeting(context)} ${topPeople[0].name} foi a pessoa com maior relação financeira no período.`
      : `${resolveGreeting(context)} não apareceu uma pessoa dominante nas transferências.`
  };
}

function buildPaymentMethodAnalysis(paymentBreakdown = [], context = {}) {
  const dominantMethod = paymentBreakdown[0] || null;
  const byPaymentMethod = paymentBreakdown.map((item) => ({
    paymentMethod: item.group,
    label: item.label,
    count: item.count,
    totalAmount: item.totalAmount,
    income: item.income,
    expenses: item.expenses
  }));
  const credit = paymentBreakdown.find((item) => item.group === "CREDIT");
  const debit = paymentBreakdown.find((item) => item.group === "DEBIT");
  const boleto = paymentBreakdown.find((item) => item.group === "BOLETO");
  const transfer = paymentBreakdown.find((item) => item.group === "TRANSFER");
  const cardBill = paymentBreakdown.find((item) => item.group === "CARD_BILL");

  return {
    byPaymentMethod,
    dominantMethod,
    creditVsDebit: {
      creditAmount: credit?.totalAmount || 0,
      debitAmount: debit?.totalAmount || 0,
      billPayments: cardBill?.count || 0
    },
    boletoCount: boleto?.count || 0,
    transferCount: transfer?.count || 0,
    headline: dominantMethod
      ? `${resolveGreeting(context)} ${dominantMethod.label.toLowerCase()} foi o método de pagamento dominante.`
      : `${resolveGreeting(context)} ainda não há volume suficiente para definir um método dominante.`
  };
}

function buildRecurrenceAnalysis(recurring = [], context = {}) {
  return {
    totalRecurring: recurring.length,
    subscriptions: recurring.filter((item) => item.kind === "SUBSCRIPTION"),
    salaries: recurring.filter((item) => item.kind === "SALARY"),
    recurringGroups: recurring,
    headline: recurring.length
      ? `${resolveGreeting(context)} foram detectados ${recurring.length} padrões recorrentes.`
      : `${resolveGreeting(context)} não houve recorrências fortes o suficiente para destaque.`
  };
}

function buildExecutiveSummaryV2({ summary, expenseAnalysis, peopleAnalysis, merchantAnalysis, context }) {
  return {
    greeting: resolveGreeting(context),
    headline: `${resolveGreeting(context)} foram analisadas ${summary.transactionCount || 0} transações com saldo líquido de ${UserFinancialProfileService.formatCurrency(summary.netAmount || 0, context)}.`,
    period: {
      start: summary.periodStart || null,
      end: summary.periodEnd || null
    },
    totalTransactions: summary.transactionCount || 0,
    totalMoved: summary.totalMoved || 0,
    totalIncome: summary.totalIncome || 0,
    totalExpenses: summary.totalExpenses || 0,
    netAmount: summary.netAmount || 0,
    dominantCategory: expenseAnalysis.topCategories?.[0] || null,
    dominantPerson: peopleAnalysis.topPeople?.[0] || null,
    dominantMerchant: merchantAnalysis.topMerchants?.[0] || null
  };
}

function buildNarrative({ executiveSummary, moneyFlow, expenseAnalysis, pixAnalysis, merchantAnalysis, recurrenceAnalysis, context, bankInterpretation }) {
  const parts = [
    executiveSummary.headline,
    moneyFlow.largestExpense ? `A maior saída individual foi ${moneyFlow.largestExpense.description}, no valor de ${UserFinancialProfileService.formatCurrency(moneyFlow.largestExpense.amount, context)}.` : null,
    expenseAnalysis.topCategories?.[0] ? `A despesa mais pesada ficou em ${expenseAnalysis.topCategories[0].category}.` : null,
    pixAnalysis.people?.[0] ? `No PIX, ${pixAnalysis.people[0].name} apareceu com maior frequência.` : null,
    merchantAnalysis.topMerchants?.[0] ? `${merchantAnalysis.topMerchants[0].merchant} foi o estabelecimento mais presente.` : null,
    recurrenceAnalysis.totalRecurring ? `Também foram encontrados ${recurrenceAnalysis.totalRecurring} padrões recorrentes.` : null,
    ...(bankInterpretation?.observations || [])
  ];

  return parts.filter(Boolean).join(" ");
}

export class StatementInterpreterService {
  static async statementReading(userId, query = {}) {
    const [transactions, overview, timeline, reports, profileContext] = await Promise.all([
      LedgerAnalyticsService.getLedgerTransactions(userId, query),
      LedgerAnalyticsService.overview(userId, query),
      LedgerAnalyticsService.timeline(userId, query),
      LedgerAnalyticsService.reports(userId, query),
      UserFinancialProfileService.getContext(userId)
    ]);

    const recurring = RecurrenceDetectionService.detect(transactions);
    const recurringIndex = RecurrenceDetectionService.buildTransactionIndex(recurring);
    const paymentBreakdown = PaymentTypeClassifierService.summarize(transactions);
    const summary = buildSummary(transactions, overview, profileContext);
    const rankings = buildRankings({ transactions, reports, timeline, paymentBreakdown });
    const confidence = buildConfidence(transactions);
    const questionAnswers = buildQuestionAnswers({ transactions, timeline, recurring, paymentBreakdown, rankings, overview: reports, context: profileContext });
    const lineTimeline = buildTimeline(timeline, transactions);

    return {
      profile: profileContext.profile,
      summary,
      recurring,
      subscriptions: recurring.filter((item) => item.kind === "SUBSCRIPTION"),
      paymentBreakdown,
      confidence,
      questionAnswers,
      rankings,
      timeline: lineTimeline,
      sampleExplanations: transactions.slice(0, 10).map((item) => ({
        id: item.id,
        description: item.description,
        explanation: TransactionExplanationService.explain(item, { recurringIndex }),
        confidenceLabel: item.confidenceLabel
      }))
    };
  }

  static async executiveReport(userId, query = {}) {
    const statementReading = await this.statementReading(userId, query);
    return ExecutiveFinancialReportService.build({
      statementReading,
      profileContext: {
        profile: statementReading.profile,
        identity: {
          preferredName: statementReading.profile?.preferredName || null,
          isPersonalized: Boolean(statementReading.profile?.preferredName && statementReading.profile?.showPersonalizedTreatment)
        }
      },
      questionAnswers: statementReading.questionAnswers,
      rankings: statementReading.rankings,
      confidence: statementReading.confidence
    });
  }

  static async questionAnswers(userId, query = {}) {
    const statementReading = await this.statementReading(userId, query);
    return statementReading.questionAnswers;
  }

  static async rankings(userId, query = {}) {
    const statementReading = await this.statementReading(userId, query);
    return statementReading.rankings;
  }

  static async confidence(userId, query = {}) {
    const statementReading = await this.statementReading(userId, query);
    return statementReading.confidence;
  }

  static async intelligentReading(userId, query = {}) {
    const statementReading = await this.statementReading(userId, query);
    const profileContext = {
      profile: statementReading.profile,
      identity: {
        preferredName: statementReading.profile?.preferredName || "André",
        isPersonalized: true
      }
    };

    const [transactions, reports] = await Promise.all([
      LedgerAnalyticsService.getLedgerTransactions(userId, query),
      LedgerAnalyticsService.reports(userId, query)
    ]);

    const moneyFlow = buildMoneyFlowAnalysis(transactions, profileContext);
    const incomeAnalysis = buildIncomeAnalysis(transactions, statementReading.rankings, profileContext);
    const expenseAnalysis = buildExpenseAnalysis(transactions, statementReading.rankings, statementReading.timeline, profileContext);
    const pixAnalysis = buildPixAnalysis(transactions, statementReading.paymentBreakdown, statementReading.rankings, statementReading.timeline, profileContext);
    const merchantAnalysis = buildMerchantAnalysis(transactions, statementReading.rankings, profileContext);
    const peopleAnalysis = buildPeopleAnalysis(transactions, profileContext);
    const paymentMethodAnalysis = buildPaymentMethodAnalysis(statementReading.paymentBreakdown, profileContext);
    const recurrenceAnalysis = buildRecurrenceAnalysis(statementReading.recurring, profileContext);
    const executiveSummary = buildExecutiveSummaryV2({
      summary: statementReading.summary,
      expenseAnalysis,
      peopleAnalysis,
      merchantAnalysis,
      context: profileContext
    });

    const baseInsights = FinancialInsightService.buildStatementInsights({
      personaName: resolvePersonaName(profileContext),
      executiveSummary,
      moneyFlow,
      pixAnalysis,
      merchantAnalysis,
      peopleAnalysis,
      paymentMethodAnalysis,
      recurrenceAnalysis,
      confidence: statementReading.confidence
    });

    const bankInterpretation = NubankStatementInterpreter.applies({
      profileContext,
      transactions,
      merchantAnalysis,
      paymentMethodAnalysis
    })
      ? NubankStatementInterpreter.interpret({
        profileContext,
        summary: statementReading.summary,
        moneyFlow,
        pixAnalysis,
        merchantAnalysis,
        paymentMethodAnalysis,
        recurrenceAnalysis
      })
      : { alerts: [], recommendations: [], observations: [] };

    const narrative = buildNarrative({
      executiveSummary,
      moneyFlow,
      expenseAnalysis,
      pixAnalysis,
      merchantAnalysis,
      recurrenceAnalysis,
      context: profileContext,
      bankInterpretation
    });

    const baseResponse = {
      executiveSummary,
      moneyFlow,
      incomeAnalysis,
      expenseAnalysis,
      pixAnalysis,
      merchantAnalysis,
      peopleAnalysis,
      paymentMethodAnalysis,
      recurrenceAnalysis,
      alerts: [...baseInsights.alerts, ...(bankInterpretation.alerts || [])],
      recommendations: [...baseInsights.recommendations, ...(bankInterpretation.recommendations || [])],
      narrative,
      confidence: {
        ...statementReading.confidence,
        sourceCoverage: {
          ledgerTransactions: transactions.length,
          recurringGroups: statementReading.recurring.length,
          byMerchant: reports.byMerchant?.length || 0
        }
      }
    };

    const aiContext = FinancialAIContextBuilder.buildReadingContext({
      statementReading,
      reports,
      transactions,
      moneyFlow,
      pixAnalysis,
      merchantAnalysis,
      peopleAnalysis,
      paymentMethodAnalysis,
      recurrenceAnalysis,
      executiveSummary,
      profileContext,
      bankInterpretation
    });

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "intelligent-reading",
      userId,
      context: aiContext,
      fallback: {
        executiveSummary: executiveSummary?.narrative || executiveSummary?.headline || narrative,
        narrative,
        mainFindings: [
          expenseAnalysis?.headline ? { title: "Saídas", description: expenseAnalysis.headline, severity: "attention", confidence: 0.72 } : null,
          pixAnalysis?.headline ? { title: "PIX", description: pixAnalysis.headline, severity: "info", confidence: 0.7 } : null,
          recurrenceAnalysis?.headline ? { title: "Recorrência", description: recurrenceAnalysis.headline, severity: "opportunity", confidence: 0.68 } : null
        ].filter(Boolean),
        recommendations: (baseInsights.recommendations || [])
          .map((item) => item?.message || item?.title)
          .filter(Boolean)
          .slice(0, 6),
        suggestedQuestions: [
          "Quais categorias concentraram mais saídas?",
          "Quem mais apareceu nas movimentações?",
          "O PIX foi dominante neste período?",
          "Existe algum padrão recorrente relevante?"
        ],
        confidence: Number(statementReading?.confidence?.averageConfidence || 0.72)
      }
    });

    return FinancialAIInsightService.applyToReading(baseResponse, aiResult, { transactions });
  }
}
