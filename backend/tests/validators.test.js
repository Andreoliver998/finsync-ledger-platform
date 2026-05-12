import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema, loginSchema } from "../src/validators/authValidator.js";
import { cardSchema } from "../src/validators/cardValidator.js";
import { categorySchema } from "../src/validators/categoryValidator.js";
import { transactionSchema } from "../src/validators/transactionValidator.js";
import { manualTransactionSchema } from "../src/validators/manualTransactionValidator.js";

// ─── Auth ────────────────────────────────────────────────────────────────────

test("registerSchema — aceita dados válidos", () => {
  const result = registerSchema.parse({
    name: "João",
    email: "joao@email.com",
    password: "senha123"
  });
  assert.equal(result.email, "joao@email.com");
});

test("registerSchema — rejeita nome curto demais", () => {
  assert.throws(
    () => registerSchema.parse({ name: "J", email: "j@j.com", password: "123456" }),
    { name: "ZodError" }
  );
});

test("registerSchema — rejeita e-mail inválido", () => {
  assert.throws(
    () => registerSchema.parse({ name: "João", email: "nao-e-email", password: "123456" }),
    { name: "ZodError" }
  );
});

test("registerSchema — rejeita senha com menos de 6 caracteres", () => {
  assert.throws(
    () => registerSchema.parse({ name: "João", email: "j@j.com", password: "123" }),
    { name: "ZodError" }
  );
});

test("loginSchema — aceita credenciais válidas", () => {
  const result = loginSchema.parse({ email: "j@j.com", password: "qualquer" });
  assert.equal(result.email, "j@j.com");
});

test("loginSchema — rejeita senha vazia", () => {
  assert.throws(
    () => loginSchema.parse({ email: "j@j.com", password: "" }),
    { name: "ZodError" }
  );
});

// ─── Card ─────────────────────────────────────────────────────────────────────

test("cardSchema — aceita cartão mínimo válido", () => {
  const result = cardSchema.parse({ name: "Nubank" });
  assert.equal(result.name, "Nubank");
});

test("cardSchema — aceita cartão completo", () => {
  const result = cardSchema.parse({
    name: "Nubank",
    bank: "Nu Pagamentos",
    brand: "Mastercard",
    lastFour: "1234",
    limit: 5000,
    closingDay: 5,
    dueDay: 15
  });
  assert.equal(result.lastFour, "1234");
  assert.equal(result.limit, 5000);
});

test("cardSchema — rejeita closingDay acima de 31", () => {
  assert.throws(
    () => cardSchema.parse({ name: "Cartão", closingDay: 32 }),
    { name: "ZodError" }
  );
});

test("cardSchema — rejeita dueDay abaixo de 1", () => {
  assert.throws(
    () => cardSchema.parse({ name: "Cartão", dueDay: 0 }),
    { name: "ZodError" }
  );
});

test("cardSchema — rejeita limite negativo", () => {
  assert.throws(
    () => cardSchema.parse({ name: "Cartão", limit: -100 }),
    { name: "ZodError" }
  );
});

// ─── Category ─────────────────────────────────────────────────────────────────

test("categorySchema — aceita categoria mínima", () => {
  const result = categorySchema.parse({ name: "Alimentação" });
  assert.equal(result.name, "Alimentação");
});

test("categorySchema — aceita categoria completa", () => {
  const result = categorySchema.parse({ name: "Lazer", color: "#ff0000", icon: "🎮" });
  assert.equal(result.color, "#ff0000");
});

test("categorySchema — rejeita nome curto demais", () => {
  assert.throws(
    () => categorySchema.parse({ name: "A" }),
    { name: "ZodError" }
  );
});

// ─── Transaction ──────────────────────────────────────────────────────────────

const validTransaction = {
  description: "Supermercado",
  amount: 150.5,
  type: "EXPENSE",
  transactionDate: "2025-05-01T10:00:00Z"
};

test("transactionSchema — aceita transação mínima válida", () => {
  const result = transactionSchema.parse(validTransaction);
  assert.equal(result.type, "EXPENSE");
});

test("transactionSchema — aceita transação completa", () => {
  const result = transactionSchema.parse({
    ...validTransaction,
    paymentMethod: "PIX",
    installments: 3,
    currentInstallment: 1,
    notes: "Compra semanal"
  });
  assert.equal(result.paymentMethod, "PIX");
  assert.equal(result.installments, 3);
});

test("transactionSchema — rejeita amount negativo ou zero", () => {
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, amount: 0 }),
    { name: "ZodError" }
  );
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, amount: -10 }),
    { name: "ZodError" }
  );
});

test("transactionSchema — rejeita type inválido", () => {
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, type: "TRANSFER" }),
    { name: "ZodError" }
  );
});

test("transactionSchema — rejeita paymentMethod inválido", () => {
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, paymentMethod: "BOLETO" }),
    { name: "ZodError" }
  );
});

test("transactionSchema — rejeita transactionDate que não é ISO datetime", () => {
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, transactionDate: "01/05/2025" }),
    { name: "ZodError" }
  );
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, transactionDate: "qualquer coisa" }),
    { name: "ZodError" }
  );
});

test("transactionSchema — aceita transactionDate com timezone offset", () => {
  const result = transactionSchema.parse({
    ...validTransaction,
    transactionDate: "2025-05-01T10:00:00-03:00"
  });
  assert.ok(result.transactionDate);
});

test("transactionSchema — rejeita description curta demais", () => {
  assert.throws(
    () => transactionSchema.parse({ ...validTransaction, description: "A" }),
    { name: "ZodError" }
  );
});

test("transactionSchema — partial() torna todos os campos opcionais para update", () => {
  const result = transactionSchema.partial().parse({ amount: 200 });
  assert.equal(result.amount, 200);
});

// ─── Manual Transaction ──────────────────────────────────────────────────────

const validManualTransaction = {
  type: "EXPENSE",
  amount: 89.9,
  date: "2026-05-08T12:00:00Z",
  description: "Almoço",
  category: "Alimentação",
  paymentMethod: "PIX",
  place: "Restaurante",
  status: "PAID"
};

test("manualTransactionSchema — aceita lançamento manual válido", () => {
  const result = manualTransactionSchema.parse(validManualTransaction);
  assert.equal(result.source, undefined);
  assert.equal(result.paymentMethod, "PIX");
});

test("manualTransactionSchema — rejeita amount negativo ou zero", () => {
  assert.throws(
    () => manualTransactionSchema.parse({ ...validManualTransaction, amount: 0 }),
    { name: "ZodError" }
  );
  assert.throws(
    () => manualTransactionSchema.parse({ ...validManualTransaction, amount: -1 }),
    { name: "ZodError" }
  );
});

test("manualTransactionSchema — rejeita enums inválidos", () => {
  assert.throws(
    () => manualTransactionSchema.parse({ ...validManualTransaction, type: "OPEN_FINANCE" }),
    { name: "ZodError" }
  );
  assert.throws(
    () => manualTransactionSchema.parse({ ...validManualTransaction, paymentMethod: "CARD" }),
    { name: "ZodError" }
  );
  assert.throws(
    () => manualTransactionSchema.parse({ ...validManualTransaction, status: "DONE" }),
    { name: "ZodError" }
  );
});
