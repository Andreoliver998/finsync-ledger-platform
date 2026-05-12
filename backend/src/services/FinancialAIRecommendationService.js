function normalizeText(value, maxLength = 240) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function uniqueByText(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = normalizeText(
      typeof item === "string"
        ? item
        : item?.title || item?.text || item?.description || item?.message
    ).toLowerCase();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

export class FinancialAIRecommendationService {
  static normalizeRecommendations(items = [], limit = 6) {
    return uniqueByText(items)
      .map((item, index) => {
        if (typeof item === "string") {
          return normalizeText(item);
        }

        const text = normalizeText(item?.text || item?.title || item?.description || item?.message);
        return text
          ? {
              id: `ai-rec-${index + 1}`,
              type: "ai-recommendation",
              text
            }
          : null;
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  static normalizeQuestions(items = [], limit = 6) {
    return uniqueByText(items)
      .map((item) => normalizeText(item, 120))
      .filter(Boolean)
      .slice(0, limit);
  }

  static buildAlertsFromFindings(findings = [], limit = 6) {
    return uniqueByText(findings)
      .map((finding, index) => {
        const title = normalizeText(finding?.title, 120);
        const description = normalizeText(finding?.description, 240);
        if (!title && !description) {
          return null;
        }

        const severity = String(finding?.severity || "info").toLowerCase();
        return {
          id: `ai-alert-${index + 1}`,
          type: "ai-alert",
          severity: severity === "risk" ? "danger" : severity === "attention" ? "warning" : "info",
          level: severity === "risk" ? "warning" : severity === "attention" ? "warning" : "info",
          title: title || "Sinal detectado",
          description: description || title,
          confidence: Number(finding?.confidence || 0)
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  static buildInsightCards(findings = [], limit = 8) {
    return uniqueByText(findings)
      .map((finding, index) => {
        const title = normalizeText(finding?.title, 120);
        const description = normalizeText(finding?.description, 280);
        if (!title && !description) {
          return null;
        }

        const severity = String(finding?.severity || "info").toLowerCase();
        return {
          id: `ai-finding-${index + 1}`,
          type: "ai-finding",
          level: severity === "risk" ? "warning" : severity === "attention" ? "warning" : severity === "opportunity" ? "success" : "info",
          tone: severity === "risk" ? "danger" : severity === "attention" ? "warning" : severity === "opportunity" ? "success" : "primary",
          title: title || "Achado principal",
          message: description || title,
          description: description || title,
          confidence: Number(finding?.confidence || 0)
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  }
}
