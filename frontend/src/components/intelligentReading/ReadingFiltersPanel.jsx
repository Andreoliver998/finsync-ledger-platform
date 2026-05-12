export default function ReadingFiltersPanel({ filters, onChange, onRefresh, loading }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>Período da análise</span></div>
      <div className="txn-filter-panel" style={{ padding: 0, marginBottom: 0 }}>
        <div className="input-group">
          <label className="input-label">Período</label>
          <select className="input" value={filters.period} onChange={(event) => onChange("period", event.target.value)}>
            <option value="CURRENT_MONTH">Mês atual</option>
            <option value="CURRENT_YEAR">Ano atual</option>
            <option value="ALL">Histórico completo</option>
            <option value="CUSTOM">Personalizado</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Data inicial</label>
          <input className="input" type="date" value={filters.startDate} onChange={(event) => onChange("startDate", event.target.value)} disabled={filters.period !== "CUSTOM"} />
        </div>
        <div className="input-group">
          <label className="input-label">Data final</label>
          <input className="input" type="date" value={filters.endDate} onChange={(event) => onChange("endDate", event.target.value)} disabled={filters.period !== "CUSTOM"} />
        </div>
        <div className="input-group" style={{ justifyContent: "flex-end" }}>
          <label className="input-label" style={{ visibility: "hidden" }}>_</label>
          <button className="btn btn-primary" type="button" onClick={onRefresh} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar leitura"}
          </button>
        </div>
      </div>
    </div>
  );
}
