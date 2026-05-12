function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

const COLORS = ["#9DFF2C", "#FB9B36", "#06b6d4", "#10b981", "#f59e0b", "#a78bfa", "#ec4899"];

export default function CategoryBreakdownChart({ title = "Categorias", items = [], labelKey = "category" }) {
  const max = Math.max(...items.map((item) => Number(item.amount || item.expenses || 0)), 1);

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>{title}</span>
      </div>
      {items.length === 0 ? (
        <div className="chart-placeholder"><span>Sem dados</span></div>
      ) : (
        <div style={{ display: "grid", gap: ".7rem" }}>
          {items.slice(0, 10).map((item, index) => {
            const amount = Number(item.amount || item.expenses || 0);
            return (
              <div key={`${item[labelKey]}-${index}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", marginBottom: ".2rem", fontSize: ".74rem" }}>
                  <span style={{ fontWeight: 700 }}>{item[labelKey] || "—"}</span>
                  <span className="mono" style={{ color: "var(--muted)" }}>{fmtCur(amount)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: "var(--s3)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max((amount / max) * 100, 2)}%`, height: "100%", background: COLORS[index % COLORS.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
