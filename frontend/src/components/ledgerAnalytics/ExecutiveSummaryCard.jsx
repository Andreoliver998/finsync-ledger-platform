function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export default function ExecutiveSummaryCard({ data = {} }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Resumo executivo</span>
      </div>
      <div className="ledger-executive-period">
        <span>Período</span>
        <strong>{fmtDate(data.period?.start)} até {fmtDate(data.period?.end)}</strong>
      </div>
      <p className="ledger-executive-narrative">{data.narrative || "Sem narrativa disponível."}</p>
      <div className="ledger-quality-grid">
        <div><span>Transações</span><strong>{data.transactionsCount ?? 0}</strong></div>
        <div><span>Recebido</span><strong>{fmtCur(data.totalReceived || 0)}</strong></div>
        <div><span>Gasto</span><strong>{fmtCur(data.totalSpent || 0)}</strong></div>
        <div><span>Saldo</span><strong>{fmtCur(data.netAmount || 0)}</strong></div>
      </div>
      {!!data.attentionPoints?.length && (
        <div className="ledger-insights-list" style={{ marginTop: "1rem" }}>
          {data.attentionPoints.map((item) => (
            <div className="ledger-insight-card" key={item}>
              <span className="badge badge-warning">atenção</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
