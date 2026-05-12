import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GitFork, LoaderCircle, X } from "lucide-react";
import { getRelationshipGraph } from "../../services/relationshipGraphApi.js";
import { buildFinancialProfileUrl } from "../../utils/financialProfileNavigation.js";
import { buildSearchUrl } from "../../utils/financialNavigation.js";

/* ── SVG constants ─────────────────────────────────────────────── */
const W  = 700;
const H  = 500;
const CX = 350;
const CY = 248;

const ORBIT_SINGLE = 178;
const ORBIT_INNER  = 138;
const ORBIT_OUTER  = 210;
const INNER_SPLIT  = 8;

const CENTER_R   = 38;
const NODE_R_MIN = 15;
const NODE_R_MAX = 24;

/* ── Type visual config ────────────────────────────────────────── */
const TYPE_CFG = {
  person:        { color: "#a78bfa", label: "Pessoa" },
  merchant:      { color: "#8b5cf6", label: "Empresa" },
  bank:          { color: "#64748b", label: "Banco" },
  paymentMethod: { color: "#0ea5e9", label: "Método" },
  category:      { color: "#f59e0b", label: "Categoria" }
};

function tcol(type) { return TYPE_CFG[type]?.color ?? "#94a3b8"; }
function tlbl(type) { return TYPE_CFG[type]?.label ?? type; }

/* ── Layout math ───────────────────────────────────────────────── */
function deg2xy(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function nodeRad(strength) {
  return NODE_R_MIN + Math.round(strength * (NODE_R_MAX - NODE_R_MIN));
}

function computeLayout(nodes) {
  if (!nodes.length) return {};
  const sorted = [...nodes].sort((a, b) => b.strength - a.strength);
  const two    = sorted.length > INNER_SPLIT;
  const pos    = {};

  function ring(group, orbR) {
    const n = group.length;
    group.forEach((nd, i) => {
      const deg = n === 1 ? 0 : (360 * i) / n;
      const { x, y } = deg2xy(orbR, deg);
      const r  = nodeRad(nd.strength);
      const dx = x - CX, dy = y - CY;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      const off = r + 12;
      const lx = x + (dx / d) * off;
      const ly = y + (dy / d) * off;
      const ta = Math.abs(dx) < 20 ? "middle" : dx > 0 ? "start" : "end";
      pos[nd.id] = { x, y, r, lx, ly, ta };
    });
  }

  if (two) {
    ring(sorted.slice(0, INNER_SPLIT), ORBIT_INNER);
    ring(sorted.slice(INNER_SPLIT), ORBIT_OUTER);
  } else {
    ring(sorted, ORBIT_SINGLE);
  }
  return pos;
}

/* ── Path builders ─────────────────────────────────────────────── */
function hubPath(tx, ty)             { return `M ${CX} ${CY} L ${tx} ${ty}`; }
function peerPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = mx - CX, dy = my - CY;
  const d  = Math.sqrt(dx * dx + dy * dy) || 1;
  const off = 32;
  return `M ${x1} ${y1} Q ${mx + (dx / d) * off} ${my + (dy / d) * off} ${x2} ${y2}`;
}

/* ── Formatters ────────────────────────────────────────────────── */
function fmtCur(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
}
function trunc(s, n) { return !s ? "" : s.length > n ? s.slice(0, n - 1) + "…" : s; }

/* ── SVG defs (gradients + filters) ───────────────────────────── */
function GraphDefs() {
  return (
    <defs>
      <radialGradient id="rg-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#c4b5fd" />
        <stop offset="55%"  stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#0e7490" />
      </radialGradient>
      <radialGradient id="rg-bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(124,58,237,.08)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      <filter id="rg-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="rg-node-glow" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

/* ── Background decorations ─────────────────────────────────────── */
function GraphBg({ useTwoRings }) {
  return (
    <>
      <circle cx={CX} cy={CY} r={260} fill="url(#rg-bg)" />
      {useTwoRings ? (
        <>
          <circle cx={CX} cy={CY} r={ORBIT_INNER} fill="none" stroke="rgba(255,255,255,.045)" strokeWidth={1} strokeDasharray="3 8" />
          <circle cx={CX} cy={CY} r={ORBIT_OUTER} fill="none" stroke="rgba(255,255,255,.03)"  strokeWidth={1} strokeDasharray="3 10" />
        </>
      ) : (
        <circle cx={CX} cy={CY} r={ORBIT_SINGLE} fill="none" stroke="rgba(255,255,255,.045)" strokeWidth={1} strokeDasharray="3 8" />
      )}
    </>
  );
}

/* ── Edge ───────────────────────────────────────────────────────── */
function EdgePath({ edge, positions, centerId, hoveredId }) {
  const isHub  = edge.source === centerId;
  const relId  = isHub ? edge.target : (edge.source === centerId ? edge.target : edge.source);
  const active = hoveredId && (edge.source === hoveredId || edge.target === hoveredId || (isHub && edge.target === hoveredId));
  const faded  = hoveredId && !active;

  let x1, y1, x2, y2;
  if (isHub) {
    x1 = CX; y1 = CY;
    const p = positions[edge.target]; if (!p) return null;
    x2 = p.x; y2 = p.y;
  } else {
    const ps = positions[edge.source];
    const pt = positions[edge.target];
    if (!ps || !pt) return null;
    x1 = ps.x; y1 = ps.y; x2 = pt.x; y2 = pt.y;
  }

  const baseAlpha = Math.max(0.10, edge.relationshipStrength * 0.55);
  const alpha     = faded ? 0.04 : active ? Math.min(0.88, baseAlpha * 2) : baseAlpha;
  const color     = isHub
    ? `rgba(124,58,237,${alpha})`
    : `rgba(6,182,212,${alpha})`;
  const sw        = isHub
    ? (0.6 + edge.relationshipStrength * 2.4) * (active ? 1.9 : 1)
    : (0.5 + edge.relationshipStrength * 1.4) * (active ? 1.9 : 1);

  const d = isHub ? hubPath(x2, y2) : peerPath(x1, y1, x2, y2);

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      style={{ transition: "stroke .18s ease, stroke-width .18s ease", pointerEvents: "none" }}
    />
  );
}

/* ── Center node ─────────────────────────────────────────────────── */
function CenterNode({ node, onClick }) {
  return (
    <g style={{ cursor: "pointer" }} onClick={() => onClick(node)}>
      <circle cx={CX} cy={CY} r={CENTER_R + 16}
        fill="none" stroke="rgba(124,58,237,.16)" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={CENTER_R}
        fill="url(#rg-center)" filter="url(#rg-glow)" />
      <text x={CX} y={CY - 8} textAnchor="middle"
        fill="rgba(255,255,255,.55)" fontSize={8} fontFamily="monospace" letterSpacing=".06em">
        {tlbl(node.type)}
      </text>
      <text x={CX} y={CY + 9} textAnchor="middle"
        fill="#fff" fontSize={11} fontFamily="sans-serif" fontWeight="700">
        {trunc(node.label, 13)}
      </text>
    </g>
  );
}

/* ── Related node ────────────────────────────────────────────────── */
function RelatedNode({ node, pos, hoveredId, onHover, onClick }) {
  const isHovered = hoveredId === node.id;
  const isFaded   = hoveredId && hoveredId !== node.id;
  const color     = tcol(node.type);

  return (
    <g
      style={{ cursor: "pointer" }}
      opacity={isFaded ? 0.25 : 1}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {isHovered && (
        <circle cx={pos.x} cy={pos.y} r={pos.r + 9}
          fill="none" stroke={color} strokeWidth={1.5} opacity={.45} />
      )}
      <circle cx={pos.x} cy={pos.y} r={pos.r}
        fill={color} opacity={.88}
        filter={isHovered ? "url(#rg-node-glow)" : undefined}
        style={{ transition: "opacity .15s ease" }}
      />
      <circle cx={pos.x} cy={pos.y} r={pos.r * 0.48}
        fill="rgba(0,0,0,.3)" style={{ pointerEvents: "none" }} />
      <text
        x={pos.lx} y={pos.ly} textAnchor={pos.ta}
        fill={isHovered ? color : "rgba(255,255,255,.72)"}
        fontSize={9} fontFamily="monospace" fontWeight="500"
        style={{ transition: "fill .15s ease", pointerEvents: "none" }}
      >
        {trunc(node.label, 11)}
      </text>
    </g>
  );
}

/* ── Detail panel (appears after click) ─────────────────────────── */
function DetailPanel({ node, isCenter, params, navigate, onClose }) {
  const color      = isCenter ? "#a78bfa" : tcol(node.type);
  const profileUrl = buildFinancialProfileUrl({
    type: node.type, q: node.label,
    startDate: params.startDate, endDate: params.endDate
  });
  const searchUrl = buildSearchUrl({
    q: node.label,
    startDate: params.startDate, endDate: params.endDate
  });
  const pct = Math.round((node.strength || 0) * 100);

  return (
    <div className="rg-detail-panel">
      <div className="rg-detail-header">
        <div className="rg-detail-title">
          <span
            className="badge"
            style={{ background: color + "22", color, border: `1px solid ${color}44` }}
          >
            {tlbl(node.type)}
          </span>
          <strong className="rg-detail-name" title={node.label}>{node.label}</strong>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
          <X size={13} />
        </button>
      </div>

      <div className="rg-detail-metrics">
        <div>
          <span>Transações</span>
          <strong>{node.transactionCount}</strong>
        </div>
        <div>
          <span>Movimentado</span>
          <strong className="mono">{fmtCur(node.totalMoved)}</strong>
        </div>
        <div>
          <span>Força relacional</span>
          <div className="rg-strength-wrap">
            <div className="rg-strength-track">
              <div className="rg-strength-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="mono" style={{ fontSize: ".68rem", color: "var(--muted-2)" }}>{pct}%</span>
          </div>
        </div>
      </div>

      {!isCenter && (
        <div className="insight-action-row" style={{ marginTop: ".85rem" }}>
          <button className="search-dossier-btn" type="button" onClick={() => navigate(profileUrl)}>
            Abrir dossiê
          </button>
          <button className="insight-link-btn" type="button" onClick={() => navigate(searchUrl)}>
            Buscar transações
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function RelationshipGraphPanel({ params, navigate }) {
  const [graphData,    setGraphData]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [hoveredId,    setHoveredId]    = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!params.type || !params.q) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelectedNode(null);

    getRelationshipGraph({ ...params, depth: 1, limit: 20 })
      .then((data) => { if (!cancelled) setGraphData(data); })
      .catch(() => { if (!cancelled) setError("Não foi possível carregar o grafo de relacionamento."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [params.type, params.q, params.startDate, params.endDate]);

  const positions    = useMemo(() => computeLayout(graphData?.nodes || []), [graphData]);
  const useTwoRings  = (graphData?.nodes?.length || 0) > INNER_SPLIT;
  const hasNodes     = graphData?.nodes?.length > 0;

  function handleNodeClick(node) {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }

  if (!params.type || !params.q) return null;

  /* ── Empty / loading / error states ── */
  if (loading) {
    return (
      <div className="card rg-card">
        <div className="dash-section-title"><span>Grafo de relacionamento</span></div>
        <div className="rg-state">
          <LoaderCircle size={18} className="spin" />
          <span>Mapeando relações financeiras…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card rg-card">
        <div className="dash-section-title"><span>Grafo de relacionamento</span></div>
        <div className="rg-state">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  if (!graphData || !hasNodes) {
    return (
      <div className="card rg-card">
        <div className="dash-section-title"><span>Grafo de relacionamento</span></div>
        <div className="rg-state">
          <GitFork size={18} style={{ opacity: .38 }} />
          <span>Sem relações identificadas para este recorte.</span>
        </div>
      </div>
    );
  }

  const centerId = graphData.centerNode.id;

  return (
    <div className="card rg-card">
      {/* Header */}
      <div className="dash-section-title">
        <span>Grafo de relacionamento</span>
        <span className="badge badge-neutral">
          {graphData.nodes.length} conexão{graphData.nodes.length !== 1 ? "ões" : ""}
        </span>
      </div>

      {graphData.narrative && (
        <p className="rg-narrative">{graphData.narrative}</p>
      )}

      {/* SVG graph */}
      <div className="rg-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-label="Grafo de relacionamento financeiro">
          <GraphDefs />
          <GraphBg useTwoRings={useTwoRings} />

          {/* Edges (rendered below nodes) */}
          {graphData.edges.map((edge) => (
            <EdgePath
              key={`${edge.source}→${edge.target}`}
              edge={edge}
              positions={positions}
              centerId={centerId}
              hoveredId={hoveredId}
            />
          ))}

          {/* Center node */}
          <CenterNode node={graphData.centerNode} onClick={handleNodeClick} />

          {/* Related nodes */}
          {graphData.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            return (
              <RelatedNode
                key={node.id}
                node={node}
                pos={pos}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onClick={handleNodeClick}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="rg-legend">
        {Object.entries(TYPE_CFG).map(([type, cfg]) => {
          if (!graphData.nodes.some((n) => n.type === type)) return null;
          return (
            <div key={type} className="rg-legend-item">
              <span className="rg-legend-dot" style={{ background: cfg.color }} />
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Detail panel (on node click) */}
      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          isCenter={selectedNode.id === centerId}
          params={params}
          navigate={navigate}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Insights */}
      {graphData.insights?.length > 0 && (
        <div className="ledger-insights-list" style={{ marginTop: "1rem" }}>
          {graphData.insights.slice(0, 3).map((ins, i) => (
            <div key={i} className="ledger-insight-card">
              <span className="badge badge-green">{ins.title}</span>
              <p>{ins.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
