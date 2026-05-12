function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function TimelineAnalysisPanel({ data = {} }) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Evolução mês a mês</span></div>
        <div className="ledger-ranking-table">
          {(data.monthly || []).map((item) => (
            <div className="ledger-ranking-row" key={item.month}>
              <strong>{item.month}</strong>
              <span>Entradas {fmtCur(item.income)} · Saídas {fmtCur(item.expenses)}</span>
              <span className="mono">{fmtCur(item.net)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Evolução ano a ano</span></div>
        <div className="ledger-ranking-table">
          {(data.annual || []).map((item) => (
            <div className="ledger-ranking-row" key={item.year}>
              <strong>{item.year}</strong>
              <span>{item.count} transações</span>
              <span className="mono">{fmtCur(item.net)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
