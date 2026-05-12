export default function SearchHumanExplanationPanel({
  explanation = "",
  recurring = [],
  actions = [],
  recommendations = [],
  suggestedQuestions = [],
  onExport,
  onShowRecurring,
  onShowTransactions
}) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Explicação humana</span></div>
      <p className="ledger-executive-narrative">{explanation || "Sem explicação disponível."}</p>

      {!!recurring.length && (
        <div className="ledger-insights-list">
          {recurring.slice(0, 4).map((item, index) => (
            <div className="ledger-insight-card" key={`${item.merchant}-${index}`}>
              <span className="badge badge-green">recorrência</span>
              <strong>{item.merchant || "Padrão detectado"}</strong>
              <p>{item.frequency === "MONTHLY" ? "Padrão mensal" : "Padrão semanal"} · {item.kind || "recorrente"}</p>
            </div>
          ))}
        </div>
      )}

      {!!recommendations.length && (
        <div className="ledger-insights-list">
          {recommendations.slice(0, 3).map((item, index) => {
            const text = typeof item === "string" ? item : item?.text || item?.title || item?.description;
            if (!text) return null;
            return (
              <div className="ledger-insight-card" key={`recommendation-${index}-${text}`}>
                <span className="badge badge-green">recomendação</span>
                <strong>Ação sugerida</strong>
                <p>{text}</p>
              </div>
            );
          })}
        </div>
      )}

      {!!suggestedQuestions.length && (
        <div className="ledger-insights-list">
          {suggestedQuestions.slice(0, 3).map((question, index) => (
            <div className="ledger-insight-card" key={`question-${index}-${question}`}>
              <span className="badge badge-blue">investigação</span>
              <strong>Pergunta sugerida</strong>
              <p>{question}</p>
            </div>
          ))}
        </div>
      )}

      <div className="search-actions-row">
        {actions.find((item) => item.label.includes("relatório"))?.enabled && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={onShowTransactions}>Ver relatório completo dessa pessoa</button>
        )}
        {actions.find((item) => item.label.includes("estabelecimento"))?.enabled && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={onShowTransactions}>Ver todas as compras nesse estabelecimento</button>
        )}
        {actions.find((item) => item.label.includes("recorrências"))?.enabled && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={onShowRecurring}>Ver recorrências relacionadas</button>
        )}
        <button className="btn btn-primary btn-sm" type="button" onClick={onExport}>Exportar resultado</button>
      </div>
    </div>
  );
}
