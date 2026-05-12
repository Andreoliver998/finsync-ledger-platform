import { prisma } from "../lib/prisma.js";
import { createTransactionFingerprint } from "../utils/transactionFingerprint.js";
import { HttpError } from "../utils/httpError.js";
import { SummaryService } from "./SummaryService.js";

function toDayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const left = new Date(toDayKey(a));
  const right = new Date(toDayKey(b));
  return Math.round(Math.abs(left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000));
}

function compareDescriptions(left, right) {
  return String(left || "").trim() === String(right || "").trim();
}

function compareAmounts(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.01;
}

function monthParts(value) {
  const date = new Date(value);
  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear()
  };
}

function categoryValue(transaction) {
  return transaction.userCategory || transaction.category || null;
}

function normalizeLedgerTransaction(transaction) {
  return {
    ...transaction,
    category: categoryValue(transaction)
  };
}

function isPendingManualReview(transaction) {
  return (
    transaction.reconciliationStatus === "POSSIBLE_DUPLICATE" ||
    (transaction.reconciliationStatus == null && transaction.status === "REVIEWED")
  );
}

function strongIdentifierMatches(incoming, existing) {
  if (incoming.externalId && existing.externalId) {
    return incoming.externalId === existing.externalId;
  }

  if (incoming.documentNumber && existing.documentNumber) {
    return incoming.documentNumber === existing.documentNumber;
  }

  return false;
}

function buildCandidateWhere(userId, transactions) {
  const dates = transactions.map((item) => item.date).sort((a, b) => a - b);
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);
  start.setDate(start.getDate() - 3);
  end.setDate(end.getDate() + 3);

  return {
    userId,
    date: {
      gte: start,
      lte: end
    }
  };
}

function classifyAgainstExisting(incoming, existingTransactions) {
  const exactHash = existingTransactions.find((existing) => existing.transactionHash === incoming.transactionHash);

  if (exactHash) {
    return { status: "DUPLICATE", matchedTransactionId: exactHash.id, reason: "transaction_hash" };
  }

  const strongMatch = existingTransactions.find((existing) => strongIdentifierMatches(incoming, existing));

  if (strongMatch) {
    const sameDate = toDayKey(strongMatch.date) === toDayKey(incoming.date);
    const sameAmount = compareAmounts(strongMatch.amount, incoming.amount);
    return {
      status: sameDate && sameAmount ? "DUPLICATE" : "CONFLICT",
      matchedTransactionId: strongMatch.id,
      reason: sameDate && sameAmount ? "strong_identifier" : "strong_identifier_conflict"
    };
  }

  const exactSemanticMatch = existingTransactions.find((existing) => {
    return (
      toDayKey(existing.date) === toDayKey(incoming.date) &&
      compareAmounts(existing.amount, incoming.amount) &&
      compareDescriptions(existing.normalizedDescription, incoming.normalizedDescription) &&
      String(existing.bank || "") === String(incoming.bank || "") &&
      String(existing.accountName || "") === String(incoming.accountName || "") &&
      String(existing.paymentMethod || "") === String(incoming.paymentMethod || "")
    );
  });

  if (exactSemanticMatch) {
    return { status: "DUPLICATE", matchedTransactionId: exactSemanticMatch.id, reason: "semantic_exact" };
  }

  const possibleDuplicate = existingTransactions.find((existing) => {
    return (
      daysBetween(existing.date, incoming.date) <= 2 &&
      compareAmounts(existing.amount, incoming.amount) &&
      compareDescriptions(existing.normalizedDescription, incoming.normalizedDescription)
    );
  });

  if (possibleDuplicate) {
    return { status: "POSSIBLE_DUPLICATE", matchedTransactionId: possibleDuplicate.id, reason: "near_date_same_amount" };
  }

  const conflict = existingTransactions.find((existing) => {
    return (
      daysBetween(existing.date, incoming.date) === 0 &&
      Math.abs(Number(existing.amount) - Number(incoming.amount)) <= 1 &&
      compareDescriptions(existing.normalizedDescription, incoming.normalizedDescription) &&
      String(existing.counterpartyDocument || "") === String(incoming.counterpartyDocument || "")
    );
  });

  if (conflict) {
    return { status: "CONFLICT", matchedTransactionId: conflict.id, reason: "same_day_amount_variation" };
  }

  return { status: "NEW", matchedTransactionId: null, reason: null };
}

function inferPossibleDuplicateMatch(transaction, candidates) {
  return candidates.find((candidate) => {
    if (candidate.id === transaction.id) {
      return false;
    }

    return (
      daysBetween(candidate.date, transaction.date) <= 2 &&
      compareAmounts(candidate.amount, transaction.amount) &&
      compareDescriptions(candidate.normalizedDescription, transaction.normalizedDescription)
    );
  }) || null;
}

export class ReconciliationService {
  static async classifyTransactions(userId, transactions) {
    if (!transactions.length) {
      return [];
    }

    const existingTransactions = await prisma.ledgerTransaction.findMany({
      where: buildCandidateWhere(userId, transactions),
      select: {
        id: true,
        transactionHash: true,
        externalId: true,
        documentNumber: true,
        date: true,
        amount: true,
        normalizedDescription: true,
        bank: true,
        accountName: true,
        paymentMethod: true,
        counterpartyDocument: true
      }
    });

    const seenInPreview = new Map();

    return transactions.map((transaction) => {
      const selfFingerprint = createTransactionFingerprint({
        userId,
        date: transaction.date,
        amount: transaction.amount,
        normalizedDescription: transaction.normalizedDescription,
        bank: transaction.bank,
        accountName: transaction.accountName,
        paymentMethod: transaction.paymentMethod,
        documentNumber: transaction.documentNumber,
        externalId: transaction.externalId
      });

      const duplicateInSameFile = seenInPreview.get(selfFingerprint);

      if (duplicateInSameFile) {
        return {
          ...transaction,
          reconciliationStatus: "DUPLICATE",
          matchedTransactionId: duplicateInSameFile.rowId,
          reconciliationReason: "duplicate_in_file"
        };
      }

      const result = classifyAgainstExisting(transaction, existingTransactions);
      seenInPreview.set(selfFingerprint, { rowId: transaction.rowId });

      return {
        ...transaction,
        reconciliationStatus: result.status,
        matchedTransactionId: result.matchedTransactionId,
        reconciliationReason: result.reason
      };
    });
  }

  static async updateTransaction(userId, id, payload) {
    const existing = await prisma.ledgerTransaction.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new HttpError(404, "Transação do ledger não encontrada.");
    }

    const data = {};

    if (payload.category !== undefined) {
      data.category = payload.category;
    }

    if (payload.userCategory !== undefined) {
      data.userCategory = payload.userCategory;
    } else if (payload.category !== undefined) {
      data.userCategory = payload.category;
    }

    if (payload.notes !== undefined) {
      data.notes = payload.notes;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.reviewedAt !== undefined) {
      data.reviewedAt = payload.reviewedAt;
    }

    if (payload.category !== undefined && payload.userCategory === undefined) {
      data.userCategory = payload.category;
    }

    if (payload.userCategory !== undefined && payload.category === undefined) {
      data.category = payload.userCategory;
    }

    const updated = await prisma.ledgerTransaction.update({
      where: { id },
      data
    });

    if (payload.category !== undefined || payload.userCategory !== undefined) {
      const { month, year } = monthParts(existing.date);
      SummaryService.invalidate(userId, month, year);
    }

    return normalizeLedgerTransaction(updated);
  }

  static async listReviewQueue(userId, query = {}) {
    const limit = Math.min(Number(query.limit || 100), 200);
    const items = await prisma.ledgerTransaction.findMany({
      where: {
        userId,
        OR: [
          {
            reconciliationStatus: "POSSIBLE_DUPLICATE",
            status: { in: ["REVIEWED", "PENDING"] }
          },
          {
            reconciliationStatus: null,
            status: "REVIEWED"
          }
        ]
      },
      include: {
        importBatch: {
          select: {
            id: true,
            fileName: true,
            source: true,
            provider: true,
            bank: true,
            accountName: true,
            createdAt: true
          }
        }
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit
    });

    const fallbackCandidates = items.length
      ? await prisma.ledgerTransaction.findMany({
          where: {
            userId,
            status: { not: "DISCARDED" }
          },
          include: {
            importBatch: {
              select: {
                id: true,
                fileName: true,
                source: true,
                provider: true,
                bank: true,
                accountName: true,
                createdAt: true
              }
            }
          }
        })
      : [];

    const inferredMatches = new Map();

    for (const item of items) {
      if (item.matchedTransactionId) {
        continue;
      }

      const inferred = inferPossibleDuplicateMatch(item, fallbackCandidates);

      if (inferred) {
        inferredMatches.set(item.id, inferred.id);
      }
    }

    const matchedIds = [
      ...new Set(
        items
          .map((item) => item.matchedTransactionId || inferredMatches.get(item.id))
          .filter(Boolean)
      )
    ];
    const matchedTransactions = matchedIds.length
      ? await prisma.ledgerTransaction.findMany({
          where: {
            userId,
            id: { in: matchedIds }
          },
          include: {
            importBatch: {
              select: {
                id: true,
                fileName: true,
                source: true,
                provider: true,
                bank: true,
                accountName: true,
                createdAt: true
              }
            }
          }
        })
      : [];

    const matchedMap = new Map(
      matchedTransactions.map((transaction) => [transaction.id, normalizeLedgerTransaction(transaction)])
    );
    const grouped = new Map();

    for (const item of items) {
      const resolvedMatchedTransactionId = item.matchedTransactionId || inferredMatches.get(item.id) || null;
      const groupKey = resolvedMatchedTransactionId || item.transactionHash;
      const group = grouped.get(groupKey) || {
        groupId: groupKey,
        reason: item.reconciliationReason || "near_date_same_amount",
        anchorTransaction: resolvedMatchedTransactionId ? matchedMap.get(resolvedMatchedTransactionId) || null : null,
        transactions: []
      };

      group.transactions.push(
        normalizeLedgerTransaction({
          ...item,
          matchedTransactionId: resolvedMatchedTransactionId,
          reconciliationReason: item.reconciliationReason || "near_date_same_amount",
          reconciliationStatus: item.reconciliationStatus || "POSSIBLE_DUPLICATE"
        })
      );
      grouped.set(groupKey, group);
    }

    const data = Array.from(grouped.values()).map((group) => ({
      ...group,
      transactions: group.transactions.sort((left, right) => new Date(right.date) - new Date(left.date)),
      totalAmount: group.transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    }));

    return {
      data: data.sort((left, right) => {
        const leftDate = new Date(left.transactions[0]?.date || 0).getTime();
        const rightDate = new Date(right.transactions[0]?.date || 0).getTime();
        return rightDate - leftDate;
      }),
      totalGroups: data.length,
      totalTransactions: items.length
    };
  }

  static async resolveReview(userId, id, payload) {
    const existing = await prisma.ledgerTransaction.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new HttpError(404, "Transação do ledger não encontrada.");
    }

    if (!isPendingManualReview(existing)) {
      throw new HttpError(409, "A transação informada não está pendente de revisão manual.");
    }

    const reviewedAt = new Date();
    const isDiscard = payload.action === "DISCARD";

    const updated = await prisma.ledgerTransaction.update({
      where: { id },
      data: {
        status: isDiscard ? "DISCARDED" : "CONFIRMED",
        reconciliationStatus: isDiscard ? "DISCARDED" : "CONFIRMED",
        reviewedAt,
        notes: payload.notes !== undefined ? payload.notes : existing.notes
      }
    });

    const { month, year } = monthParts(existing.date);
    SummaryService.invalidate(userId, month, year);

    return normalizeLedgerTransaction(updated);
  }
}
