import { useEffect, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import {
  getLedgerAnalyticsConfidence,
  getLedgerAnalyticsExecutiveReport,
  getLedgerAnalyticsQuestionAnswers,
  getLedgerAnalyticsRankings,
  getLedgerAnalyticsStatementReading,
  getLedgerAnalyticsTimeline
} from "../services/ledgerAnalyticsApi.js";
import ExecutiveSummaryPanel from "../components/ledgerAnalytics/ExecutiveSummaryPanel.jsx";
import FinancialQuestionCards from "../components/ledgerAnalytics/FinancialQuestionCards.jsx";
import SpendingRankingPanel from "../components/ledgerAnalytics/SpendingRankingPanel.jsx";
import TimelineAnalysisPanel from "../components/ledgerAnalytics/TimelineAnalysisPanel.jsx";
import ConfidenceQualityPanel from "../components/ledgerAnalytics/ConfidenceQualityPanel.jsx";
import PaymentTypeBreakdownPanel from "../components/ledgerAnalytics/PaymentTypeBreakdownPanel.jsx";
import MerchantMovementPanel from "../components/ledgerAnalytics/MerchantMovementPanel.jsx";
import PersonalizedAnalysisProfileCard from "../components/ledgerAnalytics/PersonalizedAnalysisProfileCard.jsx";

export default function StatementReadingPage() {
  const [statementReading, setStatementReading] = useState(null);
  const [executiveReport, setExecutiveReport] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getLedgerAnalyticsStatementReading(),
      getLedgerAnalyticsExecutiveReport(),
      getLedgerAnalyticsQuestionAnswers(),
      getLedgerAnalyticsRankings(),
      getLedgerAnalyticsTimeline(),
      getLedgerAnalyticsConfidence()
    ])
      .then(([statementData, reportData, questionsData, rankingsData, timelineData, confidenceData]) => {
        setStatementReading(statementData);
        setExecutiveReport(reportData);
        setQuestionAnswers(questionsData);
        setRankings(rankingsData);
        setTimeline(timelineData);
        setConfidence(confidenceData);
      })
      .catch(() => setError("Não foi possível carregar a leitura inteligente do extrato."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout breadcrumb="Leitura Inteligente do Extrato">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Ledger</span> Leitura Inteligente do Extrato</div>
            <h1>Leitura Inteligente do Extrato</h1>
          </div>
        </div>

        {loading && <div className="card beta-state"><strong>Lendo o extrato...</strong></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {statementReading && (
          <>
            <div className="ledger-analytics-layout">
              <ExecutiveSummaryPanel data={statementReading} />
              <PersonalizedAnalysisProfileCard profile={statementReading.profile || {}} />
              <ConfidenceQualityPanel data={confidence || statementReading.confidence || {}} />
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>O que aconteceu com seu dinheiro?</span></div>
                <p className="ledger-executive-narrative">{executiveReport?.narrative || "Sem relatório executivo."}</p>
                {!!executiveReport?.risks?.length && (
                  <div className="ledger-insights-list">
                    {executiveReport.risks.map((item) => (
                      <div className="ledger-insight-card" key={item}>
                        <span className="badge badge-warning">risco</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PaymentTypeBreakdownPanel data={statementReading.paymentBreakdown || []} />
            </div>

            <FinancialQuestionCards data={questionAnswers || {}} />

            <div className="ledger-analytics-layout">
              <MerchantMovementPanel items={rankings?.topMerchants || []} />
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Explicações automáticas</span></div>
                <div className="ledger-ranking-table">
                  {(statementReading.sampleExplanations || []).map((item) => (
                    <div className="ledger-ranking-row" key={item.id}>
                      <strong>{item.description}</strong>
                      <span>{item.confidenceLabel}</span>
                      <span>{item.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <SpendingRankingPanel data={rankings || {}} />
            <TimelineAnalysisPanel data={statementReading.timeline || timeline || {}} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
