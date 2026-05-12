import test from "node:test";
import assert from "node:assert/strict";
import { FinancialInsightService } from "../src/services/FinancialInsightService.js";

test("FinancialInsightService.buildStatementInsights gera alerta para saldo negativo", () => {
  const result = FinancialInsightService.buildStatementInsights({
    personaName: "André",
    executiveSummary: { headline: "Resumo" },
    moneyFlow: { netAmount: -1200, totalExpenses: 3000 },
    pixAnalysis: { totalPixSent: 1600 },
    merchantAnalysis: { marketplaces: [] },
    peopleAnalysis: { topPeople: [] },
    paymentMethodAnalysis: { creditVsDebit: { creditAmount: 2000, debitAmount: 500, billPayments: 1 } },
    recurrenceAnalysis: { subscriptions: [] },
    confidence: { needsReview: 0 }
  });

  assert.ok(result.alerts.some((item) => item.title === "Saldo líquido negativo"));
  assert.ok(result.recommendations.some((item) => item.title === "Monitorar dependência de crédito"));
});

test("FinancialInsightService.buildStatementInsights gera recomendação para recorrências", () => {
  const result = FinancialInsightService.buildStatementInsights({
    personaName: "André",
    executiveSummary: { headline: "Resumo" },
    moneyFlow: { netAmount: 1200, totalExpenses: 2000 },
    pixAnalysis: { totalPixSent: 200 },
    merchantAnalysis: { marketplaces: [{ merchant: "AMAZON" }] },
    peopleAnalysis: { topPeople: [{ name: "Gilvanise" }] },
    paymentMethodAnalysis: { creditVsDebit: { creditAmount: 200, debitAmount: 500, billPayments: 0 } },
    recurrenceAnalysis: { subscriptions: [{ merchant: "Netflix" }] },
    confidence: { needsReview: 2 }
  });

  assert.ok(result.recommendations.some((item) => item.title === "Atacar gastos recorrentes"));
  assert.ok(result.recommendations.some((item) => item.title === "Revisar concentração em marketplaces"));
  assert.ok(result.alerts.some((item) => item.title === "Leitura com pontos pendentes"));
});
