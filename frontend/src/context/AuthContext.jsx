import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearStoredAuth } from "../services/api.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "finsync:token";
const USER_KEY  = "finsync:user";

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true); // true while validating token on mount

  /* On mount: validate any stored token against the backend */
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setBootstrapping(false);
      return;
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

    api.get("/auth/me")
      .then((res) => {
        const me = res.data?.data?.user ?? res.data?.data ?? res.data?.user ?? res.data;
        setToken(storedToken);
        setUser(me);
      })
      .catch(() => {
        // Token invalid or expired — wipe everything
        clearStoredAuth();
        delete api.defaults.headers.common["Authorization"];
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Keep axios header in sync after bootstrap */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  function resolveAuthError(err, fallbackMessage) {
    if (err?.response?.data?.message) {
      return err.response.data.message;
    }

    if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
      return "Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:3334.";
    }

    return err?.message || fallbackMessage;
  }

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res  = await api.post("/auth/login", { email, password });
      const data = res.data?.data ?? res.data;
      const jwt  = data?.token ?? data?.accessToken ?? data?.jwt;
      const me   = data?.user ?? { email };

      if (!jwt) throw new Error("Token não retornado pelo servidor.");

      localStorage.setItem(TOKEN_KEY, jwt);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      setToken(jwt);
      setUser(me);
      return { ok: true };
    } catch (err) {
      const msg = resolveAuthError(err, "Erro ao fazer login.");
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", payload);
      const data = res.data?.data ?? res.data;
      const jwt = data?.token ?? data?.accessToken ?? data?.jwt;
      const me = data?.user ?? { email: payload.email, name: payload.name };

      if (!jwt) {
        throw new Error("Token não retornado pelo servidor.");
      }

      localStorage.setItem(TOKEN_KEY, jwt);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      setToken(jwt);
      setUser(me);
      return { ok: true };
    } catch (err) {
      const msg = resolveAuthError(err, "Erro ao criar conta.");
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener("finsync:auth:denied", logout);
    return () => window.removeEventListener("finsync:auth:denied", logout);
  }, [logout]);

  const isAuthenticated = Boolean(token);

  const value = useMemo(
    () => ({ user, token, loading, bootstrapping, isAuthenticated, login, register, logout }),
    [user, token, loading, bootstrapping, isAuthenticated, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
