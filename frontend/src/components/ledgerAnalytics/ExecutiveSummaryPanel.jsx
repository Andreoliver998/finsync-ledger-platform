function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function ExecutiveSummaryPanel({ data = {} }) {
  const summary = data.summary || {};

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Resumo em linguagem simples</span>
      </div>
      <p className="ledger-executive-narrative">{summary.simpleText || "Sem leitura suficiente para resumir o extrato."}</p>
      <div className="ledger-quality-grid" style={{ marginTop: "1rem" }}>
        <div><span>Transações</span><strong>{summary.transactionCount ?? 0}</strong></div>
        <div><span>Movimentado</span><strong>{fmtCur(summary.totalMoved || 0)}</strong></div>
        <div><span>Entradas</span><strong>{fmtCur(summary.totalIncome || 0)}</strong></div>
        <div><span>Saídas</span><strong>{fmtCur(summary.totalExpenses || 0)}</strong></div>
        <div><span>Saldo líquido</span><strong>{fmtCur(summary.netAmount || 0)}</strong></div>
      </div>
    </div>
  );
}
