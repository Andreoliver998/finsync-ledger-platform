import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FinancialProfileBreakdown from "../components/financialProfile/FinancialProfileBreakdown.jsx";
import FinancialProfileHeader from "../components/financialProfile/FinancialProfileHeader.jsx";
import FinancialProfileSignals from "../components/financialProfile/FinancialProfileSignals.jsx";
import FinancialProfileTimeline from "../components/financialProfile/FinancialProfileTimeline.jsx";
import FinancialProfileTotals from "../components/financialProfile/FinancialProfileTotals.jsx";
import FinancialProfileTransactions from "../components/financialProfile/FinancialProfileTransactions.jsx";
import RelatedProfilesPanel from "../components/financialProfile/RelatedProfilesPanel.jsx";
import RelationshipGraphPanel from "../components/financialProfile/RelationshipGraphPanel.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import { getFinancialProfile } from "../services/financialProfileApi.js";
import { buildSearchUrl, buildTransactionsUrl } from "../utils/financialNavigation.js";
import { openFinancialProfile } from "../utils/financialProfileNavigation.js";

const ALLOWED_PROFILE_TYPES = new Set(["person", "merchant", "bank", "paymentMethod", "category"]);

function sanitizeString(value, maxLength = 120) {
  if (value === null || value === undefined) return "";
  return String(value)
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .slice(0, maxLength);
}

function sanitizeDate(value) {
  const normalized = sanitizeString(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function ProfileSkeleton() {
  return (
    <div className="beta-page anim-fade-up">
      <div className="card intelligent-hero-card">
        <div className="skeleton" style={{ height: 18, width: 140, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 34, width: "58%", marginBottom: ".9rem" }} />
        <div className="skeleton" style={{ height: 16, width: "92%", marginBottom: ".45rem" }} />
        <div className="skeleton" style={{ height: 16, width: "88%" }} />
      </div>
      <div className="ledger-analytics-layout">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="card ledger-analytics-card" key={index}>
            <div className="skeleton" style={{ height: 14, width: "35%", marginBottom: ".8rem" }} />
            <div className="skeleton" style={{ height: 22, width: "58%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinancialProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyStateMessage, setEmptyStateMessage] = useState("");

  const requestParams = useMemo(() => ({
    ...(() => {
      const searchParams = new URLSearchParams(location.search);
      const type = sanitizeString(searchParams.get("type"), 20);
      const q = sanitizeString(searchParams.get("q"), 80);
      const startDate = sanitizeDate(searchParams.get("startDate"));
      const endDate = sanitizeDate(searchParams.get("endDate"));

      return {
        type: ALLOWED_PROFILE_TYPES.has(type) ? type : type,
        q,
        startDate,
        endDate
      };
    })()
  }), [location.search]);

  async function load() {
    setLoading(true);
    setError("");
    setEmptyStateMessage("");
    try {
      setData(await getFinancialProfile(requestParams));
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível montar o perfil financeiro solicitado.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!requestParams.type && !requestParams.q) {
      setLoading(false);
      setData(null);
      setError("");
      setEmptyStateMessage("Abra um perfil a partir da busca, da leitura inteligente ou dos detalhes da transação.");
      return;
    }

    if (!requestParams.type) {
      setLoading(false);
      setData(null);
      setError("");
      setEmptyStateMessage("Selecione um tipo de perfil válido para iniciar a investigação.");
      return;
    }

    if (!ALLOWED_PROFILE_TYPES.has(requestParams.type)) {
      setLoading(false);
      setData(null);
      setError("Tipo de perfil inválido. Use person, merchant, bank, paymentMethod ou category.");
      setEmptyStateMessage("");
      return;
    }

    if (!requestParams.q) {
      setLoading(false);
      setData(null);
      setError("");
      setEmptyStateMessage("Informe uma entidade para abrir o dossiê financeiro.");
      return;
    }
    load();
  }, [requestParams.endDate, requestParams.q, requestParams.startDate, requestParams.type]);

  function openSearch(extra = {}) {
    navigate(buildSearchUrl({
      q: requestParams.q,
      startDate: requestParams.startDate,
      endDate: requestParams.endDate,
      ...extra
    }));
  }

  function openTransactions(extra = {}) {
    navigate(buildTransactionsUrl({
      startDate: requestParams.startDate,
      endDate: requestParams.endDate,
      ...extra
    }));
  }

  function openRelatedProfile(item) {
    openFinancialProfile(navigate, {
      type: item.type,
      q: item.name,
      startDate: requestParams.startDate,
      endDate: requestParams.endDate
    });
  }

  function openPaymentMethodProfile(value) {
    openFinancialProfile(navigate, {
      type: "paymentMethod",
      q: value,
      startDate: requestParams.startDate,
      endDate: requestParams.endDate
    });
  }

  function openCategoryProfile(value) {
    openFinancialProfile(navigate, {
      type: "category",
      q: value,
      startDate: requestParams.startDate,
      endDate: requestParams.endDate
    });
  }

  if (loading) {
    return (
      <AppLayout breadcrumb="Perfil Financeiro">
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumb="Perfil Financeiro">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Profile</span> Dossiê investigativo de contraparte</div>
            <h1>Perfil Financeiro</h1>
          </div>
          <button className="btn btn-ghost btn-sm" type="button" onClick={load} disabled={loading || !requestParams.q || !requestParams.type}>
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>

        {emptyStateMessage ? (
          <div className="card beta-state">
            <strong>{emptyStateMessage}</strong>
            <span>Use parâmetros como <code>?type=person&q=Gilvanise</code> para iniciar a investigação.</span>
          </div>
        ) : null}

        {error && (
          <div className="card beta-state">
            <AlertTriangle size={18} />
            <strong>{error}</strong>
          </div>
        )}

        {!error && data?.profile && (
          <>
            <FinancialProfileHeader
              profile={data.profile}
              totals={data.totals}
              narrative={data.narrative}
              onOpenSearch={() => openSearch({ q: requestParams.q })}
              onOpenTransactions={() => openTransactions({})}
            />
            <FinancialProfileTotals totals={data.totals} profile={data.profile} />
            <RelationshipGraphPanel params={requestParams} navigate={navigate} />
            <FinancialProfileBreakdown
              paymentMethods={data.paymentMethods || []}
              categories={data.categories || []}
              onOpenPaymentMethod={openPaymentMethodProfile}
              onOpenCategory={openCategoryProfile}
            />
            <RelatedProfilesPanel
              items={data.relatedProfiles || []}
              navigate={navigate}
              currentParams={requestParams}
            />
            <FinancialProfileTimeline items={data.monthlyTimeline || []} />
            <FinancialProfileSignals
              recurrenceSignals={data.recurrenceSignals || []}
              riskSignals={data.riskSignals || []}
              insights={data.insights || []}
              onOpenRecurrence={(item) => openSearch({ q: item?.merchant || requestParams.q, recurrence: true })}
            />
            <FinancialProfileTransactions items={data.relatedTransactions || []} />
          </>
        )}

        {!loading && !error && requestParams.type && requestParams.q && !data?.profile && (
          <div className="card beta-state">
            <LoaderCircle size={18} />
            <strong>Perfil indisponível para este recorte.</strong>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
