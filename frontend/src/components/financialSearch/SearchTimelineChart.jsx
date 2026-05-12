function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function SearchTimelineChart({ data = {} }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Meses com maior movimentação</span></div>
      <div className="ledger-ranking-table">
        {(data.byMonth || []).length === 0 ? (
          <div className="ledger-empty">Sem histórico suficiente</div>
        ) : (data.byMonth || []).map((item) => (
          <div className="ledger-ranking-row" key={item.month}>
            <strong>{item.label}</strong>
            <span>{item.count} transações · enviados {fmtCur(item.totalSent)} · recebidos {fmtCur(item.totalReceived)}</span>
            <span className="mono">{fmtCur(item.totalMoved)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
