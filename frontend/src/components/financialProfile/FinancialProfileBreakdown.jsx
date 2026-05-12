function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function BreakdownList({ title, items = [], labelKey = "name", emptyMessage = "Sem dados para este recorte.", actionLabel, onOpenItem }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>{title}</span></div>
      <div className="ledger-ranking-table">
        {items.length === 0 && <div className="ledger-empty">{emptyMessage}</div>}
        {items.map((item) => (
          <div className="ledger-ranking-row" key={`${title}-${item[labelKey]}`}>
            <strong>{item[labelKey]}</strong>
            <span>{item.count} ocorrências</span>
            <span className="mono">{fmtCur(item.totalAmount || item.amount || 0)}</span>
            {onOpenItem && (
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenItem(item[labelKey])}>
                  {actionLabel}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinancialProfileBreakdown({
  paymentMethods = [],
  categories = [],
  onOpenPaymentMethod,
  onOpenCategory
}) {
  return (
    <div className="ledger-analytics-layout">
      <BreakdownList
        title="Métodos usados"
        items={paymentMethods}
        actionLabel="Abrir perfil"
        onOpenItem={onOpenPaymentMethod}
      />
      <BreakdownList
        title="Categorias relacionadas"
        items={categories}
        actionLabel="Abrir perfil"
        onOpenItem={onOpenCategory}
      />
    </div>
  );
}
