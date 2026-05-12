import { useEffect, useState } from "react";
import FinancialDashboard from "../components/FinancialDashboard.jsx";
import LedgerAnalyticsDashboard from "../components/ledgerAnalytics/LedgerAnalyticsDashboard.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import {
  getAccounts,
  getDashboardSummary,
  getExtendedMetrics
} from "../services/financialSyncApi.js";
import {
  getLedgerAnalyticsCardUsage,
  getLedgerAnalyticsCategories,
  getLedgerAnalyticsImportQuality,
  getLedgerAnalyticsInsights,
  getLedgerAnalyticsMerchants,
  getLedgerAnalyticsOverview,
  getLedgerAnalyticsPaymentMethods,
  getLedgerAnalyticsTimeline
} from "../services/ledgerAnalyticsApi.js";

const DEFAULT_FILTERS = {
  period: "ALL",
  startDate: "",
  endDate: "",
  month: "",
  year: "",
  source: "ALL",
  bank: "",
  category: "",
  paymentMethod: ""
};

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [ledgerAnalytics, setLedgerAnalytics] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError("");

      try {
        const cleaned = cleanFilters(filters);
        const [
          summaryData,
          accountsData,
          metricsData,
          overview,
          timeline,
          categories,
          merchants,
          paymentMethods,
          insights,
          cardUsage,
          importQuality
        ] = await Promise.all([
          getDashboardSummary(cleaned),
          getAccounts(),
          getExtendedMetrics(cleaned),
          getLedgerAnalyticsOverview(cleaned),
          getLedgerAnalyticsTimeline(cleaned),
          getLedgerAnalyticsCategories(cleaned),
          getLedgerAnalyticsMerchants(cleaned),
          getLedgerAnalyticsPaymentMethods(cleaned),
          getLedgerAnalyticsInsights(cleaned),
          getLedgerAnalyticsCardUsage(cleaned),
          getLedgerAnalyticsImportQuality()
        ]);

        if (!isMounted) return;

        setSummary(summaryData);
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
        setMetrics(metricsData);
        setLedgerAnalytics({
          overview,
          timeline,
          categories,
          merchants,
          paymentMethods,
          insights,
          cardUsage,
          importQuality
        });
      } catch {
        if (!isMounted) return;

        setSummary(null);
        setAccounts([]);
        setMetrics(null);
        setLedgerAnalytics(null);
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [filters, refreshKey]);

  useEffect(() => {
    function handleLedgerUpdated() {
      setRefreshKey((value) => value + 1);
    }

    window.addEventListener("finsync:ledger-updated", handleLedgerUpdated);
    return () => window.removeEventListener("finsync:ledger-updated", handleLedgerUpdated);
  }, []);

  return (
    <AppLayout breadcrumb="Dashboard">
      <FinancialDashboard
        summary={summary}
        metrics={metrics}
        accounts={accounts}
        filters={filters}
        loading={loading}
        error={error}
        onFiltersChange={setFilters}
        onFiltersClear={() => setFilters(DEFAULT_FILTERS)}
      />
      <div style={{ marginTop: "1.5rem" }}>
        <LedgerAnalyticsDashboard
          overview={ledgerAnalytics?.overview}
          timeline={ledgerAnalytics?.timeline}
          categories={ledgerAnalytics?.categories}
          merchants={ledgerAnalytics?.merchants}
          paymentMethods={ledgerAnalytics?.paymentMethods}
          insights={ledgerAnalytics?.insights}
          cardUsage={ledgerAnalytics?.cardUsage}
          importQuality={ledgerAnalytics?.importQuality}
        />
      </div>
    </AppLayout>
  );
}
