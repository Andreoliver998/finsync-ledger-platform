export default function ConfidenceQualityPanel({ data = {} }) {
  function pct(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Confiança da análise</span></div>
      <div className="ledger-quality-grid">
        <div><span>Alta confiança</span><strong>{data.highConfidence ?? 0}</strong></div>
        <div><span>Média confiança</span><strong>{data.mediumConfidence ?? 0}</strong></div>
        <div><span>Baixa confiança</span><strong>{data.lowConfidence ?? 0}</strong></div>
        <div><span>Precisa revisão</span><strong>{data.needsReview ?? 0}</strong></div>
        <div><span>Classificadas</span><strong>{pct(data.classifiedPercent)}</strong></div>
        <div><span>Em Outros</span><strong>{pct(data.otherPercent)}</strong></div>
        <div><span>Estabelecimento identificado</span><strong>{pct(data.merchantIdentifiedPercent)}</strong></div>
        <div><span>Método identificado</span><strong>{pct(data.paymentMethodIdentifiedPercent)}</strong></div>
      </div>
    </div>
  );
}
