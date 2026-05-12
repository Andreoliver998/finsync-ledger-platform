import { Search, Sparkles, X } from "lucide-react";

const QUICK_CHIPS = [
  { label: "PIX", query: "PIX" },
  { label: "Débito", query: "Débito" },
  { label: "Crédito", query: "Crédito" },
  { label: "Mercado", query: "Mercado" },
  { label: "Transferências", query: "Transferência" }
];

export default function FinancialSearchBox({
  value,
  onChange,
  onSubmit,
  recentSearches = [],
  onSelectRecent,
  onQuickChip
}) {
  return (
    <div className="card ledger-analytics-card search-hero-card">
      <div className="search-hero-head">
        <div>
          <div className="beta-eyebrow">
            <span className="badge badge-green">Ledger</span>
            Busca Inteligente Financeira
          </div>
          <h1>Busque qualquer pessoa, empresa, banco ou palavra-chave</h1>
          <p className="ledger-muted">
            Pesquise por nomes, marketplaces, bancos, PIX, categorias ou termos livres para entender toda a relação financeira.
          </p>
        </div>
        <div className="search-hero-icon">
          <Sparkles size={22} />
        </div>
      </div>

      <form className="search-box-form" onSubmit={onSubmit}>
        <div className="search-box-input-wrap">
          <Search size={18} className="search-box-icon" />
          <input
            className="input search-box-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder='Pesquisar "Gilvanise", "PREZUNIC", "Amazon", "Pix", "Nubank"...'
          />
          {value && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => onChange("")} title="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      <div className="search-chip-row">
        {QUICK_CHIPS.map((chip) => (
          <button key={chip.label} className="period-chip" type="button" onClick={() => onQuickChip(chip.query)}>
            {chip.label}
          </button>
        ))}
      </div>

      {!!recentSearches.length && (
        <div className="search-recent-block">
          <span className="search-recent-label">Buscas recentes</span>
          <div className="search-chip-row">
            {recentSearches.map((item) => (
              <button key={item} className="period-chip" type="button" onClick={() => onSelectRecent(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
