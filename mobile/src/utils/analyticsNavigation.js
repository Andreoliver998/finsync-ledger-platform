import { safeText } from './safeText';
import { inferEntityType } from './formatters';

export function buildProfileParams(input = {}) {
  const q = safeText(
    input.q ||
      input.query ||
      input.label ||
      input.name ||
      input.counterparty ||
      input.merchant ||
      input.description,
    ''
  ).trim();

  const rawType = safeText(input.type || input.entityType, '').trim();

  return {
    type: rawType || (q ? inferEntityType(q) : undefined),
    q: q || undefined,
    entityId: safeText(input.entityId || input.id, '').trim() || undefined,
    source: safeText(input.source || input.origin || input.screen, '').trim() || undefined,
    transactionId: safeText(input.transactionId, '').trim() || undefined,
    period: safeText(input.period || input.activePeriod, '').trim() || undefined,
    summary: safeText(input.summary || input.contextSummary, '').trim() || undefined,
    filters:
      input.filters && typeof input.filters === 'object'
        ? input.filters
        : input.activeFilters && typeof input.activeFilters === 'object'
        ? input.activeFilters
        : undefined
  };
}

export function hasProfileIdentity(params = {}) {
  return Boolean((params.type && params.q) || params.entityId);
}

function routeExists(navigation, routeName) {
  return Boolean(navigation?.getState?.()?.routeNames?.includes(routeName));
}

function defaultTabForScreen(screenName) {
  return screenName === 'FinancialSearch' ? 'SearchTab' : 'ProfileTab';
}

export function navigateToAnalyticsScreen(navigation, screenName, params, options = {}) {
  const tabName = options.tabName || defaultTabForScreen(screenName);
  if (routeExists(navigation, screenName)) {
    navigation.navigate(screenName, params);
    return;
  }

  const parent = navigation?.getParent?.();
  if (parent) {
    parent.navigate(tabName, {
      screen: screenName,
      params
    });
    return;
  }

  navigation?.navigate?.(tabName, {
    screen: screenName,
    params
  });
}

export function openFinancialSearch(navigation, params = {}) {
  navigateToAnalyticsScreen(
    navigation,
    'FinancialSearch',
    { prefill: safeText(params.prefill || params.q || params.query, '') },
    { tabName: 'SearchTab' }
  );
}

export function openFinancialProfile(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'FinancialProfile', buildProfileParams(params), {
    tabName: 'ProfileTab'
  });
}

export function openIntelligentReading(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'IntelligentReading', params, { tabName: 'ProfileTab' });
}

export function openRelationshipGraph(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'RelationshipGraph', buildProfileParams(params), {
    tabName: 'ProfileTab'
  });
}

export function openTimelineAnalysis(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'TimelineAnalysis', params, { tabName: 'ProfileTab' });
}

export function openInsightDetails(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'InsightDetails', params, { tabName: 'ProfileTab' });
}

export function openRelatedTransactions(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'RelatedTransactions', params, { tabName: 'ProfileTab' });
}

export function openEntityDetails(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'EntityDetails', params, { tabName: 'ProfileTab' });
}

export function openExportScreen(navigation, params = {}) {
  navigateToAnalyticsScreen(navigation, 'ExportScreen', params, { tabName: 'ProfileTab' });
}
