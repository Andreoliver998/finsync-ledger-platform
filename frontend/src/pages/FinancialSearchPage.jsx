import { LoaderCircle, Search, X } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { searchFinancialTransactions } from "../services/financialSearchApi.js";
import FinancialSearchBox from "../components/financialSearch/FinancialSearchBox.jsx";
import SearchEntitySummaryCard from "../components/financialSearch/SearchEntitySummaryCard.jsx";
import SearchBreakdownCards from "../components/financialSearch/SearchBreakdownCards.jsx";
import SearchTimelineChart from "../components/financialSearch/SearchTimelineChart.jsx";
import SearchTransactionsTable from "../components/financialSearch/SearchTransactionsTable.jsx";
import SearchHumanExplanationPanel from "../components/financialSearch/SearchHumanExplanationPanel.jsx";
import SearchFiltersPanel from "../components/financialSearch/SearchFiltersPanel.jsx";

const HISTORY_KEY = "finsync_financial_search_history_v1";
const SEARCH_FILTER_FIELDS = ["startDate", "endDate", "type", "paymentMethod", "category", "source", "minAmount", "maxAmount", "recurrence"];

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {}
}

function exportTransactionsCsv(result) {
  const header = ["date", "sourceType", "description", "counterpartyName", "merchantName", "category", "paymentMethod", "amount"];
  const rows = (result.transactions || []).map((item) => [
    item.date,
    item.sourceType,
    item.description,
    item.counterpartyName || "",
    item.merchantName || "",
    item.category || "",
    item.paymentMethod || "",
    item.amount
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `financial-search-${result.query || "resultado"}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeQueryValue(value) {
  return String(value || "")
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, 120);
}

function readSearchState(searchParams) {
  const nextFilters = {
    startDate: "",
    endDate: "",
    type: "",
    paymentMethod: "",
    category: "",
    source: "",
    minAmount: "",
    maxAmount: "",
    recurrence: ""
  };

  for (const field of SEARCH_FILTER_FIELDS) {
    nextFilters[field] = sanitizeQueryValue(searchParams.get(field));
  }

  return {
    query: sanitizeQueryValue(searchParams.get("q")),
    filters: nextFilters
  };
}

export default function FinancialSearchPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const transactionsRef = useRef(null);
  const recurringRef = useRef(null);
  const initialState = useMemo(() => readSearchState(searchParams), [searchParams]);
  const [query, setQuery] = useState(initialState.query);
  const [history, setHistory] = useState(() => loadHistory());
  const [filters, setFilters] = useState(initialState.filters);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const nextState = readSearchState(searchParams);
    setQuery(nextState.query);
    setFilters(nextState.filters);
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResult(null);
      setLoading(false);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
      Object.entries({
          q: debouncedQuery,
          ...filters
        }).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );

      searchFinancialTransactions(params)
        .then((data) => {
          startTransition(() => {
            setResult(data);
            setHistory((current) => {
              const nextHistory = [debouncedQuery, ...current.filter((item) => item !== debouncedQuery)];
              saveHistory(nextHistory);
              return nextHistory;
            });
          });
        })
        .catch(() => {
          setError("Não foi possível executar a busca financeira.");
          setResult(null);
        })
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [debouncedQuery, filters]);

  function handleFilterChange(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function clearFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      type: "",
      paymentMethod: "",
      category: "",
      source: "",
      minAmount: "",
      maxAmount: "",
      recurrence: ""
    });
  }

  function handleSelectRecent(value) {
    setQuery(value);
  }

  function handleQuickChip(value) {
    setQuery(value);
  }

  function handleExport() {
    if (!result) {
      return;
    }
    exportTransactionsCsv(result);
    toast.success("Resultado exportado com sucesso.");
  }

  function scrollToTransactions() {
    transactionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToRecurring() {
    recurringRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppLayout breadcrumb="Busca Inteligente">
      <div className="beta-page anim-fade-up">
        <FinancialSearchBox
          value={query}
          onChange={setQuery}
          onSubmit={(event) => event.preventDefault()}
          recentSearches={history}
          onSelectRecent={handleSelectRecent}
          onQuickChip={handleQuickChip}
        />

        <SearchFiltersPanel filters={filters} onChange={handleFilterChange} onClear={clearFilters} />

        {loading && (
          <div className="card beta-state">
            <LoaderCircle size={18} className="spin" />
            <strong>Buscando relações financeiras...</strong>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !result && query.trim().length < 2 && (
          <div className="card beta-state">
            <Search size={18} />
            <strong>Digite ao menos 2 caracteres para iniciar a busca.</strong>
          </div>
        )}

        {!loading && result && result.summary?.totalTransactions === 0 && (
          <div className="card beta-state">
            <strong>Nenhuma transação encontrada.</strong>
            <span>Tente outro termo ou ajuste os filtros de período, categoria e método.</span>
          </div>
        )}

        {result && result.summary?.totalTransactions > 0 && (
          <>
            <div className="ledger-analytics-layout">
              <SearchEntitySummaryCard data={result} />
              <SearchHumanExplanationPanel
                explanation={result.humanExplanation}
                recurring={result.recurring || []}
                actions={result.actions || []}
                recommendations={result.recommendations || []}
                suggestedQuestions={result.suggestedQuestions || []}
                onExport={handleExport}
                onShowRecurring={scrollToRecurring}
                onShowTransactions={scrollToTransactions}
              />
            </div>

            <SearchBreakdownCards data={result.breakdown || {}} />
            <SearchTimelineChart data={result.timeline || {}} />

            <div className="ledger-analytics-layout" ref={recurringRef}>
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Relacionamentos e recorrências</span></div>
                <div className="ledger-ranking-table">
                  {(result.relationship?.frequentCounterparties || []).map((item) => (
                    <div className="ledger-ranking-row" key={item.name}>
                      <strong>{item.name}</strong>
                      <span>{item.count} transações</span>
                      <span className="mono">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Maiores valores</span></div>
                <div className="ledger-ranking-table">
                  {(result.relationship?.highestValues || []).map((item) => (
                    <div className="ledger-ranking-row" key={`${item.id}-${item.date}`}>
                      <strong>{item.description}</strong>
                      <span>{item.paymentMethod || "—"} · {item.direction}</span>
                      <span className="mono">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.amount || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div ref={transactionsRef}>
              <SearchTransactionsTable items={result.transactions || []} onSelect={setSelectedTransaction} />
            </div>
          </>
        )}

        {selectedTransaction && (
          <div className="manual-drawer-backdrop" onClick={() => setSelectedTransaction(null)}>
            <div className="card manual-drawer" onClick={(event) => event.stopPropagation()}>
              <div className="manual-header">
                <div>
                  <h2>Detalhe da transação</h2>
                  <p className="ledger-muted">{selectedTransaction.description}</p>
                </div>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelectedTransaction(null)}>
                  <X size={14} />
                </button>
              </div>
              <div className="ledger-quality-grid" style={{ marginTop: "1rem" }}>
                <div><span>Data</span><strong>{selectedTransaction.date ? new Intl.DateTimeFormat("pt-BR").format(new Date(selectedTransaction.date)) : "—"}</strong></div>
                <div><span>Origem</span><strong>{selectedTransaction.sourceType}</strong></div>
                <div><span>Categoria</span><strong>{selectedTransaction.category || "—"}</strong></div>
                <div><span>Método</span><strong>{selectedTransaction.paymentMethod || "—"}</strong></div>
                <div><span>Banco</span><strong>{selectedTransaction.bank || "—"}</strong></div>
                <div><span>Valor</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(selectedTransaction.amount || 0))}</strong></div>
              </div>
              <div className="ledger-insights-list">
                <div className="ledger-insight-card">
                  <span className="badge badge-blue">explicação</span>
                  <p>{selectedTransaction.explanation || "Sem explicação adicional."}</p>
                </div>
                <div className="ledger-insight-card">
                  <span className="badge badge-neutral">raw preview</span>
                  <pre className="search-raw-preview">{JSON.stringify(selectedTransaction.rawPreview || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
