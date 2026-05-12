import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api, registerUnauthorizedHandler, setAuthToken } from '@services/api';
import { tokenStorage } from '@services/tokenStorage';

/**
 * @typedef {import('@types/index').User} User
 *
 * @typedef {Object} AuthState
 * @property {boolean} isHydrating  true on cold start before SecureStore is read
 * @property {boolean} isAuthenticated
 * @property {User|null} user
 * @property {string|null} token
 * @property {(payload: {email: string, password: string}) => Promise<void>} login
 * @property {(payload: {name: string, email: string, password: string}) => Promise<void>} register
 * @property {() => Promise<void>} logout
 * @property {() => Promise<void>} refreshSession
 */

/** @type {React.Context<AuthState|undefined>} */
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [isHydrating, setIsHydrating] = useState(true);
  const [user, setUser] = useState(/** @type {User|null} */ (null));
  const [token, setToken] = useState(/** @type {string|null} */ (null));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applySession = useCallback(
    async (nextToken, nextUser) => {
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser ?? null);
      if (nextToken) {
        await tokenStorage.set(nextToken);
      } else {
        await tokenStorage.clear();
      }
    },
    []
  );

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const fetched = data?.data ?? data?.user ?? null;
      if (fetched && mountedRef.current) {
        setUser(fetched);
      }
    } catch {
      /* handled by 401 interceptor below */
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* server-side logout is best-effort; client must still clear */
    } finally {
      await applySession(null, null);
      queryClient.clear();
    }
  }, [applySession, queryClient]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (!mountedRef.current) return;
      setUser(null);
      setToken(null);
      setAuthToken(null);
      queryClient.clear();
    });
  }, [queryClient]);

  // Cold-start hydration: read token from SecureStore, then fetch /auth/me.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await tokenStorage.get();
      if (cancelled) return;

      if (persisted) {
        setAuthToken(persisted);
        setToken(persisted);
        try {
          const { data } = await api.get('/auth/me');
          if (!cancelled) {
            setUser(data?.data ?? data?.user ?? null);
          }
        } catch {
          if (!cancelled) {
            await applySession(null, null);
          }
        }
      }
      if (!cancelled) setIsHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      const payload = data?.data ?? data;
      if (!payload?.token) {
        throw new Error('Resposta de login inválida.');
      }
      await applySession(payload.token, payload.user ?? null);
    },
    [applySession]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const { data } = await api.post('/auth/register', { name, email, password });
      const payload = data?.data ?? data;
      if (!payload?.token) {
        throw new Error('Resposta de cadastro inválida.');
      }
      await applySession(payload.token, payload.user ?? null);
    },
    [applySession]
  );

  const value = useMemo(
    () => ({
      isHydrating,
      isAuthenticated: !!token && !!user,
      user,
      token,
      login,
      register,
      logout,
      refreshSession
    }),
    [isHydrating, token, user, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
