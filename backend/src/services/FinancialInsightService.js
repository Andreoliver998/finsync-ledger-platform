import { UserFinancialProfileService } from "./UserFinancialProfileService.js";

export class FinancialInsightService {
  static build({
    profileContext,
    overview,
    executiveSummary,
    recurringTransactions,
    categoryGrowth,
    topMerchants,
    topCategories,
    annualTimeline,
    probableCardUsage,
    paymentMethods,
    anomalies
  }) {
    const insights = [];
    const fmt = (value) => UserFinancialProfileService.formatCurrency(value, profileContext);

    if (executiveSummary?.narrative) {
      insights.push({
        level: "info",
        title: "O que aconteceu com seu dinheiro",
        message: executiveSummary.narrative
      });
    }

    if (topCategories[0]) {
      insights.push({
        level: "info",
        title: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `seu maior gasto foi com ${topCategories[0].category}`,
          didactic: `Você gastou mais com ${topCategories[0].category}`,
          executive: `${topCategories[0].category} liderou suas despesas`,
          consultive: `${topCategories[0].category} concentrou sua maior saída`,
          neutral: `Você gastou mais com ${topCategories[0].category}`
        }),
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `${topCategories[0].category} concentrou ${topCategories[0].percentage.toFixed(1)}% das suas despesas filtradas.`,
          didactic: `A categoria líder concentrou ${topCategories[0].percentage.toFixed(1)}% das despesas filtradas.`,
          executive: `${topCategories[0].category} respondeu por ${topCategories[0].percentage.toFixed(1)}% das despesas filtradas.`,
          consultive: `A categoria líder concentrou ${topCategories[0].percentage.toFixed(1)}% das despesas filtradas.`,
          neutral: `A categoria líder concentrou ${topCategories[0].percentage.toFixed(1)}% das despesas filtradas.`
        })
      });
    }

    if (overview.biggestExpense) {
      insights.push({
        level: "warning",
        title: "Maior gasto identificado",
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `${overview.biggestExpense.description} foi seu maior gasto individual, totalizando ${overview.biggestExpense.formattedAmount}.`,
          didactic: `${overview.biggestExpense.description} totalizou ${overview.biggestExpense.formattedAmount}.`,
          executive: `${overview.biggestExpense.description} liderou as saídas individuais com ${overview.biggestExpense.formattedAmount}.`,
          consultive: `${overview.biggestExpense.description} apareceu como o maior gasto individual, totalizando ${overview.biggestExpense.formattedAmount}.`,
          neutral: `${overview.biggestExpense.description} totalizou ${overview.biggestExpense.formattedAmount}.`
        })
      });
    }

    if (categoryGrowth[0]?.growthAmount > 0) {
      insights.push({
        level: "warning",
        title: `A categoria que mais cresceu foi ${categoryGrowth[0].category}`,
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `${categoryGrowth[0].category} cresceu ${categoryGrowth[0].growthPercent.toFixed(1)}% no seu comparativo.`,
          didactic: `Houve aumento de ${categoryGrowth[0].growthPercent.toFixed(1)}% em relação ao período anterior comparável.`,
          executive: `${categoryGrowth[0].category} registrou alta de ${categoryGrowth[0].growthPercent.toFixed(1)}% versus o período comparável.`,
          consultive: `Houve aumento de ${categoryGrowth[0].growthPercent.toFixed(1)}% em relação ao período anterior comparável.`,
          neutral: `Houve aumento de ${categoryGrowth[0].growthPercent.toFixed(1)}% em relação ao período anterior comparável.`
        })
      });
    }

    if (overview.highestExpenseMonth) {
      insights.push({
        level: "info",
        title: "Período com maior despesa",
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `você concentrou mais despesas em ${overview.highestExpenseMonth.month}, com ${overview.highestExpenseMonth.formattedExpenses}.`,
          didactic: `${overview.highestExpenseMonth.month} concentrou ${overview.highestExpenseMonth.formattedExpenses} em saídas.`,
          executive: `${overview.highestExpenseMonth.month} liderou as saídas com ${overview.highestExpenseMonth.formattedExpenses}.`,
          consultive: `${overview.highestExpenseMonth.month} concentrou ${overview.highestExpenseMonth.formattedExpenses} em saídas.`,
          neutral: `${overview.highestExpenseMonth.month} concentrou ${overview.highestExpenseMonth.formattedExpenses} em saídas.`
        })
      });
    }

    if (recurringTransactions[0]) {
      insights.push({
        level: "info",
        title: recurringTransactions[0].kind === "SALARY" ? "Receita recorrente detectada" : "Recorrência detectada",
        message: `${recurringTransactions[0].merchant} aparece com padrão ${recurringTransactions[0].frequency === "MONTHLY" ? "mensal" : "semanal"} recorrente.`
      });
    }

    if (topMerchants[0]) {
      insights.push({
        level: "info",
        title: "Estabelecimento mais frequente",
        message: `${topMerchants[0].merchant} apareceu em ${topMerchants[0].count} transações filtradas.`
      });
    }

    if (paymentMethods?.[0]) {
      insights.push({
        level: "info",
        title: "Método de pagamento dominante",
        message: `${paymentMethods[0].paymentMethod} lidera o uso no período, com ${paymentMethods[0].count} lançamentos.`
      });
    }

    if (probableCardUsage.summary.creditAmount > 0 || probableCardUsage.summary.debitAmount > 0) {
      const leader = probableCardUsage.summary.creditAmount >= probableCardUsage.summary.debitAmount ? "crédito" : "débito";
      insights.push({
        level: "success",
        title: "Método provável dominante",
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `seu CSV sugere uso maior de ${leader} entre as compras detectadas.`,
          didactic: `O CSV sugere predominância de uso em ${leader} entre as compras detectadas.`,
          executive: `${leader} aparece como método provável dominante nas compras detectadas.`,
          consultive: `O CSV sugere predominância de uso em ${leader} entre as compras detectadas.`,
          neutral: `O CSV sugere predominância de uso em ${leader} entre as compras detectadas.`
        })
      });
    }

    if (anomalies?.[0]) {
      insights.push({
        level: "warning",
        title: "Despesa fora do padrão",
        message: UserFinancialProfileService.buildMessage(profileContext, {
          direct: `${anomalies[0].merchant} registrou ${fmt(anomalies[0].amount)} e ficou acima do seu padrão histórico.`,
          didactic: `${anomalies[0].merchant} registrou ${fmt(anomalies[0].amount)} e ficou acima do padrão histórico.`,
          executive: `${anomalies[0].merchant} excedeu o padrão histórico com ${fmt(anomalies[0].amount)}.`,
          consultive: `${anomalies[0].merchant} registrou ${fmt(anomalies[0].amount)} e ficou acima do padrão histórico.`,
          neutral: `${anomalies[0].merchant} registrou ${fmt(anomalies[0].amount)} e ficou acima do padrão histórico.`
        })
      });
    }

    if (executiveSummary?.quality?.needsReview) {
      insights.push({
        level: executiveSummary.quality.needsReview > 5 ? "warning" : "info",
        title: "Qualidade da leitura",
        message: `${executiveSummary.quality.needsReview} transações ainda precisam de revisão para elevar a confiança analítica.`
      });
    }

    if (annualTimeline.length > 1) {
      const first = annualTimeline[0];
      const last = annualTimeline[annualTimeline.length - 1];
      const diff = last.expenses - first.expenses;
      insights.push({
        level: diff > 0 ? "warning" : "success",
        title: "Padrão histórico de gastos",
        message: diff > 0
          ? `As despesas cresceram ${Math.abs(diff).toFixed(2)} do primeiro para o último ano analisado.`
          : `As despesas reduziram ${Math.abs(diff).toFixed(2)} do primeiro para o último ano analisado.`
      });
    }

    if (!insights.length) {
      insights.push({
        level: "info",
        title: "Base analítica em formação",
        message: "Ainda não há volume suficiente de transações para gerar padrões avançados."
      });
    }

    return insights.slice(0, 10);
  }

  static buildStatementInsights({
    personaName,
    executiveSummary,
    moneyFlow,
    pixAnalysis,
    merchantAnalysis,
    peopleAnalysis,
    paymentMethodAnalysis,
    recurrenceAnalysis,
    confidence
  }) {
    const alerts = [];
    const recommendations = [];

    if ((moneyFlow.netAmount || 0) < 0) {
      alerts.push({
        level: "warning",
        title: "Saldo líquido negativo",
        message: `${personaName}, as saídas superaram as entradas no período analisado.`
      });
    }

    if ((pixAnalysis.totalPixSent || 0) > (moneyFlow.totalExpenses || 0) * 0.4 && moneyFlow.totalExpenses > 0) {
      alerts.push({
        level: "info",
        title: "PIX com peso relevante",
        message: `${personaName}, o PIX respondeu por parte relevante das suas saídas e merece leitura por pessoa e finalidade.`
      });
    }

    if ((merchantAnalysis.marketplaces || []).length > 0) {
      const marketplace = merchantAnalysis.marketplaces[0];
      recommendations.push({
        title: "Revisar concentração em marketplaces",
        message: `${marketplace.merchant} aparece com frequência no período. Vale validar recorrência, ticket médio e compras impulsivas.`
      });
    }

    if ((peopleAnalysis.topPeople || []).length > 0) {
      const person = peopleAnalysis.topPeople[0];
      recommendations.push({
        title: "Mapear relacionamento financeiro",
        message: `${person.name} aparece com recorrência entre transferências e PIX. Isso pode virar uma visão dedicada de relacionamento financeiro.`
      });
    }

    if ((recurrenceAnalysis.subscriptions || []).length > 0) {
      recommendations.push({
        title: "Atacar gastos recorrentes",
        message: `${personaName}, existem ${recurrenceAnalysis.subscriptions.length} assinaturas prováveis. Revisar essas recorrências pode liberar caixa rapidamente.`
      });
    }

    if ((paymentMethodAnalysis.creditVsDebit?.creditAmount || 0) > (paymentMethodAnalysis.creditVsDebit?.debitAmount || 0) * 1.2) {
      recommendations.push({
        title: "Monitorar dependência de crédito",
        message: "O uso de crédito ficou acima do débito no período. Cruzar isso com pagamento de fatura melhora a leitura de liquidez."
      });
    }

    if ((confidence.needsReview || 0) > 0) {
      alerts.push({
        level: confidence.needsReview > 10 ? "warning" : "info",
        title: "Leitura com pontos pendentes",
        message: `${confidence.needsReview} transações ainda precisam de revisão para aumentar a confiança da interpretação.`
      });
    }

    if (!alerts.length) {
      alerts.push({
        level: "success",
        title: "Leitura estável",
        message: `${personaName}, não há sinais fortes de distorção ou risco imediato no recorte atual.`
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: "Manter acompanhamento contínuo",
        message: "O próximo passo mais útil é continuar importando o extrato para consolidar padrões mensais e recorrências."
      });
    }

    return {
      alerts,
      recommendations,
      narrativeHighlights: [
        executiveSummary?.headline,
        merchantAnalysis?.headline,
        pixAnalysis?.headline
      ].filter(Boolean)
    };
  }
}
