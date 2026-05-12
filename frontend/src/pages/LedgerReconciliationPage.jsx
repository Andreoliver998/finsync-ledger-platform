import {
  AlertTriangle,
  CheckCheck,
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CsvImportQualityCard from "../components/ledgerAnalytics/CsvImportQualityCard.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getLedgerAnalyticsImportQuality } from "../services/ledgerAnalyticsApi.js";
import {
  listLedgerReconciliationReview,
  resolveLedgerReconciliation
} from "../services/ledgerImportApi.js";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0)
  );
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function reasonLabel(reason) {
  const map = {
    near_date_same_amount: "Mesmo valor com data próxima",
    duplicate_in_file: "Duplicidade no mesmo arquivo",
    semantic_exact: "Mesma assinatura semântica",
    strong_identifier: "Identificador forte repetido",
    strong_identifier_conflict: "Identificador forte divergente",
    same_day_amount_variation: "Mesmo dia com pequena variação"
  };
  return map[reason] || "Suspeita de duplicidade";
}

function StatusBadge({ status }) {
  const className =
    status === "REVIEWED" || status === "PENDING"
      ? "badge badge-warning"
      : status === "CONFIRMED"
        ? "badge badge-green"
        : "badge badge-neutral";

  return <span className={className}>{status}</span>;
}

function SkeletonCard() {
  return (
    <div className="card recon-card recon-card-skeleton">
      <div className="skeleton" style={{ height: 18, width: "35%" }} />
      <div className="skeleton" style={{ height: 14, width: "70%" }} />
      <div className="skeleton" style={{ height: 14, width: "50%" }} />
      <div className="skeleton" style={{ height: 42, width: "100%", borderRadius: 12 }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="txn-empty recon-empty">
      <div className="txn-empty-icon">
        <CheckCheck size={26} />
      </div>
      <h2>Nenhuma pendência de duplicidade</h2>
      <p>Todas as transações marcadas para revisão manual já foram tratadas.</p>
    </div>
  );
}

function AnchorTransaction({ item }) {
  if (!item) {
    return (
      <div className="recon-anchor">
        <div className="recon-anchor-title">Transação similar</div>
        <span className="recon-anchor-empty">Nenhuma transação-base vinculada.</span>
      </div>
    );
  }

  return (
    <div className="recon-anchor">
      <div className="recon-anchor-title">Transação similar</div>
      <div className="recon-anchor-grid">
        <div>
          <span className="recon-label">Descrição</span>
          <strong>{item.description || "—"}</strong>
        </div>
        <div>
          <span className="recon-label">Data</span>
          <strong>{fmtDate(item.date)}</strong>
        </div>
        <div>
          <span className="recon-label">Valor</span>
          <strong>{fmtCur(item.amount)}</strong>
        </div>
        <div>
          <span className="recon-label">Categoria</span>
          <strong>{item.category || "Sem categoria"}</strong>
        </div>
        <div>
          <span className="recon-label">Arquivo</span>
          <strong>{item.importBatch?.fileName || "Histórico prévio"}</strong>
        </div>
      </div>
    </div>
  );
}

export default function LedgerReconciliationPage() {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState("");
  const [stats, setStats] = useState({ totalGroups: 0, totalTransactions: 0 });
  const [quality, setQuality] = useState(null);

  async function loadReviewQueue() {
    setLoading(true);

    try {
      const result = await listLedgerReconciliationReview({ limit: 100 });
      setGroups(result.data || []);
      setStats({
        totalGroups: result.totalGroups || 0,
        totalTransactions: result.totalTransactions || 0
      });
      setQuality(await getLedgerAnalyticsImportQuality());
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível carregar a fila de conciliação.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const pendingGroups = useMemo(() => groups.filter((group) => group.transactions?.length), [groups]);

  async function handleResolve(transaction, action) {
    if (action === "DISCARD") {
      const confirmed = window.confirm(
        `Descartar a transação "${transaction.description}" como duplicata?`
      );

      if (!confirmed) {
        return;
      }
    }

    setResolvingId(transaction.id);

    try {
      await resolveLedgerReconciliation(transaction.id, { action });

      setGroups((current) => {
        const nextGroups = current
          .map((group) => ({
            ...group,
            transactions: group.transactions.filter((item) => item.id !== transaction.id)
          }))
          .filter((group) => group.transactions.length > 0);

        setStats({
          totalGroups: nextGroups.length,
          totalTransactions: nextGroups.reduce((sum, group) => sum + group.transactions.length, 0)
        });

        return nextGroups;
      });
      toast.success(action === "DISCARD" ? "Duplicata descartada." : "Transação confirmada.");
      window.dispatchEvent(new CustomEvent("finsync:ledger-updated"));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível concluir a revisão.");
    } finally {
      setResolvingId("");
    }
  }

  return (
    <AppLayout breadcrumb="Conciliação manual">
      <div className="ledger-page anim-fade-in recon-page">
        <div className="txn-page-header">
          <div>
            <h1 className="dash-page-title">Conciliação Manual</h1>
            <p className="dash-page-sub">
              Revise duplicidades prováveis importadas por CSV ou OneDrive sem perder rastreabilidade.
            </p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
            <span className="badge badge-neutral">{stats.totalGroups} grupos</span>
            <span className="badge badge-warning">{stats.totalTransactions} pendências</span>
            <button className="btn btn-ghost btn-sm" onClick={loadReviewQueue} disabled={loading} title="Recarregar">
              <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
          </div>
        </div>

        <div className="recon-hero card">
          <div className="recon-hero-copy">
            <span className="recon-overline">POSSIBLE_DUPLICATE</span>
            <h2>Fila de revisão premium para transações suspeitas</h2>
            <p>
              Cada grupo concentra lançamentos com mesmo valor e descrição próxima, preservando o lote de origem e o contexto do histórico já importado.
            </p>
          </div>
          <div className="recon-hero-stats">
            <div className="recon-hero-stat">
              <span>Grupos ativos</span>
              <strong>{stats.totalGroups}</strong>
            </div>
            <div className="recon-hero-stat">
              <span>Itens para revisar</span>
              <strong>{stats.totalTransactions}</strong>
            </div>
          </div>
        </div>

        <CsvImportQualityCard data={quality || {}} />

        {loading ? (
          <div className="recon-list">
            {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : pendingGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="recon-list">
            {pendingGroups.map((group) => {
              const expanded = expandedGroupId === group.groupId;

              return (
                <div className="card recon-card" key={group.groupId}>
                  <div className="recon-card-head">
                    <div>
                      <div className="recon-card-title">
                        <AlertTriangle size={16} />
                        <strong>{reasonLabel(group.reason)}</strong>
                      </div>
                      <p className="ledger-muted">
                        {group.transactions.length} transação(ões) pendente(s) para revisão neste grupo.
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setExpandedGroupId(expanded ? "" : group.groupId)}
                    >
                      <Eye size={13} />
                      {expanded ? "Ocultar similares" : "Ver similares"}
                    </button>
                  </div>

                  <div className="recon-transactions">
                    {group.transactions.map((transaction) => {
                      const busy = resolvingId === transaction.id;

                      return (
                        <div className="recon-transaction" key={transaction.id}>
                          <div className="recon-transaction-main">
                            <div>
                              <span className="recon-label">Descrição</span>
                              <strong>{transaction.description || "—"}</strong>
                            </div>
                            <div>
                              <span className="recon-label">Data</span>
                              <strong>{fmtDate(transaction.date)}</strong>
                            </div>
                            <div>
                              <span className="recon-label">Valor</span>
                              <strong>{fmtCur(transaction.amount)}</strong>
                            </div>
                            <div>
                              <span className="recon-label">Categoria</span>
                              <strong>{transaction.category || "Sem categoria"}</strong>
                            </div>
                            <div>
                              <span className="recon-label">Arquivo de origem</span>
                              <strong>{transaction.importBatch?.fileName || "Sem lote"}</strong>
                            </div>
                            <div>
                              <span className="recon-label">Status</span>
                              <StatusBadge status={transaction.status} />
                            </div>
                          </div>

                          <div className="recon-transaction-meta">
                            <span className="badge badge-neutral">
                              <FileText size={12} /> {transaction.importBatch?.provider || transaction.provider || "MANUAL_UPLOAD"}
                            </span>
                            <span className="badge badge-neutral">
                              Motivo: {reasonLabel(transaction.reconciliationReason)}
                            </span>
                          </div>

                          <div className="recon-actions">
                            <button
                              className="btn btn-primary btn-sm"
                              type="button"
                              disabled={busy}
                              onClick={() => handleResolve(transaction, "CONFIRM")}
                            >
                              {busy ? <LoaderCircle size={13} className="spin" /> : <CheckCheck size={13} />}
                              Confirmar transação
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              type="button"
                              disabled={busy}
                              onClick={() => handleResolve(transaction, "DISCARD")}
                            >
                              {busy ? <LoaderCircle size={13} className="spin" /> : <Trash2 size={13} />}
                              Descartar duplicata
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {expanded && <AnchorTransaction item={group.anchorTransaction} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
