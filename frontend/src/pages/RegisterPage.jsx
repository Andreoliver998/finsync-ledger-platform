import { AlertCircle, Eye, EyeOff, Lock, Mail, UserRound, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import financeiroLogo from "../assets/financeiro-logo.png";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    const result = await register({ name, email, password });

    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div
        className="grid-bg"
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.4,
          pointerEvents: "none"
        }}
      />

      <div className="login-card anim-fade-up">
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, var(--green), var(--orange))",
            borderRadius: "16px 16px 0 0"
          }}
        />

        <div className="login-logo">
          <img className="login-logo-mark" src={financeiroLogo} alt="FinSync" />
          <div className="login-logo-name">FinSync</div>
          <span className="badge badge-green" style={{ marginLeft: "auto" }}>
            <Zap size={9} />
            Beta
          </span>
        </div>

        <h1 className="login-title">Criar conta</h1>
        <p className="login-subtitle">Cadastre seu acesso para começar a usar a plataforma.</p>

        {error && (
          <div className="alert alert-error anim-shake" style={{ marginBottom: "1.25rem" }}>
            <AlertCircle size={15} />
            <div>{error}</div>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="register-name">Nome</label>
            <div style={{ position: "relative" }}>
              <UserRound
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none"
                }}
              />
              <input
                id="register-name"
                className="input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                required
                style={{ paddingLeft: "2.4rem" }}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="register-email">Email</label>
            <div style={{ position: "relative" }}>
              <Mail
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none"
                }}
              />
              <input
                id="register-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                style={{ paddingLeft: "2.4rem" }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="register-password">Senha</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none"
                }}
              />
              <input
                id="register-password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
                minLength={6}
                style={{ paddingLeft: "2.4rem", paddingRight: "2.8rem" }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
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
                  display: "flex"
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="register-confirm-password">Confirmar senha</label>
            <div style={{ position: "relative" }}>
              <Lock
                size={14}
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-2)",
                  pointerEvents: "none"
                }}
              />
              <input
                id="register-confirm-password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a senha"
                required
                minLength={6}
                style={{ paddingLeft: "2.4rem" }}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: ".5rem", height: 46 }}
            disabled={loading || !name || !email || !password || !confirmPassword}
          >
            {loading ? <><div className="btn-spinner" />Criando conta…</> : "Criar conta"}
          </button>
        </form>

        <div className="login-footer">
          Já tem conta? <Link to="/login">Entrar agora</Link>
        </div>
      </div>
    </div>
  );
}
