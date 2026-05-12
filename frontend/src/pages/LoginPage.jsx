import { AlertCircle, Eye, EyeOff, Lock, Mail, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import financeiroLogo from "../assets/financeiro-logo.png";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const result = await login(email, password);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="login-page">
      {/* Background glow */}
      <div className="login-glow" />

      {/* Grid bg */}
      <div
        className="grid-bg"
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div className="login-card anim-fade-up">
        {/* Accent top line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
            borderRadius: "16px 16px 0 0",
          }}
        />

        {/* Logo */}
        <div className="login-logo">
          <img className="login-logo-mark" src={financeiroLogo} alt="FinSync" />
          <div className="login-logo-name">FinSync</div>
          <span className="badge badge-green" style={{ marginLeft: "auto" }}>
            <Zap size={9} />
            Beta
          </span>
        </div>

        <h1 className="login-title">Entrar</h1>
        <p className="login-subtitle">Acesse sua plataforma financeira</p>

        {/* Error */}
        {error && (
          <div className="alert alert-error anim-shake" style={{ marginBottom: "1.25rem" }}>
            <AlertCircle size={15} />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="email"
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: "2.4rem" }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Senha
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="password"
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: "2.4rem", paddingRight: "2.8rem" }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted-2)",
                  padding: ".2rem",
                  display: "flex",
                }}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: ".5rem", height: 46 }}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <><div className="btn-spinner" />Entrando…</>
            ) : (
              "Entrar no FinSync"
            )}
          </button>
        </form>

        <div className="login-footer">
          Ainda sem conta?{" "}
          <Link to="/register">Criar conta gratuita</Link>
        </div>
      </div>
    </div>
  );
}
