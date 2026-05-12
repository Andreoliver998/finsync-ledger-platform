import TransactionLink from "../financial/TransactionLink.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function MerchantRecurrencePanel({
  merchantAnalysis = {},
  recurrenceAnalysis = {},
  paymentMethodAnalysis = {},
  onOpenMerchant,
  onOpenPaymentMethod,
  onOpenRecurrence,
  onOpenCategory
}) {
  return (
    <>
      <div className="ledger-analytics-layout">
        <div className="card ledger-analytics-card">
          <div className="dash-section-title"><span>Empresas e estabelecimentos</span></div>
          <div className="ledger-ranking-table">
            {(merchantAnalysis.topMerchants || []).slice(0, 8).map((item, index) => (
              <div className="ledger-ranking-row" key={item.merchant}>
                <strong>{item.merchant}</strong>
                <span>{item.count} transações</span>
                <span className="mono">{fmtCur(item.amount || item.expenses || 0)}</span>
                <div className="insight-action-row">
                  <button className="insight-link-btn" type="button" onClick={() => onOpenMerchant?.(item.merchant)}>
                    Analisar empresa
                  </button>
                  {item.category && (
                    <button className="insight-link-btn" type="button" onClick={() => onOpenCategory?.(item.category)}>
                      Abrir categoria
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card ledger-analytics-card">
          <div className="dash-section-title"><span>Métodos de pagamento</span></div>
          <div className="ledger-ranking-table">
            {(paymentMethodAnalysis.byPaymentMethod || []).map((item) => (
              <div className="ledger-ranking-row" key={item.paymentMethod}>
                <strong>{item.label}</strong>
                <span>{item.count} lançamentos</span>
                <span className="mono">{fmtCur(item.totalAmount || 0)}</span>
                <div className="insight-action-row">
                  <button className="insight-link-btn" type="button" onClick={() => onOpenPaymentMethod?.(item.paymentMethod)}>
                    Abrir perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ledger-analytics-layout">
        <div className="card ledger-analytics-card">
          <div className="dash-section-title"><span>Recorrências e assinaturas</span></div>
          <div className="ledger-insights-list">
            {(recurrenceAnalysis.recurringGroups || []).slice(0, 6).map((item, index) => (
              <div className="ledger-insight-card" key={`${item.merchant}-${index}`}>
                <span className="badge badge-green">{item.frequency === "MONTHLY" ? "mensal" : "semanal"}</span>
                <strong>{item.merchant || "Padrão recorrente"}</strong>
                <p>{item.kind || "recorrente"} · {(item.transactions || []).length} ocorrências detectadas</p>
                <div className="insight-action-row">
                  <button className="insight-link-btn" type="button" onClick={() => onOpenRecurrence?.(item)}>
                    Investigar recorrência
                  </button>
                  {item.merchant && (
                    <button className="insight-link-btn" type="button" onClick={() => onOpenMerchant?.(item.merchant)}>
                      Ver compras
                    </button>
                  )}
                </div>
                <div className="transaction-preview-grid">
                  {(item.transactions || []).slice(0, 3).map((transaction) => (
                    <TransactionLink
                      key={transaction.id}
                      transactionId={transaction.id}
                      transaction={transaction}
                      className="transaction-mini-link"
                      showPreview
                    >
                      <span className="transaction-mini-label">Abrir ocorrência</span>
                    </TransactionLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
