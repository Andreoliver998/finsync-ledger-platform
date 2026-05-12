import TransactionLink from "../financial/TransactionLink.jsx";

function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";
}

export default function FinancialProfileTransactions({ items = [] }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Transações relacionadas</span></div>
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
          <div className="ledger-empty">Nenhuma transação relacionada encontrada.</div>
        ) : items.map((item) => (
          <TransactionLink key={item.id} transactionId={item.id} transaction={item} className="search-transaction-row" showPreview>
            <span>{fmtDate(item.date)}</span>
            <span>
              <strong>{item.description}</strong>
              <small>{item.counterpartyName || item.merchantName || item.category || item.paymentMethod || item.sourceType}</small>
            </span>
            <span>{item.category || "—"}</span>
            <span>{item.paymentMethod || "—"}</span>
            <span>{item.sourceType || "LEDGER"}</span>
            <span className={`mono ${item.amount > 0 ? "text-green" : "text-orange"}`}>
              {item.amount > 0 ? "+" : "-"}{fmtCur(Math.abs(item.amount || 0), item.currencyCode)}
            </span>
          </TransactionLink>
        ))}
      </div>
    </div>
  );
}
