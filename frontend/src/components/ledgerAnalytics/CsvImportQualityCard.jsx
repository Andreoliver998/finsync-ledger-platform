export default function CsvImportQualityCard({ data = {} }) {
  const totals = data.totals || {};
  const utilization = Number(totals.utilizationRate || 0).toFixed(1);

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Qualidade da leitura do CSV</span>
      </div>
      <div className="ledger-quality-grid">
        <div><span>Linhas lidas</span><strong>{totals.linesRead ?? 0}</strong></div>
        <div><span>Importadas</span><strong>{totals.importedRows ?? 0}</strong></div>
        <div><span>Duplicadas</span><strong>{totals.duplicatedRows ?? 0}</strong></div>
        <div><span>Em revisão</span><strong>{totals.reviewedRows ?? 0}</strong></div>
        <div><span>Descartadas</span><strong>{totals.discardedRows ?? 0}</strong></div>
        <div><span>Aproveitamento</span><strong>{utilization}%</strong></div>
        <div><span>Alta confiança</span><strong>{totals.highConfidence ?? 0}</strong></div>
        <div><span>Média confiança</span><strong>{totals.mediumConfidence ?? 0}</strong></div>
        <div><span>Baixa confiança</span><strong>{totals.lowConfidence ?? 0}</strong></div>
        <div><span>Em Outros</span><strong>{totals.uncategorized ?? 0}</strong></div>
      </div>
    </div>
  );
}
