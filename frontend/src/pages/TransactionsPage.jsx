import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Check,
  FileText,
  Filter,
  LoaderCircle,
  PencilLine,
  ReceiptText,
  RefreshCw,
  Search,
  Tag,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TransactionExplanationColumn from "../components/ledgerAnalytics/TransactionExplanationColumn.jsx";
import TransactionTotalsBar from "../components/ledgerAnalytics/TransactionTotalsBar.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import { getAllTransactions } from "../services/financialSyncApi.js";
import { updateLedgerTransaction } from "../services/ledgerImportApi.js";
import { buildTransactionsUrl } from "../utils/financialNavigation.js";

const LS_KEY = "finsync_txn_filters_v2";
const PAGE_SIZE = 50;

function sanitizeParam(value, maxLength = 120) {
  return String(value || "")
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLength);
}

function loadPersistedFilters() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveFilters(filters) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(filters));
  } catch {}
}

const TYPE_OPTIONS = [
  { value: "", label: "Todos os tipos" },
  { value: "CREDIT", label: "Crédito / Entrada" },
  { value: "DEBIT", label: "Débito / Saída" }
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "REVIEWED", label: "Em revisão" },
  { value: "DISCARDED", label: "Descartado" },
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "SCHEDULED", label: "Agendado" }
];

const SOURCE_OPTIONS = [
  { value: "", label: "Todas as fontes" },
  { value: "CSV_UPLOAD", label: "CSV manual" },
  { value: "ONEDRIVE_CSV", label: "OneDrive CSV" },
  { value: "MANUAL", label: "Manual" }
];

const PAYMENT_OPTIONS = [
  { value: "", label: "Forma de pagamento" },
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CASH", label: "Dinheiro" },
  { value: "TRANSFER", label: "Transferência" }
];

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function SkeletonRow() {
  return (
    <div className="txn-row txn-row-skeleton">
      <div className="skeleton" style={{ height: 13, width: "55%" }} />
      <div className="skeleton" style={{ height: 13, width: "75%" }} />
      <div className="skeleton" style={{ height: 13, width: "40%" }} />
      <div className="skeleton" style={{ height: 13, width: "45%" }} />
      <div className="skeleton" style={{ height: 13, width: "70%" }} />
      <div className="skeleton" style={{ height: 20, width: 68, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 13, width: "50%" }} />
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="txn-empty">
      <div className="txn-empty-icon"><ReceiptText size={26} /></div>
      <h2>{hasFilters ? "Nenhuma transação encontrada" : "Sem transações registradas"}</h2>
      <p>{hasFilters ? "Ajuste o período, origem ou critérios de busca." : "Importe um CSV ou adicione lançamentos manuais para começar."}</p>
      {hasFilters && (
        <button className="btn btn-secondary btn-sm" style={{ marginTop: ".75rem" }} onClick={onClear}>
          <X size={12} /> Limpar filtros
        </button>
      )}
    </div>
  );
}

function TypeBadge({ amount, type }) {
  const isCredit = amount > 0 || type === "CREDIT" || type === "INCOME";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: ".25rem", fontSize: ".62rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".12rem .5rem", borderRadius: 4, background: isCredit ? "rgba(16,185,129,.1)" : "rgba(6,182,212,.1)", color: isCredit ? "var(--success)" : "var(--cyan)", border: `1px solid ${isCredit ? "rgba(16,185,129,.2)" : "rgba(6,182,212,.2)"}` }}>
      {isCredit ? <ArrowUpRight size={9} /> : <ArrowDownLeft size={9} />}
      {isCredit ? "Entrada" : "Saída"}
    </span>
  );
}

function SourceBadge({ source }) {
  const config = {
    CSV_UPLOAD: { label: "CSV", icon: FileText, bg: "rgba(157,255,44,.08)", color: "#9DFF2C", border: "rgba(157,255,44,.2)" },
    ONEDRIVE_CSV: { label: "OneDrive", icon: FileText, bg: "rgba(6,182,212,.08)", color: "#06b6d4", border: "rgba(6,182,212,.2)" },
    MANUAL: { label: "Manual", icon: User, bg: "rgba(167,139,250,.08)", color: "var(--purple-light)", border: "rgba(167,139,250,.2)" }
  };
  const c = config[source] || config.MANUAL;
  const Icon = c.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: ".25rem", fontSize: ".58rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".1rem .45rem", borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      <Icon size={9} />{c.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { label: "Confirmado", bg: "rgba(16,185,129,.1)", color: "var(--success)", border: "rgba(16,185,129,.2)" },
    REVIEWED: { label: "Em revisão", bg: "rgba(251,155,54,.12)", color: "#FB9B36", border: "rgba(251,155,54,.24)" },
    DISCARDED: { label: "Descartado", bg: "rgba(239,68,68,.1)", color: "var(--error)", border: "rgba(239,68,68,.22)" },
    PAID: { label: "Pago", bg: "rgba(16,185,129,.1)", color: "var(--success)", border: "rgba(16,185,129,.2)" },
    PENDING: { label: "Pendente", bg: "rgba(245,158,11,.1)", color: "#f59e0b", border: "rgba(245,158,11,.2)" },
    SCHEDULED: { label: "Agendado", bg: "rgba(148,163,184,.1)", color: "var(--muted)", border: "rgba(148,163,184,.2)" }
  };
  const c = map[status];
  if (!c) return null;
  return <span style={{ fontSize: ".58rem", fontFamily: "var(--mono)", fontWeight: 600, padding: ".1rem .45rem", borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{c.label}</span>;
}

function ConfidenceBadge({ label }) {
  const map = {
    detectado: { bg: "rgba(16,185,129,.1)", color: "var(--success)", border: "rgba(16,185,129,.2)" },
    "provável": { bg: "rgba(251,155,54,.12)", color: "#FB9B36", border: "rgba(251,155,54,.24)" },
    "precisa revisar": { bg: "rgba(239,68,68,.1)", color: "var(--error)", border: "rgba(239,68,68,.22)" }
  };
  const c = map[label] || map["precisa revisar"];
  return <span style={{ fontSize: ".58rem", fontFamily: "var(--mono)", fontWeight: 600, padding: ".1rem .45rem", borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{label}</span>;
}

export default function TransactionsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const persisted = useMemo(() => loadPersistedFilters(), []);
  const highlightedTransactionId = sanitizeParam(searchParams.get("transactionId"));

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(sanitizeParam(persisted?.search ?? ""));
  const [type, setType] = useState(sanitizeParam(searchParams.get("type") ?? persisted?.type ?? ""));
  const [status, setStatus] = useState(sanitizeParam(searchParams.get("status") ?? persisted?.status ?? ""));
  const [source, setSource] = useState(sanitizeParam(searchParams.get("source") ?? persisted?.source ?? ""));
  const [payment, setPayment] = useState(sanitizeParam(searchParams.get("paymentMethod") ?? persisted?.payment ?? ""));
  const [month, setMonth] = useState(sanitizeParam(searchParams.get("month") ?? persisted?.month ?? ""));
  const [year, setYear] = useState(sanitizeParam(searchParams.get("year") ?? persisted?.year ?? ""));
  const [startDate, setStartDate] = useState(sanitizeParam(searchParams.get("startDate") ?? persisted?.startDate ?? "", 10));
  const [endDate, setEndDate] = useState(sanitizeParam(searchParams.get("endDate") ?? persisted?.endDate ?? "", 10));
  const [category, setCategory] = useState(sanitizeParam(searchParams.get("category") ?? persisted?.category ?? ""));
  const [bank, setBank] = useState(persisted?.bank ?? "");
  const [fileName, setFileName] = useState(persisted?.fileName ?? "");
  const [minAmount, setMinAmount] = useState(sanitizeParam(searchParams.get("minAmount") ?? persisted?.minAmount ?? "", 24));
  const [maxAmount, setMaxAmount] = useState(sanitizeParam(searchParams.get("maxAmount") ?? persisted?.maxAmount ?? "", 24));
  const [showFilters, setShowFilters] = useState(Boolean(searchParams.get("type") || searchParams.get("status") || searchParams.get("source") || searchParams.get("paymentMethod") || searchParams.get("category") || searchParams.get("startDate") || searchParams.get("endDate") || searchParams.get("minAmount") || searchParams.get("maxAmount")));
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [savingId, setSavingId] = useState("");

  const requestFilters = useMemo(() => ({
    search,
    type,
    status,
    source,
    paymentMethod: payment,
    month,
    year,
    startDate,
    endDate,
    category,
    bank,
    fileName,
    minAmount,
    maxAmount
  }), [search, type, status, source, payment, month, year, startDate, endDate, category, bank, fileName, minAmount, maxAmount]);

  useEffect(() => {
    setType(sanitizeParam(searchParams.get("type") ?? persisted?.type ?? ""));
    setStatus(sanitizeParam(searchParams.get("status") ?? persisted?.status ?? ""));
    setSource(sanitizeParam(searchParams.get("source") ?? persisted?.source ?? ""));
    setPayment(sanitizeParam(searchParams.get("paymentMethod") ?? persisted?.payment ?? ""));
    setMonth(sanitizeParam(searchParams.get("month") ?? persisted?.month ?? ""));
    setYear(sanitizeParam(searchParams.get("year") ?? persisted?.year ?? ""));
    setStartDate(sanitizeParam(searchParams.get("startDate") ?? persisted?.startDate ?? "", 10));
    setEndDate(sanitizeParam(searchParams.get("endDate") ?? persisted?.endDate ?? "", 10));
    setCategory(sanitizeParam(searchParams.get("category") ?? persisted?.category ?? ""));
    setMinAmount(sanitizeParam(searchParams.get("minAmount") ?? persisted?.minAmount ?? "", 24));
    setMaxAmount(sanitizeParam(searchParams.get("maxAmount") ?? persisted?.maxAmount ?? "", 24));
    setShowFilters(Boolean(searchParams.get("type") || searchParams.get("status") || searchParams.get("source") || searchParams.get("paymentMethod") || searchParams.get("category") || searchParams.get("startDate") || searchParams.get("endDate") || searchParams.get("minAmount") || searchParams.get("maxAmount")));
  }, [persisted, searchParams]);

  useEffect(() => {
    saveFilters({ search, type, status, source, payment, month, year, startDate, endDate, category, bank, fileName, minAmount, maxAmount });
  }, [search, type, status, source, payment, month, year, startDate, endDate, category, bank, fileName, minAmount, maxAmount]);

  function load(nextPage = 0, append = false) {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries({
        ...requestFilters,
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE
      }).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );

    getAllTransactions(params)
      .then((data) => {
        const txs = Array.isArray(data?.transactions) ? data.transactions : [];
        setItems((current) => append ? [...current, ...txs] : txs);
        setSummary(data?.summary || {});
        setTotal(data?.total || 0);
        setHasMore(Boolean(data?.hasMore));
        setPage(nextPage);
      })
      .catch(() => toast.error("Não foi possível carregar as transações."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(0, false);
  }, [requestFilters]);

  useEffect(() => {
    if (!highlightedTransactionId || loading || !items.length) {
      return;
    }

    const element = document.getElementById(`transaction-row-${highlightedTransactionId}`);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedTransactionId, items, loading]);

  const uniqueBanks = useMemo(() => [...new Set(items.map((item) => item.bank).filter(Boolean))].sort(), [items]);
  const uniqueCategories = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(), [items]);
  const uniqueFiles = useMemo(() => [...new Set(items.map((item) => item.fileName).filter(Boolean))].sort(), [items]);

  const hasFilters = Boolean(search || type || status || source || payment || month || year || startDate || endDate || category || bank || fileName || minAmount || maxAmount);

  function clearFilters() {
    setSearch("");
    setType("");
    setStatus("");
    setSource("");
    setPayment("");
    setMonth("");
    setYear("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setBank("");
    setFileName("");
    setMinAmount("");
    setMaxAmount("");
    try { localStorage.removeItem(LS_KEY); } catch {}
  }

  function startCategoryEdit(transaction) {
    if (transaction.source !== "CSV_UPLOAD" && transaction.source !== "ONEDRIVE_CSV") {
      return;
    }
    setEditingId(transaction.id);
    setDraftCategory(transaction.category || "");
  }

  function cancelCategoryEdit() {
    setEditingId("");
    setDraftCategory("");
  }

  async function saveCategory(transaction) {
    const value = draftCategory.trim();
    setSavingId(transaction.id);

    try {
      const updated = await updateLedgerTransaction(transaction.id, {
        category: value || null,
        userCategory: value || null,
        reviewedAt: new Date().toISOString()
      });

      setItems((current) => current.map((item) => item.id === transaction.id ? { ...item, ...updated, category: updated.category || null } : item));
      toast.success("Categoria atualizada com sucesso.");
      cancelCategoryEdit();
      window.dispatchEvent(new CustomEvent("finsync:ledger-updated"));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível atualizar a categoria.");
    } finally {
      setSavingId("");
    }
  }

  function openTransactionDetails(transactionId) {
    navigate(buildTransactionsUrl({ transactionId }));
  }

  function shouldIgnoreRowNavigation(target) {
    return Boolean(target?.closest("button, input, textarea, select, a, [data-no-transaction-nav='true']"));
  }

  return (
    <AppLayout breadcrumb="Transações">
      <div className="anim-fade-in">
        <div className="txn-page-header">
          <div>
            <h1 className="dash-page-title">Transações</h1>
            <p className="dash-page-sub">Ledger, OneDrive e lançamentos manuais com filtros por período, origem, arquivo e valor.</p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => load(0, false)} disabled={loading} title="Recarregar">
              <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
            <button className={`btn btn-sm ${showFilters ? "btn-secondary" : "btn-ghost"}`} onClick={() => setShowFilters((value) => !value)}>
              <Filter size={13} />
              Filtros
              {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--purple)", marginLeft: ".1rem" }} />}
            </button>
          </div>
        </div>

        {highlightedTransactionId && (
          <div className="card txn-focus-banner">
            <strong>Transação em foco</strong>
            <span>O filtro abriu esta tela com uma transação destacada para investigação detalhada.</span>
          </div>
        )}

        <TransactionTotalsBar summary={summary} />

        <div className="txn-search-bar">
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted-2)", pointerEvents: "none" }} />
            <input className="input" placeholder="Buscar por descrição, estabelecimento, categoria, arquivo..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.4rem" }} />
          </div>
          {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch("")}><X size={13} /></button>}
        </div>

        {showFilters && (
          <div className="txn-filter-panel card anim-fade-in">
            <div className="input-group">
              <label className="input-label">Data inicial</label>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Data final</label>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Ano</label>
              <input className="input" type="number" min="2000" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Mês</label>
              <input className="input" type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </div>
            <div className="input-group">
              <label className="input-label">Origem</label>
              <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>{SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </div>
            <div className="input-group">
              <label className="input-label">Pagamento</label>
              <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>{PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            </div>
            <div className="input-group">
              <label className="input-label">Categoria</label>
              <input className="input" list="cat-list" value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="cat-list">{uniqueCategories.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="input-group">
              <label className="input-label">Banco</label>
              <input className="input" list="bank-list" value={bank} onChange={(e) => setBank(e.target.value)} />
              <datalist id="bank-list">{uniqueBanks.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="input-group">
              <label className="input-label">Arquivo CSV</label>
              <input className="input" list="file-list" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              <datalist id="file-list">{uniqueFiles.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
            <div className="input-group">
              <label className="input-label">Valor mínimo</label>
              <input className="input" type="number" min="0" step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Valor máximo</label>
              <input className="input" type="number" min="0" step="0.01" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </div>
            {hasFilters && (
              <div className="input-group" style={{ justifyContent: "flex-end" }}>
                <label className="input-label" style={{ visibility: "hidden" }}>_</label>
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={12} />Limpar</button>
              </div>
            )}
          </div>
        )}

        <div className="txn-table card">
          <div className="txn-head">
            <span>Data</span>
            <span>Descrição</span>
            <span>Categoria</span>
            <span>Banco / Fonte</span>
            <span>Explicação</span>
            <span>Tipo</span>
            <span style={{ textAlign: "right" }}>Valor</span>
          </div>

          {loading ? (
            Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} />)
          ) : items.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            <>
              {items.map((item) => {
                const isCredit = item.amount > 0 || item.type === "CREDIT" || item.type === "INCOME";
                const institution = item.bank || item.accountName || "—";
                const editable = item.source === "CSV_UPLOAD" || item.source === "ONEDRIVE_CSV";
                const isHighlighted = highlightedTransactionId && String(item.id) === highlightedTransactionId;

                return (
                  <div
                    className={`txn-row txn-row-clickable ${isHighlighted ? "txn-row-highlighted" : ""}`}
                    key={`${item.source}-${item.id}`}
                    id={`transaction-row-${item.id}`}
                    role="link"
                    tabIndex={0}
                    aria-label={`Abrir investigação de ${item.description || "transação"}`}
                    onClick={(event) => {
                      if (editingId === item.id || shouldIgnoreRowNavigation(event.target)) return;
                      openTransactionDetails(item.id);
                    }}
                    onKeyDown={(event) => {
                      if (editingId === item.id || shouldIgnoreRowNavigation(event.target)) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTransactionDetails(item.id);
                      }
                    }}
                  >
                    <span className="txn-date mono">{fmtDate(item.date)}</span>

                    <span className="txn-desc" style={{ flexDirection: "column", alignItems: "flex-start", gap: ".2rem" }}>
                      <strong style={{ fontSize: ".79rem" }}>{item.description || "—"}</strong>
                      <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap" }}>
                        <SourceBadge source={item.source} />
                        {item.status && <StatusBadge status={item.status} />}
                        {item.paymentMethod && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: ".2rem", fontSize: ".57rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".08rem .4rem", borderRadius: 3, background: "var(--s3)", color: "var(--muted)", border: "1px solid var(--border-b2)" }}>
                            <Tag size={8} />{item.paymentMethod}
                          </span>
                        )}
                        {item.fileName && <span className="badge badge-neutral">{item.fileName}</span>}
                      </div>
                    </span>

                    <span className="txn-category">
                      {editingId === item.id ? (
                        <span className="txn-category-editor">
                          <input data-no-transaction-nav="true" className="input txn-category-input" list="cat-list" autoFocus value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveCategory(item); if (e.key === "Escape") cancelCategoryEdit(); }} />
                          <button data-no-transaction-nav="true" className="btn btn-ghost btn-sm" type="button" disabled={savingId === item.id} onClick={() => saveCategory(item)} title="Salvar categoria">
                            {savingId === item.id ? <LoaderCircle size={12} className="spin" /> : <Check size={12} />}
                          </button>
                          <button data-no-transaction-nav="true" className="btn btn-ghost btn-sm" type="button" disabled={savingId === item.id} onClick={cancelCategoryEdit} title="Cancelar edição">
                            <X size={12} />
                          </button>
                        </span>
                      ) : (
                        <button data-no-transaction-nav="true" className={`txn-category-trigger ${!editable ? "is-readonly" : ""}`} type="button" onClick={() => startCategoryEdit(item)} title={editable ? "Editar categoria" : "Somente transações importadas podem ser editadas aqui"}>
                          <span>{item.category || "Definir categoria"}</span>
                          {editable && <PencilLine size={11} />}
                        </button>
                      )}
                    </span>

                    <span className="txn-bank">
                      <Building2 size={10} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{institution}</span>
                    </span>

                    <div className="txn-desc" style={{ flexDirection: "column", alignItems: "flex-start", gap: ".2rem" }}>
                      <TransactionExplanationColumn item={item} />
                      <div style={{ display: "flex", gap: ".25rem", flexWrap: "wrap" }}>
                        {item.confidenceLabel && <ConfidenceBadge label={item.confidenceLabel} />}
                        {item.needsReview && <span className="badge badge-warning">revisar</span>}
                      </div>
                    </div>

                    <span><TypeBadge amount={item.amount} type={item.type} /></span>

                    <span className="txn-amount mono" style={{ color: isCredit ? "var(--success)" : "var(--cyan)", textAlign: "right" }}>
                      {isCredit ? "+" : "-"}{fmtCur(Math.abs(item.amount))}
                    </span>
                  </div>
                );
              })}

              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => load(page + 1, true)} disabled={loading}>
                    Carregar mais
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div style={{ marginTop: ".75rem", textAlign: "center", fontFamily: "var(--mono)", fontSize: ".61rem", color: "var(--dim)" }}>
            {items.length} exibidas nesta página · {total} no total
          </div>
        )}
      </div>
    </AppLayout>
  );
}
