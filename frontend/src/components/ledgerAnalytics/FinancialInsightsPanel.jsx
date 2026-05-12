export default function FinancialInsightsPanel({ data = {} }) {
  const insights = data.insights || [];
  const executiveSummary = data.executiveSummary || {};
  const recommendations = data.recommendations || [];
  const suggestedQuestions = data.suggestedQuestions || [];

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>IA Financeira com dados reais</span>
      </div>
      <div className="ledger-ai-score">
        <span>Health score</span>
        <strong>{data.healthScore ?? 0}</strong>
      </div>
      {executiveSummary.narrative && (
        <p className="ledger-executive-narrative" style={{ marginTop: ".9rem" }}>
          {executiveSummary.narrative}
        </p>
      )}
      {insights.length === 0 ? (
        <div className="chart-placeholder"><span>Sem insights</span></div>
      ) : (
        <div className="ledger-insights-list">
          {insights.map((insight) => (
            <div className="ledger-insight-card" key={insight.title}>
              <span className={`badge ${insight.level === "warning" ? "badge-warning" : insight.level === "success" ? "badge-green" : "badge-blue"}`}>
                {insight.level}
              </span>
              <strong>{insight.title}</strong>
              <p>{insight.message}</p>
            </div>
          ))}
        </div>
      )}
      {recommendations.length > 0 && (
        <div className="ledger-insights-list" style={{ marginTop: "1rem" }}>
          {recommendations.slice(0, 4).map((item, index) => {
            const text = typeof item === "string" ? item : item?.text || item?.title || item?.description;
            if (!text) return null;
            return (
              <div className="ledger-insight-card" key={`rec-${index + 1}-${text}`}>
                <span className="badge badge-green">recomendação</span>
                <strong>Ação recomendada</strong>
                <p>{text}</p>
              </div>
            );
          })}
        </div>
      )}
      {suggestedQuestions.length > 0 && (
        <div className="ledger-insights-list" style={{ marginTop: "1rem" }}>
          {suggestedQuestions.slice(0, 4).map((question, index) => (
            <div className="ledger-insight-card" key={`question-${index + 1}-${question}`}>
              <span className="badge badge-blue">pergunta sugerida</span>
              <strong>Próxima investigação</strong>
              <p>{question}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
