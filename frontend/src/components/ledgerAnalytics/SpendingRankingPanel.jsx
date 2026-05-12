function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function RankingCard({ title, items = [], valueKey = "amount", subtitleKey = "category" }) {
  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title"><span>{title}</span></div>
      <div className="ledger-ranking-table">
        {items.length === 0 ? <div className="chart-placeholder"><span>Sem dados</span></div> : items.map((item, index) => (
          <div className="ledger-ranking-row" key={`${title}-${item.id || item.merchant || item.category || item.day || index}`}>
            <strong>{item.description || item.merchant || item.category || item.label || item.day}</strong>
            <span>{item[subtitleKey] || item.count ? `${item.count || 0} itens` : "—"}</span>
            <span className="mono">{fmtCur(item[valueKey] || item.totalAmount || item.expenses || item.moved || 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SpendingRankingPanel({ data = {} }) {
  return (
    <>
      <div className="ledger-analytics-layout">
        <RankingCard title="Top 10 maiores saídas" items={data.topExpenses || []} />
        <RankingCard title="Top 10 maiores entradas" items={data.topIncome || []} />
      </div>
      <div className="ledger-analytics-layout">
        <RankingCard title="Top pessoas / empresas" items={data.topMerchants || []} valueKey="expenses" subtitleKey="lastTransactionAt" />
        <RankingCard title="Top categorias" items={data.topCategories || []} />
      </div>
      <div className="ledger-analytics-layout">
        <RankingCard title="Top métodos de pagamento" items={data.topPaymentMethods || []} valueKey="totalAmount" subtitleKey="label" />
        <RankingCard title="Top meses mais caros" items={data.expensiveMonths || []} valueKey="expenses" subtitleKey="month" />
      </div>
      <div className="ledger-analytics-layout">
        <RankingCard title="Top dias mais movimentados" items={data.busyDays || []} valueKey="moved" subtitleKey="day" />
      </div>
    </>
  );
}
