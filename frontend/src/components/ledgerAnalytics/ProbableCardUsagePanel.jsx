function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function ProbableCardUsagePanel({ data = {} }) {
  const summary = data.summary || {};

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Uso provável de cartões</span>
      </div>
      <div className="ledger-quality-grid">
        <div><span>Provável crédito</span><strong>{fmtCur(summary.creditAmount || 0)}</strong></div>
        <div><span>Provável débito</span><strong>{fmtCur(summary.debitAmount || 0)}</strong></div>
        <div><span>Compras crédito</span><strong>{summary.creditCount ?? 0}</strong></div>
        <div><span>Compras débito</span><strong>{summary.debitCount ?? 0}</strong></div>
        <div><span>Pagamentos de fatura</span><strong>{summary.billPaymentCount ?? 0}</strong></div>
        <div><span>Possíveis parcelamentos</span><strong>{summary.installmentCount ?? 0}</strong></div>
      </div>
      <p className="ledger-muted" style={{ marginBottom: 0 }}>
        Todos os sinais são exibidos como prováveis ou detectados pelo CSV, nunca como certeza absoluta.
      </p>
    </div>
  );
}
