import { MerchantAnalyticsService } from "./MerchantAnalyticsService.js";

function monthKey(value) {
  return new Date(value).toISOString().slice(0, 7);
}

function yearKey(value) {
  return new Date(value).getUTCFullYear();
}

function categoryLabel(transaction) {
  return transaction.category || "Sem categoria";
}

export class PatternAnalysisService {
  static annualTimeline(transactions = []) {
    const years = new Map();

    for (const transaction of transactions) {
      const year = yearKey(transaction.date);
      const current = years.get(year) || {
        year,
        count: 0,
        income: 0,
        expenses: 0,
        net: 0
      };

      current.count += 1;

      if (transaction.signedAmount < 0) {
        current.expenses += Math.abs(transaction.signedAmount);
      } else {
        current.income += Math.abs(transaction.signedAmount);
      }

      current.net = current.income - current.expenses;
      years.set(year, current);
    }

    return Array.from(years.values()).sort((left, right) => left.year - right.year);
  }

  static monthlyTimeline(transactions = []) {
    const months = new Map();

    for (const transaction of transactions) {
      const month = monthKey(transaction.date);
      const current = months.get(month) || {
        month,
        count: 0,
        income: 0,
        expenses: 0,
        net: 0
      };

      current.count += 1;

      if (transaction.signedAmount < 0) {
        current.expenses += Math.abs(transaction.signedAmount);
      } else {
        current.income += Math.abs(transaction.signedAmount);
      }

      current.net = current.income - current.expenses;
      months.set(month, current);
    }

    return Array.from(months.values()).sort((left, right) => left.month.localeCompare(right.month));
  }

  static categoryGrowth(transactions = []) {
    const monthly = this.monthlyTimeline(transactions);

    if (monthly.length < 2) {
      return [];
    }

    const lastMonth = monthly[monthly.length - 1].month;
    const previousMonth = monthly[monthly.length - 2].month;
    const byCategory = new Map();

    for (const transaction of transactions.filter((item) => item.signedAmount < 0)) {
      const month = monthKey(transaction.date);
      if (month !== lastMonth && month !== previousMonth) {
        continue;
      }

      const category = categoryLabel(transaction);
      const current = byCategory.get(category) || {
        category,
        previousAmount: 0,
        currentAmount: 0,
        growthAmount: 0,
        growthPercent: 0
      };

      if (month === previousMonth) {
        current.previousAmount += Math.abs(transaction.signedAmount);
      } else {
        current.currentAmount += Math.abs(transaction.signedAmount);
      }

      byCategory.set(category, current);
    }

    return Array.from(byCategory.values())
      .map((item) => ({
        ...item,
        growthAmount: item.currentAmount - item.previousAmount,
        growthPercent: item.previousAmount > 0
          ? ((item.currentAmount - item.previousAmount) / item.previousAmount) * 100
          : item.currentAmount > 0
            ? 100
            : 0
      }))
      .sort((left, right) => right.growthAmount - left.growthAmount);
  }

  static detectAnomalies(transactions = []) {
    const merchantRanking = MerchantAnalyticsService.rank(transactions.filter((item) => item.signedAmount < 0));
    const merchantAverages = new Map(
      merchantRanking.map((item) => [item.merchant, item.expenses / Math.max(item.count, 1)])
    );

    return transactions
      .filter((item) => item.signedAmount < 0)
      .map((item) => {
        const merchant = MerchantAnalyticsService.detectMerchant(item);
        const baseline = merchantAverages.get(merchant) || 0;
        const amount = Math.abs(item.signedAmount);

        return {
          id: item.id,
          merchant,
          description: item.description,
          category: item.category,
          amount,
          date: item.date,
          deviationPercent: baseline > 0 ? ((amount - baseline) / baseline) * 100 : 0,
          confidenceLabel: baseline > 0 && amount > baseline * 2 ? "provável" : "precisa revisar",
          reason: baseline > 0
            ? `Valor ${Math.round((amount / baseline) * 100)}% acima da média do estabelecimento.`
            : "Sem histórico suficiente; valor alto isolado."
        };
      })
      .filter((item) => item.amount > 150 && item.deviationPercent >= 120)
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 20);
  }
}
