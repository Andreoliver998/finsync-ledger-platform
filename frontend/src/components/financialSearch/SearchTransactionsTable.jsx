import TransactionLink from "../financial/TransactionLink.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";
}

export default function SearchTransactionsTable({ items = [], onSelect }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Transações encontradas</span></div>
      <div className="search-transactions-head">
        <span>Data</span>
        <span>Descrição</span>
        <span>Categoria</span>
        <span>Método</span>
        <span>Origem</span>
        <span>Valor</span>
      </div>
      <div className="search-transactions-list">
        {items.length === 0 ? (
          <div className="ledger-empty">Nenhuma transação para exibir.</div>
        ) : items.map((item) => (
          <div key={`${item.sourceType}-${item.id}`} className="search-transaction-shell">
            <TransactionLink
              transactionId={item.id}
              transaction={item}
              className="search-transaction-row"
              title={`Abrir investigação de ${item.description || "transação"}`}
              showPreview
            >
              <span>{fmtDate(item.date)}</span>
              <span>
                <strong>{item.description}</strong>
                <small>{item.counterpartyName || item.merchantName || item.bank || item.matchedField}</small>
              </span>
              <span>{item.category || "—"}</span>
              <span>{item.paymentMethod || "—"}</span>
              <span>{item.sourceType}</span>
              <span className={`mono ${item.amount > 0 ? "text-green" : "text-orange"}`}>
                {item.amount > 0 ? "+" : "-"}{fmtCur(Math.abs(item.amount || 0))}
              </span>
            </TransactionLink>
            {onSelect && (
              <button className="transaction-secondary-btn" type="button" onClick={() => onSelect(item)}>
                Preview rápido
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
