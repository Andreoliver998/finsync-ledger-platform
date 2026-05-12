import test from "node:test";
import assert from "node:assert/strict";
import { financialSearchQuerySchema } from "../src/validators/financialSearchValidator.js";
import { FinancialSearchService } from "../src/services/FinancialSearchService.js";

test("financialSearchQuerySchema aceita busca válida", () => {
  const result = financialSearchQuerySchema.parse({
    q: "PREZUNIC",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    paymentMethod: "PIX"
  });

  assert.equal(result.q, "PREZUNIC");
  assert.ok(result.startDate instanceof Date);
  assert.ok(result.endDate instanceof Date);
});

test("financialSearchQuerySchema rejeita query curta", () => {
  assert.throws(() => financialSearchQuerySchema.parse({ q: "a" }));
});

test("FinancialSearchService.classifyEntity identifica marketplace", () => {
  const entityType = FinancialSearchService.classifyEntity([], "AMAZON");
  assert.equal(entityType, "MARKETPLACE");
});

test("FinancialSearchService.classifyEntity identifica banco", () => {
  const entityType = FinancialSearchService.classifyEntity([], "NUBANK");
  assert.equal(entityType, "BANK");
});

test("FinancialSearchService.buildEntitySummary consolida totais", () => {
  const summary = FinancialSearchService.buildEntitySummary([
    { amount: -120, absoluteAmount: 120, paymentMethod: "DEBIT", direction: "OUT", date: new Date("2026-01-10") },
    { amount: 300, absoluteAmount: 300, paymentMethod: "PIX", direction: "IN", date: new Date("2026-01-11") },
    { amount: -80, absoluteAmount: 80, paymentMethod: "PIX", direction: "OUT", date: new Date("2026-01-12") }
  ]);

  assert.equal(summary.totalTransactions, 3);
  assert.equal(summary.totalSpent, 200);
  assert.equal(summary.totalReceived, 300);
  assert.equal(summary.pixSent, 80);
  assert.equal(summary.pixReceived, 300);
});
