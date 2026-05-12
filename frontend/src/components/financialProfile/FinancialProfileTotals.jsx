function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";
}

export default function FinancialProfileTotals({ totals = {}, profile = {} }) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Resumo do relacionamento</span></div>
        <div className="ledger-quality-grid">
          <div><span>Entradas</span><strong>{fmtCur(totals.totalIn || 0)}</strong></div>
          <div><span>Saídas</span><strong>{fmtCur(totals.totalOut || 0)}</strong></div>
          <div><span>Ticket médio</span><strong>{fmtCur(totals.averageAmount || 0)}</strong></div>
          <div><span>Primeira ocorrência</span><strong>{fmtDate(totals.firstSeenAt)}</strong></div>
          <div><span>Última ocorrência</span><strong>{fmtDate(totals.lastSeenAt)}</strong></div>
          <div><span>Confiança</span><strong>{Math.round(Number(profile.confidence || 0) * 100)}%</strong></div>
        </div>
      </div>
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Maior movimentação</span></div>
        {totals.largestTransaction ? (
          <div className="ledger-insight-card">
            <span className="badge badge-warning">{totals.largestTransaction.direction === "IN" ? "entrada" : "saída"}</span>
            <strong>{totals.largestTransaction.description}</strong>
            <p>{fmtCur(totals.largestTransaction.amount || 0)} · {fmtDate(totals.largestTransaction.date)}</p>
          </div>
        ) : (
          <div className="ledger-empty">Sem movimentação dominante neste recorte.</div>
        )}
      </div>
    </div>
  );
}
