import { PluggyConnect } from "react-pluggy-connect";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Unlink,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BankConnectionCard from "./BankConnectionCard.jsx";
import { useOpenFinance } from "../hooks/useOpenFinance.js";
import { getStoredJwt } from "../services/api.js";

/* ─── Mini Toast ─────────────────────────────────────────────── */
function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} style={{ maxWidth: 340 }}>
      {type === "success" ? (
        <CheckCircle2 size={16} className="toast-icon" />
      ) : (
        <AlertCircle size={16} className="toast-icon" />
      )}
      <span>{message}</span>
    </div>
  );
}

/* ─── How It Works step ──────────────────────────────────────── */
function HowStep({ num, title, desc }) {
  return (
    <div className="how-card anim-fade-up">
      <div className="how-num">{String(num).padStart(2, "0")}</div>
      <div className="how-title">{title}</div>
      <div className="how-desc">{desc}</div>
    </div>
  );
}

/* ─── Security card ──────────────────────────────────────────── */
function SecurityCard({ icon: Icon, title, desc }) {
  return (
    <div className="security-card">
      <div className="security-icon-wrap">
        <Icon size={16} />
      </div>
      <div className="security-title">{title}</div>
      <div className="security-desc">{desc}</div>
    </div>
  );
}

/* ─── Canvas particle background ─────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const ctx  = canvas.getContext("2d");
    const cols = Math.floor(canvas.width / 22);
    const drops = Array.from({ length: cols }, () => Math.random() * 30);
    const chars = "ABCDEF0123456789アイウ₿#@";

    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(13,13,26,.055)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#a78bfa";
      ctx.font      = "12px monospace";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 22, y * 22);
        if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
      raf = setTimeout(() => requestAnimationFrame(draw), 90);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    return () => {
      clearTimeout(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.055,
        pointerEvents: "none",
      }}
    />
  );
}

/* ─── Loading state overlay ──────────────────────────────────── */
function FetchingTokenState() {
  return (
    <div className="connecting-overlay anim-fade-in">
      <div className="ring ring-lg" />
      <div className="connecting-title">Preparando conexão segura</div>
      <div className="connecting-sub">Obtendo token de acesso temporário…</div>
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginTop: ".5rem",
          alignItems: "center",
          fontFamily: "var(--mono)",
          fontSize: ".65rem",
          color: "var(--muted-2)",
        }}
      >
        <Lock size={11} style={{ color: "var(--purple-light)" }} />
        Conexão criptografada end-to-end
      </div>
    </div>
  );
}

/* ─── Saving state ───────────────────────────────────────────── */
function SavingState({ institution }) {
  return (
    <div className="connecting-overlay anim-fade-in">
      <div className="ring ring-md" />
      <div className="connecting-title">Salvando conexão</div>
      <div className="connecting-sub">
        {institution ? `Registrando ${institution}…` : "Registrando sua conta bancária…"}
      </div>
    </div>
  );
}

/* ─── Success state ──────────────────────────────────────────── */
function SuccessState({ institution, onContinue }) {
  return (
    <div className="connecting-overlay anim-pop">
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(16,185,129,.12)",
          border: "1.5px solid rgba(16,185,129,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckCircle2 size={28} style={{ color: "var(--success)" }} />
      </div>
      <div className="connecting-title" style={{ color: "var(--success)", fontSize: "1.1rem" }}>
        Banco conectado!
      </div>
      <div className="connecting-sub">
        {institution ?? "Sua conta bancária"} foi vinculada com sucesso ao FinSync.
      </div>
      <button className="btn btn-primary btn-lg" onClick={onContinue} style={{ marginTop: ".5rem" }}>
        Ver conexões
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function OpenFinanceConnect() {
  const {
    status,
    connectToken,
    connections,
    error,
    lastSaved,
    syncingConnectionId,
    syncMessage,
    isLoadingToken,
    isSaving,
    isOpen,
    isSuccess,
    isError,
    isBusy,
    startConnect,
    handlePluggySuccess,
    handlePluggyClose,
    dismissError,
    dismissSuccess,
    loadConnections,
    syncBankConnection,
  } = useOpenFinance();

  const [toast, setToast]   = useState(null);
  const [loadingConns, setLoadingConns] = useState(false);
  const hasJwt = Boolean(getStoredJwt());

  /* Show toast on success */
  useEffect(() => {
    if (isSuccess) {
      setToast({
        type: "success",
        message: `${lastSaved?.institution ?? "Banco"} conectado com sucesso!`,
      });
    }
  }, [isSuccess, lastSaved]);

  useEffect(() => {
    if (syncMessage) {
      setToast({
        type: "success",
        message: syncMessage,
      });
    }
  }, [syncMessage]);

  const hasConnections = connections.length > 0;

  /* ── Derived state for center panel ── */
  const showCenter = isLoadingToken || isSaving || isSuccess;

  /* ─── Handlers ─────────────────────────────────────────────── */
  function handleContinueAfterSuccess() {
    dismissSuccess();
  }

  async function handleRefresh() {
    setLoadingConns(true);
    await loadConnections();
    setLoadingConns(false);
  }

  async function handleSync(connection) {
    await syncBankConnection(connection.id);
  }

  /* ─── Central animated state panel ────────────────────────── */
  function renderStatePanel() {
    if (isLoadingToken) return <FetchingTokenState />;
    if (isSaving)       return <SavingState institution={lastSaved?.institution} />;
    if (isSuccess)      return <SuccessState institution={lastSaved?.institution} onContinue={handleContinueAfterSuccess} />;
    return null;
  }

  /* ─── Main Render ──────────────────────────────────────────── */
  return (
    <>
      {/* PluggyConnect widget — rendered as modal overlay by the lib */}
      {isOpen && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={import.meta.env.DEV}
          theme="dark"
          language="pt"
          onSuccess={handlePluggySuccess}
          onClose={handlePluggyClose}
          onError={() => {
            dismissError();
          }}
        />
      )}

      {/* Toast notifications */}
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      {/* ── State panel overlay (loading / saving / success) ── */}
      {showCenter && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,13,26,.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
          }}
        >
          <div
            className="card anim-pop"
            style={{
              maxWidth: 420,
              width: "100%",
              margin: "1rem",
              padding: "2.5rem 2rem",
              textAlign: "center",
            }}
          >
            {renderStatePanel()}
          </div>
        </div>
      )}

      {/* ─── NO JWT warning ──────────────────────────────────── */}
      {!hasJwt && (
        <div className="alert alert-warn" style={{ marginBottom: "1.5rem" }}>
          <span className="alert-icon">⚠</span>
          <div>
            <strong>Sessão não encontrada</strong>
            Faça login no sistema antes de conectar um banco. O JWT é necessário para autenticar
            as chamadas ao backend.
          </div>
        </div>
      )}

      {/* ─── Error alert ─────────────────────────────────────── */}
      {isError && error && (
        <div className="alert alert-error anim-shake" style={{ marginBottom: "1.5rem" }}>
          <span className="alert-icon">
            <AlertCircle size={15} />
          </span>
          <div>
            <strong>Erro na conexão</strong>
            {error}
          </div>
          <button
            onClick={dismissError}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto", padding: ".3rem .5rem", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          HERO — shown when no banks connected yet
      ═════════════════════════════════════════════════════════ */}
      {!hasConnections && (
        <section
          className="of-hero grid-bg scanlines"
          style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: "2.5rem" }}
        >
          <ParticleCanvas />
          <div className="of-hero-glow1" />
          <div className="of-hero-glow2" />

          <div className="of-hero-content stagger" style={{ padding: "4rem 2.5rem", position: "relative", zIndex: 1 }}>
            {/* Eyebrow */}
            <div className="of-eyebrow">
              <Zap size={11} />
              Open Finance · Regulado pelo BCB
            </div>

            {/* Title */}
            <h1 className="of-title">
              Conecte seus<br />
              <span className="gradient-green">bancos reais</span>
              <br />
              em segundos.
            </h1>

            {/* Subtitle */}
            <p className="of-subtitle">
              Sincronize suas contas, cartões e investimentos automaticamente.
              Sem digitar senhas bancárias — suas credenciais nunca chegam ao FinSync.
            </p>

            {/* Trust pills */}
            <div className="trust-row">
              <span className="trust-pill">
                <ShieldCheck size={12} />
                Senhas NÃO armazenadas
              </span>
              <span className="trust-pill">
                <Lock size={12} />
                Criptografia ponta a ponta
              </span>
              <span className="trust-pill">
                <Shield size={12} />
                Regulado Banco Central
              </span>
              <span className="trust-pill">
                <Unlink size={12} />
                Conexão revogável
              </span>
            </div>

            {/* CTA */}
            <div className="of-cta-group">
              <button
                className="btn btn-primary btn-xl anim-glow"
                onClick={startConnect}
                disabled={isBusy || !hasJwt}
                style={{ minWidth: 220 }}
              >
                {isLoadingToken ? (
                  <><div className="btn-spinner" />Preparando…</>
                ) : (
                  <>
                    <Plus size={17} />
                    Conectar banco
                    <ChevronRight size={16} style={{ marginLeft: ".15rem" }} />
                  </>
                )}
              </button>
              <div className="of-cta-note">
                <Lock size={12} style={{ color: "var(--purple-light)" }} />
                Sem custo · Cancelável a qualquer momento
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════
          CONNECTIONS — shown when banks are connected
      ═════════════════════════════════════════════════════════ */}
      {hasConnections && (
        <section className="anim-fade-in">
          <div className="connections-header">
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
              <h2 className="connections-title">Conexões bancárias</h2>
              <span className="connections-count">{connections.length}</span>
            </div>
            <div style={{ display: "flex", gap: ".6rem" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleRefresh}
                disabled={loadingConns}
                title="Atualizar lista"
              >
                <RefreshCw
                  size={13}
                  style={loadingConns ? { animation: "spin 1s linear infinite" } : {}}
                />
                Atualizar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={startConnect}
                disabled={isBusy || !hasJwt}
              >
                <Plus size={13} />
                Adicionar banco
              </button>
            </div>
          </div>

          <div className="connections-grid stagger">
            {connections.map((conn) => (
              <BankConnectionCard
                key={conn.id ?? conn.itemId}
                connection={{
                  ...conn,
                  isSyncing: syncingConnectionId === conn.id
                }}
                onSync={handleSync}
                onDisconnect={() => {}}
                onViewTransactions={() => {}}
              />
            ))}

            {/* Add more card */}
            <div
              className="bank-card-add"
              onClick={() => !isBusy && hasJwt && startConnect()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && startConnect()}
              style={!hasJwt ? { opacity: .4, cursor: "not-allowed" } : {}}
            >
              <div className="bank-card-add-icon">
                <Plus size={18} />
              </div>
              <div className="bank-card-add-label">Adicionar banco</div>
            </div>
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════
          HOW IT WORKS — always visible
      ═════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "3rem" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <span className="section-num">01</span>
          <h2>Como funciona</h2>
        </div>
        <div className="how-grid">
          <HowStep
            num={1}
            title="Escolha seu banco"
            desc="Selecione na lista de mais de 200 instituições financeiras homologadas pelo Banco Central."
          />
          <HowStep
            num={2}
            title="Autorize o acesso"
            desc="Você é redirecionado para o ambiente seguro do seu banco. O FinSync nunca vê sua senha."
          />
          <HowStep
            num={3}
            title="Transações importadas"
            desc="Suas transações são sincronizadas automaticamente. Categorização e análise em tempo real."
          />
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          SECURITY — always visible
      ═════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: "2.5rem" }}>
        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <span className="section-num">02</span>
          <h2>Segurança &amp; Privacidade</h2>
        </div>
        <div className="security-grid">
          <SecurityCard
            icon={Lock}
            title="Sem armazenar senhas"
            desc="Suas credenciais bancárias nunca passam pelo FinSync. A autenticação ocorre diretamente entre você e seu banco."
          />
          <SecurityCard
            icon={ShieldCheck}
            title="Padrão Open Finance"
            desc="Integração via Pluggy, certificada pelo Banco Central do Brasil e em conformidade com a Resolução BCB nº 32."
          />
          <SecurityCard
            icon={Unlink}
            title="Revogue quando quiser"
            desc="Você tem controle total. Desconecte qualquer banco a qualquer momento — dentro do app ou diretamente no site do banco."
          />
        </div>
      </section>
    </>
  );
}
