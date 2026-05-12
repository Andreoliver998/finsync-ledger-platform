import { Edit3, Trash2 } from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "-";
}

const STATUS_LABELS = {
  PAID: "Pago",
  PENDING: "Pendente",
  SCHEDULED: "Agendado"
};

export default function ManualTransactionTable({ transactions, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="manual-table card">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="manual-row skeleton-row" key={index}>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="manual-empty card">
        <div className="manual-empty-icon">F</div>
        <h2>Nenhum lançamento manual</h2>
        <p>Cadastre receitas e despesas para complementar os dados automáticos.</p>
      </div>
    );
  }

  return (
    <div className="manual-table card">
      <div className="manual-table-head">
        <span>Data</span>
        <span>Descrição</span>
        <span>Categoria</span>
        <span>Forma</span>
        <span>Status</span>
        <span>Valor</span>
        <span>Ações</span>
      </div>
      {transactions.map((transaction) => {
        const isExpense = transaction.type === "EXPENSE";

        return (
          <div className="manual-table-row" key={transaction.id}>
            <span className="mono">{formatDate(transaction.date)}</span>
            <span>
              <strong>{transaction.description}</strong>
              <small>{transaction.place || transaction.bank || "Manual"}</small>
            </span>
            <span>{transaction.category || "-"}</span>
            <span>{transaction.paymentMethod || "OTHER"}</span>
            <span><span className="badge badge-neutral">{STATUS_LABELS[transaction.status] || transaction.status}</span></span>
            <span className={isExpense ? "manual-amount-out" : "manual-amount-in"}>
              {formatCurrency(transaction.amount)}
            </span>
            <span className="manual-row-actions">
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => onEdit(transaction)} title="Editar">
                <Edit3 size={14} />
              </button>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(transaction)} title="Excluir">
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
