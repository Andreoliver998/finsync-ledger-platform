import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@contexts/AuthContext';
import { investigationStorage } from '@services/investigationStorage';
import { safeText } from '@utils/safeText';

const DEFAULT_PERIOD = '90d';
const MAX_TRAIL = 20;
const MAX_RECENTS = 20;
const MAX_PINNED = 30;
const EMPTY_STATE = {
  activeEntity: undefined,
  activeType: undefined,
  activePeriod: DEFAULT_PERIOD,
  activeFilters: {},
  navigationTrail: [],
  recentInvestigations: [],
  pinnedEntities: [],
  currentInsight: undefined,
  investigationStartedAt: undefined
};

const InvestigationContext = createContext(undefined);

function sanitizeEntity(item = {}) {
  const activeEntity = safeText(item.activeEntity || item.q || item.entity || item.label || item.name, '').trim();
  const activeType = safeText(item.activeType || item.type || item.entityType, '').trim() || undefined;
  const activePeriod = safeText(item.activePeriod || item.period, '').trim() || DEFAULT_PERIOD;
  const activeFilters =
    item.activeFilters && typeof item.activeFilters === 'object'
      ? item.activeFilters
      : item.filters && typeof item.filters === 'object'
      ? item.filters
      : {};

  return {
    activeEntity: activeEntity || undefined,
    activeType,
    activePeriod,
    activeFilters,
    currentInsight: safeText(item.currentInsight || item.summary || item.contextSummary, '').trim() || undefined
  };
}

function normalizeTrailItem(item = {}) {
  const label = safeText(item.label || item.activeEntity || item.screen, 'Investigação').trim();
  const screen = safeText(item.screen, '').trim();
  const params = item.params && typeof item.params === 'object' ? item.params : {};
  return {
    id: safeText(item.id, `${screen}-${label}-${Date.now()}`),
    label,
    screen,
    params,
    activeEntity: safeText(item.activeEntity || params.q || params.entity || label, '').trim() || undefined,
    activeType: safeText(item.activeType || params.type || params.entityType, '').trim() || undefined,
    activePeriod: safeText(item.activePeriod || params.period, '').trim() || DEFAULT_PERIOD,
    source: safeText(item.source || params.source || screen, '').trim() || undefined,
    summary: safeText(item.summary || params.summary || params.contextSummary, '').trim() || undefined,
    timestamp: item.timestamp || new Date().toISOString()
  };
}

function normalizeRecent(item = {}) {
  return {
    id: safeText(item.id, `${safeText(item.entity, 'investigation')}-${Date.now()}`),
    entity: safeText(item.entity || item.activeEntity || item.q || item.label, '').trim(),
    type: safeText(item.type || item.activeType, '').trim() || undefined,
    period: safeText(item.period || item.activePeriod, '').trim() || DEFAULT_PERIOD,
    source: safeText(item.source || item.screen, '').trim() || undefined,
    summary: safeText(item.summary || item.currentInsight || item.contextSummary, '').trim() || undefined,
    screen: safeText(item.screen, '').trim() || undefined,
    params: item.params && typeof item.params === 'object' ? item.params : {},
    timestamp: item.timestamp || new Date().toISOString()
  };
}

function normalizePinned(item = {}) {
  return {
    id: safeText(item.id, `${safeText(item.entity, 'pinned')}-${Date.now()}`),
    entity: safeText(item.entity || item.activeEntity || item.q || item.label, '').trim(),
    type: safeText(item.type || item.activeType, '').trim() || undefined,
    period: safeText(item.period || item.activePeriod, '').trim() || DEFAULT_PERIOD,
    source: safeText(item.source || item.screen, '').trim() || undefined,
    summary: safeText(item.summary || item.currentInsight || item.contextSummary, '').trim() || undefined,
    params: item.params && typeof item.params === 'object' ? item.params : {}
  };
}

export function InvestigationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState(EMPTY_STATE);

  const storageScope = useMemo(
    () => (user?.id ? `user.${user.id}` : user?.email ? `user.${user.email}` : null),
    [user?.email, user?.id]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!storageScope || !isAuthenticated) {
        setState((prev) => ({
          ...prev,
          activeEntity: undefined,
          activeType: undefined,
          activePeriod: DEFAULT_PERIOD,
          activeFilters: {},
          navigationTrail: [],
          currentInsight: undefined,
          investigationStartedAt: undefined
        }));
        return;
      }

      const persisted = await investigationStorage.get(storageScope);
      if (cancelled) return;
      if (!persisted) {
        setState(EMPTY_STATE);
        return;
      }

      setState({
        ...EMPTY_STATE,
        ...persisted,
        navigationTrail: Array.isArray(persisted.navigationTrail) ? persisted.navigationTrail : [],
        recentInvestigations: Array.isArray(persisted.recentInvestigations) ? persisted.recentInvestigations : [],
        pinnedEntities: Array.isArray(persisted.pinnedEntities) ? persisted.pinnedEntities : [],
        activeFilters: persisted.activeFilters && typeof persisted.activeFilters === 'object' ? persisted.activeFilters : {},
        activePeriod: persisted.activePeriod || DEFAULT_PERIOD
      });
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [storageScope, isAuthenticated]);

  useEffect(() => {
    if (!storageScope || !isAuthenticated) return;
    investigationStorage.set(storageScope, state);
  }, [state, storageScope, isAuthenticated]);

  const syncInvestigationContext = useCallback((payload = {}) => {
    const entityState = sanitizeEntity(payload);
    const screen = safeText(payload.screen, '').trim();
    const routeKey = safeText(payload.routeKey, '').trim();
    const label =
      safeText(payload.label || entityState.activeEntity || payload.screen, 'Investigação').trim();
    const trackRecent = payload.trackRecent !== false && !!entityState.activeEntity;

    setState((prev) => {
      const nextTrail = screen
        ? (() => {
            const item = normalizeTrailItem({
              id: routeKey || `${screen}-${label}`,
              label,
              screen,
              params: payload.params || {},
              ...entityState,
              source: payload.source,
              summary: payload.summary
            });
            const last = prev.navigationTrail[prev.navigationTrail.length - 1];
            if (last?.id === item.id && last?.label === item.label) {
              return [...prev.navigationTrail.slice(0, -1), item];
            }
            return [...prev.navigationTrail, item].slice(-MAX_TRAIL);
          })()
        : prev.navigationTrail;

      const nextRecents = trackRecent
        ? [
            normalizeRecent({
              id: `${entityState.activeEntity}-${entityState.activeType || 'entity'}`,
              entity: entityState.activeEntity,
              type: entityState.activeType,
              period: entityState.activePeriod,
              source: payload.source,
              summary: payload.summary,
              screen,
              params: payload.params || {}
            }),
            ...prev.recentInvestigations.filter(
              (item) =>
                item.entity !== entityState.activeEntity ||
                item.type !== entityState.activeType
            )
          ].slice(0, MAX_RECENTS)
        : prev.recentInvestigations;

      return {
        ...prev,
        ...entityState,
        navigationTrail: nextTrail,
        recentInvestigations: nextRecents,
        currentInsight: entityState.currentInsight || prev.currentInsight,
        investigationStartedAt: prev.investigationStartedAt || new Date().toISOString()
      };
    });
  }, []);

  const restoreTrailItem = useCallback((item) => {
    const trailItem = normalizeTrailItem(item);
    setState((prev) => {
      const index = prev.navigationTrail.findIndex((entry) => entry.id === trailItem.id);
      const trimmed = index >= 0 ? prev.navigationTrail.slice(0, index + 1) : prev.navigationTrail;
      return {
        ...prev,
        activeEntity: trailItem.activeEntity,
        activeType: trailItem.activeType,
        activePeriod: trailItem.activePeriod,
        currentInsight: trailItem.summary || prev.currentInsight,
        navigationTrail: trimmed
      };
    });
  }, []);

  const setActivePeriod = useCallback((period) => {
    setState((prev) => ({ ...prev, activePeriod: period || prev.activePeriod }));
  }, []);

  const setActiveFilters = useCallback((filters) => {
    setState((prev) => ({
      ...prev,
      activeFilters: typeof filters === 'function' ? filters(prev.activeFilters) : filters || {}
    }));
  }, []);

  const pinEntity = useCallback((payload = {}) => {
    const nextPinned = normalizePinned(payload);
    setState((prev) => {
      const exists = prev.pinnedEntities.some(
        (item) => item.entity === nextPinned.entity && item.type === nextPinned.type
      );
      return exists
        ? {
            ...prev,
            pinnedEntities: prev.pinnedEntities.filter(
              (item) => item.entity !== nextPinned.entity || item.type !== nextPinned.type
            )
          }
        : {
            ...prev,
            pinnedEntities: [nextPinned, ...prev.pinnedEntities].slice(0, MAX_PINNED)
          };
    });
  }, []);

  const clearInvestigation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeEntity: undefined,
      activeType: undefined,
      activePeriod: DEFAULT_PERIOD,
      activeFilters: {},
      navigationTrail: [],
      currentInsight: undefined,
      investigationStartedAt: undefined
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      syncInvestigationContext,
      restoreTrailItem,
      setActivePeriod,
      setActiveFilters,
      pinEntity,
      clearInvestigation
    }),
    [state, syncInvestigationContext, restoreTrailItem, setActivePeriod, setActiveFilters, pinEntity, clearInvestigation]
  );

  return <InvestigationContext.Provider value={value}>{children}</InvestigationContext.Provider>;
}

export function useInvestigation() {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation deve ser usado dentro de <InvestigationProvider>.');
  }
  return context;
}
