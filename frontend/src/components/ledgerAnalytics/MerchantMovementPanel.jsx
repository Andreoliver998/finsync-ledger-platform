function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function MerchantMovementPanel({ items = [] }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Com quem o dinheiro mais circulou</span></div>
      <div className="ledger-ranking-table">
        {items.map((item) => (
          <div className="ledger-ranking-row" key={item.merchant}>
            <strong>{item.merchant}</strong>
            <span>{item.count} movimentações</span>
            <span className="mono">{fmtCur(item.expenses || item.totalAmount || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
