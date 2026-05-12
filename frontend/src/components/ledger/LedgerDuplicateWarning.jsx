export default function LedgerDuplicateWarning({ summary }) {
  if (!summary) {
    return null;
  }

  const hasWarnings = summary.duplicatedRows || summary.possibleDuplicateRows || summary.conflictRows;

  if (!hasWarnings) {
    return null;
  }

  return (
    <section className="card ledger-panel ledger-warning-panel">
      <div className="ledger-warning-title">Atenção à conciliação</div>
      <div className="ledger-warning-grid">
        <div>
          <strong>{summary.duplicatedRows}</strong>
          <span>duplicados confirmados</span>
        </div>
        <div>
          <strong>{summary.possibleDuplicateRows}</strong>
          <span>possíveis duplicados</span>
        </div>
        <div>
          <strong>{summary.conflictRows}</strong>
          <span>conflitos para revisão</span>
        </div>
      </div>
    </section>
  );
}
