export default function SearchFiltersPanel({ filters, onChange, onClear }) {
  return (
    <div className="card ledger-analytics-card search-filters-panel">
      <div className="dash-section-title"><span>Filtros da busca</span></div>
      <div className="txn-filter-panel" style={{ padding: 0 }}>
        <div className="input-group">
          <label className="input-label">Data inicial</label>
          <input className="input" type="date" value={filters.startDate} onChange={(event) => onChange("startDate", event.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Data final</label>
          <input className="input" type="date" value={filters.endDate} onChange={(event) => onChange("endDate", event.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Tipo</label>
          <select className="input" value={filters.type} onChange={(event) => onChange("type", event.target.value)}>
            <option value="">Todos</option>
            <option value="CREDIT">Crédito / Entrada</option>
            <option value="DEBIT">Débito / Saída</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Pagamento</label>
          <input className="input" value={filters.paymentMethod} onChange={(event) => onChange("paymentMethod", event.target.value)} placeholder="PIX, débito, crédito..." />
        </div>
        <div className="input-group">
          <label className="input-label">Categoria</label>
          <input className="input" value={filters.category} onChange={(event) => onChange("category", event.target.value)} placeholder="Mercado, tarifa..." />
        </div>
        <div className="input-group">
          <label className="input-label">Origem</label>
          <input className="input" value={filters.source} onChange={(event) => onChange("source", event.target.value)} placeholder="CSV_UPLOAD, MANUAL..." />
        </div>
        <div className="input-group">
          <label className="input-label">Valor mínimo</label>
          <input className="input" type="number" min="0" step="0.01" value={filters.minAmount} onChange={(event) => onChange("minAmount", event.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Valor máximo</label>
          <input className="input" type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(event) => onChange("maxAmount", event.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: ".9rem" }}>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onClear}>Limpar filtros</button>
      </div>
    </div>
  );
}
