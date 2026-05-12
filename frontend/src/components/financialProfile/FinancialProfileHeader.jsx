function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function typeLabel(type) {
  const labels = {
    person: "Pessoa",
    merchant: "Empresa",
    bank: "Banco",
    paymentMethod: "Método",
    category: "Categoria"
  };
  return labels[type] || "Perfil";
}

export default function FinancialProfileHeader({
  profile,
  totals,
  narrative,
  onOpenSearch,
  onOpenTransactions
}) {
  return (
    <div className="card intelligent-hero-card financial-profile-hero">
      <div className="intelligent-hero-copy">
        <div className="beta-eyebrow">
          <span className="badge badge-green">Profile</span>
          Dossiê financeiro contextual
        </div>
        <h1>{profile?.name || "Perfil financeiro"}</h1>
        <p className="ledger-executive-narrative">{narrative || profile?.relationshipSummary || "Sem narrativa disponível para este recorte."}</p>
        <div className="insight-action-row">
          <button className="insight-link-btn" type="button" onClick={onOpenSearch}>
            Abrir busca
          </button>
          <button className="insight-link-btn" type="button" onClick={onOpenTransactions}>
            Ver transações
          </button>
        </div>
      </div>
      <div className="intelligent-kpi-grid">
        <div className="intelligent-kpi-card"><span>Tipo</span><strong>{typeLabel(profile?.type)}</strong></div>
        <div className="intelligent-kpi-card"><span>Classificação</span><strong>{profile?.classification || "UNKNOWN"}</strong></div>
        <div className="intelligent-kpi-card"><span>Movimentado</span><strong>{fmtCur(totals?.totalMoved || 0)}</strong></div>
        <div className="intelligent-kpi-card"><span>Ocorrências</span><strong>{totals?.transactionCount || 0}</strong></div>
      </div>
    </div>
  );
}
