function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function MerchantRankingTable({ items = [] }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Top estabelecimentos</span>
      </div>
      {items.length === 0 ? (
        <div className="chart-placeholder"><span>Sem dados</span></div>
      ) : (
        <div className="ledger-ranking-table">
          {items.slice(0, 10).map((item, index) => (
            <div className="ledger-ranking-row" key={`${item.merchant}-${index}`}>
              <span className="mono">{index + 1}</span>
              <strong>{item.merchant}</strong>
              <span>{item.count} transações</span>
              <span className="mono">{fmtCur(item.expenses || item.totalAmount || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
