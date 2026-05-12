import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { getLedgerAnalyticsImportQuality, getLedgerAnalyticsReports } from "../services/ledgerAnalyticsApi.js";
import CategoryBreakdownChart from "../components/ledgerAnalytics/CategoryBreakdownChart.jsx";
import MerchantRankingTable from "../components/ledgerAnalytics/MerchantRankingTable.jsx";
import PaymentMethodChart from "../components/ledgerAnalytics/PaymentMethodChart.jsx";
import AnnualTimelineChart from "../components/ledgerAnalytics/AnnualTimelineChart.jsx";
import CsvImportQualityCard from "../components/ledgerAnalytics/CsvImportQualityCard.jsx";
import ExecutiveSummaryCard from "../components/ledgerAnalytics/ExecutiveSummaryCard.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function CsvReportsPage() {
  const [data, setData] = useState(null);
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLedgerAnalyticsReports(), getLedgerAnalyticsImportQuality()])
      .then(([reportsData, qualityData]) => {
        setData(reportsData);
        setQuality(qualityData);
      })
      .catch(() => setError("Não foi possível carregar os relatórios do ledger."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout breadcrumb="Relatórios">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Ledger</span> Relatórios reais do CSV</div>
            <h1>Relatórios</h1>
          </div>
        </div>

        {loading && <div className="card beta-state"><strong>Carregando relatórios...</strong></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {data && (
          <>
            <div className="beta-metric-grid">
              <div className="card beta-metric"><span>Transações</span><strong>{data.transactionsCount ?? 0}</strong></div>
              <div className="card beta-metric"><span>Receitas</span><strong>{fmtCur(data.totals?.totalIncome || 0)}</strong></div>
              <div className="card beta-metric"><span>Despesas</span><strong>{fmtCur(data.totals?.totalExpenses || 0)}</strong></div>
              <div className="card beta-metric"><span>Saldo líquido</span><strong>{fmtCur(data.totals?.netAmount || 0)}</strong></div>
            </div>

            <div className="ledger-analytics-layout">
              <ExecutiveSummaryCard data={data.executiveSummary || {}} />
              <CsvImportQualityCard data={quality || {}} />
            </div>

            <div className="ledger-analytics-layout">
              <AnnualTimelineChart annual={data.annual || []} />
              <CategoryBreakdownChart title="Relatório por categoria" items={data.byCategory || []} />
            </div>

            <div className="ledger-analytics-layout">
              <MerchantRankingTable items={data.byMerchant || []} />
              <PaymentMethodChart items={data.byPaymentMethod || []} />
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Para onde foi o dinheiro</span></div>
                <div className="ledger-ranking-table">
                  {(data.moneyOutflow || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={item.category}>
                      <strong>{item.category}</strong>
                      <span>{item.count} lançamentos</span>
                      <span className="mono">{fmtCur(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>De onde veio o dinheiro</span></div>
                <div className="ledger-ranking-table">
                  {(data.moneyInflow || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={item.merchant}>
                      <strong>{item.merchant}</strong>
                      <span>{item.count} entradas</span>
                      <span className="mono">{fmtCur(item.income || item.totalAmount || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Maiores gastos</span></div>
                <div className="ledger-ranking-table">
                  {(data.topPurchases || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={item.id}>
                      <strong>{item.description}</strong>
                      <span>{item.category || "Sem categoria"}</span>
                      <span className="mono">{fmtCur(Math.abs(item.signedAmount || item.amount || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Maiores entradas</span></div>
                <div className="ledger-ranking-table">
                  {(data.topIncome || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={item.id}>
                      <strong>{item.description}</strong>
                      <span>{item.counterpartyName || item.merchant || item.category || "Entrada"}</span>
                      <span className="mono">{fmtCur(Math.abs(item.signedAmount || item.amount || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Gastos recorrentes</span></div>
                <div className="ledger-ranking-table">
                  {(data.recurring || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={`${item.merchant}-${item.frequency}`}>
                      <strong>{item.merchant}</strong>
                      <span>{item.kind === "SUBSCRIPTION" ? "Assinatura" : item.frequency === "MONTHLY" ? "Mensal" : "Semanal"}</span>
                      <span className="mono">{fmtCur(item.averageAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Possíveis assinaturas</span></div>
                <div className="ledger-ranking-table">
                  {(data.subscriptions || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={`${item.merchant}-${item.averageAmount}`}>
                      <strong>{item.merchant}</strong>
                      <span>{item.frequency === "MONTHLY" ? "Mensal" : "Semanal"}</span>
                      <span className="mono">{fmtCur(item.averageAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Anomalias</span></div>
                <div className="ledger-ranking-table">
                  {(data.anomalies || []).slice(0, 10).map((item) => (
                    <div className="ledger-ranking-row" key={item.id}>
                      <strong>{item.merchant}</strong>
                      <span>{item.reason || item.description}</span>
                      <span className="mono">{fmtCur(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Qualidade da classificação</span></div>
                <div className="ledger-quality-grid">
                  <div><span>Alta confiança</span><strong>{data.classificationQuality?.highConfidence ?? 0}</strong></div>
                  <div><span>Média confiança</span><strong>{data.classificationQuality?.mediumConfidence ?? 0}</strong></div>
                  <div><span>Baixa confiança</span><strong>{data.classificationQuality?.lowConfidence ?? 0}</strong></div>
                  <div><span>Em Outros</span><strong>{data.classificationQuality?.uncategorized ?? 0}</strong></div>
                  <div><span>Revisar</span><strong>{data.classificationQuality?.needsReview ?? 0}</strong></div>
                  <div><span>Aproveitamento</span><strong>{Number(data.classificationQuality?.utilizationRate || 0).toFixed(1)}%</strong></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
