import { AlertTriangle, ArrowLeft, CalendarRange, LoaderCircle, RefreshCw, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import TransactionLink from "../components/financial/TransactionLink.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import { getTransactionDetails } from "../services/transactionDetailsApi.js";
import { buildSearchUrl, buildTransactionsUrl } from "../utils/financialNavigation.js";
import { openFinancialProfile } from "../utils/financialProfileNavigation.js";

function fmtCur(value, currencyCode = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode || "BRL" }).format(Number(value || 0));
}

function fmtDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function DetailsSkeleton() {
  return (
    <div className="beta-page anim-fade-up">
      <div className="card intelligent-hero-card">
        <div className="skeleton" style={{ height: 18, width: 120, marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: 34, width: "68%", marginBottom: ".9rem" }} />
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

export default function TransactionDetailsPage() {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contextParams = useMemo(() => ({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    paymentMethod: searchParams.get("paymentMethod") || "",
    category: searchParams.get("category") || "",
    source: searchParams.get("source") || "",
    minAmount: searchParams.get("minAmount") || "",
    maxAmount: searchParams.get("maxAmount") || ""
  }), [searchParams]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getTransactionDetails(transactionId));
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível carregar a investigação da transação.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [transactionId]);

  const transaction = data?.transaction;
  const counterparty = transaction?.counterpartyName || transaction?.merchantName || transaction?.merchant || "";
  const temporalWindow = transaction?.date ? {
    startDate: addDays(transaction.date, -7),
    endDate: addDays(transaction.date, 7)
  } : {};

  function openRelatedSearch(extra = {}) {
    navigate(buildSearchUrl({
      q: counterparty || transaction?.description || transaction?.paymentMethod || transaction?.category || "PIX",
      ...contextParams,
      ...extra
    }));
  }

  function openTemporalContext() {
    navigate(buildTransactionsUrl({
      ...contextParams,
      ...temporalWindow,
      paymentMethod: transaction?.paymentMethod || contextParams.paymentMethod,
      category: transaction?.category || contextParams.category
    }));
  }

  function openRecurrence() {
    navigate(buildSearchUrl({
      ...contextParams,
      q: data?.recurrenceContext?.merchant || counterparty || transaction?.description || "PIX",
      recurrence: true
    }));
  }

  function goBackToList() {
    navigate(buildTransactionsUrl(contextParams));
  }

  function openCounterpartyProfile() {
    const profileType = transaction?.counterpartyName ? "person" : transaction?.merchantName ? "merchant" : transaction?.bank ? "bank" : transaction?.paymentMethod ? "paymentMethod" : transaction?.category ? "category" : "";
    const profileQuery = transaction?.counterpartyName || transaction?.merchantName || transaction?.bank || transaction?.paymentMethod || transaction?.category || "";

    openFinancialProfile(navigate, {
      type: profileType,
      q: profileQuery,
      startDate: contextParams.startDate,
      endDate: contextParams.endDate
    });
  }

  if (loading) {
    return (
      <AppLayout breadcrumb="Investigação de Transação">
        <DetailsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumb="Investigação de Transação">
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow"><span className="badge badge-green">Investigation</span> Navegação determinística por ID real</div>
            <h1>Painel de investigação da transação</h1>
          </div>
          <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
            <button className="btn btn-ghost btn-sm" type="button" onClick={goBackToList}>
              <ArrowLeft size={14} /> Voltar
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
          </div>
        </div>

        {error && (
          <div className="card beta-state">
            <AlertTriangle size={18} />
            <strong>{error}</strong>
          </div>
        )}

        {!error && transaction && (
          <>
            <div className="card intelligent-hero-card">
              <div className="intelligent-hero-copy">
                <div className="beta-eyebrow">
                  <span className={`badge ${transaction.amount < 0 ? "badge-warning" : "badge-green"}`}>{transaction.sourceType}</span>
                  Investigação contextual
                </div>
                <h1>{transaction.description}</h1>
                <p className="ledger-executive-narrative">{data.humanExplanation}</p>
                <div className="insight-action-row">
                  <button className="insight-link-btn" type="button" onClick={() => openRelatedSearch({ paymentMethod: transaction.paymentMethod, category: transaction.category })}>
                    Abrir busca relacionada
                  </button>
                  <button className="insight-link-btn" type="button" onClick={openRecurrence}>
                    Ver recorrências
                  </button>
                  <button className="insight-link-btn" type="button" onClick={() => openRelatedSearch({ q: counterparty })}>
                    Analisar contraparte
                  </button>
                  <button className="insight-link-btn" type="button" onClick={openCounterpartyProfile}>
                    Abrir perfil da contraparte
                  </button>
                  <button className="insight-link-btn" type="button" onClick={openTemporalContext}>
                    Ver contexto temporal
                  </button>
                </div>
              </div>
              <div className="intelligent-kpi-grid">
                <div className="intelligent-kpi-card"><span>Valor</span><strong>{transaction.amount > 0 ? "+" : "-"}{fmtCur(transaction.absoluteAmount, transaction.currencyCode)}</strong></div>
                <div className="intelligent-kpi-card"><span>Data</span><strong>{fmtDate(transaction.date)}</strong></div>
                <div className="intelligent-kpi-card"><span>Categoria</span><strong>{transaction.category || "—"}</strong></div>
                <div className="intelligent-kpi-card"><span>Método</span><strong>{transaction.paymentMethod || "—"}</strong></div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Leitura financeira</span></div>
                <div className="ledger-quality-grid">
                  <div><span>Impacto no mês</span><strong>{(data.financialImpact?.shareOfMonthPercent || 0).toFixed(1)}%</strong></div>
                  <div><span>Despesas do mês</span><strong>{fmtCur(data.financialImpact?.monthExpenses || 0, transaction.currencyCode)}</strong></div>
                  <div><span>Entradas do mês</span><strong>{fmtCur(data.financialImpact?.monthIncome || 0, transaction.currencyCode)}</strong></div>
                  <div><span>Direção</span><strong>{transaction.direction === "IN" ? "Entrada" : "Saída"}</strong></div>
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Confiança analítica</span></div>
                <div className="ledger-quality-grid">
                  <div><span>Rótulo</span><strong>{data.confidence?.label || "—"}</strong></div>
                  <div><span>Score</span><strong>{Number(data.confidence?.score || 0).toFixed(2)}</strong></div>
                  <div><span>Precisa revisar</span><strong>{data.confidence?.needsReview ? "Sim" : "Não"}</strong></div>
                  <div><span>Base</span><strong>{data.confidence?.classificationReason || "Leitura contextual."}</strong></div>
                </div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Contrapartes relacionadas</span></div>
                <div className="ledger-ranking-table">
                  {(data.relatedPeople || []).length === 0 && (data.relatedMerchants || []).length === 0 && (
                    <div className="ledger-empty">Não há contrapartes relacionadas suficientes neste recorte.</div>
                  )}
                  {(data.relatedPeople || []).map((item) => (
                    <button className="ledger-ranking-row transaction-entity-row" type="button" key={`person-${item.name}`} onClick={() => openFinancialProfile(navigate, { type: "person", q: item.name, startDate: contextParams.startDate, endDate: contextParams.endDate })}>
                      <strong>{item.name}</strong>
                      <span>{item.count} ocorrências</span>
                      <span className="mono">{fmtCur(item.amount, transaction.currencyCode)}</span>
                    </button>
                  ))}
                  {(data.relatedMerchants || []).map((item) => (
                    <button className="ledger-ranking-row transaction-entity-row" type="button" key={`merchant-${item.name}`} onClick={() => openFinancialProfile(navigate, { type: "merchant", q: item.name, startDate: contextParams.startDate, endDate: contextParams.endDate })}>
                      <strong>{item.name}</strong>
                      <span>{item.count} ocorrências</span>
                      <span className="mono">{fmtCur(item.amount, transaction.currencyCode)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Recorrência e padrão</span></div>
                <div className="ledger-insights-list">
                  <button className="ledger-insight-card transaction-entity-card" type="button" onClick={openRecurrence}>
                    <span className={`badge ${data.recurrenceContext?.detected ? "badge-green" : "badge-neutral"}`}>
                      {data.recurrenceContext?.detected ? "detectado" : "sem padrão"}
                    </span>
                    <strong>{data.recurrenceContext?.merchant || counterparty || "Sem contraparte dominante"}</strong>
                    <p>
                      {data.recurrenceContext?.detected
                        ? `${data.recurrenceContext.frequency?.toLowerCase() || "recorrente"} · ${data.recurrenceContext.kind?.toLowerCase() || "movimentação"}`
                        : "Nenhuma recorrência forte foi detectada para esta transação."}
                    </p>
                  </button>
                  <div className="transaction-preview-grid">
                    {(data.recurrenceContext?.transactions || []).slice(0, 4).map((item) => (
                      <TransactionLink key={item.id} transactionId={item.id} transaction={item} className="transaction-mini-link" showPreview>
                        <span className="transaction-mini-label">Abrir ocorrência</span>
                      </TransactionLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Contexto temporal</span></div>
                <div className="ledger-quality-grid">
                  <div><span>Transações no mês</span><strong>{data.timelineContext?.monthTransactionCount || 0}</strong></div>
                  <div><span>Janela analisada</span><strong>{fmtDate(data.timelineContext?.previousTransactions?.[0]?.date || temporalWindow.startDate)} até {fmtDate(data.timelineContext?.nextTransactions?.slice(-1)[0]?.date || temporalWindow.endDate)}</strong></div>
                </div>
                <div className="ledger-insights-list" style={{ marginTop: "1rem" }}>
                  {(data.timelineContext?.previousTransactions || []).slice(0, 4).map((item) => (
                    <TransactionLink key={`before-${item.id}`} transactionId={item.id} transaction={item} className="transaction-block-link" showPreview>
                      <div className="ledger-insight-card">
                        <span className="badge badge-neutral">antes</span>
                        <strong>{item.description}</strong>
                        <p>{fmtDate(item.date)} · {fmtCur(Math.abs(item.amount || 0), item.currencyCode)}</p>
                      </div>
                    </TransactionLink>
                  ))}
                  {(data.timelineContext?.nextTransactions || []).slice(0, 4).map((item) => (
                    <TransactionLink key={`after-${item.id}`} transactionId={item.id} transaction={item} className="transaction-block-link" showPreview>
                      <div className="ledger-insight-card">
                        <span className="badge badge-blue">depois</span>
                        <strong>{item.description}</strong>
                        <p>{fmtDate(item.date)} · {fmtCur(Math.abs(item.amount || 0), item.currencyCode)}</p>
                      </div>
                    </TransactionLink>
                  ))}
                </div>
              </div>
            </div>

            <div className="card ledger-analytics-card">
              <div className="dash-section-title"><span>Transações relacionadas</span></div>
              <div className="search-transactions-head">
                <span>Data</span>
                <span>Descrição</span>
                <span>Categoria</span>
                <span>Método</span>
                <span>Origem</span>
                <span>Valor</span>
              </div>
              <div className="search-transactions-list">
                {(data.relatedTransactions || []).length === 0 ? (
                  <div className="ledger-empty">Nenhuma transação correlata encontrada para esta leitura.</div>
                ) : (
                  data.relatedTransactions.map((item) => (
                    <TransactionLink key={item.id} transactionId={item.id} transaction={item} className="search-transaction-row" showPreview>
                      <span>{fmtDate(item.date)}</span>
                      <span>
                        <strong>{item.description}</strong>
                        <small>{item.counterpartyName || item.merchantName || item.category || item.paymentMethod || item.sourceType}</small>
                      </span>
                      <span>{item.category || "—"}</span>
                      <span>{item.paymentMethod || "—"}</span>
                      <span>{item.sourceType}</span>
                      <span className={`mono ${item.amount > 0 ? "text-green" : "text-orange"}`}>
                        {item.amount > 0 ? "+" : "-"}{fmtCur(Math.abs(item.amount || 0), item.currencyCode)}
                      </span>
                    </TransactionLink>
                  ))
                )}
              </div>
            </div>

            <div className="ledger-analytics-layout">
              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Traços operacionais</span></div>
                <div className="ledger-quality-grid">
                  <div><span>Banco</span><strong>{transaction.bank || "—"}</strong></div>
                  <div><span>Conta / cartão</span><strong>{transaction.accountName || "—"}</strong></div>
                  <div><span>Arquivo</span><strong>{transaction.fileName || "—"}</strong></div>
                  <div><span>Raw completo</span><strong>{transaction.rawAvailable ? "restrito" : "não disponível"}</strong></div>
                </div>
              </div>

              <div className="card ledger-analytics-card">
                <div className="dash-section-title"><span>Próximas leituras</span></div>
                <div className="ledger-insights-list">
                  <div className="ledger-insight-card">
                    <span className="badge badge-green"><Search size={11} /></span>
                    <strong>Busca Inteligente</strong>
                    <p>Cruze esta transação com a contraparte, o método e a categoria para ampliar o contexto.</p>
                  </div>
                  <div className="ledger-insight-card">
                    <span className="badge badge-blue"><CalendarRange size={11} /></span>
                    <strong>Contexto temporal</strong>
                    <p>Abra a janela de sete dias para entender o fluxo imediatamente antes e depois.</p>
                  </div>
                  <div className="ledger-insight-card">
                    <span className="badge badge-warning"><Sparkles size={11} /></span>
                    <strong>Recorrência</strong>
                    <p>Valide se este lançamento faz parte de um padrão fixo ou de um evento isolado.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !error && !transaction && (
          <div className="card beta-state">
            <LoaderCircle size={18} />
            <strong>Transação não disponível para investigação.</strong>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
