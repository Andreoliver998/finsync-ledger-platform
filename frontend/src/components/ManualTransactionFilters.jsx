const TYPE_OPTIONS = [
  { value: "", label: "Todos os tipos" },
  { value: "INCOME", label: "Receita" },
  { value: "EXPENSE", label: "Despesa" }
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "PAID", label: "Pago" },
  { value: "PENDING", label: "Pendente" },
  { value: "SCHEDULED", label: "Agendado" }
];

const PAYMENT_OPTIONS = [
  { value: "", label: "Todas as formas" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "PIX", label: "PIX" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BOLETO", label: "Boleto" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "OTHER", label: "Outro" }
];

export { PAYMENT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS };

export default function ManualTransactionFilters({ filters, onChange, onClear }) {
  function updateFilter(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="manual-filters card">
      <div className="input-group">
        <label className="input-label">Mês</label>
        <input
          className="input"
          min="1"
          max="12"
          type="number"
          value={filters.month}
          onChange={(event) => updateFilter("month", event.target.value)}
        />
      </div>
      <div className="input-group">
        <label className="input-label">Ano</label>
        <input
          className="input"
          min="2000"
          type="number"
          value={filters.year}
          onChange={(event) => updateFilter("year", event.target.value)}
        />
      </div>
      <div className="input-group">
        <label className="input-label">Tipo</label>
        <select className="input" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Status</label>
        <select className="input" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Forma de pagamento</label>
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(event) => updateFilter("paymentMethod", event.target.value)}
        >
          {PAYMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Categoria</label>
        <input
          className="input"
          placeholder="Ex.: Mercado"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
        />
      </div>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onClear}>
        Limpar
      </button>
    </div>
  );
}
