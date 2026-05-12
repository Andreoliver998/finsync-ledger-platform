import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { CategoryClassifierService } from "./CategoryClassifierService.js";

/* ── Validation schema ─────────────────────────────────────────── */
const ALLOWED_TYPES = ["person", "merchant", "bank", "paymentMethod", "category"];

export const relationshipGraphQuerySchema = z.object({
  type:      z.enum(ALLOWED_TYPES),
  q:         z.string().trim().min(1).max(80),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  depth:     z.coerce.number().int().min(1).max(2).optional().default(1),
  limit:     z.coerce.number().int().min(5).max(30).optional().default(20)
});

/* ── Pure helpers ──────────────────────────────────────────────── */
function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function includesQuery(value, query) {
  return normalize(value).includes(query);
}

function signedAmount(row) {
  return String(row.type || "").toUpperCase() === "DEBIT"
    ? -Math.abs(Number(row.amount || 0))
    : Math.abs(Number(row.amount || 0));
}

function filterDateRange(row, startDate, endExclusive) {
  const d = new Date(row.date);
  if (startDate && d < startDate) return false;
  if (endExclusive && d >= endExclusive) return false;
  return true;
}

function normalizeTx(row) {
  const en = CategoryClassifierService.classifyFull(row);
  const amount = signedAmount(row);
  return {
    id:              row.id,
    date:            row.date,
    amount,
    absoluteAmount:  Math.abs(amount),
    merchantName:    en.merchantName || row.counterpartyName || row.description,
    counterpartyName: en.counterpartyName || row.counterpartyName || null,
    category:        row.userCategory || row.category || en.category || "Sem categoria",
    paymentMethod:   row.paymentMethod || null,
    bank:            row.bank || row.importBatch?.bank || null,
    operationType:   en.operationType || null
  };
}

/* ── Center entity matching ────────────────────────────────────── */
function matchesCenter(tx, type, nq) {
  if (type === "person")        return includesQuery(tx.counterpartyName || "", nq) || includesQuery(tx.merchantName || "", nq);
  if (type === "merchant")      return includesQuery(tx.merchantName || "", nq) || includesQuery(tx.counterpartyName || "", nq);
  if (type === "bank")          return includesQuery(tx.bank || "", nq);
  if (type === "paymentMethod") return includesQuery(tx.paymentMethod || tx.operationType || "", nq);
  if (type === "category")      return includesQuery(tx.category || "", nq);
  return false;
}

/* ── Entity extraction per transaction ─────────────────────────── */
function extractEntities(tx, centerType, centerNq) {
  const ents = [];
  const add = (type, raw) => {
    if (!raw || typeof raw !== "string") return;
    const name = raw.trim().slice(0, 80);
    if (name.length < 2) return;
    if (normalize(name) === centerNq) return;
    ents.push({ type, name });
  };

  if (centerType !== "merchant")      add("merchant", tx.merchantName);
  if (centerType !== "person")        add("person", tx.counterpartyName);
  if (centerType !== "paymentMethod") add("paymentMethod", tx.paymentMethod || tx.operationType);
  if (centerType !== "category" && tx.category !== "Sem categoria") add("category", tx.category);
  if (centerType !== "bank")          add("bank", tx.bank);

  return ents;
}

/* ── Relationship strength ─────────────────────────────────────── */
function temporalScore(lastSeenDate) {
  if (!lastSeenDate) return 0.1;
  const days = (Date.now() - new Date(lastSeenDate).getTime()) / 86400000;
  if (days < 30)  return 1.0;
  if (days < 90)  return 0.6;
  if (days < 180) return 0.3;
  return 0.1;
}

function computeStrength(txCount, totalCount, moved, totalMoved, lastSeen) {
  const freq = Math.min(1, (txCount / (totalCount || 1)) * 4);
  const amt  = Math.min(1, moved / (totalMoved || 1));
  const temp = temporalScore(lastSeen);
  return Math.round(Math.min(1, 0.40 * freq + 0.35 * amt + 0.25 * temp) * 100) / 100;
}

/* ── Node / edge ID helpers ────────────────────────────────────── */
function nid(type, name) { return `${type}::${name}`; }

/* ── Currency formatter ────────────────────────────────────────── */
function fmtCur(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));
}

/* ── Main service ──────────────────────────────────────────────── */
export class RelationshipGraphService {
  static async getGraph(userId, query) {
    const parsed = relationshipGraphQuerySchema.parse(query);
    const nq = normalize(parsed.q);
    const startDate    = parsed.startDate ? new Date(parsed.startDate) : null;
    const endExclusive = parsed.endDate
      ? new Date(new Date(parsed.endDate).getTime() + 86400000)
      : null;

    /* ── Fetch ledger rows ── */
    const rows = await prisma.ledgerTransaction.findMany({
      where: { userId, status: { not: "DISCARDED" } },
      include: { importBatch: { select: { bank: true, accountName: true } } },
      orderBy: { date: "desc" },
      take: 6000
    });

    const allTx = rows
      .filter((row) => filterDateRange(row, startDate, endExclusive))
      .map(normalizeTx);

    /* ── Match center entity ── */
    const matches = allTx.filter((tx) => matchesCenter(tx, parsed.type, nq));

    const totalMoved = matches.reduce((s, t) => s + t.absoluteAmount, 0);
    const centerNodeId = nid(parsed.type, parsed.q.trim());

    const centerNode = {
      id:               centerNodeId,
      label:            parsed.q.trim(),
      type:             parsed.type,
      totalMoved:       Math.round(totalMoved * 100) / 100,
      transactionCount: matches.length,
      strength:         1.0
    };

    if (!matches.length) {
      return {
        centerNode,
        nodes:    [],
        edges:    [],
        insights: [],
        narrative: `Nenhuma transação encontrada para "${parsed.q.trim()}" no período selecionado.`
      };
    }

    /* ── Build related entity map ── */
    const relMap = new Map();

    for (const tx of matches) {
      const ents = extractEntities(tx, parsed.type, nq);
      for (const ent of ents) {
        const id = nid(ent.type, ent.name);
        const ex = relMap.get(id) || {
          id, type: ent.type, name: ent.name,
          txCount: 0, moved: 0, lastSeen: null,
          pmCounts: new Map(), catCounts: new Map()
        };
        ex.txCount  += 1;
        ex.moved    += tx.absoluteAmount;
        if (!ex.lastSeen || new Date(tx.date) > new Date(ex.lastSeen)) ex.lastSeen = tx.date;
        if (tx.paymentMethod) ex.pmCounts.set(tx.paymentMethod, (ex.pmCounts.get(tx.paymentMethod) || 0) + 1);
        if (tx.category && tx.category !== "Sem categoria") {
          ex.catCounts.set(tx.category, (ex.catCounts.get(tx.category) || 0) + 1);
        }
        relMap.set(id, ex);
      }
    }

    /* ── Sort and limit ── */
    const sorted = Array.from(relMap.values())
      .sort((a, b) => b.moved - a.moved || b.txCount - a.txCount)
      .slice(0, parsed.limit);

    /* ── Build nodes and center→node edges ── */
    const nodes = [];
    const edges = [];

    for (const rel of sorted) {
      const strength = computeStrength(rel.txCount, matches.length, rel.moved, totalMoved, rel.lastSeen);
      const topPm  = [...rel.pmCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
      const topCat = [...rel.catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

      nodes.push({
        id:               rel.id,
        label:            rel.name,
        type:             rel.type,
        totalMoved:       Math.round(rel.moved * 100) / 100,
        transactionCount: rel.txCount,
        strength
      });

      edges.push({
        source:               centerNodeId,
        target:               rel.id,
        relationshipStrength: strength,
        totalMoved:           Math.round(rel.moved * 100) / 100,
        transactionCount:     rel.txCount,
        paymentMethods:       topPm,
        categories:           topCat
      });
    }

    /* ── Depth 2: node-to-node edges ── */
    if (parsed.depth >= 2 && nodes.length > 1) {
      const includedIds = new Set(nodes.map((n) => n.id));
      const pairMap = new Map();

      for (const tx of matches) {
        const txEnts = extractEntities(tx, parsed.type, nq)
          .map((e) => ({ ...e, id: nid(e.type, e.name.trim().slice(0, 80)) }))
          .filter((e) => e.name.length >= 2 && includedIds.has(e.id));

        for (let i = 0; i < txEnts.length; i++) {
          for (let j = i + 1; j < txEnts.length; j++) {
            const a = txEnts[i].id, b = txEnts[j].id;
            const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
            const pair = pairMap.get(key) || {
              source: a < b ? a : b,
              target: a < b ? b : a,
              txCount: 0, moved: 0,
              pmCounts: new Map(), catCounts: new Map()
            };
            pair.txCount += 1;
            pair.moved   += tx.absoluteAmount;
            if (tx.paymentMethod) pair.pmCounts.set(tx.paymentMethod, (pair.pmCounts.get(tx.paymentMethod) || 0) + 1);
            if (tx.category && tx.category !== "Sem categoria") {
              pair.catCounts.set(tx.category, (pair.catCounts.get(tx.category) || 0) + 1);
            }
            pairMap.set(key, pair);
          }
        }
      }

      for (const p of pairMap.values()) {
        if (p.txCount < 2) continue;
        const strength2 = Math.min(1, Math.round((p.txCount / matches.length) * 3 * 100) / 100);
        edges.push({
          source:               p.source,
          target:               p.target,
          relationshipStrength: strength2,
          totalMoved:           Math.round(p.moved * 100) / 100,
          transactionCount:     p.txCount,
          paymentMethods:       [...p.pmCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n),
          categories:           [...p.catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n)
        });
      }
    }

    /* ── Insights ── */
    const insights = [];
    const top = nodes[0];
    if (top) {
      insights.push({
        title: "Conexão mais forte",
        message: `${top.label} acumula ${top.transactionCount} transações e ${fmtCur(top.totalMoved)} movimentados com ${parsed.q.trim()}.`
      });
    }
    if (nodes.length >= 5) {
      insights.push({
        title: "Rede diversificada",
        message: `${parsed.q.trim()} interage com ${nodes.length} entidades distintas no período selecionado.`
      });
    }
    const merchantCount = nodes.filter((n) => n.type === "merchant").length;
    if (merchantCount >= 3) {
      insights.push({
        title: "Múltiplos estabelecimentos",
        message: `${merchantCount} empresas diferentes identificadas nesta rede relacional.`
      });
    }

    const narrative = `${parsed.q.trim()} aparece conectado(a) a ${nodes.length} entidade${nodes.length !== 1 ? "s" : ""}, formando ${edges.length} relação${edges.length !== 1 ? "ões" : ""} identificada${edges.length !== 1 ? "s" : ""} no período.`;

    return { centerNode, nodes, edges, insights, narrative };
  }
}
