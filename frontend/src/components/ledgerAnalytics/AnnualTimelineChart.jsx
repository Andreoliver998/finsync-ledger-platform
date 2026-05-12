function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function AnnualTimelineChart({ annual = [] }) {
  const max = Math.max(...annual.map((item) => Math.max(item.expenses || 0, item.income || 0)), 1);

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Evolução anual</span>
      </div>
      {annual.length === 0 ? (
        <div className="chart-placeholder"><span>Sem dados</span></div>
      ) : (
        <div className="ledger-annual-chart">
          {annual.map((item) => (
            <div key={item.year} className="ledger-annual-bar">
              <div className="ledger-annual-values">
                <span>{fmtCur(item.expenses)}</span>
                <span>{item.year}</span>
              </div>
              <div className="ledger-annual-track">
                <div className="ledger-annual-fill" style={{ height: `${Math.max((item.expenses / max) * 100, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
