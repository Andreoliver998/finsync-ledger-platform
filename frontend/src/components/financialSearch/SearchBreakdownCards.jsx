function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function BreakdownCard({ title, items = [], labelKey, valueKey }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>{title}</span></div>
      <div className="ledger-ranking-table">
        {items.length === 0 ? (
          <div className="ledger-empty">Sem dados</div>
        ) : items.map((item, index) => (
          <div className="ledger-ranking-row" key={`${title}-${index}`}>
            <strong>{item[labelKey] || item.label || "—"}</strong>
            <span>{item.count || 0} transações</span>
            <span className="mono">{fmtCur(item[valueKey] || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchBreakdownCards({ data = {} }) {
  return (
    <div className="ledger-analytics-layout">
      <BreakdownCard title="Por método de pagamento" items={data.byPaymentMethod || []} labelKey="paymentMethod" valueKey="totalAmount" />
      <BreakdownCard title="Por categoria" items={data.byCategory || []} labelKey="category" valueKey="amount" />
      <BreakdownCard title="Por direção" items={data.byDirection || []} labelKey="direction" valueKey="amount" />
    </div>
  );
}
