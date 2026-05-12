function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "-";
}

export default function LedgerPreviewTable({ rows = [] }) {
  return (
    <section className="card ledger-panel">
      <div className="ledger-panel-head">
        <div>
          <div className="section-num">Fluxo 03</div>
          <h2>Prévia da importação</h2>
          <p className="ledger-muted">
            Amostra das transações normalizadas, com classificação de duplicidade e categoria sugerida.
          </p>
        </div>
      </div>

      <div className="ledger-table">
        <div className="ledger-table-head">
          <span>Data</span>
          <span>Descrição</span>
          <span>Valor</span>
          <span>Tipo</span>
          <span>Categoria</span>
          <span>Status</span>
        </div>

        {rows.length === 0 ? (
          <div className="ledger-empty">
            Nenhuma linha disponível para prévia.
          </div>
        ) : rows.map((row) => (
          <div className="ledger-table-row" key={row.rowId}>
            <span>{formatDate(row.date)}</span>
            <div>
              <strong>{row.description}</strong>
              <small>{row.bank || "-"} · {row.accountName || "-"}</small>
            </div>
            <span>{formatCurrency(row.amount)}</span>
            <span>{row.type}</span>
            <span>{row.category || row.suggestedCategory || "Outros"}</span>
            <span className={`ledger-status ledger-status-${String(row.reconciliationStatus || "").toLowerCase()}`}>
              {row.reconciliationStatus}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
