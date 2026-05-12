import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import { getIntelligentReading } from "../services/intelligentReadingApi.js";
import ReadingSummaryHero from "../components/intelligentReading/ReadingSummaryHero.jsx";
import ReadingFiltersPanel from "../components/intelligentReading/ReadingFiltersPanel.jsx";
import MoneyFlowPanel from "../components/intelligentReading/MoneyFlowPanel.jsx";
import PixPeoplePanel from "../components/intelligentReading/PixPeoplePanel.jsx";
import MerchantRecurrencePanel from "../components/intelligentReading/MerchantRecurrencePanel.jsx";
import NarrativePanel from "../components/intelligentReading/NarrativePanel.jsx";
import { openSearchFromInsight, openTransactionsFromInsight } from "../utils/financialNavigation.js";
import { openFinancialProfile } from "../utils/financialProfileNavigation.js";

export default function SmartStatementReadingPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    period: "CURRENT_MONTH",
    startDate: "",
    endDate: ""
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestParams = useMemo(() => (
    Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    )
  ), [filters]);
  const navigationFilters = useMemo(() => ({
    startDate: filters.startDate || "",
    endDate: filters.endDate || ""
  }), [filters.endDate, filters.startDate]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getIntelligentReading(requestParams));
    } catch {
      setError("Não foi possível gerar a leitura inteligente do extrato.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [requestParams]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === "period" && value !== "CUSTOM" ? { startDate: "", endDate: "" } : {})
    }));
  }

  function openSearch(params = {}) {
    openSearchFromInsight(navigate, { ...navigationFilters, ...params });
  }

  function openTransactions(params = {}) {
    openTransactionsFromInsight(navigate, { ...navigationFilters, ...params });
  }

  function openProfile(type, q) {
    openFinancialProfile(navigate, {
      type,
      q,
      ...navigationFilters
    });
  }

  function handleAlertOpen(alert) {
    const text = `${alert?.title || ""} ${alert?.message || ""}`.toUpperCase();

    if (text.includes("PIX")) {
      openSearch({ q: "PIX", paymentMethod: "PIX" });
      return;
    }

    if (text.includes("CRÉDITO") || text.includes("CREDITO")) {
      openSearch({ paymentMethod: "CREDIT" });
      return;
    }

    if (text.includes("SALDO LÍQUIDO NEGATIVO") || text.includes("SALDO LIQUIDO NEGATIVO")) {
      openTransactions({ type: "DEBIT" });
      return;
    }

    openTransactions({});
  }

  function handleRecommendationOpen(recommendation) {
    const text = `${recommendation?.title || ""} ${recommendation?.message || ""}`.toUpperCase();
    const topMarketplace = data?.merchantAnalysis?.marketplaces?.[0]?.merchant || data?.merchantAnalysis?.topMerchants?.[0]?.merchant;
    const topPerson = data?.peopleAnalysis?.topPeople?.[0]?.name;

    if (text.includes("MARKETPLACE") && topMarketplace) {
      openSearch({ q: topMarketplace });
      return;
    }

    if (text.includes("RELACIONAMENTO FINANCEIRO") && topPerson) {
      openSearch({ q: topPerson });
      return;
    }

    if (text.includes("RECORREN")) {
      openSearch({ q: data?.recurrenceAnalysis?.recurringGroups?.[0]?.merchant || topMarketplace || topPerson || "PIX", recurrence: true });
      return;
    }

    if (text.includes("CRÉDITO") || text.includes("CREDITO")) {
      openSearch({ paymentMethod: "CREDIT" });
      return;
    }

    openTransactions({});
  }

  return (
    <AppLayout breadcrumb="Leitura Inteligente">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Ledger</span> Camada narrativa e interpretativa do extrato</div>
            <h1>Leitura Inteligente</h1>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>

        <ReadingFiltersPanel filters={filters} onChange={updateFilter} onRefresh={load} loading={loading} />

        {loading && <div className="card beta-state"><strong>Analisando o extrato em linguagem humana...</strong></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && !data?.executiveSummary?.totalTransactions && (
          <div className="card beta-state">
            <strong>Sem transações suficientes para leitura inteligente.</strong>
            <span>Importe um CSV ou ajuste o período para ampliar o recorte analisado.</span>
          </div>
        )}

        {data?.executiveSummary?.totalTransactions > 0 && (
          <>
            <ReadingSummaryHero
              data={data}
              onOpenPerson={(name) => openProfile("person", name)}
              onOpenMerchant={(merchant) => openProfile("merchant", merchant)}
              onOpenCategory={(category) => openProfile("category", category)}
              onOpenLargestExpense={(transaction) => openTransactions({ transactionId: transaction?.id, category: transaction?.category })}
            />
            <MoneyFlowPanel
              moneyFlow={data.moneyFlow || {}}
              incomeAnalysis={data.incomeAnalysis || {}}
              expenseAnalysis={data.expenseAnalysis || {}}
              onOpenCategory={(category) => openSearch({ category })}
            />
            <PixPeoplePanel
              pixAnalysis={data.pixAnalysis || {}}
              peopleAnalysis={data.peopleAnalysis || {}}
              onOpenPix={() => openSearch({ q: "PIX", paymentMethod: "PIX" })}
              onOpenPerson={(name) => openProfile("person", name)}
            />
            <MerchantRecurrencePanel
              merchantAnalysis={data.merchantAnalysis || {}}
              recurrenceAnalysis={data.recurrenceAnalysis || {}}
              paymentMethodAnalysis={data.paymentMethodAnalysis || {}}
              onOpenMerchant={(merchant) => openProfile("merchant", merchant)}
              onOpenPaymentMethod={(paymentMethod) => openProfile("paymentMethod", paymentMethod)}
              onOpenRecurrence={(item) => openSearch({ q: item?.merchant || data?.merchantAnalysis?.topMerchants?.[0]?.merchant || "PIX", recurrence: true })}
              onOpenCategory={(category) => openProfile("category", category)}
            />
            <NarrativePanel
              narrative={data.narrative}
              alerts={data.alerts || []}
              recommendations={data.recommendations || []}
              confidence={data.confidence || {}}
              onOpenAlert={handleAlertOpen}
              onOpenRecommendation={handleRecommendationOpen}
              onOpenTransactions={() => openTransactions({})}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
