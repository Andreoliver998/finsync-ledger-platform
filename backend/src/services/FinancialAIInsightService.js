import { FinancialAIRecommendationService } from "./FinancialAIRecommendationService.js";
import { ActionableInsightEnrichmentService } from "./ActionableInsightEnrichmentService.js";

function mergeUniqueStrings(items = [], additions = [], limit = 8) {
  const seen = new Set();
  const result = [];

  for (const item of [...items, ...additions]) {
    const text = String(item || "").trim();
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(text);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

export class FinancialAIInsightService {
  static applyToReading(base, ai, context = {}) {
    const aiAlerts = FinancialAIRecommendationService.buildAlertsFromFindings(ai.mainFindings);
    const aiRecommendations = FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations);
    const aiInsights = FinancialAIRecommendationService.buildInsightCards(ai.mainFindings);
    const enriched = ActionableInsightEnrichmentService.enrichReading({
      base,
      insights: [...aiInsights, ...(base.insights || [])].slice(0, 10),
      findings: ai.mainFindings,
      transactions: context.transactions || []
    });

    return {
      ...base,
      executiveSummary: {
        ...(base.executiveSummary || {}),
        aiNarrative: ai.executiveSummary,
        narrative: ai.executiveSummary
      },
      summary: ai.executiveSummary,
      narrative: ai.narrative || ai.executiveSummary,
      alerts: [...aiAlerts, ...(base.alerts || [])].slice(0, 8),
      recommendations: [...aiRecommendations, ...(base.recommendations || [])].slice(0, 8),
      insights: enriched.insights,
      mainFindings: ai.mainFindings,
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      relatedTransactions: enriched.relatedTransactions,
      evidenceItems: enriched.evidenceItems,
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence
      }
    };
  }

  static applyToProfile(base, ai) {
    const aiInsights = FinancialAIRecommendationService.buildInsightCards(ai.mainFindings);
    const aiRecommendations = FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations);

    return {
      ...base,
      narrative: ai.narrative || ai.executiveSummary,
      summary: ai.executiveSummary,
      description: ai.narrative || ai.executiveSummary,
      recommendations: aiRecommendations,
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      insights: [...aiInsights, ...(base.insights || [])].slice(0, 10),
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence,
        mainFindings: ai.mainFindings
      }
    };
  }

  static applyToSearch(base, ai) {
    const summary = base.summary || {};

    return {
      ...base,
      humanExplanation: ai.narrative || ai.executiveSummary,
      meta: {
        headline: ai.executiveSummary,
        subheadline: ai.narrative || ai.executiveSummary,
        confidence: ai.confidence
      },
      summary: {
        ...summary,
        aiNarrative: ai.executiveSummary
      },
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      recommendations: FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations),
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence,
        mainFindings: ai.mainFindings
      }
    };
  }

  static applyToTransaction(base, ai) {
    return {
      ...base,
      humanExplanation: ai.narrative || ai.executiveSummary,
      explanation: ai.narrative || ai.executiveSummary,
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      recommendations: FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations),
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence,
        mainFindings: ai.mainFindings
      }
    };
  }

  static applyToInsights(base, ai) {
    const aiInsights = FinancialAIRecommendationService.buildInsightCards(ai.mainFindings);

    return {
      ...base,
      executiveSummary: {
        ...(base.executiveSummary || {}),
        narrative: ai.executiveSummary
      },
      insights: [...aiInsights, ...(base.insights || [])].slice(0, 10),
      recommendations: FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations),
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      narrativeHighlights: mergeUniqueStrings(base.narrativeHighlights || [], [ai.executiveSummary, ai.narrative]),
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence
      }
    };
  }

  static applyToReport(base, ai) {
    return {
      ...base,
      narrative: ai.narrative || ai.executiveSummary,
      executiveConclusion: ai.executiveSummary,
      recommendations: FinancialAIRecommendationService.normalizeRecommendations(ai.recommendations),
      suggestedQuestions: FinancialAIRecommendationService.normalizeQuestions(ai.suggestedQuestions),
      aiAnalysis: {
        provider: ai.provider,
        cached: ai.cached,
        contextHash: ai.contextHash,
        confidence: ai.confidence,
        mainFindings: ai.mainFindings
      }
    };
  }
}
