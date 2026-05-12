import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { FinancialSyncService } from "./FinancialSyncService.js";
import { LedgerAnalyticsService } from "./LedgerAnalyticsService.js";
import { UserFinancialProfileService } from "./UserFinancialProfileService.js";
import { FinancialAIContextBuilder } from "./FinancialAIContextBuilder.js";
import { FinancialAINarrativeService } from "./FinancialAINarrativeService.js";
import { FinancialAIInsightService } from "./FinancialAIInsightService.js";

function parseNullableDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

function toGoalPayload(data) {
  return {
    ...data,
    deadline: data.deadline === undefined ? undefined : parseNullableDate(data.deadline)
  };
}

function isDebitTransaction(transaction) {
  return transaction.amount < 0 || transaction.type === "DEBIT" || transaction.type === "EXPENSE";
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export class BetaModuleService {
  static async getSettings(userId) {
    const settings = await prisma.appSettings.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });

    return UserFinancialProfileService.normalizePayload(settings);
  }

  static async updateSettings(userId, data) {
    const current = await prisma.appSettings.findUnique({ where: { userId } });
    const nextProfile = {
      ...(current?.userFinancialProfile || {}),
      ...(data.userFinancialProfile || {})
    };
    const normalized = UserFinancialProfileService.normalizePayload({
      ...(current || {}),
      ...data,
      userFinancialProfile: nextProfile
    });
    const persistencePayload = UserFinancialProfileService.toPersistencePayload(normalized);

    const settings = await prisma.appSettings.upsert({
      where: { userId },
      create: { userId, ...persistencePayload },
      update: persistencePayload
    });

    return UserFinancialProfileService.normalizePayload(settings);
  }

  static listGoals(userId) {
    return prisma.financialGoal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  static createGoal(userId, data) {
    return prisma.financialGoal.create({
      data: { userId, ...toGoalPayload(data) }
    });
  }

  static async updateGoal(userId, id, data) {
    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new HttpError(404, "Meta financeira não encontrada.");

    return prisma.financialGoal.update({
      where: { id },
      data: toGoalPayload(data)
    });
  }

  static async removeGoal(userId, id) {
    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new HttpError(404, "Meta financeira não encontrada.");

    return prisma.financialGoal.delete({ where: { id } });
  }

  static listAlerts(userId) {
    return prisma.alertRule.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    });
  }

  static createAlert(userId, data) {
    return prisma.alertRule.create({ data: { userId, ...data } });
  }

  static async updateAlert(userId, id, data) {
    const alert = await prisma.alertRule.findFirst({ where: { id, userId } });
    if (!alert) throw new HttpError(404, "Alerta financeiro não encontrado.");

    return prisma.alertRule.update({ where: { id }, data });
  }

  static async removeAlert(userId, id) {
    const alert = await prisma.alertRule.findFirst({ where: { id, userId } });
    if (!alert) throw new HttpError(404, "Alerta financeiro não encontrado.");

    return prisma.alertRule.delete({ where: { id } });
  }

  static listInvestments(userId) {
    return prisma.investmentPosition.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
  }

  static createInvestment(userId, data) {
    return prisma.investmentPosition.create({ data: { userId, ...data } });
  }

  static async updateInvestment(userId, id, data) {
    const position = await prisma.investmentPosition.findFirst({ where: { id, userId } });
    if (!position) throw new HttpError(404, "Investimento não encontrado.");

    return prisma.investmentPosition.update({ where: { id }, data });
  }

  static async removeInvestment(userId, id) {
    const position = await prisma.investmentPosition.findFirst({ where: { id, userId } });
    if (!position) throw new HttpError(404, "Investimento não encontrado.");

    return prisma.investmentPosition.delete({ where: { id } });
  }

  static async reports(userId, query = {}) {
    const report = await LedgerAnalyticsService.reports(userId, query);
    const savingsRate = report.totals.totalIncome > 0
      ? ((report.totals.totalIncome - report.totals.totalExpenses) / report.totals.totalIncome) * 100
      : 0;

    const baseResponse = {
      ...report,
      monthIncome: report.totals.totalIncome,
      monthExpenses: report.totals.totalExpenses,
      expensesByCategory: report.byCategory,
      latestTransactions: report.topPurchases,
      savingsRate,
      netCashFlow: report.totals.netAmount,
      topCategories: report.byCategory.slice(0, 5)
    };

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "executive-report",
      userId,
      context: FinancialAIContextBuilder.buildReportContext(baseResponse),
      fallback: {
        executiveSummary: report.narrative || "Relatório executivo gerado a partir do período analisado.",
        narrative: report.narrative || "Sem narrativa adicional para este recorte.",
        mainFindings: [
          report.byCategory?.[0] ? { title: "Categoria dominante", description: `${report.byCategory[0].category || report.byCategory[0].label} concentrou a maior parte das saídas.`, severity: "attention", confidence: 0.72 } : null,
          report.topPurchases?.[0] ? { title: "Maior gasto", description: `${report.topPurchases[0].description} liderou os gastos individuais do período.`, severity: "info", confidence: 0.69 } : null
        ].filter(Boolean),
        recommendations: [
          report.byCategory?.[0] ? `Revise a categoria ${report.byCategory[0].category || report.byCategory[0].label} para verificar concentração.` : null,
          report.recurring?.length ? "Use os padrões recorrentes detectados para planejar o próximo período." : null
        ].filter(Boolean),
        suggestedQuestions: [
          "O que mais pressionou meu caixa neste período?",
          "Quais gastos mudaram de padrão?",
          "Existe concentração excessiva em alguma categoria?"
        ],
        confidence: 0.72
      }
    });

    return FinancialAIInsightService.applyToReport(baseResponse, aiResult);
  }

  static async financialAi(userId, query = {}) {
    const data = await LedgerAnalyticsService.insights(userId, query);
    const latestExpenses = data.overview.biggestExpense ? [data.overview.biggestExpense] : [];
    const averageTicket = latestExpenses.length
      ? sum(latestExpenses, (item) => Math.abs(item.signedAmount || item.amount || 0)) / latestExpenses.length
      : 0;

    const baseResponse = {
      ...data,
      averageTicket
    };

    const aiResult = await FinancialAINarrativeService.generate({
      useCase: "financial-ai",
      userId,
      context: FinancialAIContextBuilder.buildInsightsContext(baseResponse),
      fallback: {
        executiveSummary: data.executiveSummary?.narrative || "Insights financeiros gerados a partir de dados reais.",
        narrative: data.executiveSummary?.narrative || "Sem narrativa adicional para este recorte.",
        mainFindings: (data.insights || [])
          .slice(0, 5)
          .map((item) => ({
            title: item.title || "Insight",
            description: item.message || item.description || item.title || "Sinal analítico detectado.",
            severity: item.level === "warning" ? "attention" : item.level === "success" ? "opportunity" : "info",
            confidence: 0.7
          })),
        recommendations: [
          "Priorize revisão das maiores concentrações de saída.",
          data.recurringTransactions?.length ? "Aproveite os padrões recorrentes para planejamento mensal." : null
        ].filter(Boolean),
        suggestedQuestions: [
          "Quem recebeu mais dinheiro no período?",
          "Qual categoria pesou mais nas saídas?",
          "Existe alguma anomalia fora do padrão?"
        ],
        confidence: 0.72
      }
    });

    return FinancialAIInsightService.applyToInsights(baseResponse, aiResult);
  }
}
