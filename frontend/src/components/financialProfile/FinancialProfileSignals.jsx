export default function FinancialProfileSignals({
  recurrenceSignals = [],
  riskSignals = [],
  insights = [],
  onOpenRecurrence
}) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Recorrências e padrões</span></div>
        <div className="ledger-insights-list">
          {recurrenceSignals.length === 0 && <div className="ledger-empty">Nenhuma recorrência forte detectada neste recorte.</div>}
          {recurrenceSignals.map((item, index) => (
            <div className="ledger-insight-card" key={`${item.merchant || item.description || "pattern"}-${index}`}>
              <span className="badge badge-green">{String(item.frequency || "PADRÃO").toLowerCase()}</span>
              <strong>{item.merchant || item.description || "Padrão identificado"}</strong>
              <p>{item.kind || "Recorrência"} · {(item.transactions || []).length} ocorrências vinculadas</p>
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenRecurrence?.(item)}>
                  Investigar recorrência
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Alertas e insights</span></div>
        <div className="ledger-insights-list">
          {riskSignals.map((item) => (
            <div className="ledger-insight-card" key={`risk-${item.title}`}>
              <span className={`badge ${item.level === "warning" ? "badge-warning" : item.level === "success" ? "badge-green" : "badge-blue"}`}>
                {item.level}
              </span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
          {insights.map((item) => (
            <div className="ledger-insight-card" key={`insight-${item.title}`}>
              <span className="badge badge-neutral">insight</span>
              <strong>{item.title}</strong>
              <p>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
