export default function NarrativePanel({
  narrative = "",
  alerts = [],
  recommendations = [],
  confidence = {},
  onOpenAlert,
  onOpenRecommendation,
  onOpenTransactions
}) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Narrativa final</span></div>
        <p className="ledger-executive-narrative">{narrative || "Sem narrativa disponível."}</p>
        <div className="insight-action-row">
          <button className="insight-link-btn" type="button" onClick={() => onOpenTransactions?.()}>
            Ver transações
          </button>
        </div>
      </div>

      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Alertas e recomendações</span></div>
        <div className="ledger-insights-list">
          {alerts.map((item, index) => (
            <div className="ledger-insight-card" key={`alert-${index}`}>
              <span className={`badge ${item.level === "warning" ? "badge-warning" : item.level === "success" ? "badge-green" : "badge-blue"}`}>{item.level}</span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenAlert?.(item)}>
                  Abrir busca
                </button>
              </div>
            </div>
          ))}
          {recommendations.map((item, index) => (
            <div className="ledger-insight-card" key={`recommendation-${index}`}>
              <span className="badge badge-neutral">ação</span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenRecommendation?.(item)}>
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="ledger-quality-grid" style={{ marginTop: "1rem" }}>
          <div><span>Confiança alta</span><strong>{confidence.highConfidence || 0}</strong></div>
          <div><span>Confiança média</span><strong>{confidence.mediumConfidence || 0}</strong></div>
          <div><span>Precisa revisar</span><strong>{confidence.needsReview || 0}</strong></div>
          <div><span>Com cobertura</span><strong>{Math.round(confidence.classifiedPercent || 0)}%</strong></div>
        </div>
      </div>
    </div>
  );
}
