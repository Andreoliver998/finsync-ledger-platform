import { Clock, Eye, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { useMemo } from "react";

/* ── Bank visual identity ────────────────────────────────────── */
const BANKS = {
  nubank:      { name: "Nubank",           initials: "Nu", bg: "#8A05BE", text: "#fff" },
  bradesco:    { name: "Bradesco",          initials: "Bra", bg: "#CC0000", text: "#fff" },
  itaú:        { name: "Itaú",             initials: "Itaú", bg: "#EC7000", text: "#fff" },
  itau:        { name: "Itaú",             initials: "Itaú", bg: "#EC7000", text: "#fff" },
  bb:          { name: "Banco do Brasil",  initials: "BB", bg: "#F7D51B", text: "#00439C" },
  "banco do brasil": { name: "Banco do Brasil", initials: "BB", bg: "#F7D51B", text: "#00439C" },
  caixa:       { name: "Caixa",            initials: "CEF", bg: "#0066CC", text: "#fff" },
  santander:   { name: "Santander",        initials: "San", bg: "#EC0000", text: "#fff" },
  xp:          { name: "XP Investimentos", initials: "XP", bg: "#1C1C1E", text: "#fff" },
  c6:          { name: "C6 Bank",          initials: "C6", bg: "#2E2E2E", text: "#fff" },
  "c6 bank":   { name: "C6 Bank",          initials: "C6", bg: "#2E2E2E", text: "#fff" },
  inter:       { name: "Inter",            initials: "In", bg: "#FF7A00", text: "#fff" },
  btg:         { name: "BTG Pactual",      initials: "BTG", bg: "#00439C", text: "#fff" },
  sicoob:      { name: "Sicoob",           initials: "SC", bg: "#006B3C", text: "#fff" },
  sicredi:     { name: "Sicredi",          initials: "SR", bg: "#00853F", text: "#fff" },
  default:     { name: "Banco",            initials: "BK", bg: "#1a1a35", text: "#a78bfa" },
};

const STATUS_CONFIG = {
  CONNECTED:    { label: "Conectado",     dotClass: "dot dot-green",  badgeClass: "badge badge-green" },
  DISCONNECTED: { label: "Desconectado",  dotClass: "dot dot-error",  badgeClass: "badge badge-error" },
  SYNCING:      { label: "Sincronizando", dotClass: "dot dot-orange", badgeClass: "badge badge-orange" },
  ERROR:        { label: "Erro",          dotClass: "dot dot-error",  badgeClass: "badge badge-error" },
  OUTDATED:     { label: "Expirado",      dotClass: "dot dot-muted",  badgeClass: "badge badge-neutral" },
};

function resolveBankProfile(institution) {
  if (!institution) return BANKS.default;
  const key = institution.toLowerCase();
  for (const [k, v] of Object.entries(BANKS)) {
    if (key.includes(k)) return v;
  }
  /* Fallback: generate initials + deterministic color */
  const words    = institution.split(" ").filter(Boolean);
  const initials = words.slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return { name: institution, initials, bg: "#1a1a35", text: "#a78bfa" };
}

function formatSyncTime(dateStr) {
  if (!dateStr) return "nunca";
  const d    = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)   return "agora mesmo";
  const min  = Math.floor(sec / 60);
  if (min < 60)   return `há ${min} min`;
  const hrs  = Math.floor(min / 60);
  if (hrs < 24)   return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)} dias`;
}

/* ─────────────────────────────────────────────────────────────── */
export default function BankConnectionCard({ connection, onDisconnect, onSync, onViewTransactions }) {
  const {
    institution,
    status = "CONNECTED",
    lastSync,
    itemId,
    updatedAt,
    syncLogs = [],
    _count,
    isSyncing = false,
  } = connection;

  const latestSync = Array.isArray(syncLogs) ? syncLogs[0] : null;
  const accountsCount = _count?.bankAccounts ?? 0;
  const transactionsCount = _count?.financialTransactions ?? 0;
  const bank      = useMemo(() => resolveBankProfile(institution), [institution]);
  const visibleStatus = isSyncing ? "SYNCING" : latestSync?.status === "ERROR" ? "ERROR" : status;
  const statusCfg = STATUS_CONFIG[visibleStatus] ?? STATUS_CONFIG.CONNECTED;
  const syncTime  = formatSyncTime(lastSync ?? latestSync?.finishedAt ?? latestSync?.startedAt ?? updatedAt);
  const isConnected = ["CONNECTED", "SYNCED"].includes(status);

  return (
    <div className="bank-card">
      {/* Accent top line */}
      <div
        className="card-accent"
        style={{ background: `linear-gradient(90deg, ${bank.bg}, transparent)` }}
      />

      {/* Header */}
      <div className="bank-card-top">
        <div
          className="bank-avatar"
          style={{ background: bank.bg, color: bank.text }}
        >
          {bank.initials}
        </div>
        <div className="bank-info">
          <div className="bank-name">{bank.name}</div>
          <div className="bank-status-row">
            <span className={statusCfg.dotClass} style={{ width: "6px", height: "6px" }} />
            <span className="bank-status-label">{statusCfg.label}</span>
          </div>
        </div>
        <span className={statusCfg.badgeClass} style={{ flexShrink: 0 }}>
          {isConnected ? <Wifi size={9} /> : <WifiOff size={9} />}
          {statusCfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="bank-card-body">
        <div className="bank-meta">
          <Clock size={12} />
          Última sincronização:&nbsp;
          <span style={{ color: "var(--muted)" }}>{syncTime}</span>
        </div>
        {itemId && (
          <div className="bank-meta" style={{ fontSize: ".6rem", opacity: ".5" }}>
            ID: {itemId.substring(0, 8)}...
          </div>
        )}
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".6rem" }}>
          <span className="badge badge-neutral">{accountsCount} conta(s)</span>
          <span className="badge badge-neutral">{transactionsCount} transação(ões)</span>
        </div>
        {latestSync?.message && (
          <div className="bank-meta" style={{ color: "var(--danger)", fontSize: ".68rem", marginTop: ".5rem" }}>
            {latestSync.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bank-card-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onSync?.(connection)}
          disabled={isSyncing}
          title="Sincronizar transações"
          style={{ flex: 1, gap: ".4rem" }}
        >
          <RefreshCw size={12} style={isSyncing ? { animation: "spin 1s linear infinite" } : {}} />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onViewTransactions?.(connection)}
          title="Ver transações"
          style={{ padding: ".45rem .7rem" }}
        >
          <Eye size={13} />
        </button>

        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDisconnect?.(connection)}
          title="Desconectar banco"
          style={{ padding: ".45rem .7rem" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
