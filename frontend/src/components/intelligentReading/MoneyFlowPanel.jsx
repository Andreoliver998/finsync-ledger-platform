import TransactionLink from "../financial/TransactionLink.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function MoneyFlowPanel({
  moneyFlow = {},
  incomeAnalysis = {},
  expenseAnalysis = {},
  onOpenCategory
}) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Fluxo de dinheiro</span></div>
        <div className="ledger-quality-grid">
          <div><span>Total movimentado</span><strong>{fmtCur(moneyFlow.totalMoved || 0)}</strong></div>
          <div><span>Entradas</span><strong>{fmtCur(moneyFlow.totalIncome || 0)}</strong></div>
          <div><span>Saídas</span><strong>{fmtCur(moneyFlow.totalExpenses || 0)}</strong></div>
          <div><span>Média diária de saída</span><strong>{fmtCur(expenseAnalysis.averageDailyExpense || 0)}</strong></div>
        </div>
        <div className="ledger-insights-list">
          {moneyFlow.largestIncome && (
            <TransactionLink transactionId={moneyFlow.largestIncome.id} transaction={moneyFlow.largestIncome} className="transaction-block-link" showPreview>
              <div className="ledger-insight-card">
                <span className="badge badge-green">entrada</span>
                <strong>{moneyFlow.largestIncome.description}</strong>
                <p>Maior entrada do período: {fmtCur(moneyFlow.largestIncome.amount)}</p>
              </div>
            </TransactionLink>
          )}
          {moneyFlow.largestExpense && (
            <TransactionLink transactionId={moneyFlow.largestExpense.id} transaction={moneyFlow.largestExpense} className="transaction-block-link" showPreview>
              <div className="ledger-insight-card">
                <span className="badge badge-warning">saída</span>
                <strong>{moneyFlow.largestExpense.description}</strong>
                <p>Maior saída do período: {fmtCur(moneyFlow.largestExpense.amount)}</p>
              </div>
            </TransactionLink>
          )}
        </div>
      </div>

      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>Leitura de receitas e despesas</span></div>
        <div className="ledger-ranking-table">
          {(incomeAnalysis.topSources || []).slice(0, 5).map((item) => (
            <TransactionLink key={`income-${item.id}`} transactionId={item.id} transaction={item} className="transaction-ranking-link" showPreview>
              <div className="ledger-ranking-row">
                <strong>{item.description}</strong>
                <span>Principal origem</span>
                <span className="mono">{fmtCur(item.amount)}</span>
              </div>
            </TransactionLink>
          ))}
          {(expenseAnalysis.topExpenses || []).slice(0, 5).map((item) => (
            <div key={`expense-${item.id}`} className="transaction-ranking-shell">
              <TransactionLink transactionId={item.id} transaction={item} className="transaction-ranking-link" showPreview>
                <div className="ledger-ranking-row">
                  <strong>{item.description}</strong>
                  <span>{item.category || "Maior compra"}</span>
                  <span className="mono">{fmtCur(item.amount)}</span>
                </div>
              </TransactionLink>
              {item.category && (
                <div className="insight-action-row">
                  <button className="insight-link-btn" type="button" onClick={() => onOpenCategory?.(item.category)}>
                    Abrir categoria
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
