function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function PaymentTypeBreakdownPanel({ data = [] }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Detecção de tipo financeiro</span></div>
      <div className="ledger-ranking-table">
        {data.map((item) => (
          <div className="ledger-ranking-row" key={item.group}>
            <strong>{item.label}</strong>
            <span>{item.count} transações</span>
            <span className="mono">{fmtCur(item.totalAmount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
