function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

export default function TransactionTotalsBar({ summary = {} }) {
  const cards = [
    { label: "Transações encontradas", value: summary.totalTransactions ?? 0 },
    { label: "Total financeiro", value: fmtCur(summary.totalAmount ?? 0) },
    { label: "Receitas", value: fmtCur(summary.income ?? 0) },
    { label: "Despesas", value: fmtCur(summary.expenses ?? 0) },
    { label: "Maior despesa", value: summary.biggestExpense ? fmtCur(Math.abs(summary.biggestExpense.amount)) : "—" },
    { label: "Maior receita", value: summary.biggestIncome ? fmtCur(Math.abs(summary.biggestIncome.amount)) : "—" }
  ];

  return (
    <div className="txn-summary-row">
      {cards.map((card) => (
        <div className="txn-stat" key={card.label}>
          <span className="txn-stat-label">{card.label}</span>
          <span className="txn-stat-value mono">{card.value}</span>
        </div>
      ))}
    </div>
  );
}
