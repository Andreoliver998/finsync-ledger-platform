import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildTransactionsUrl } from "../../utils/financialNavigation.js";
import TransactionPreviewCard from "./TransactionPreviewCard.jsx";

function isValidTransactionId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || "").trim());
}

export default function TransactionLink({
  transactionId,
  transaction = null,
  className = "",
  children,
  title,
  showPreview = false,
  compactPreview = true,
  disabled = false
}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const valid = isValidTransactionId(transactionId);

  function openTransaction() {
    if (disabled || !valid || pending) {
      return;
    }

    setPending(true);
    navigate(buildTransactionsUrl({ transactionId }));
  }

  if (!valid) {
    return (
      <span className={`transaction-link-fallback ${className}`.trim()}>
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`transaction-link ${pending ? "is-pending" : ""} ${className}`.trim()}
      onClick={openTransaction}
      disabled={disabled}
      aria-label={title || "Abrir investigação da transação"}
      title={title || "Abrir investigação da transação"}
    >
      <span className="transaction-link-body">
        {children}
      </span>
      {showPreview && transaction && (
        <TransactionPreviewCard transaction={transaction} compact={compactPreview} className="transaction-link-preview" />
      )}
      {pending && (
        <span className="transaction-link-loading" aria-hidden="true">
          <LoaderCircle size={12} className="spin" />
        </span>
      )}
    </button>
  );
}
