import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { AppCard } from '@components/AppCard';
import { AppScreen } from '@components/AppScreen';
import { EmptyState } from '@components/EmptyState';
import { InfoHint } from '@components/InfoHint';
import { InvestigationBreadcrumbs } from '@components/InvestigationBreadcrumbs';
import { InvestigationHeader } from '@components/InvestigationHeader';
import { LoadingSkeleton } from '@components/LoadingSkeleton';
import { SectionHeader } from '@components/SectionHeader';
import { SmartErrorState } from '@components/SmartErrorState';
import { useInvestigation } from '@contexts/InvestigationContext';
import { theme } from '@theme/index';
import { buildProfileParams, hasProfileIdentity, openEntityDetails, openFinancialProfile } from '@utils/analyticsNavigation';
import { buildStableKey, uniqueByStableKey } from '@utils/buildStableKey';
import { safeText } from '@utils/safeText';
import { getEntityColor, getEntityBg, getEntityIcon, inferEntityType } from '@utils/formatters';
import { useInvestigationScreen } from '@hooks/useInvestigationScreen';
import { fetchRelationshipGraph } from '../api/relationshipGraphApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function safeNumericText(value, fallback = '—') {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : fallback;
}

function normalizeGraph(payload) {
  if (!payload) return { nodes: [], edges: [] };
  const rawNodes = payload.nodes || payload.entities || [];
  const rawEdges = payload.edges || payload.links || payload.relationships || [];
  return {
    nodes: uniqueByStableKey(rawNodes, (node) => [
      node.id,
      node.type || node.entityType,
      node.label || node.name || node.normalizedName,
      node.weight || node.score
    ]),
    edges: uniqueByStableKey(rawEdges, (edge) => [
      edge.id,
      edge.from || edge.source || edge.a,
      edge.to || edge.target || edge.b,
      edge.weight || edge.score
    ])
  };
}

function buildLayout(nodes, size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 42;
  return nodes.map((node, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  });
}

function getNodeColor(node) {
  const type = node.type || node.entityType || inferEntityType(safeText(node.label || node.name, ''));
  return getEntityColor(type);
}

function getNodeBg(node) {
  const type = node.type || node.entityType || inferEntityType(safeText(node.label || node.name, ''));
  return getEntityBg(type);
}

function getNodeIcon(node) {
  const type = node.type || node.entityType || inferEntityType(safeText(node.label || node.name, ''));
  return getEntityIcon(type);
}

function getNodeLabel(node) {
  return safeText(
    node.label || node.name || node.normalizedName || node.id,
    'Entidade'
  );
}

// ─── Connection Card ──────────────────────────────────────────────────────────────

function ConnectionCard({ node, index, maxWeight, onPress }) {
  const label = getNodeLabel(node);
  const color = getNodeColor(node);
  const bg = getNodeBg(node);
  const icon = getNodeIcon(node);
  const weight = node.weight || node.score || 1;
  const strengthRatio = Math.min(1, weight / Math.max(maxWeight, 1));
  const strengthPct = Math.round(strengthRatio * 100);

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.primarySoft }}
      style={({ pressed }) => [
        localStyles.connectionCard,
        pressed && { opacity: 0.82 }
      ]}
    >
      <View style={[localStyles.connectionIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={localStyles.connectionContent}>
        <View style={localStyles.connectionHeader}>
          <Text style={localStyles.connectionLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[localStyles.connectionStrengthPct, { color }]}>{strengthPct}%</Text>
        </View>
        <View style={localStyles.strengthBarTrack}>
          <View
            style={[
              localStyles.strengthBarFill,
              { width: `${strengthPct}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={localStyles.connectionMeta}>
          Peso: {safeNumericText(weight)} · #{index + 1} no ranking
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedStrong} />
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────────

export function RelationshipGraphScreen({ navigation, route }) {
  const { state: investigationState } = useInvestigation();
  const [selectedNode, setSelectedNode] = useState(null);
  const graphParams = useMemo(() => buildProfileParams(route?.params || {}), [route?.params]);
  const hasIdentity = hasProfileIdentity(graphParams);
  const query = useQuery({
    queryKey: ['ledger', 'relationship-graph', graphParams.type, graphParams.q, graphParams.entityId],
    queryFn: () => fetchRelationshipGraph(graphParams)
  });

  const { nodes, edges } = useMemo(() => normalizeGraph(query.data), [query.data]);
  const graphSize = 320;

  const positioned = useMemo(
    () => buildLayout(nodes.slice(0, 16), graphSize),
    [nodes]
  );

  const indexById = useMemo(() => {
    const map = new Map();
    positioned.forEach((n) => map.set(n.id || n.label, n));
    return map;
  }, [positioned]);

  const maxWeight = useMemo(
    () =>
      positioned.reduce((max, n) => Math.max(max, n.weight || n.score || 1), 1),
    [positioned]
  );

  const previewNode = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const openNodeProfile = useCallback(
    (node) => {
      previewNode(node);
      openFinancialProfile(navigation, {
        type: node.type || node.entityType,
        q: getNodeLabel(node),
        entityId: safeText(node.id, ''),
        source: 'RelationshipGraph'
      });
    },
    [navigation, previewNode]
  );

  useInvestigationScreen(
    {
      enabled: hasIdentity,
      screen: 'RelationshipGraph',
      routeKey: route?.key,
      label: graphParams.q || 'Grafo',
      activeEntity: graphParams.q,
      activeType: graphParams.type,
      activePeriod: graphParams.period || investigationState.activePeriod,
      source: graphParams.source || 'RelationshipGraph',
      params: route?.params || {},
      summary: `Rede relacional de ${graphParams.q || 'entidade'}`
    },
    [hasIdentity, route?.key, route?.params, graphParams.q, graphParams.type, graphParams.period, graphParams.source, investigationState.activePeriod]
  );

  if (!hasIdentity) {
    return (
      <AppScreen padded scroll>
        <View style={localStyles.hero}>
          <Text style={localStyles.label}>Relacionamentos</Text>
          <Text style={localStyles.title}>Abra o grafo a partir de um dossiê</Text>
          <Text style={localStyles.summary}>
            Para montar um mapa contextual, o FinSync precisa receber a entidade investigada.
          </Text>
        </View>
        <InfoHint
          text="Volte ao dossiê financeiro e toque em Grafo. O fluxo enviará type, q e source corretamente."
          tone="info"
        />
        <EmptyState
          icon="git-network-outline"
          title="Contexto insuficiente"
          description="Os parâmetros type ou q não foram informados para esta análise."
        />
      </AppScreen>
    );
  }

  if (query.isError) {
    return (
      <AppScreen padded>
        <SmartErrorState error={query.error} onRetry={() => query.refetch()} />
      </AppScreen>
    );
  }

  if (query.isPending) {
    return (
      <AppScreen padded scroll>
        <LoadingSkeleton width="50%" height={28} />
        <LoadingSkeleton width="100%" height={graphSize} style={{ marginTop: theme.spacing.lg }} />
        <LoadingSkeleton width="100%" height={80} style={{ marginTop: theme.spacing.md }} />
        <LoadingSkeleton width="100%" height={80} style={{ marginTop: theme.spacing.sm }} />
      </AppScreen>
    );
  }

  if (!positioned.length) {
    return (
      <AppScreen padded>
        <EmptyState
          icon="git-network-outline"
          title="Sem relacionamentos"
          description="Quando houver dados suficientes, o grafo de relacionamentos é gerado automaticamente."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll refreshing={query.isFetching} onRefresh={() => query.refetch()}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <View style={localStyles.hero}>
        <Text style={localStyles.label}>Relacionamentos</Text>
        <Text style={localStyles.title}>Quem se conecta com o quê</Text>
        <Text style={localStyles.summary}>
          Mapa relacional para {safeText(graphParams.q, 'a entidade atual')}. Toque em um nó para abrir o dossiê.
        </Text>
        <View style={localStyles.contextPills}>
          <View style={localStyles.contextPill}>
            <Text style={localStyles.contextPillText}>{safeText(graphParams.type, '—')}</Text>
          </View>
          {graphParams.source ? (
            <View style={localStyles.contextPill}>
              <Text style={localStyles.contextPillText}>{graphParams.source}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <InvestigationHeader
        navigation={navigation}
        summary={`Relações, recorrência e vizinhança financeira de ${safeText(graphParams.q, 'entidade')}`}
      />
      <InvestigationBreadcrumbs navigation={navigation} />

      {/* ── Grafo SVG ─────────────────────────────────────────────── */}
      <AppCard
        variant="elevated"
        style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}
      >
        <ScrollView horizontal maximumZoomScale={3} minimumZoomScale={1} bouncesZoom showsHorizontalScrollIndicator={false}>
          <Svg width={graphSize} height={graphSize}>
          {/* Arestas */}
          {edges.slice(0, 60).map((edge, i) => {
            const fromId = edge.from || edge.source || edge.a;
            const toId = edge.to || edge.target || edge.b;
            const from = indexById.get(fromId);
            const to = indexById.get(toId);
            if (!from || !to) return null;
            return (
              <Line
                key={buildStableKey('edge', edge.id, fromId, toId, edge.weight || edge.score || 1, i + 1)}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={theme.colors.borderStrong}
                strokeOpacity={0.72}
                strokeWidth={Math.min(4, Math.max(1.2, Number(edge.weight || edge.score || 1)))}
              />
            );
          })}

          {/* Nós interativos */}
          {positioned.map((node, i) => {
            const weight = node.weight || node.score || 1;
            const r = Math.max(7, Math.min(20, 7 + Math.sqrt(weight) * 2));
            const color = getNodeColor(node);
            const bg = getNodeBg(node);
            const label = getNodeLabel(node).slice(0, 14);

            return (
              <G
                key={buildStableKey(
                  'node',
                  node.id,
                  node.type || node.entityType,
                  node.label || node.name || node.normalizedName,
                  node.weight || node.score || 1,
                  i + 1
                )}
                onPress={() => previewNode(node)}
              >
                {/* Hit area maior para facilitar o toque */}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="transparent"
                />
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 4}
                  fill={color}
                  opacity={0.12}
                />
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={bg}
                  stroke={color}
                  strokeWidth={1.5}
                />
                <SvgText
                  x={node.x}
                  y={node.y + r + 13}
                  fill={theme.colors.textSubtle}
                  fontSize="9"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </G>
            );
          })}
          </Svg>
        </ScrollView>

        <Text style={localStyles.graphHint}>Toque em um nó para abrir a prévia e seguir para o dossiê</Text>
      </AppCard>

      {selectedNode ? (
        <AppCard variant="outline" style={localStyles.previewCard}>
          <View style={localStyles.previewHeader}>
            <View style={[localStyles.previewIcon, { backgroundColor: getNodeBg(selectedNode) }]}>
              <Ionicons name={getNodeIcon(selectedNode)} size={16} color={getNodeColor(selectedNode)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={localStyles.previewTitle}>{getNodeLabel(selectedNode)}</Text>
              <Text style={localStyles.previewSubtitle}>Peso {safeNumericText(selectedNode.weight || selectedNode.score || 1)}</Text>
            </View>
          </View>
          <View style={localStyles.previewActions}>
            <Pressable
              onPress={() =>
                openFinancialProfile(navigation, {
                  type: selectedNode.type || selectedNode.entityType,
                  q: getNodeLabel(selectedNode),
                  source: 'RelationshipGraphPreview'
                })
              }
              style={({ pressed }) => [localStyles.previewButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={localStyles.previewButtonText}>Abrir dossiê</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                openEntityDetails(navigation, {
                  type: selectedNode.type || selectedNode.entityType,
                  q: getNodeLabel(selectedNode),
                  source: 'RelationshipGraphPreview',
                  entityId: safeText(selectedNode.id, '')
                })
              }
              style={({ pressed }) => [localStyles.previewGhostButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={localStyles.previewGhostText}>Ver preview</Text>
            </Pressable>
          </View>
        </AppCard>
      ) : null}

      {/* ── Top conexões ─────────────────────────────────────────── */}
      <SectionHeader
        title="Top conexões"
        subtitle="Entidades com mais interações no histórico"
      />

      <View style={localStyles.connectionsList}>
        {positioned.slice(0, 8).map((node, i) => (
          <ConnectionCard
            key={buildStableKey(
              'connection',
              node.id,
              node.type || node.entityType,
              node.label || node.name || node.normalizedName,
              node.weight || node.score || 1,
              i + 1
            )}
            node={node}
            index={i}
            maxWeight={maxWeight}
            onPress={() => openNodeProfile(node)}
          />
        ))}
      </View>

      {/* ── Dica de navegação ─────────────────────────────────────── */}
      <AppCard variant="outline" style={localStyles.tipCard}>
        <View style={localStyles.tipRow}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.muted} />
          <Text style={localStyles.tipText}>
            Toque em qualquer entidade para abrir seu dossiê financeiro completo com transações,
            padrões e métricas.
          </Text>
        </View>
      </AppCard>

      <View style={{ height: theme.spacing.xxxl }} />
    </AppScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  hero: { paddingTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  label: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.size.display,
    fontWeight: theme.typography.weight.bold,
    marginTop: theme.spacing.sm
  },
  summary: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.sm,
    lineHeight: 22
  },

  graphHint: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  contextPills: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.md
  },
  contextPill: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6
  },
  contextPillText: {
    color: theme.colors.textSubtle,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium
  },

  connectionsList: { gap: theme.spacing.md },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.md
  },
  connectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  connectionContent: { flex: 1 },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  connectionLabel: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    paddingRight: theme.spacing.sm
  },
  connectionStrengthPct: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold
  },
  strengthBarTrack: {
    height: 4,
    backgroundColor: theme.colors.surface2,
    borderRadius: 2,
    marginBottom: theme.spacing.xs
  },
  strengthBarFill: {
    height: 4,
    borderRadius: 2
  },
  connectionMeta: {
    color: theme.colors.mutedStrong,
    fontSize: theme.typography.size.xs
  },

  tipCard: { marginTop: theme.spacing.lg },
  tipRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  tipText: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: theme.typography.size.sm,
    lineHeight: 18
  },
  previewCard: { marginTop: theme.spacing.lg },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold
  },
  previewSubtitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.size.xs,
    marginTop: 2
  },
  previewActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  previewButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12
  },
  previewGhostButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    paddingVertical: 12
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weight.semibold
  },
  previewGhostText: {
    color: theme.colors.text,
    fontWeight: theme.typography.weight.semibold
  }
});
