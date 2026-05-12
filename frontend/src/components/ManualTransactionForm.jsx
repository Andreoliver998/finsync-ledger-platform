import { useEffect, useMemo, useState } from "react";
import { PAYMENT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "./ManualTransactionFilters.jsx";

const EMPTY_FORM = {
  type: "EXPENSE",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: "",
  paymentMethod: "PIX",
  place: "",
  notes: "",
  bank: "",
  card: "",
  installments: "",
  isRecurring: false,
  dueDate: "",
  status: "PAID"
};

function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function toIsoDate(value) {
  return value ? new Date(`${value}T12:00:00.000Z`).toISOString() : undefined;
}

export default function ManualTransactionForm({ initialData, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const title = useMemo(
    () => (initialData?.id ? "Editar lançamento" : "Novo lançamento"),
    [initialData]
  );

  useEffect(() => {
    if (!initialData) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      type: initialData.type || "EXPENSE",
      amount: String(initialData.amount || ""),
      date: toDateInput(initialData.date),
      description: initialData.description || "",
      category: initialData.category || "",
      paymentMethod: initialData.paymentMethod || "PIX",
      place: initialData.place || "",
      notes: initialData.notes || "",
      bank: initialData.bank || "",
      card: initialData.card || "",
      installments: initialData.installments ? String(initialData.installments) : "",
      isRecurring: Boolean(initialData.isRecurring),
      dueDate: toDateInput(initialData.dueDate),
      status: initialData.status || "PAID"
    });
  }, [initialData]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      type: form.type,
      amount: Number(form.amount),
      date: toIsoDate(form.date),
      description: form.description.trim(),
      category: form.category.trim() || undefined,
      paymentMethod: form.paymentMethod,
      place: form.place.trim() || undefined,
      notes: form.notes.trim() || undefined,
      bank: form.bank.trim() || undefined,
      card: form.card.trim() || undefined,
      installments: form.installments ? Number(form.installments) : undefined,
      isRecurring: form.isRecurring,
      dueDate: form.dueDate ? toIsoDate(form.dueDate) : undefined,
      status: form.status
    });
  }

  return (
    <form className="manual-form" onSubmit={handleSubmit}>
      <div className="manual-form-header">
        <div>
          <h2>{title}</h2>
          <p>Registre receitas e despesas fora da sincronização Open Finance.</p>
        </div>
      </div>

      <div className="manual-form-grid">
        <div className="input-group">
          <label className="input-label">Tipo</label>
          <select className="input" value={form.type} onChange={(event) => updateField("type", event.target.value)}>
            {TYPE_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Quanto foi?</label>
          <input
            className="input"
            min="0.01"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Quando?</label>
          <input
            className="input"
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Com o que foi?</label>
          <input
            className="input"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Categoria</label>
          <input className="input" value={form.category} onChange={(event) => updateField("category", event.target.value)} />
        </div>

        <div className="input-group">
          <label className="input-label">Forma de pagamento</label>
          <select
            className="input"
            value={form.paymentMethod}
            onChange={(event) => updateField("paymentMethod", event.target.value)}
          >
            {PAYMENT_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Onde gastou?</label>
          <input className="input" value={form.place} onChange={(event) => updateField("place", event.target.value)} />
        </div>

        <div className="input-group">
          <label className="input-label">Status</label>
          <select className="input" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Cartão usado</label>
          <input className="input" value={form.card} onChange={(event) => updateField("card", event.target.value)} />
        </div>

        <div className="input-group">
          <label className="input-label">Banco</label>
          <input className="input" value={form.bank} onChange={(event) => updateField("bank", event.target.value)} />
        </div>

        <div className="input-group">
          <label className="input-label">Parcelas</label>
          <input
            className="input"
            min="1"
            type="number"
            value={form.installments}
            onChange={(event) => updateField("installments", event.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Vencimento</label>
          <input
            className="input"
            type="date"
            value={form.dueDate}
            onChange={(event) => updateField("dueDate", event.target.value)}
          />
        </div>
      </div>

      <label className="manual-check">
        <input
          checked={form.isRecurring}
          type="checkbox"
          onChange={(event) => updateField("isRecurring", event.target.checked)}
        />
        Recorrente
      </label>

      <div className="input-group">
        <label className="input-label">Observações</label>
        <textarea
          className="input"
          rows="3"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
        />
      </div>

      <div className="manual-form-actions">
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? <span className="btn-spinner" /> : null}
          Salvar lançamento
        </button>
      </div>
    </form>
  );
}
