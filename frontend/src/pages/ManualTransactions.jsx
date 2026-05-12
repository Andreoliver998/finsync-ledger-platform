import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ManualTransactionFilters from "../components/ManualTransactionFilters.jsx";
import ManualTransactionForm from "../components/ManualTransactionForm.jsx";
import ManualTransactionTable from "../components/ManualTransactionTable.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import {
  createManualTransaction,
  deleteManualTransaction,
  listManualTransactions,
  updateManualTransaction
} from "../services/manualTransactionsApi.js";

const now = new Date();
const DEFAULT_FILTERS = {
  month: String(now.getMonth() + 1),
  year: String(now.getFullYear()),
  category: "",
  type: "",
  status: "",
  paymentMethod: ""
};

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
}

export default function ManualTransactions() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "INCOME") {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }

        acc.total += 1;
        return acc;
      },
      { income: 0, expenses: 0, total: 0 }
    );
  }, [transactions]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await listManualTransactions({ ...cleanFilters(filters), limit: 100 });
      setTransactions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível carregar os lançamentos manuais.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function openNewDrawer() {
    setEditingTransaction(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setEditingTransaction(null);
    setDrawerOpen(false);
  }

  async function handleSubmit(data) {
    setSubmitting(true);
    setError("");
    setFeedback("");

    try {
      if (editingTransaction?.id) {
        await updateManualTransaction(editingTransaction.id, data);
        setFeedback("Lançamento atualizado com sucesso.");
      } else {
        await createManualTransaction(data);
        setFeedback("Lançamento cadastrado com sucesso.");
      }

      closeDrawer();
      await loadTransactions();
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível salvar o lançamento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(transaction) {
    const shouldDelete = window.confirm(`Excluir "${transaction.description}"?`);

    if (!shouldDelete) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      await deleteManualTransaction(transaction.id);
      setFeedback("Lançamento excluído com sucesso.");
      await loadTransactions();
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível excluir o lançamento.");
    }
  }

  return (
    <AppLayout breadcrumb="Lançamentos manuais">
      <div className="manual-page anim-fade-in">
        <div className="manual-header">
          <div>
            <h1 className="dash-page-title">Lançamentos manuais</h1>
            <p className="dash-page-sub">
              Registre despesas e receitas que não vieram do Open Finance.
            </p>
          </div>
          <button className="btn btn-primary" type="button" onClick={openNewDrawer}>
            <Plus size={16} />
            Novo lançamento
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        {feedback && <div className="alert alert-green" style={{ marginBottom: "1rem" }}>{feedback}</div>}

        <div className="manual-summary-grid">
          <div className="stat-card">
            <div className="stat-label">Receitas manuais</div>
            <div className="stat-value">{formatCurrency(summary.income)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Gastos manuais</div>
            <div className="stat-value">{formatCurrency(summary.expenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Saldo manual</div>
            <div className="stat-value">{formatCurrency(summary.income - summary.expenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Registros filtrados</div>
            <div className="stat-value">{pagination?.total ?? summary.total}</div>
          </div>
        </div>

        <ManualTransactionFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />

        <ManualTransactionTable
          transactions={transactions}
          loading={loading}
          onEdit={(transaction) => {
            setEditingTransaction(transaction);
            setDrawerOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {drawerOpen && (
        <div className="manual-drawer-backdrop" onMouseDown={closeDrawer}>
          <aside className="manual-drawer card" onMouseDown={(event) => event.stopPropagation()}>
            <ManualTransactionForm
              initialData={editingTransaction}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={closeDrawer}
            />
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
