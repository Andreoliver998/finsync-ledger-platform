function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

export default function FinancialProfileTimeline({ items = [] }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Timeline mensal</span></div>
      <div className="ledger-insights-list">
        {items.length === 0 && <div className="ledger-empty">Sem histórico mensal suficiente para este perfil.</div>}
        {items.map((item) => (
          <div className="ledger-insight-card financial-profile-timeline-card" key={item.month}>
            <span className="badge badge-blue">{item.label}</span>
            <strong>{fmtCur(item.totalMoved || 0)}</strong>
            <p>{item.count} movimentações · entradas {fmtCur(item.totalIn || 0)} · saídas {fmtCur(item.totalOut || 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
