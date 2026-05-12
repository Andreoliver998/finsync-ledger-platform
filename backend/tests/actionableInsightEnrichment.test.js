import assert from "node:assert/strict";
import test from "node:test";

import { ActionableInsightEnrichmentService } from "../src/services/ActionableInsightEnrichmentService.js";

test("ActionableInsightEnrichmentService enriquece insight com transações reais", () => {
  const transactions = [
    {
      id: "64f000000000000000000001",
      date: new Date("2026-05-01T12:00:00.000Z"),
      signedAmount: -45.9,
      description: "IFOOD RESTAURANTE",
      category: "Alimentação",
      paymentMethod: "PIX",
      merchantName: "IFOOD",
      source: "CSV_IMPORT",
      provider: "MANUAL_UPLOAD"
    },
    {
      id: "64f000000000000000000002",
      date: new Date("2026-05-02T12:00:00.000Z"),
      signedAmount: -35.5,
      description: "IFOOD LANCHES",
      category: "Alimentação",
      paymentMethod: "PIX",
      merchantName: "IFOOD",
      source: "CSV_IMPORT",
      provider: "MANUAL_UPLOAD"
    }
  ];

  const result = ActionableInsightEnrichmentService.enrichReading({
    base: {
      executiveSummary: { totalTransactions: 2, totalMoved: 81.4 },
      merchantAnalysis: { topMerchants: [{ merchant: "IFOOD", amount: 81.4, count: 2 }] },
      expenseAnalysis: { topCategories: [{ category: "Alimentação", amount: 81.4, count: 2 }] },
      paymentMethodAnalysis: { byPaymentMethod: [{ paymentMethod: "PIX", totalAmount: 81.4, count: 2 }] }
    },
    insights: [
      {
        id: "ai-finding-1",
        title: "Gasto relevante com IFOOD",
        description: "IFOOD concentrou gastos no período.",
        level: "warning"
      }
    ],
    findings: [
      {
        title: "Gasto relevante com IFOOD",
        description: "IFOOD concentrou gastos no período.",
        entity: "IFOOD",
        category: "Alimentação",
        paymentMethod: "PIX",
        transactionId: "id-inventado"
      }
    ],
    transactions
  });

  assert.equal(result.insights.length, 1);
  assert.equal(result.insights[0].entity, "IFOOD");
  assert.equal(result.insights[0].category, "Alimentação");
  assert.equal(result.insights[0].paymentMethod, "PIX");
  assert.equal(result.insights[0].transactionId, null);
  assert.equal(result.insights[0].navigationTarget.route, "FinancialProfile");
  assert.equal(result.insights[0].relatedTransactions.length, 2);
  assert.equal(result.relatedTransactions.length, 2);
  assert.ok(result.evidenceItems.some((item) => item.label === "Total movimentado"));
});

test("ActionableInsightEnrichmentService usa TransactionDetails quando há uma transação real forte", () => {
  const transaction = {
    id: "64f000000000000000000003",
    date: new Date("2026-05-03T12:00:00.000Z"),
    signedAmount: -120,
    description: "PIX MERCADO CENTRAL",
    category: "Mercado",
    paymentMethod: "PIX",
    merchantName: "Mercado Central"
  };

  const result = ActionableInsightEnrichmentService.enrichReading({
    base: {},
    insights: [{ title: "Maior compra no Mercado Central", description: "Compra isolada relevante." }],
    findings: [{ title: "Maior compra no Mercado Central", transactionId: transaction.id }],
    transactions: [transaction]
  });

  assert.equal(result.insights[0].transactionId, transaction.id);
  assert.equal(result.insights[0].navigationTarget.route, "TransactionDetails");
  assert.equal(result.insights[0].suggestedAction.route, "TransactionDetails");
});
