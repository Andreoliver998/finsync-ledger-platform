import { createContext, useCallback, useContext, useState } from "react";

const ToastCtx = createContext(null);
let _uid = 0;

const ICON = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
const COLORS = {
  success: { bg: "rgba(16,185,129,.13)",  border: "rgba(16,185,129,.30)", accent: "#10b981" },
  error:   { bg: "rgba(239,68,68,.13)",   border: "rgba(239,68,68,.30)",  accent: "#ef4444" },
  warning: { bg: "rgba(245,158,11,.13)",  border: "rgba(245,158,11,.30)", accent: "#f59e0b" },
  info:    { bg: "rgba(124,58,237,.13)",  border: "rgba(124,58,237,.30)", accent: "#a78bfa" }
};

function ToastItem({ id, message, type, dismissing, onDismiss }) {
  const c = COLORS[type] || COLORS.info;
  return (
    <div
      className={`toast${dismissing ? " toast--out" : ""}`}
      style={{ background: c.bg, borderColor: c.border }}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon" style={{ color: c.accent }}>{ICON[type]}</span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={() => onDismiss(id)} aria-label="Fechar">×</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, dismissing: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  const add = useCallback((message, type = "info", duration = 4500) => {
    const id = ++_uid;
    setToasts((prev) => [...prev, { id, message, type, dismissing: false }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg, dur)        => add(msg, "success", dur),
    error:   (msg, dur)        => add(msg, "error",   dur ?? 6000),
    warning: (msg, dur)        => add(msg, "warning", dur),
    info:    (msg, dur)        => add(msg, "info",    dur),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-container" aria-label="Notificações">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
