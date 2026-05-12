import { ArrowRight } from "lucide-react";
import { openFinancialProfile } from "../../utils/financialProfileNavigation.js";

const TYPE_CONFIG = {
  person:        { label: "Pessoa",     badgeClass: "badge-blue",    colorVar: "var(--blue)" },
  merchant:      { label: "Empresa",    badgeClass: "badge-green",   colorVar: "var(--purple-light)" },
  bank:          { label: "Banco",      badgeClass: "badge-neutral", colorVar: "var(--muted)" },
  paymentMethod: { label: "Método",     badgeClass: "badge-orange",  colorVar: "var(--cyan)" },
  category:      { label: "Categoria",  badgeClass: "badge-warning", colorVar: "var(--warning)" }
};

const TYPE_ORDER = ["merchant", "person", "category", "paymentMethod", "bank"];

const TYPE_SECTION_LABELS = {
  person:        "Pessoas relacionadas",
  merchant:      "Empresas relacionadas",
  bank:          "Bancos relacionados",
  paymentMethod: "Métodos relacionados",
  category:      "Categorias relacionadas"
};

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function StrengthBar({ value = 0, colorVar = "var(--purple)" }) {
  const pct = Math.round(value * 100);
  return (
    <div className="related-strength-row">
      <div className="related-strength-track">
        <div
          className="related-strength-fill"
          style={{ width: `${pct}%`, background: colorVar }}
        />
      </div>
      <span className="related-strength-pct mono">{pct}%</span>
    </div>
  );
}

function RelatedEntityCard({ item, onNavigate }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.merchant;

  function handleClick() {
    onNavigate(item);
  }

  return (
    <button
      className="related-entity-card"
      type="button"
      onClick={handleClick}
      title={`Investigar ${item.name}`}
    >
      <div className="related-entity-header">
        <span className={`badge ${config.badgeClass}`}>{config.label}</span>
        <ArrowRight size={11} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
      </div>
      <div className="related-entity-name" title={item.name}>{item.name}</div>
      <StrengthBar value={item.relationshipStrength} colorVar={config.colorVar} />
      <div className="related-entity-meta">
        <span>{item.transactionCount} transações</span>
        <span className="mono">{fmtCur(item.totalMoved)}</span>
      </div>
    </button>
  );
}

function RelatedSection({ type, items, onNavigate }) {
  if (!items.length) return null;
  const label = TYPE_SECTION_LABELS[type] || type;
  return (
    <div className="related-section">
      <div className="related-section-label">{label}</div>
      <div className="related-entities-row">
        {items.map((item) => (
          <RelatedEntityCard
            key={`${item.type}-${item.name}`}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export default function RelatedProfilesPanel({
  items = [],
  navigate,
  currentParams = {}
}) {
  if (!items.length) return null;

  const groups = {};
  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  }

  const orderedTypes = TYPE_ORDER.filter((t) => groups[t]?.length);

  function handleNavigate(item) {
    openFinancialProfile(navigate, {
      type: item.type,
      q: item.name,
      startDate: currentParams.startDate,
      endDate: currentParams.endDate
    });
  }

  const total = items.length;

  return (
    <div className="card related-profiles-panel">
      <div className="dash-section-title">
        <span>Mapa relacional</span>
        <span className="badge badge-neutral">
          {total} entidade{total !== 1 ? "s" : ""} relacionada{total !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="related-profiles-desc">
        Entidades financeiramente ligadas a este perfil — clique para abrir o dossiê de cada uma.
      </p>
      <div className="related-profiles-body">
        {orderedTypes.map((type) => (
          <RelatedSection
            key={type}
            type={type}
            items={groups[type]}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  );
}
