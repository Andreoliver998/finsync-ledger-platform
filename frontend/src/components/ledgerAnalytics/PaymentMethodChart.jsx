function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function PaymentMethodChart({ items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Métodos de pagamento</span>
      </div>
      {items.length === 0 ? (
        <div className="chart-placeholder"><span>Sem dados</span></div>
      ) : (
        <div style={{ display: "grid", gap: ".65rem" }}>
          {items.slice(0, 8).map((item) => {
            const percentage = total > 0 ? (Number(item.amount || 0) / total) * 100 : 0;
            return (
              <div key={item.paymentMethod}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".74rem", marginBottom: ".2rem" }}>
                  <strong>{item.paymentMethod}</strong>
                  <span className="mono">{fmtCur(item.amount)}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: "var(--s3)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(percentage, 2)}%`, height: "100%", background: "#FB9B36" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
