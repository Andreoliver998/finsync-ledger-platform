function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

function summarizeExplanation(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return "Sem explicação adicional.";
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

export default function TransactionPreviewCard({ transaction = {}, compact = false, className = "" }) {
  return (
    <div className={`transaction-preview-card ${compact ? "is-compact" : ""} ${className}`.trim()}>
      <div className="transaction-preview-topline">
        <span className={`transaction-preview-amount ${Number(transaction.amount || 0) >= 0 ? "is-positive" : "is-negative"}`}>
          {Number(transaction.amount || 0) >= 0 ? "+" : "-"}
          {fmtCur(Math.abs(transaction.absoluteAmount ?? transaction.amount ?? 0), transaction.currencyCode)}
        </span>
        <span className="transaction-preview-date">{fmtDate(transaction.date)}</span>
      </div>
      <strong className="transaction-preview-title">{transaction.description || "Transação sem descrição"}</strong>
      <div className="transaction-preview-meta">
        <span>{transaction.paymentMethod || "Método não identificado"}</span>
        <span>{transaction.counterpartyName || transaction.merchantName || transaction.merchant || "Contraparte não identificada"}</span>
        <span>{transaction.category || "Sem categoria"}</span>
      </div>
      <p className="transaction-preview-explanation">
        {summarizeExplanation(transaction.explanation || transaction.humanExplanation)}
      </p>
    </div>
  );
}
