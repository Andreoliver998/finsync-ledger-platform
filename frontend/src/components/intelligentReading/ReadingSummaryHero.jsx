function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";
}

export default function ReadingSummaryHero({
  data = {},
  onOpenPerson,
  onOpenMerchant,
  onOpenCategory,
  onOpenLargestExpense
}) {
  const summary = data.executiveSummary || {};
  const largestExpense = data.moneyFlow?.largestExpense || null;

  return (
    <div className="card intelligent-hero-card">
      <div className="intelligent-hero-copy">
        <div className="beta-eyebrow">
          <span className="badge badge-green">Intelligence</span>
          Leitura Inteligente do Extrato
        </div>
        <h1>{summary.headline || "Leitura inteligente indisponível."}</h1>
        <p className="ledger-executive-narrative">{data.narrative || "Sem narrativa disponível."}</p>
        <div className="insight-action-row">
          {summary.dominantPerson?.name && (
            <button className="insight-link-btn" type="button" onClick={() => onOpenPerson?.(summary.dominantPerson.name)}>
              Analisar pessoa
            </button>
          )}
          {summary.dominantMerchant?.merchant && (
            <button className="insight-link-btn" type="button" onClick={() => onOpenMerchant?.(summary.dominantMerchant.merchant)}>
              Analisar empresa
            </button>
          )}
          {summary.dominantCategory?.category && (
            <button className="insight-link-btn" type="button" onClick={() => onOpenCategory?.(summary.dominantCategory.category)}>
              Abrir categoria
            </button>
          )}
          {largestExpense && (
            <button className="insight-link-btn" type="button" onClick={() => onOpenLargestExpense?.(largestExpense)}>
              Ver maior gasto
            </button>
          )}
        </div>
      </div>
      <div className="intelligent-kpi-grid">
        <div className="intelligent-kpi-card"><span>Período</span><strong>{fmtDate(summary.period?.start)} até {fmtDate(summary.period?.end)}</strong></div>
        <div className="intelligent-kpi-card"><span>Entradas</span><strong>{fmtCur(summary.totalIncome || 0)}</strong></div>
        <div className="intelligent-kpi-card"><span>Saídas</span><strong>{fmtCur(summary.totalExpenses || 0)}</strong></div>
        <div className="intelligent-kpi-card"><span>Saldo líquido</span><strong>{fmtCur(summary.netAmount || 0)}</strong></div>
      </div>
    </div>
  );
}
