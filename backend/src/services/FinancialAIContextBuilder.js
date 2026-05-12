function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function toDateString(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function compactText(value, maxLength = 160) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function summarizeTransactions(items = [], limit = 6) {
  return items.slice(0, limit).map((item) => ({
    id: item?.id || null,
    date: toDateString(item?.date),
    amount: toNumber(item?.amount ?? item?.absoluteAmount),
    direction: item?.direction || null,
    description: compactText(item?.description || item?.merchantName || item?.counterpartyName || item?.merchant),
    category: compactText(item?.category, 80) || null,
    paymentMethod: compactText(item?.paymentMethod, 80) || null
  }));
}

function summarizeRanking(items = [], labelKeys = ["name", "label", "merchant", "category", "paymentMethod"], valueKeys = ["amount", "total", "value", "count"], limit = 6) {
  return items.slice(0, limit).map((item) => {
    const label = labelKeys.map((key) => compactText(item?.[key], 80)).find(Boolean) || "Não identificado";
    const metricValue = valueKeys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null);

    return {
      label,
      value: toNumber(metricValue),
      count: item?.count ?? item?.transactionCount ?? null,
      percentage: item?.percentage != null ? Number(item.percentage) : null
    };
  });
}

function buildPeriodFromCollection(items = []) {
  if (!items.length) {
    return { start: null, end: null };
  }

  return {
    start: toDateString(items[items.length - 1]?.date),
    end: toDateString(items[0]?.date)
  };
}

export class FinancialAIContextBuilder {
  static buildReadingContext(payload = {}) {
    const totals = payload?.statementReading?.summary || {};
    const transactions = payload?.transactions || [];

    return {
      user: {
        preferredName: payload?.profileContext?.identity?.preferredName || payload?.statementReading?.profile?.preferredName || null
      },
      period: payload?.reports?.period || buildPeriodFromCollection(transactions),
      totals: {
        totalIn: toNumber(totals.totalIncome),
        totalOut: toNumber(totals.totalExpenses),
        netAmount: toNumber(totals.netAmount),
        transactionCount: Number(totals.transactionCount || transactions.length || 0)
      },
      topCategories: summarizeRanking(payload?.reports?.byCategory || payload?.statementReading?.rankings?.topCategories || [], ["category", "label"], ["amount", "total", "value"], 6),
      topMerchants: summarizeRanking(payload?.statementReading?.rankings?.topMerchants || [], ["merchant", "label", "name"], ["amount", "total", "value", "count"], 6),
      topPeople: summarizeRanking(payload?.peopleAnalysis?.topPeople || [], ["name", "label", "person"], ["amount", "total", "value", "count"], 6),
      paymentMethods: summarizeRanking(payload?.statementReading?.paymentBreakdown || [], ["paymentMethod", "method", "label"], ["amount", "total", "count", "value"], 6),
      pixSummary: payload?.pixAnalysis || null,
      recurrenceSignals: summarizeRanking(payload?.statementReading?.recurring || [], ["merchant", "label", "name"], ["count", "amount", "total"], 6),
      riskSignals: [
        compactText(payload?.executiveSummary?.headline, 180),
        compactText(payload?.expenseAnalysis?.headline, 180),
        compactText(payload?.bankInterpretation?.observations?.[0], 180)
      ].filter(Boolean),
      largestTransactions: summarizeTransactions(payload?.reports?.topPurchases || [], 5),
      relationshipSummary: payload?.merchantAnalysis || null,
      relatedTransactions: summarizeTransactions(transactions, 6),
      sourceInfo: {
        source: "INTELLIGENT_READING",
        confidenceScore: payload?.statementReading?.confidence?.score ?? payload?.statementReading?.confidence?.averageConfidence ?? null
      }
    };
  }

  static buildProfileContext(query = {}, data = {}) {
    return {
      user: {
        preferredName: data?.profileContext?.identity?.preferredName || null
      },
      period: buildPeriodFromCollection(data?.relatedTransactions || []),
      entity: {
        type: data?.profile?.type || query?.type || null,
        name: compactText(data?.profile?.name || query?.q, 80),
        classification: compactText(data?.profile?.classification, 40) || null
      },
      totals: {
        totalIn: toNumber(data?.totals?.totalReceived),
        totalOut: toNumber(data?.totals?.totalSent),
        netAmount: toNumber(data?.totals?.netAmount),
        transactionCount: Number(data?.totals?.transactionCount || 0)
      },
      topCategories: summarizeRanking(data?.categories || [], ["label", "category"], ["amount", "total", "value", "count"], 6),
      paymentMethods: summarizeRanking(data?.paymentMethods || [], ["label", "paymentMethod", "method"], ["amount", "total", "value", "count"], 6),
      recurrenceSignals: summarizeRanking(data?.recurrenceSignals || [], ["merchant", "label", "name"], ["count", "amount", "total"], 6),
      riskSignals: (data?.riskSignals || []).slice(0, 6).map((item) => ({
        title: compactText(item?.title || item?.label, 80),
        description: compactText(item?.message || item?.description, 180)
      })),
      relationshipSummary: compactText(data?.profile?.relationshipSummary || data?.narrative, 240),
      relatedEntities: summarizeRanking(data?.relatedProfiles || [], ["name", "label"], ["totalMoved", "amount", "value", "count"], 6),
      relatedTransactions: summarizeTransactions(data?.relatedTransactions || [], 6),
      timeline: summarizeRanking(data?.monthlyTimeline || [], ["label", "month"], ["amount", "total", "value"], 6),
      sourceInfo: {
        source: "FINANCIAL_PROFILE",
        confidenceScore: data?.profile?.confidence ?? null
      }
    };
  }

  static buildSearchContext(query = {}, data = {}) {
    const transactions = data?.transactions || [];
    const summary = data?.summary || {};
    const paymentMethods = data?.breakdown?.byPaymentMethod || [];
    const categories = data?.breakdown?.byCategory || [];
    const byMonth = data?.breakdown?.byMonth || [];

    return {
      user: { preferredName: null },
      period: buildPeriodFromCollection(transactions),
      entity: {
        query: compactText(query?.q || data?.query, 80),
        type: compactText(data?.entityType, 40) || null
      },
      totals: {
        totalIn: toNumber(summary.totalIncome),
        totalOut: toNumber(summary.totalSpent),
        netAmount: toNumber(summary.netAmount),
        transactionCount: Number(summary.totalTransactions || transactions.length || 0)
      },
      topCategories: summarizeRanking(categories, ["category", "label"], ["amount", "total", "value", "count"], 6),
      paymentMethods: summarizeRanking(paymentMethods, ["paymentMethod", "label", "method"], ["amount", "total", "count", "value"], 6),
      relationshipSummary: data?.relationship || null,
      recurrenceSignals: summarizeRanking(data?.recurring || [], ["merchant", "label", "name"], ["count", "amount", "total"], 6),
      timeline: summarizeRanking(byMonth, ["month", "label"], ["amount", "total", "value", "count"], 6),
      largestTransactions: summarizeTransactions(summary.largestTransaction ? [summary.largestTransaction] : [], 1),
      relatedTransactions: summarizeTransactions(transactions, 6),
      sourceInfo: {
        source: "FINANCIAL_SEARCH",
        averageTicket: toNumber(summary.averageTicket)
      }
    };
  }

  static buildTransactionContext(data = {}) {
    return {
      user: { preferredName: null },
      period: {
        start: toDateString(data?.timelineContext?.periodStart || data?.transaction?.date),
        end: toDateString(data?.timelineContext?.periodEnd || data?.transaction?.date)
      },
      transaction: {
        id: data?.transaction?.id || null,
        description: compactText(data?.transaction?.description, 120),
        amount: toNumber(data?.transaction?.amount),
        direction: data?.transaction?.direction || null,
        date: toDateString(data?.transaction?.date),
        category: compactText(data?.transaction?.category, 80) || null,
        paymentMethod: compactText(data?.transaction?.paymentMethod, 80) || null
      },
      relatedPeople: summarizeRanking(data?.relatedPeople || [], ["name", "label"], ["amount", "total", "count"], 6),
      relatedMerchants: summarizeRanking(data?.relatedMerchants || [], ["name", "label", "merchant"], ["amount", "total", "count"], 6),
      recurrenceContext: data?.recurrenceContext || null,
      financialImpact: data?.financialImpact || null,
      timelineContext: data?.timelineContext || null,
      relatedTransactions: summarizeTransactions(data?.relatedTransactions || [], 6),
      sourceInfo: {
        source: "TRANSACTION_DETAILS",
        confidenceScore: data?.confidence?.score ?? null
      }
    };
  }

  static buildInsightsContext(data = {}) {
    return {
      user: {
        preferredName: data?.profile?.preferredName || null
      },
      period: data?.overview?.period || null,
      totals: {
        totalIn: toNumber(data?.overview?.totalIncome),
        totalOut: toNumber(data?.overview?.totalExpenses),
        netAmount: toNumber(data?.overview?.netAmount),
        transactionCount: Number(data?.overview?.transactionCount || 0)
      },
      topCategories: summarizeRanking(data?.topCategories || [], ["category", "label"], ["amount", "total", "value", "count"], 6),
      topMerchants: summarizeRanking(data?.topMerchants || [], ["merchant", "label", "name"], ["amount", "total", "value", "count"], 6),
      paymentMethods: summarizeRanking(data?.paymentMethods || [], ["paymentMethod", "label", "method"], ["amount", "total", "count", "value"], 6),
      recurrenceSignals: summarizeRanking(data?.recurringTransactions || [], ["merchant", "label", "name"], ["count", "amount", "total"], 6),
      riskSignals: summarizeRanking(data?.anomalies || [], ["merchant", "label", "name"], ["amount", "total", "value"], 6),
      timeline: summarizeRanking(data?.annualTimeline || [], ["year", "label"], ["expenses", "amount", "value"], 6),
      sourceInfo: {
        source: "FINANCIAL_AI",
        healthScore: data?.healthScore ?? null
      }
    };
  }

  static buildReportContext(data = {}) {
    return {
      user: { preferredName: null },
      period: data?.period || null,
      totals: {
        totalIn: toNumber(data?.totals?.totalIncome),
        totalOut: toNumber(data?.totals?.totalExpenses),
        netAmount: toNumber(data?.totals?.netAmount),
        transactionCount: Number(data?.transactionsCount || 0)
      },
      topCategories: summarizeRanking(data?.byCategory || data?.expensesByCategory || [], ["category", "label"], ["amount", "total", "value", "count"], 6),
      topMerchants: summarizeRanking(data?.byMerchant || [], ["merchant", "label", "name"], ["amount", "total", "value", "count"], 6),
      paymentMethods: summarizeRanking(data?.byPaymentMethod || [], ["paymentMethod", "label", "method"], ["amount", "total", "count", "value"], 6),
      recurrenceSignals: summarizeRanking(data?.recurring || [], ["merchant", "label", "name"], ["count", "amount", "total"], 6),
      riskSignals: summarizeRanking(data?.anomalies || [], ["merchant", "label", "name"], ["amount", "total", "value"], 6),
      largestTransactions: summarizeTransactions(data?.topPurchases || [], 5),
      sourceInfo: {
        source: "EXECUTIVE_REPORT",
        savingsRate: toNumber(data?.savingsRate)
      }
    };
  }
}
