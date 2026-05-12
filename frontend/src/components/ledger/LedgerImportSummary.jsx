export default function LedgerImportSummary({ summary, onConfirm, confirming = false, ready = false }) {
  if (!summary) {
    return null;
  }

  const cards = [
    { label: "Linhas lidas", value: summary.totalRows },
    { label: "Novas", value: summary.newRows },
    { label: "Duplicadas", value: summary.duplicatedRows },
    { label: "Possíveis duplicatas", value: summary.possibleDuplicateRows },
    { label: "Conflitos", value: summary.conflictRows }
  ];

  return (
    <section className="card ledger-panel">
      <div className="ledger-panel-head">
        <div>
          <div className="section-num">Fluxo 04</div>
          <h2>Resumo da importação</h2>
          <p className="ledger-muted">
            O sistema só persiste linhas novas ou aprovadas como revisão controlada.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={!ready || confirming}>
          {confirming ? "Importando..." : "Confirmar importação"}
        </button>
      </div>

      <div className="ledger-summary-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
