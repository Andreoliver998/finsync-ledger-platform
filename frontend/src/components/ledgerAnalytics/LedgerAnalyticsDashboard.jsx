import AnnualTimelineChart from "./AnnualTimelineChart.jsx";
import CategoryBreakdownChart from "./CategoryBreakdownChart.jsx";
import CsvImportQualityCard from "./CsvImportQualityCard.jsx";
import MerchantRankingTable from "./MerchantRankingTable.jsx";
import PaymentMethodChart from "./PaymentMethodChart.jsx";
import FinancialInsightsPanel from "./FinancialInsightsPanel.jsx";
import ProbableCardUsagePanel from "./ProbableCardUsagePanel.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export default function LedgerAnalyticsDashboard({
  overview = {},
  timeline = {},
  categories = [],
  merchants = [],
  paymentMethods = [],
  insights = {},
  cardUsage = {},
  importQuality = {}
}) {
  const cards = [
    { label: "CSVs importados", value: overview.totalCsvImported ?? 0 },
    { label: "Transações importadas", value: overview.totalImportedTransactions ?? 0 },
    { label: "Período analisado", value: overview.analyzedPeriod?.start ? `${fmtDate(overview.analyzedPeriod.start)} até ${fmtDate(overview.analyzedPeriod.end)}` : "—" },
    { label: "Total de despesas", value: fmtCur(overview.totalExpenses || 0) },
    { label: "Total de receitas", value: fmtCur(overview.totalIncome || 0) },
    { label: "Saldo líquido", value: fmtCur(overview.netAmount || 0) }
  ];

  return (
    <div className="ledger-analytics-dashboard">
      <div className="ledger-analytics-grid">
        {cards.map((card) => (
          <div className="card ledger-analytics-card" key={card.label}>
            <span className="txn-stat-label">{card.label}</span>
            <strong className="txn-stat-value">{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="ledger-analytics-layout">
        <AnnualTimelineChart annual={timeline.annual || []} />
        <CategoryBreakdownChart title="Top 5 categorias" items={overview.topCategories || categories} />
      </div>

      <div className="ledger-analytics-layout">
        <MerchantRankingTable items={overview.topMerchants || merchants} />
        <PaymentMethodChart items={paymentMethods} />
      </div>

      <div className="ledger-analytics-layout">
        <CsvImportQualityCard data={importQuality} />
        <ProbableCardUsagePanel data={cardUsage} />
      </div>

      <FinancialInsightsPanel data={insights} />
    </div>
  );
}
