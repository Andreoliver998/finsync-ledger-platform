import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CreditCard,
  Flag,
  LineChart,
  Plus,
  Settings,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import {
  createAlert,
  createCard,
  createGoal,
  createInvestment,
  deleteAlert,
  deleteCard,
  deleteGoal,
  deleteInvestment,
  getFinancialAi,
  getReports,
  getSettings,
  listAlerts,
  listCards,
  listGoals,
  listInvestments,
  updateSettings
} from "../services/betaModulesApi.js";
import { getLedgerAnalyticsCardUsage } from "../services/ledgerAnalyticsApi.js";
import ProbableCardUsagePanel from "../components/ledgerAnalytics/ProbableCardUsagePanel.jsx";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const analysisToneOptions = [
  { value: "DIRECT", label: "Direto" },
  { value: "DIDACTIC", label: "Didático" },
  { value: "EXECUTIVE", label: "Executivo" },
  { value: "CONSULTIVE", label: "Consultivo" }
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

function PageShell({ title, icon: Icon, children }) {
  return (
    <AppLayout breadcrumb={title}>
      <div className="beta-page anim-fade-up">
        <div className="beta-page-header">
          <div>
            <div className="beta-eyebrow">
              <span className="badge badge-green">Beta</span>
              Módulo FinSync
            </div>
            <h1>{title}</h1>
          </div>
          <div className="beta-header-icon">
            <Icon size={22} />
          </div>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}

function ModuleState({ loading, error, empty, emptyTitle, emptyText }) {
  if (loading) {
    return (
      <div className="card beta-state">
        <div className="ring ring-md" />
        <strong>Carregando dados do módulo...</strong>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle size={16} />
        <div>{error}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="card beta-state">
        <strong>{emptyTitle}</strong>
        <span>{emptyText}</span>
      </div>
    );
  }

  return null;
}

function BetaForm({ children, onSubmit, submitLabel = "Adicionar" }) {
  return (
    <form className="card beta-form" onSubmit={onSubmit}>
      {children}
      <button className="btn btn-primary btn-sm" type="submit">
        <Plus size={14} />
        {submitLabel}
      </button>
    </form>
  );
}

function RemoveButton({ onClick, title = "Remover" }) {
  return (
    <button className="btn btn-ghost btn-sm" type="button" onClick={onClick} title={title}>
      <Trash2 size={14} />
    </button>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setError("Não foi possível carregar as configurações."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      currency: form.get("currency"),
      locale: form.get("locale"),
      theme: form.get("theme"),
      monthlyBudget: form.get("monthlyBudget") ? toNumber(form.get("monthlyBudget")) : null,
      alertEmail: form.get("alertEmail") === "on",
      alertPush: form.get("alertPush") === "on",
      dataSharing: form.get("dataSharing") === "on",
      userFinancialProfile: {
        preferredName: form.get("preferredName") || null,
        fullName: form.get("fullName") || null,
        documentMasked: form.get("documentMasked") || null,
        primaryBank: form.get("primaryBank") || null,
        financialProfileType: form.get("financialProfileType") || null,
        analysisTone: form.get("analysisTone") || "CONSULTIVE",
        currency: form.get("currency"),
        locale: form.get("locale"),
        showPersonalizedTreatment: form.get("showPersonalizedTreatment") === "on"
      }
    };

    try {
      setSettings(await updateSettings(payload));
    } catch {
      setError("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Configurações" icon={Settings}>
      <ModuleState loading={loading} error={error} />
      {settings && (
        <form className="beta-settings-grid" onSubmit={handleSubmit}>
          <div className="card beta-panel">
            <h2>Preferências da conta</h2>
            <label className="input-group">
              <span className="input-label">Moeda</span>
              <input className="input" name="currency" defaultValue={settings.currency || "BRL"} />
            </label>
            <label className="input-group">
              <span className="input-label">Localidade</span>
              <input className="input" name="locale" defaultValue={settings.locale || "pt-BR"} />
            </label>
            <label className="input-group">
              <span className="input-label">Tema</span>
              <select className="input" name="theme" defaultValue={settings.theme || "dark"}>
                <option value="dark">Dark premium</option>
                <option value="system">Sistema</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label className="input-group">
              <span className="input-label">Orçamento mensal</span>
              <input className="input" name="monthlyBudget" type="number" min="0" step="0.01" defaultValue={settings.monthlyBudget ?? ""} />
            </label>
          </div>
          <div className="card beta-panel">
            <h2>Perfil financeiro do titular</h2>
            <label className="input-group">
              <span className="input-label">Nome preferido</span>
              <input className="input" name="preferredName" defaultValue={settings.userFinancialProfile?.preferredName || ""} placeholder="Como a análise deve falar com você" />
            </label>
            <label className="input-group">
              <span className="input-label">Nome completo opcional</span>
              <input className="input" name="fullName" defaultValue={settings.userFinancialProfile?.fullName || ""} placeholder="Uso interno e contextual" />
            </label>
            <label className="input-group">
              <span className="input-label">Documento mascarado</span>
              <input className="input" name="documentMasked" defaultValue={settings.userFinancialProfile?.documentMasked || ""} placeholder="Ex.: ***1234" />
            </label>
            <label className="input-group">
              <span className="input-label">Banco principal</span>
              <input className="input" name="primaryBank" defaultValue={settings.userFinancialProfile?.primaryBank || ""} placeholder="Ex.: Itaú, Nubank, Bradesco" />
            </label>
            <label className="input-group">
              <span className="input-label">Perfil financeiro</span>
              <input className="input" name="financialProfileType" defaultValue={settings.userFinancialProfile?.financialProfileType || ""} placeholder="Ex.: conservador, crescimento, operacional" />
            </label>
            <label className="input-group">
              <span className="input-label">Tom da análise</span>
              <select className="input" name="analysisTone" defaultValue={settings.userFinancialProfile?.analysisTone || "CONSULTIVE"}>
                {analysisToneOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="beta-check">
              <input
                name="showPersonalizedTreatment"
                type="checkbox"
                defaultChecked={Boolean(settings.userFinancialProfile?.showPersonalizedTreatment)}
              />
              Mostrar tratamento personalizado
            </label>
          </div>
          <div className="card beta-panel">
            <h2>Segurança e alertas</h2>
            <label className="beta-check"><input name="alertEmail" type="checkbox" defaultChecked={settings.alertEmail} /> Alertas por email</label>
            <label className="beta-check"><input name="alertPush" type="checkbox" defaultChecked={settings.alertPush} /> Alertas push</label>
            <label className="beta-check"><input name="dataSharing" type="checkbox" defaultChecked={settings.dataSharing} /> Compartilhamento analítico</label>
            <div className="card" style={{ marginTop: "1rem", background: "rgba(157,255,44,.08)", borderColor: "rgba(157,255,44,.22)" }}>
              <strong>Exemplos de personalização</strong>
              <p style={{ marginTop: ".7rem" }}>
                “André, seu maior gasto no período foi...”
                <br />
                “André, identificamos que você recebeu mais valores entre os dias...”
                <br />
                “André, seu uso de PIX foi maior que o uso de débito.”
              </p>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</button>
          </div>
        </form>
      )}
    </PageShell>
  );
}

export function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getReports()
      .then(setReport)
      .catch(() => setError("Não foi possível gerar os relatórios."))
      .finally(() => setLoading(false));
  }, []);

  const hasData = (report?.transactionsCount || 0) > 0;

  return (
    <PageShell title="Relatórios" icon={BarChart3}>
      <ModuleState loading={loading} error={error} empty={!loading && !error && !hasData} emptyTitle="Nenhum dado financeiro ainda" emptyText="Conecte o Open Finance ou registre lançamentos manuais para liberar relatórios." />
      {report && hasData && (
        <>
          <div className="beta-metric-grid">
            <div className="card beta-metric"><span>Receitas</span><strong>{money.format(report.monthIncome || 0)}</strong></div>
            <div className="card beta-metric"><span>Despesas</span><strong>{money.format(report.monthExpenses || 0)}</strong></div>
            <div className="card beta-metric"><span>Fluxo líquido</span><strong>{money.format(report.netCashFlow || 0)}</strong></div>
            <div className="card beta-metric"><span>Taxa de poupança</span><strong>{Math.round(report.savingsRate || 0)}%</strong></div>
          </div>
          <div className="card beta-panel">
            <h2>Top categorias</h2>
            <div className="beta-list">
              {report.topCategories.map((item) => (
                <div className="beta-row" key={item.category}>
                  <span>{item.category}</span>
                  <strong>{money.format(item.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

export function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setGoals(await listGoals());
    } catch {
      setError("Não foi possível carregar suas metas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createGoal({
      name: form.get("name"),
      targetAmount: toNumber(form.get("targetAmount")),
      currentAmount: toNumber(form.get("currentAmount")),
      category: form.get("category") || null,
      deadline: toIsoDate(form.get("deadline"))
    });
    event.currentTarget.reset();
    load();
  }

  return (
    <PageShell title="Metas" icon={Flag}>
      <BetaForm onSubmit={submit}>
        <input className="input" name="name" placeholder="Nome da meta" required />
        <input className="input" name="targetAmount" type="number" min="1" step="0.01" placeholder="Valor alvo" required />
        <input className="input" name="currentAmount" type="number" min="0" step="0.01" placeholder="Valor atual" />
        <input className="input" name="category" placeholder="Categoria" />
        <input className="input" name="deadline" type="date" />
      </BetaForm>
      <ModuleState loading={loading} error={error} empty={!loading && goals.length === 0} emptyTitle="Nenhuma meta cadastrada" emptyText="Crie metas para acompanhar objetivos financeiros com clareza." />
      <div className="beta-card-grid">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round(((goal.currentAmount || 0) / goal.targetAmount) * 100));
          return (
            <div className="card beta-panel" key={goal.id}>
              <div className="beta-row"><h2>{goal.name}</h2><RemoveButton onClick={() => deleteGoal(goal.id).then(load)} /></div>
              <p>{money.format(goal.currentAmount || 0)} de {money.format(goal.targetAmount)}</p>
              <div className="beta-progress"><span style={{ width: `${pct}%` }} /></div>
              <span className="badge badge-green">{pct}%</span>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

export function CardsPage() {
  const [cards, setCards] = useState([]);
  const [cardUsage, setCardUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setCards(await listCards());
    } catch {
      setError("Não foi possível carregar seus cartões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    getLedgerAnalyticsCardUsage().then(setCardUsage).catch(() => {});
  }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createCard({
      name: form.get("name"),
      bank: form.get("bank") || undefined,
      brand: form.get("brand") || undefined,
      lastFour: form.get("lastFour") || undefined,
      limit: form.get("limit") ? toNumber(form.get("limit")) : undefined,
      closingDay: form.get("closingDay") ? toNumber(form.get("closingDay")) : undefined,
      dueDay: form.get("dueDay") ? toNumber(form.get("dueDay")) : undefined
    });
    event.currentTarget.reset();
    load();
  }

  return (
    <PageShell title="Cartões" icon={CreditCard}>
      <BetaForm onSubmit={submit}>
        <input className="input" name="name" placeholder="Nome do cartão" required />
        <input className="input" name="bank" placeholder="Banco" />
        <input className="input" name="brand" placeholder="Bandeira" />
        <input className="input" name="lastFour" maxLength="4" placeholder="Final" />
        <input className="input" name="limit" type="number" min="0" step="0.01" placeholder="Limite" />
        <input className="input" name="closingDay" type="number" min="1" max="31" placeholder="Fechamento" />
        <input className="input" name="dueDay" type="number" min="1" max="31" placeholder="Vencimento" />
      </BetaForm>
      <ModuleState loading={loading} error={error} empty={!loading && cards.length === 0} emptyTitle="Nenhum cartão cadastrado" emptyText="Cadastre cartões para organizar limites, vencimentos e lançamentos." />
      <div className="beta-card-grid">
        {cards.map((card) => (
          <div className="card beta-card-visual" key={card.id}>
            <div className="beta-row"><span className="badge badge-orange">{card.brand || "Cartão"}</span><RemoveButton onClick={() => deleteCard(card.id).then(load)} /></div>
            <h2>{card.name}</h2>
            <p>{card.bank || "Instituição não informada"} · final {card.lastFour || "----"}</p>
            <strong>{card.limit ? money.format(card.limit) : "Limite não informado"}</strong>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <ProbableCardUsagePanel data={cardUsage || {}} />
      </div>
    </PageShell>
  );
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setAlerts(await listAlerts());
    } catch {
      setError("Não foi possível carregar os alertas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createAlert({
      name: form.get("name"),
      type: form.get("type"),
      threshold: form.get("threshold") ? toNumber(form.get("threshold")) : null,
      category: form.get("category") || null,
      channel: form.get("channel")
    });
    event.currentTarget.reset();
    load();
  }

  return (
    <PageShell title="Alertas" icon={AlertTriangle}>
      <BetaForm onSubmit={submit}>
        <input className="input" name="name" placeholder="Nome do alerta" required />
        <select className="input" name="type" defaultValue="BUDGET">
          <option value="BUDGET">Orçamento</option>
          <option value="CATEGORY">Categoria</option>
          <option value="BALANCE">Saldo</option>
          <option value="CARD_DUE">Cartão</option>
          <option value="GOAL">Meta</option>
        </select>
        <input className="input" name="threshold" type="number" min="0" step="0.01" placeholder="Limite" />
        <input className="input" name="category" placeholder="Categoria" />
        <select className="input" name="channel" defaultValue="IN_APP">
          <option value="IN_APP">In-app</option>
          <option value="EMAIL">Email</option>
          <option value="PUSH">Push</option>
        </select>
      </BetaForm>
      <ModuleState loading={loading} error={error} empty={!loading && alerts.length === 0} emptyTitle="Nenhum alerta ativo" emptyText="Crie alertas para acompanhar orçamento, saldo e metas." />
      <div className="beta-list">
        {alerts.map((alert) => (
          <div className="card beta-row beta-list-card" key={alert.id}>
            <div><strong>{alert.name}</strong><p>{alert.type} · {alert.channel}</p></div>
            <span className={`badge ${alert.isActive ? "badge-green" : "badge-neutral"}`}>{alert.isActive ? "Ativo" : "Inativo"}</span>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => updateAlert(alert.id, { isActive: !alert.isActive }).then(load)}>{alert.isActive ? "Pausar" : "Ativar"}</button>
            <RemoveButton onClick={() => deleteAlert(alert.id).then(load)} />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function FinancialAiPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFinancialAi()
      .then(setData)
      .catch(() => setError("Não foi possível gerar insights financeiros."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="IA Financeira" icon={BrainCircuit}>
      <ModuleState loading={loading} error={error} />
      {data && (
        <>
          <div className="card beta-ai-score">
            <span>Score financeiro Beta</span>
            <strong>{data.healthScore}</strong>
            <p>Ticket médio recente: {money.format(data.averageTicket || 0)}</p>
          </div>
          <div className="beta-card-grid">
            {data.insights.map((insight) => (
              <div className="card beta-panel" key={insight.title}>
                <span className="badge badge-blue">{insight.level}</span>
                <h2>{insight.title}</h2>
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

export function InvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setInvestments(await listInvestments());
    } catch {
      setError("Não foi possível carregar investimentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createInvestment({
      name: form.get("name"),
      type: form.get("type"),
      institution: form.get("institution") || null,
      investedAmount: toNumber(form.get("investedAmount")),
      currentAmount: form.get("currentAmount") ? toNumber(form.get("currentAmount")) : null,
      riskLevel: form.get("riskLevel") || null,
      liquidity: form.get("liquidity") || null
    });
    event.currentTarget.reset();
    load();
  }

  const totals = useMemo(() => ({
    invested: investments.reduce((acc, item) => acc + (item.investedAmount || 0), 0),
    current: investments.reduce((acc, item) => acc + (item.currentAmount ?? item.investedAmount ?? 0), 0)
  }), [investments]);

  return (
    <PageShell title="Investimentos" icon={LineChart}>
      <BetaForm onSubmit={submit}>
        <input className="input" name="name" placeholder="Ativo ou carteira" required />
        <select className="input" name="type" defaultValue="FIXED_INCOME">
          <option value="FIXED_INCOME">Renda fixa</option>
          <option value="STOCK">Ações</option>
          <option value="FUND">Fundos</option>
          <option value="CRYPTO">Cripto</option>
          <option value="PENSION">Previdência</option>
          <option value="OTHER">Outros</option>
        </select>
        <input className="input" name="institution" placeholder="Instituição" />
        <input className="input" name="investedAmount" type="number" min="0" step="0.01" placeholder="Valor investido" required />
        <input className="input" name="currentAmount" type="number" min="0" step="0.01" placeholder="Valor atual" />
        <select className="input" name="riskLevel" defaultValue="">
          <option value="">Risco</option>
          <option value="LOW">Baixo</option>
          <option value="MEDIUM">Médio</option>
          <option value="HIGH">Alto</option>
        </select>
        <input className="input" name="liquidity" placeholder="Liquidez" />
      </BetaForm>
      <ModuleState loading={loading} error={error} empty={!loading && investments.length === 0} emptyTitle="Nenhum investimento cadastrado" emptyText="Cadastre posições para acompanhar patrimônio e evolução." />
      {investments.length > 0 && (
        <div className="beta-metric-grid">
          <div className="card beta-metric"><span>Investido</span><strong>{money.format(totals.invested)}</strong></div>
          <div className="card beta-metric"><span>Atual</span><strong>{money.format(totals.current)}</strong></div>
          <div className="card beta-metric"><span>Resultado</span><strong>{money.format(totals.current - totals.invested)}</strong></div>
        </div>
      )}
      <div className="beta-card-grid">
        {investments.map((position) => (
          <div className="card beta-panel" key={position.id}>
            <div className="beta-row"><span className="badge badge-green">{position.type}</span><RemoveButton onClick={() => deleteInvestment(position.id).then(load)} /></div>
            <h2>{position.name}</h2>
            <p>{position.institution || "Instituição não informada"}</p>
            <strong>{money.format(position.currentAmount ?? position.investedAmount)}</strong>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
