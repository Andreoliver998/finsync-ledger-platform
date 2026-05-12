import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeText } from '@utils/safeText';

function buildKey(scope) {
  return `finsync.investigation.${scope}.v1`;
}

const MAX_TRAIL = 20;
const MAX_RECENTS = 20;
const MAX_PINNED = 30;

function sanitizeFilters(filters) {
  if (!filters || typeof filters !== 'object') return {};
  try {
    return JSON.parse(JSON.stringify(filters));
  } catch {
    return {};
  }
}

function sanitizeParams(params = {}) {
  if (!params || typeof params !== 'object') return {};
  return {
    type: safeText(params.type || params.entityType, '').trim() || undefined,
    q: safeText(params.q || params.entity || params.label || params.name, '').trim() || undefined,
    entityId: safeText(params.entityId || params.id, '').trim() || undefined,
    period: safeText(params.period || params.activePeriod, '').trim() || undefined,
    source: safeText(params.source || params.origin || params.screen, '').trim() || undefined,
    summary: safeText(params.summary || params.contextSummary, '').trim() || undefined,
    filters: sanitizeFilters(params.filters || params.activeFilters)
  };
}

function sanitizeTrailItem(item = {}) {
  return {
    id: safeText(item.id, '').trim() || undefined,
    label: safeText(item.label || item.activeEntity || item.screen, '').trim() || undefined,
    screen: safeText(item.screen, '').trim() || undefined,
    activeEntity: safeText(item.activeEntity || item.entity || item.q, '').trim() || undefined,
    activeType: safeText(item.activeType || item.type || item.entityType, '').trim() || undefined,
    activePeriod: safeText(item.activePeriod || item.period, '').trim() || undefined,
    source: safeText(item.source, '').trim() || undefined,
    summary: safeText(item.summary || item.currentInsight || item.contextSummary, '').trim() || undefined,
    timestamp: item.timestamp || new Date().toISOString(),
    params: sanitizeParams(item.params)
  };
}

function sanitizeRecentItem(item = {}) {
  return {
    id: safeText(item.id, '').trim() || undefined,
    entity: safeText(item.entity || item.activeEntity || item.q || item.label, '').trim() || undefined,
    type: safeText(item.type || item.activeType || item.entityType, '').trim() || undefined,
    period: safeText(item.period || item.activePeriod, '').trim() || undefined,
    source: safeText(item.source || item.screen, '').trim() || undefined,
    summary: safeText(item.summary || item.currentInsight || item.contextSummary, '').trim() || undefined,
    screen: safeText(item.screen, '').trim() || undefined,
    timestamp: item.timestamp || new Date().toISOString(),
    params: sanitizeParams(item.params)
  };
}

function sanitizePinnedItem(item = {}) {
  return {
    id: safeText(item.id, '').trim() || undefined,
    entity: safeText(item.entity || item.activeEntity || item.q || item.label, '').trim() || undefined,
    type: safeText(item.type || item.activeType || item.entityType, '').trim() || undefined,
    period: safeText(item.period || item.activePeriod, '').trim() || undefined,
    source: safeText(item.source || item.screen, '').trim() || undefined,
    summary: safeText(item.summary || item.currentInsight || item.contextSummary, '').trim() || undefined,
    params: sanitizeParams(item.params)
  };
}

function sanitizeState(value = {}) {
  return {
    activeEntity: safeText(value.activeEntity, '').trim() || undefined,
    activeType: safeText(value.activeType, '').trim() || undefined,
    activePeriod: safeText(value.activePeriod, '').trim() || '90d',
    activeFilters: sanitizeFilters(value.activeFilters),
    currentInsight: safeText(value.currentInsight, '').trim() || undefined,
    investigationStartedAt: value.investigationStartedAt || undefined,
    navigationTrail: Array.isArray(value.navigationTrail)
      ? value.navigationTrail.slice(0, MAX_TRAIL).map(sanitizeTrailItem)
      : [],
    recentInvestigations: Array.isArray(value.recentInvestigations)
      ? value.recentInvestigations.slice(0, MAX_RECENTS).map(sanitizeRecentItem)
      : [],
    pinnedEntities: Array.isArray(value.pinnedEntities)
      ? value.pinnedEntities.slice(0, MAX_PINNED).map(sanitizePinnedItem)
      : []
  };
}

export const investigationStorage = {
  async get(scope) {
    try {
      const raw = await AsyncStorage.getItem(buildKey(scope));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async set(scope, value) {
    try {
      const sanitized = sanitizeState(value);
      await AsyncStorage.setItem(buildKey(scope), JSON.stringify(sanitized));
    } catch {
      /* noop */
    }
  },

  async clear(scope) {
    try {
      await AsyncStorage.removeItem(buildKey(scope));
    } catch {
      /* noop */
    }
  }
};
