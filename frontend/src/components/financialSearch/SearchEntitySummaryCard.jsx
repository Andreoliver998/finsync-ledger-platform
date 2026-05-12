import { useNavigate } from "react-router-dom";
import { buildFinancialProfileUrl } from "../../utils/financialProfileNavigation.js";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

const ENTITY_LABELS = {
  PERSON: "Pessoa",
  MERCHANT: "Empresa",
  MARKETPLACE: "Marketplace",
  BANK: "Banco",
  PAYMENT_METHOD: "Método de pagamento",
  CATEGORY: "Categoria",
  UNKNOWN: "Desconhecido"
};

const ENTITY_TYPE_TO_PROFILE_TYPE = {
  PERSON: "person",
  MERCHANT: "merchant",
  MARKETPLACE: "merchant",
  BANK: "bank",
  PAYMENT_METHOD: "paymentMethod",
  CATEGORY: "category"
};

export default function SearchEntitySummaryCard({ data = {} }) {
  const navigate = useNavigate();
  const summary = data.summary || {};
  const profileType = ENTITY_TYPE_TO_PROFILE_TYPE[data.entityType];
  const profileQuery = String(data.entity?.label || data.query || "")
    .trim()
    .slice(0, 80);

  function openProfile() {
    if (!profileType || !profileQuery) return;
    navigate(buildFinancialProfileUrl({ type: profileType, q: profileQuery }));
  }

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Resumo da entidade</span>
      </div>
      <div className="ledger-executive-period">
        <span>Consulta</span>
        <strong>{data.query || "—"}</strong>
        <span className="badge badge-blue">{ENTITY_LABELS[data.entityType] || "Desconhecido"}</span>
      </div>
      <div className="ledger-quality-grid">
        <div><span>Transações</span><strong>{summary.totalTransactions || 0}</strong></div>
        <div><span>Total enviado</span><strong>{fmtCur(summary.totalSent || 0)}</strong></div>
        <div><span>Total recebido</span><strong>{fmtCur(summary.totalReceived || 0)}</strong></div>
        <div><span>Total gasto</span><strong>{fmtCur(summary.totalSpent || 0)}</strong></div>
        <div><span>PIX enviado</span><strong>{fmtCur(summary.pixSent || 0)}</strong></div>
        <div><span>PIX recebido</span><strong>{fmtCur(summary.pixReceived || 0)}</strong></div>
        <div><span>Compras débito</span><strong>{summary.debitPurchases || 0}</strong></div>
        <div><span>Compras crédito</span><strong>{summary.creditPurchases || 0}</strong></div>
        <div><span>Ticket médio</span><strong>{fmtCur(summary.averageTicket || 0)}</strong></div>
        <div><span>Primeira data</span><strong>{summary.firstDate ? new Intl.DateTimeFormat("pt-BR").format(new Date(summary.firstDate)) : "—"}</strong></div>
        <div><span>Última data</span><strong>{summary.lastDate ? new Intl.DateTimeFormat("pt-BR").format(new Date(summary.lastDate)) : "—"}</strong></div>
        <div><span>Maior valor</span><strong>{fmtCur(summary.largestTransaction?.amount || 0)}</strong></div>
      </div>

      {profileType && profileQuery && (
        <div className="insight-action-row" style={{ marginTop: "1.1rem" }}>
          <button className="search-dossier-btn" type="button" onClick={openProfile}>
            Abrir dossiê
          </button>
          <button className="insight-link-btn" type="button" onClick={openProfile}>
            Investigar entidade
          </button>
          <button className="insight-link-btn" type="button" onClick={openProfile}>
            Ver relacionamento financeiro
          </button>
        </div>
      )}
    </div>
  );
}
