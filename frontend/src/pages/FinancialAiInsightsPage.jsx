import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import { getLedgerAnalyticsCardUsage, getLedgerAnalyticsInsights } from "../services/ledgerAnalyticsApi.js";
import FinancialInsightsPanel from "../components/ledgerAnalytics/FinancialInsightsPanel.jsx";
import ProbableCardUsagePanel from "../components/ledgerAnalytics/ProbableCardUsagePanel.jsx";
import MerchantRankingTable from "../components/ledgerAnalytics/MerchantRankingTable.jsx";

export default function FinancialAiInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [cardUsage, setCardUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLedgerAnalyticsInsights(), getLedgerAnalyticsCardUsage()])
      .then(([insightsData, cardUsageData]) => {
        setInsights(insightsData);
        setCardUsage(cardUsageData);
      })
      .catch(() => setError("Não foi possível gerar insights financeiros reais."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout breadcrumb="IA Financeira">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Ledger</span> IA baseada em transações reais</div>
            <h1>IA Financeira</h1>
          </div>
        </div>

        {loading && <div className="card beta-state"><strong>Gerando análise financeira...</strong></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {insights && (
          <>
            <FinancialInsightsPanel data={insights} />
            <div className="ledger-analytics-layout">
              <ProbableCardUsagePanel data={cardUsage || {}} />
              <MerchantRankingTable items={insights.topMerchants || []} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
