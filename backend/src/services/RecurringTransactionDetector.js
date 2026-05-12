import { MerchantAnalyticsService } from "./MerchantAnalyticsService.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";

function daysBetween(left, right) {
  const day = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(new Date(left).getTime() - new Date(right).getTime()) / day);
}

function average(values = []) {
  return values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : 0;
}

export class RecurringTransactionDetector {
  static detect(transactions = []) {
    const groups = new Map();

    for (const transaction of transactions) {
      const merchant = MerchantAnalyticsService.detectMerchant(transaction);
      const amountBucket = Math.round(Math.abs(transaction.signedAmount));
      const direction = transaction.signedAmount < 0 ? "OUT" : "IN";
      const key = `${direction}|${merchant}|${amountBucket}`;
      const current = groups.get(key) || [];
      current.push(transaction);
      groups.set(key, current);
    }

    const recurring = [];

    for (const [key, items] of groups.entries()) {
      if (items.length < 3) {
        continue;
      }

      const sorted = [...items].sort((left, right) => new Date(left.date) - new Date(right.date));
      const intervals = [];

      for (let index = 1; index < sorted.length; index += 1) {
        intervals.push(daysBetween(sorted[index - 1].date, sorted[index].date));
      }

      const avgInterval = average(intervals);
      const monthlyLike = avgInterval >= 25 && avgInterval <= 35;
      const weeklyLike = avgInterval >= 6 && avgInterval <= 8;

      if (!monthlyLike && !weeklyLike) {
        continue;
      }

      const [, merchant] = key.split("|");
      const sample = sorted[0];
      const category = CategoryClassifierService.classify(sample);
      const kind = category === "Assinatura"
        ? "SUBSCRIPTION"
        : category === "Salário / receita recorrente"
          ? "SALARY"
          : sorted[0].signedAmount > 0
            ? "RECURRENT_INCOME"
            : "RECURRENT_EXPENSE";
      recurring.push({
        merchant,
        category,
        kind,
        count: sorted.length,
        averageAmount: average(sorted.map((item) => Math.abs(item.signedAmount))),
        firstTransactionAt: sorted[0].date,
        lastTransactionAt: sorted[sorted.length - 1].date,
        averageIntervalDays: Math.round(avgInterval),
        frequency: monthlyLike ? "MONTHLY" : "WEEKLY",
        confidenceScore: sorted.length >= 6 ? 0.9 : sorted.length >= 4 ? 0.78 : 0.68,
        transactions: sorted.slice(-6)
      });
    }

    return recurring.sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.averageAmount - left.averageAmount;
    });
  }
}
