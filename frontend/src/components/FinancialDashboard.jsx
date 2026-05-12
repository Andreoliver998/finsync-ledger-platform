import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Link2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";

const SOURCE_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "MANUAL", label: "Manual" },
  { value: "OPEN_FINANCE", label: "Open Finance" },
  { value: "CSV_IMPORT", label: "CSV Manual" },
  { value: "ONEDRIVE_CSV", label: "OneDrive CSV" },
  { value: "LEDGER", label: "Ledger" }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "PIX", label: "PIX" },
  { value: "TED", label: "TED" },
  { value: "DOC", label: "DOC" },
  { value: "CREDIT", label: "Crédito" },
  { value: "DEBIT", label: "Débito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CASH", label: "Dinheiro" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "OTHER", label: "Outro" }
];

const TAG_LABELS = {
  pix_recebido: "PIX recebido",
  pix_enviado: "PIX enviado",
  ted: "TED",
  doc: "DOC",
  tarifa: "Tarifa",
  estorno: "Estorno / Cashback",
  boleto: "Boleto",
  salario: "Salário",
  investimento: "Investimento",
  fatura_cartao: "Fatura cartão",
  outros_saida: "Outros débitos",
  outros_entrada: "Outros créditos"
};

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function fmtDateFull(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function fmtRelative(value) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({ label, value, note, icon: Icon, accent, loading, badge, trend, to }) {
  const card = (
    <div className="stat-card">
      <div className="stat-accent" style={{ background: accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
        <div className="stat-label">{label}</div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--s3)", border: "1px solid var(--border-b2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-2)" }}>
          <Icon size={13} />
        </div>
      </div>
      <div className="stat-value">{loading ? "..." : value}</div>
      {badge && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", fontSize: ".6rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".15rem .5rem", borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, marginTop: ".3rem" }}>
          {badge.label}
        </span>
      )}
      {trend !== undefined && trend !== null && (
        <div className={`stat-change ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
          {Math.abs(trend).toFixed(1)}% vs mês anterior
        </div>
      )}
      {note && !badge && trend === undefined && (
        <div style={{ fontFamily: "var(--mono)", fontSize: ".6rem", color: "var(--dim)", marginTop: ".2rem" }}>
          {note}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="stat-card-link" title={`Ver ${label}`}>
        {card}
      </Link>
    );
  }
  return card;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

function MonthlyFlowChart({ data = [], loading }) {
  const H = 110;
  const maxVal = Math.max(...data.map((d) => Math.max(d.income || 0, d.expenses || 0)), 1);
  const cols = data.length || 1;
  const slotW = 100 / cols;
  const barW = Math.min(slotW * 0.32, 8);

  return (
    <div>
      <div className="dash-section-title">
        <BarChart3 size={15} style={{ color: "var(--muted-2)" }} />
        <span>Fluxo 6 meses</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: ".75rem", fontSize: ".63rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#7c3aed", display: "inline-block" }} />Receita
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#06b6d4", display: "inline-block" }} />Despesa
          </span>
        </span>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 170 }}>
        {loading ? (
          <div className="chart-placeholder"><BarChart3 size={28} /><span>Carregando...</span></div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder"><BarChart3 size={28} /><span>Sem dados de fluxo</span></div>
        ) : (
          <svg viewBox={`0 0 100 ${H}`} style={{ width: "100%", height: H, overflow: "visible" }} preserveAspectRatio="xMidYMid meet">
            {data.map((d, i) => {
              const x = i * slotW + slotW / 2;
              const incH = ((d.income || 0) / maxVal) * (H - 24);
              const expH = ((d.expenses || 0) / maxVal) * (H - 24);
              return (
                <g key={d.month}>
                  <rect x={x - barW - 1} y={H - 20 - incH} width={barW} height={incH || 2} fill="#7c3aed" fillOpacity={0.85} rx="1.5" />
                  <rect x={x + 1} y={H - 20 - expH} width={barW} height={expH || 2} fill="#06b6d4" fillOpacity={0.75} rx="1.5" />
                  <text x={x} y={H - 5} textAnchor="middle" fontSize="4.5" fill="var(--muted)" fontFamily="monospace">
                    {d.month?.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Daily Sparkline ───────────────────────────────────────────────────────────

function DailySparkline({ data = [], loading }) {
  const H = 60;
  const W = 200;
  const maxVal = Math.max(...data.map((d) => Math.max(d.income || 0, d.expenses || 0)), 1);
  const pts = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * W;
    const y = H - ((d.income || 0) / maxVal) * H;
    return `${x},${y}`;
  });

  return (
    <div>
      <div className="dash-section-title">
        <TrendingUp size={15} style={{ color: "var(--muted-2)" }} />
        <span>Movimentação 30 dias</span>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 120 }}>
        {loading ? (
          <div className="chart-placeholder"><TrendingUp size={24} /><span>Carregando...</span></div>
        ) : data.length === 0 ? (
          <div className="chart-placeholder"><TrendingUp size={24} /><span>Sem movimentação recente</span></div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill="url(#sparkGrad)" />
            <polyline points={pts.join(" ")} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Category Breakdown ────────────────────────────────────────────────────────

function CategoryBreakdown({ items = [], title = "Gastos por categoria" }) {
  const max = Math.max(...items.map((i) => i.amount || 0), 1);
  const COLORS = ["#7c3aed", "#06b6d4", "#ec4899", "#10b981", "#fb923c", "#a78bfa", "#f59e0b", "#67e8f9"];

  return (
    <div>
      <div className="dash-section-title">
        <BarChart3 size={15} style={{ color: "var(--muted-2)" }} />
        <span>{title}</span>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 220 }}>
        {items.length === 0 ? (
          <div className="chart-placeholder"><BarChart3 size={28} /><span>Sem dados categorizados</span></div>
        ) : (
          <div style={{ display: "grid", gap: ".65rem" }}>
            {items.slice(0, 8).map((item, i) => (
              <div key={item.category || item.type || i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".73rem", marginBottom: ".25rem" }}>
                  <span style={{ fontWeight: 600 }}>{item.category || TAG_LABELS[item.type] || item.type || "—"}</span>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>{fmtCur(item.amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "var(--s3)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max((item.amount / max) * 100, item.amount ? 3 : 0)}%`, height: "100%", background: COLORS[i % COLORS.length], transition: "width .4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Anomaly Widget ────────────────────────────────────────────────────────────

function AnomalyWidget({ anomalies = [], loading }) {
  return (
    <div>
      <div className="dash-section-title">
        <AlertTriangle size={15} style={{ color: "#f59e0b" }} />
        <span>Gastos atípicos</span>
        {anomalies.length > 0 && (
          <span style={{ marginLeft: ".5rem", fontSize: ".6rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".1rem .45rem", borderRadius: 4, background: "rgba(245,158,11,.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.25)" }}>
            {anomalies.length}
          </span>
        )}
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 160 }}>
        {loading ? (
          <div className="chart-placeholder"><AlertTriangle size={24} /><span>Analisando...</span></div>
        ) : anomalies.length === 0 ? (
          <div className="chart-placeholder" style={{ color: "var(--success)" }}>
            <CheckCircle2 size={24} style={{ color: "var(--success)" }} />
            <span>Nenhum gasto atípico detectado</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: ".65rem" }}>
            {anomalies.map((a) => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".5rem", alignItems: "start", padding: ".6rem .75rem", borderRadius: 8, background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.15)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".78rem", marginBottom: ".15rem" }}>{a.description || "Transação"}</div>
                  <div style={{ fontSize: ".65rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                    {fmtDate(a.date)} · {a.category || "Sem categoria"} · +{a.deviation}% da média
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontFamily: "var(--mono)", fontSize: ".8rem", color: "#f59e0b", whiteSpace: "nowrap" }}>
                  {fmtCur(a.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recent Imports ────────────────────────────────────────────────────────────

function RecentImports({ imports = [], loading }) {
  const statusConfig = {
    COMPLETED: { label: "Concluído", bg: "rgba(16,185,129,.1)", color: "var(--success)", border: "rgba(16,185,129,.2)" },
    PROCESSING: { label: "Processando", bg: "rgba(245,158,11,.1)", color: "#f59e0b", border: "rgba(245,158,11,.2)" },
    ERROR: { label: "Erro", bg: "rgba(239,68,68,.1)", color: "var(--error)", border: "rgba(239,68,68,.2)" },
    PENDING: { label: "Pendente", bg: "rgba(148,163,184,.1)", color: "var(--muted)", border: "rgba(148,163,184,.2)" }
  };

  return (
    <div>
      <div className="dash-section-title">
        <FileText size={15} style={{ color: "var(--muted-2)" }} />
        <span>Importações recentes</span>
        <Link to="/ledger/imports" style={{ marginLeft: "auto", fontSize: ".65rem", color: "var(--purple-light)", textDecoration: "none" }}>
          Ver todas →
        </Link>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 160 }}>
        {loading ? (
          <div className="chart-placeholder"><FileText size={24} /><span>Carregando...</span></div>
        ) : imports.length === 0 ? (
          <div className="chart-placeholder">
            <FileText size={24} />
            <span>Nenhum CSV importado ainda</span>
            <Link to="/ledger/imports" className="btn btn-primary btn-sm" style={{ marginTop: ".5rem" }}>Importar CSV</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: ".55rem" }}>
            {imports.map((imp) => {
              const sc = statusConfig[imp.status] || statusConfig.PENDING;
              return (
                <div key={imp.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".5rem", alignItems: "center", paddingBottom: ".55rem", borderBottom: "1px solid var(--border-b2)" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".76rem", marginBottom: ".1rem" }}>{imp.fileName || "arquivo.csv"}</div>
                    <div style={{ fontSize: ".63rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                      {imp.bank || "—"} · {imp.importedRows ?? 0} linhas · {fmtRelative(imp.createdAt)}
                    </div>
                  </div>
                  <span style={{ fontSize: ".6rem", fontFamily: "var(--mono)", fontWeight: 700, padding: ".1rem .45rem", borderRadius: 4, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, whiteSpace: "nowrap" }}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Highlight Card ────────────────────────────────────────────────────────────

function HighlightCard({ label, data, color, icon: Icon, loading }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".75rem" }}>
        <Icon size={14} style={{ color }} />
        <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 4 }} />
      ) : !data ? (
        <div style={{ fontSize: ".78rem", color: "var(--dim)" }}>Sem dados no período</div>
      ) : (
        <>
          <div style={{ fontWeight: 900, fontFamily: "var(--mono)", fontSize: "1.1rem", color, marginBottom: ".3rem" }}>
            {fmtCur(data.amount)}
          </div>
          <div style={{ fontSize: ".73rem", fontWeight: 600, marginBottom: ".15rem" }}>{data.description || "—"}</div>
          <div style={{ fontSize: ".63rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
            {fmtDateFull(data.date)}{data.category ? ` · ${data.category}` : ""}
          </div>
        </>
      )}
    </div>
  );
}

// ── Accounts ──────────────────────────────────────────────────────────────────

function AccountsOverview({ accounts = [], loading }) {
  return (
    <div>
      <div className="dash-section-title">
        <Building2 size={15} style={{ color: "var(--muted-2)" }} />
        <span>Contas bancárias</span>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 200 }}>
        {loading ? (
          <div className="chart-placeholder"><Building2 size={28} /><span>Carregando contas...</span></div>
        ) : accounts.length === 0 ? (
          <div className="chart-placeholder">
            <Building2 size={28} />
            <span>Nenhuma conta sincronizada</span>
            <Link to="/open-finance/connect" className="btn btn-primary btn-sm" style={{ marginTop: ".5rem" }}>Conectar banco</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: ".65rem" }}>
            {accounts.slice(0, 6).map((acc) => (
              <div key={acc.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".5rem", alignItems: "center", paddingBottom: ".65rem", borderBottom: "1px solid var(--border-b2)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: ".82rem" }}>{acc.marketingName || acc.name || "Conta bancária"}</div>
                  <div style={{ color: "var(--muted)", fontSize: ".68rem", marginTop: ".1rem" }}>
                    {acc.connection?.institution || "—"}{acc.type ? ` · ${acc.type}` : ""}
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontFamily: "var(--mono)", fontSize: ".8rem" }}>{fmtCur(acc.balance)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Latest Transactions ───────────────────────────────────────────────────────

function LatestTransactions({ items = [], loading }) {
  return (
    <div>
      <div className="dash-section-title">
        <ReceiptText size={15} style={{ color: "var(--muted-2)" }} />
        <span>Últimas transações</span>
        <Link to="/transactions" style={{ marginLeft: "auto", fontSize: ".65rem", color: "var(--purple-light)", textDecoration: "none" }}>
          Ver todas →
        </Link>
      </div>
      <div className="card" style={{ padding: "1rem", minHeight: 200 }}>
        {loading ? (
          <div className="chart-placeholder"><ReceiptText size={28} /><span>Carregando...</span></div>
        ) : items.length === 0 ? (
          <div className="chart-placeholder"><ReceiptText size={28} /><span>Nenhuma transação ainda</span></div>
        ) : (
          <div style={{ display: "grid", gap: ".65rem" }}>
            {items.slice(0, 8).map((t) => {
              const isExp = t.amount < 0 || t.type === "DEBIT" || t.type === "EXPENSE";
              return (
                <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".5rem", alignItems: "start", paddingBottom: ".65rem", borderBottom: "1px solid var(--border-b2)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: ".78rem", marginBottom: ".1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description || "Transação"}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: ".65rem", fontFamily: "var(--mono)" }}>
                      {fmtDate(t.date)} · {t.category || t.source || "—"}
                    </div>
                  </div>
                  <div style={{ color: isExp ? "var(--cyan)" : "var(--success)", fontWeight: 900, fontFamily: "var(--mono)", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                    {isExp ? "-" : "+"}{fmtCur(Math.abs(t.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Period Chips ──────────────────────────────────────────────────────────────

const _now = new Date();

const PERIOD_CHIPS = [
  {
    label: "Todo o período",
    get() {
      return { period: "ALL", month: "", year: "", startDate: "", endDate: "" };
    }
  },
  {
    label: "Este mês",
    get() {
      return { period: "CURRENT_MONTH", month: String(_now.getMonth() + 1), year: String(_now.getFullYear()), startDate: "", endDate: "" };
    }
  },
  {
    label: "Mês passado",
    get() {
      const d = new Date(_now.getFullYear(), _now.getMonth() - 1, 1);
      return { period: "CUSTOM", month: String(d.getMonth() + 1), year: String(d.getFullYear()), startDate: "", endDate: "" };
    }
  },
  {
    label: "Este ano",
    get() { return { period: "CURRENT_YEAR", month: "", year: String(_now.getFullYear()), startDate: "", endDate: "" }; }
  },
  {
    label: "Ano passado",
    get() { return { period: "CUSTOM", month: "", year: String(_now.getFullYear() - 1), startDate: "", endDate: "" }; }
  }
];

function PeriodChips({ filters, onChange }) {
  return (
    <div className="period-chips">
      {PERIOD_CHIPS.map((chip) => {
        const target = chip.get();
        const active =
          target.period === filters.period &&
          target.month === filters.month &&
          target.year === filters.year &&
          (target.startDate || "") === (filters.startDate || "") &&
          (target.endDate || "") === (filters.endDate || "");
        return (
          <button
            key={chip.label}
            className={`period-chip${active ? " active" : ""}`}
            type="button"
            onClick={() => onChange({ ...filters, ...target })}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Filter Panel ──────────────────────────────────────────────────────────────

function DashboardFilters({ filters, onChange, onClear }) {
  function up(field, value) { onChange({ ...filters, [field]: value }); }

  return (
    <div className="dashboard-filters card" style={{ marginBottom: "1.5rem" }}>
      <div className="input-group">
        <label className="input-label">Período livre</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".45rem" }}>
          <input className="input" type="date" value={filters.startDate || ""} onChange={(e) => up("startDate", e.target.value)} />
          <input className="input" type="date" value={filters.endDate || ""} onChange={(e) => up("endDate", e.target.value)} />
        </div>
      </div>
      <div className="input-group">
        <label className="input-label">Mês</label>
        <input className="input" type="number" min="1" max="12" value={filters.month} onChange={(e) => up("month", e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Ano</label>
        <input className="input" type="number" min="2000" value={filters.year} onChange={(e) => up("year", e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Origem</label>
        <select className="input" value={filters.source} onChange={(e) => up("source", e.target.value)}>
          {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Categoria</label>
        <input className="input" placeholder="Todas" value={filters.category} onChange={(e) => up("category", e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Banco</label>
        <input className="input" placeholder="Todos" value={filters.bank} onChange={(e) => up("bank", e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Forma</label>
        <select className="input" value={filters.paymentMethod} onChange={(e) => up("paymentMethod", e.target.value)}>
          {PAYMENT_METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onClear} style={{ alignSelf: "flex-end" }}>Limpar</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════

export default function FinancialDashboard({
  summary,
  metrics,
  accounts = [],
  filters,  
  loading = false,
  error = "",
  onFiltersChange,
  onFiltersClear
}) {
  const s = summary || {};
  const m = metrics || {};
  const kpis = m.kpis || {};

  const netBalance = (s.monthIncome || 0) - (s.monthExpenses || 0);
  const savingsRate = s.monthIncome > 0 ? (netBalance / s.monthIncome) * 100 : 0;

  const mp = `month=${filters?.month || ""}&year=${filters?.year || ""}`;

  const kpiCards = [
    { label: "Saldo Total",         value: fmtCur(s.totalBalance),                                        icon: Wallet,        accent: "linear-gradient(90deg,#7c3aed,transparent)",  note: "Open Finance + manual" },
    { label: "Receita do Mês",      value: fmtCur(s.monthIncome),                                         icon: ArrowUpRight,  accent: "linear-gradient(90deg,#10b981,transparent)",  note: "Entradas no período",    to: `/transactions?${mp}&type=CREDIT` },
    { label: "Despesas do Mês",     value: fmtCur(s.monthExpenses),                                       icon: TrendingDown,  accent: "linear-gradient(90deg,#06b6d4,transparent)",  note: "Saídas no período",      to: `/transactions?${mp}&type=DEBIT` },
    {
      label: "Saldo Líquido",
      value: fmtCur(Math.abs(netBalance)),
      icon: TrendingUp,
      accent: `linear-gradient(90deg,${netBalance >= 0 ? "#10b981" : "#ef4444"},transparent)`,
      badge: netBalance >= 0
        ? { label: `+${savingsRate.toFixed(1)}% poupança`, bg: "rgba(16,185,129,.1)", color: "var(--success)", border: "rgba(16,185,129,.2)" }
        : { label: "Déficit",  bg: "rgba(239,68,68,.1)",   color: "var(--error)",   border: "rgba(239,68,68,.2)"  }
    },
    { label: "Contas Conectadas",   value: String(s.connectedAccounts ?? 0),                               icon: Building2,     accent: "linear-gradient(90deg,#67e8f9,transparent)",  note: "Open Finance",           to: "/open-finance/connect" },
    { label: "Total de Transações", value: String(kpis.totalTransactions ?? s.transactionsCount ?? 0),     icon: ReceiptText,   accent: "linear-gradient(90deg,#a78bfa,transparent)",  note: "Todas as fontes",        to: `/transactions?${mp}` },
    { label: "Arquivos CSV",        value: String(kpis.totalImportedFiles ?? s.processedFilesCount ?? 0),  icon: FileText,      accent: "linear-gradient(90deg,#9DFF2C,transparent)",  note: `${kpis.filesImportedToday ?? 0} importados hoje`, to: "/ledger/imports" },
    { label: "Duplicados Evitados", value: String(kpis.totalDuplicatesAvoided ?? s.duplicatesAvoided ?? 0),icon: ShieldCheck,   accent: "linear-gradient(90deg,#ec4899,transparent)",  note: "Deduplicação ativa",     to: "/ledger/imports" },
    { label: "Pendentes",           value: String(kpis.pendingTransactions ?? 0),                          icon: CalendarClock, accent: "linear-gradient(90deg,#f59e0b,transparent)",  note: "Aguardando conciliação", to: `/transactions?${mp}&status=PENDING` },
    { label: "Conciliadas",         value: String(kpis.reconciledTransactions ?? 0),                       icon: CheckCircle2,  accent: "linear-gradient(90deg,#10b981,transparent)",  note: "Status CONFIRMED",       to: `/transactions?${mp}&status=CONFIRMED` },
    { label: "Lançamentos Manuais", value: String(s.manualTransactionsCount ?? 0),                         icon: CreditCard,    accent: "linear-gradient(90deg,#ec4899,transparent)",  note: "Registros do usuário",   to: "/manual-transactions" },
    { label: "Última Sincronização",value: fmtRelative(kpis.lastSyncAt),                                   icon: RefreshCw,     accent: "linear-gradient(90deg,#06b6d4,transparent)",  note: kpis.lastImportFile || "OneDrive", to: "/onedrive" }
  ];

  const connectionCount = s.connectedAccounts ?? 0;

  return (
    <div className="anim-fade-in">

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="dash-page-title">
          <Sparkles size={20} style={{ color: "var(--purple)", verticalAlign: "middle", marginRight: ".5rem" }} />
          Painel Executivo
        </h1>
        <p className="dash-page-sub">
          Consolidação em tempo real — Open Finance, CSV, OneDrive e lançamentos manuais.
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      {filters && onFiltersChange && (
        <>
          <PeriodChips filters={filters} onChange={onFiltersChange} />
          <DashboardFilters filters={filters} onChange={onFiltersChange} onClear={onFiltersClear} />
        </>
      )}

      {/* 12 KPI cards */}
      <div className="stats-grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {kpiCards.map((c) => <KPICard key={c.label} {...c} loading={loading} />)}
      </div>

      {/* CTA sem banco */}
      {connectionCount === 0 && !loading && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", background: "var(--s2)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0 }}>
            <Link2 size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, marginBottom: ".25rem" }}>Nenhum banco conectado</div>
            <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>Conecte pelo Open Finance ou importe um CSV para começar.</div>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexShrink: 0 }}>
            <Link to="/open-finance/connect" className="btn btn-primary btn-sm">Open Finance</Link>
            <Link to="/ledger/imports" className="btn btn-secondary btn-sm">Importar CSV</Link>
          </div>
        </div>
      )}

      {/* Highlights: maior despesa / maior receita */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: ".85rem", marginBottom: ".85rem" }}>
        <HighlightCard label="Maior despesa do mês" data={m.biggestExpense} color="var(--cyan)"    icon={TrendingDown} loading={loading} />
        <HighlightCard label="Maior receita do mês"  data={m.biggestIncome}  color="var(--success)" icon={TrendingUp}   loading={loading} />
      </div>

      {/* Charts linha 1: fluxo mensal + categorias */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: ".85rem", marginBottom: ".85rem" }}>
        <MonthlyFlowChart data={m.monthlyTrend || s.monthlyFlow || []} loading={loading} />
        <CategoryBreakdown items={m.topCategories || s.expensesByCategory || []} />
      </div>

      {/* Charts linha 2: sparkline + tipos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".85rem", marginBottom: ".85rem" }}>
        <DailySparkline data={m.dailyMovement || []} loading={loading} />
        <CategoryBreakdown items={m.typeBreakdown || []} title="Tipos de movimentação" />
      </div>

      {/* Linha 3: contas + últimas transações */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: ".85rem", marginBottom: ".85rem" }}>
        <AccountsOverview accounts={accounts} loading={loading} />
        <LatestTransactions items={s.latestTransactions || []} loading={loading} />
      </div>

      {/* Linha 4: importações recentes + anomalias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: ".85rem", marginBottom: ".85rem" }}>
        <RecentImports imports={m.recentImports || []} loading={loading} />
        <AnomalyWidget anomalies={m.anomalies || []} loading={loading} />
      </div>

      {/* Formas de pagamento */}
      {(s.paymentMethods || []).length > 0 && (
        <div style={{ marginBottom: ".85rem" }}>
          <CategoryBreakdown
            items={(s.paymentMethods || []).map((p) => ({ category: p.paymentMethod, amount: p.amount }))}
            title="Formas de pagamento"
          />
        </div>
      )}

      {/* Beta modules */}
      <div style={{ marginTop: "2rem" }}>
        <div className="divider">Módulos avançados</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: ".55rem", marginTop: "1rem" }}>
          {[
            { label: "IA Financeira", to: "/financial-ai" },
            { label: "Metas", to: "/goals" },
            { label: "Cartões", to: "/cards" },
            { label: "Investimentos", to: "/investments" },
            { label: "Alertas", to: "/alerts" },
            { label: "Relatórios", to: "/reports" }
          ].map((f) => (
            <Link key={f.to} to={f.to} className="card" style={{ padding: ".65rem 1rem", display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".78rem", color: "var(--text)", textDecoration: "none" }}>
              <span className="badge badge-green">Beta</span>
              {f.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
