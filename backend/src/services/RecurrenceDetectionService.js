import { RecurringTransactionDetector } from "./RecurringTransactionDetector.js";

export class RecurrenceDetectionService {
  static detect(transactions = []) {
    return RecurringTransactionDetector.detect(transactions);
  }

  static buildTransactionIndex(recurringGroups = []) {
    const index = new Map();

    for (const group of recurringGroups) {
      for (const transaction of group.transactions || []) {
        index.set(transaction.id, group);
      }
    }

    return index;
  }
}

