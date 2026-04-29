import { useState, useMemo, useCallback, useEffect } from "react";

// ─── CONSTANTS & CONFIG ───────────────────────────────────────────────
const YIELD_CHAIN = {
  cleaning: { label: "Cleaning", yield: 0.92, loss: "Shells/waste" },
  cooking: { label: "Cooking", yield: 0.85, loss: "Moisture/protein" },
  glazing: { label: "Glazing", yield: 1.03, loss: "Glaze adds weight" },
  packing: { label: "Packing", yield: 0.99, loss: "Spillage" },
};
const TOTAL_YIELD = 0.92 * 0.85 * 1.03 * 0.99; // ≈ 0.7974
const PROCESSING_COST_PER_MT = 45000;
const STAGES = ["cleaning", "cooking", "glazing", "packing"];
const STAGE_COLORS = { cleaning: "#3b82f6", cooking: "#ef4444", glazing: "#06b6d4", packing: "#8b5cf6" };

const GRADE_CONFIG = {
  "8/12": { priceMultiplier: 1.85, yieldMultiplier: 1.06 },
  "13/15": { priceMultiplier: 1.65, yieldMultiplier: 1.04 },
  "16/20": { priceMultiplier: 1.50, yieldMultiplier: 1.02 },
  "20/25": { priceMultiplier: 1.40, yieldMultiplier: 1.00 },
  "26/30": { priceMultiplier: 1.20, yieldMultiplier: 0.98 },
  "31/40": { priceMultiplier: 1.05, yieldMultiplier: 0.96 },
  "41/50": { priceMultiplier: 0.90, yieldMultiplier: 0.94 },
};

const MACHINES = [
  { id: "cleaning", name: "Cleaning Line", rawCapacity: 10, count: 2, downtime: 0.08, stage: "cleaning" },
  { id: "cooking", name: "Cooking Line", rawCapacity: 8, count: 3, downtime: 0.10, stage: "cooking" },
  { id: "glazing", name: "Glazing Unit", rawCapacity: 6, count: 2, downtime: 0.05, stage: "glazing" },
  { id: "packing", name: "Packing Line", rawCapacity: 7, count: 2, downtime: 0.07, stage: "packing" },
];

const EFFICIENCY_PER_STAGE = { cleaning: 200, cooking: 150, glazing: 180, packing: 160 };

const SUPPLIERS = [
  { id: "SUP-01", name: "KeralaFish Exports", species: "Black Tiger", leadDays: 3, pricePerMT: 420000, gradeProfile: { "8/12": 0.05, "13/15": 0.10, "16/20": 0.20, "20/25": 0.35, "26/30": 0.20, "31/40": 0.08, "41/50": 0.02 } },
  { id: "SUP-02", name: "Coastal Marine Pvt", species: "Vannamei", leadDays: 2, pricePerMT: 310000, gradeProfile: { "8/12": 0.02, "13/15": 0.05, "16/20": 0.15, "20/25": 0.30, "26/30": 0.28, "31/40": 0.15, "41/50": 0.05 } },
  { id: "SUP-03", name: "Bay of Bengal Co", species: "Black Tiger", leadDays: 4, pricePerMT: 395000, gradeProfile: { "8/12": 0.08, "13/15": 0.12, "16/20": 0.22, "20/25": 0.30, "26/30": 0.18, "31/40": 0.08, "41/50": 0.02 } },
];

const INITIAL_ORDERS = [
  { id: "ORD-001", customer: "Nippon Suisan", dest: "Japan", species: "Black Tiger", grade: "20/25", qty: 4.5, sellingPrice: 850000, deliveryDate: "2026-04-29", customerTier: "repeat", status: "confirmed" },
  { id: "ORD-002", customer: "Thai Union Group", dest: "Thailand", species: "Vannamei", grade: "26/30", qty: 3.2, sellingPrice: 620000, deliveryDate: "2026-05-02", customerTier: "repeat", status: "confirmed" },
  { id: "ORD-003", customer: "Maruha Nichiro", dest: "Japan", species: "Black Tiger", grade: "16/20", qty: 5.0, sellingPrice: 920000, deliveryDate: "2026-04-30", customerTier: "repeat", status: "confirmed" },
  { id: "ORD-004", customer: "Red Lobster Int", dest: "USA", species: "Black Tiger", grade: "20/25", qty: 6.0, sellingPrice: 780000, deliveryDate: "2026-05-05", customerTier: "new", status: "confirmed" },
  { id: "ORD-005", customer: "Sysco Foods EU", dest: "Germany", species: "Vannamei", grade: "31/40", qty: 3.8, sellingPrice: 540000, deliveryDate: "2026-05-08", customerTier: "new", status: "confirmed" },
  { id: "ORD-006", customer: "Clearwater Fine", dest: "Canada", species: "Black Tiger", grade: "13/15", qty: 2.5, sellingPrice: 1050000, deliveryDate: "2026-05-03", customerTier: "repeat", status: "confirmed" },
];

const INITIAL_BATCHES = [
  { id: "BAT-001", orderId: "ORD-001", inputMT: 2.5, currentStage: "cooking", stageStartTime: "08:00", stages: { cleaning: "done", cooking: "active", glazing: "pending", packing: "pending" }, startDate: "2026-04-21" },
  { id: "BAT-002", orderId: "ORD-001", inputMT: 3.14, currentStage: "cleaning", stageStartTime: "06:00", stages: { cleaning: "active", cooking: "pending", glazing: "pending", packing: "pending" }, startDate: "2026-04-21" },
  { id: "BAT-003", orderId: "ORD-003", inputMT: 3.5, currentStage: "cleaning", stageStartTime: "10:00", stages: { cleaning: "active", cooking: "pending", glazing: "pending", packing: "pending" }, startDate: "2026-04-21" },
  { id: "BAT-004", orderId: "ORD-002", inputMT: 4.01, currentStage: "scheduled", stageStartTime: null, stages: { cleaning: "pending", cooking: "pending", glazing: "pending", packing: "pending" }, startDate: "2026-04-22" },
];

const INITIAL_INVENTORY = {
  "Black Tiger": { inStock: 18.0, committed: 6.0, pricePerMT: 420000 },
  "Vannamei": { inStock: 8.5, committed: 0, pricePerMT: 310000 },
};

// ─── UTILITY FUNCTIONS ───────────────────────────────────────────────
const today = new Date("2026-04-21");
const daysBetween = (d) => Math.ceil((new Date(d) - today) / 86400000);
const fmt = (n, d = 2) => Number(n).toFixed(d);
const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function calcYieldChain(inputMT) {
  let w = inputMT;
  const steps = [];
  for (const s of STAGES) {
    const out = w * YIELD_CHAIN[s].yield;
    steps.push({ stage: s, input: w, output: out, loss: w - out });
    w = out;
  }
  return { steps, finalOutput: w };
}

function calcMargin(order) {
  const grade = GRADE_CONFIG[order.grade] || { priceMultiplier: 1, yieldMultiplier: 1 };
  const rmCost = (order.species === "Black Tiger" ? 420000 : 310000) * grade.priceMultiplier;
  return order.sellingPrice - rmCost - PROCESSING_COST_PER_MT;
}

function calcPriorityScore(order, allOrders) {
  const daysLeft = daysBetween(order.deliveryDate);
  const urgency = Math.max(0, Math.min(100, 100 - daysLeft * 5));
  const margin = calcMargin(order);
  const maxMargin = Math.max(...allOrders.map(calcMargin));
  const marginScore = maxMargin > 0 ? (margin / maxMargin) * 100 : 0;
  const customerScore = order.customerTier === "repeat" ? 100 : 50;
  const inv = INITIAL_INVENTORY[order.species];
  const rawNeeded = order.qty / TOTAL_YIELD;
  const stockScore = inv && (inv.inStock - inv.committed) >= rawNeeded ? 100 : 0;
  return {
    total: Math.round(urgency * 0.4 + marginScore * 0.3 + customerScore * 0.2 + stockScore * 0.1),
    urgency: Math.round(urgency),
    marginScore: Math.round(marginScore),
    customerScore,
    stockScore,
  };
}

function machineNetCapacity(m) { return m.rawCapacity * m.count * (1 - m.downtime); }

// ─── STYLES ───────────────────────────────────────────────────────────
const C = {
  bg: "#0a0e17", surface: "#111827", surface2: "#1a2234", border: "#1e293b",
  text: "#e2e8f0", textDim: "#94a3b8", textMuted: "#64748b",
  accent: "#0ea5e9", accentDim: "#0284c7",
  green: "#10b981", greenDim: "#065f46",
  red: "#ef4444", redDim: "#7f1d1d",
  amber: "#f59e0b", amberDim: "#78350f",
  purple: "#8b5cf6", cyan: "#06b6d4",
};

const baseCard = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 };
const badge = (color, bg) => ({
  display: "inline-block", padding: "2px 10px", borderRadius: 12,
  fontSize: 11, fontWeight: 600, color, background: bg, letterSpacing: 0.5,
});

// ─── COMPONENTS ───────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = C.accent }) {
  return (
    <div style={{ ...baseCard, padding: 16, minWidth: 150, flex: 1 }}>
      <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: "4px 0 0 30px", fontSize: 13, color: C.textDim }}>{subtitle}</p>}
    </div>
  );
}

function ProgressDots({ stages, currentStage }) {
  const stageList = STAGES;
  const currentIdx = stageList.indexOf(currentStage);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {stageList.map((s, i) => {
        const isDone = stages[s] === "done";
        const isActive = stages[s] === "active";
        const color = isDone ? C.green : isActive ? C.accent : C.border;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", background: color,
              boxShadow: isActive ? `0 0 8px ${C.accent}` : "none",
            }} />
            {i < stageList.length - 1 && <div style={{ width: 16, height: 2, background: isDone ? C.green : C.border }} />}
          </div>
        );
      })}
    </div>
  );
}

function PriorityBadge({ score }) {
  if (score >= 75) return <span style={badge("#fff", C.red)}>CRITICAL</span>;
  if (score >= 50) return <span style={badge("#000", C.amber)}>URGENT</span>;
  return <span style={badge(C.textDim, C.surface2)}>STANDARD</span>;
}

function BarChart({ data, maxVal, barColor = C.accent, height = 120, label }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>{fmt(d.value, 1)}</div>
            <div style={{
              width: "100%", maxWidth: 40,
              height: Math.max(4, (d.value / max) * (height - 30)),
              background: typeof barColor === "function" ? barColor(d) : barColor,
              borderRadius: "4px 4px 0 0",
              transition: "height 0.3s",
            }} />
            <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, textAlign: "center", wordBreak: "break-word" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTable({ headers, rows, compact }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 11 : 12 }}>
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} style={{ textAlign: "left", padding: compact ? "6px 8px" : "8px 10px", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${C.border}22` }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: compact ? "6px 8px" : "8px 10px", color: C.text, whiteSpace: "nowrap" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN TABS ────────────────────────────────────────────────────────

function OrdersPanel({ orders }) {
  const sorted = useMemo(() =>
    [...orders].map(o => ({ ...o, priority: calcPriorityScore(o, orders), margin: calcMargin(o), daysLeft: daysBetween(o.deliveryDate), rawNeeded: o.qty / TOTAL_YIELD }))
      .sort((a, b) => b.priority.total - a.priority.total),
    [orders]
  );
  const totalDemand = orders.reduce((s, o) => s + o.qty, 0);
  const totalRaw = totalDemand / TOTAL_YIELD;
  const destData = {};
  orders.forEach(o => { destData[o.dest] = (destData[o.dest] || 0) + o.qty; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Active Orders" value={orders.length} sub="In pipeline" />
        <MetricCard label="Total Demand" value={`${fmt(totalDemand, 1)} MT`} sub="Finished product" color={C.green} />
        <MetricCard label="Raw Material Req." value={`${fmt(totalRaw, 1)} MT`} sub="@ 79.7% yield" color={C.amber} />
        <MetricCard label="Revenue Pipeline" value={fmtINR(orders.reduce((s, o) => s + o.qty * o.sellingPrice, 0))} sub="If all fulfilled" color={C.purple} />
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Order Priority Queue</div>
        <MiniTable
          headers={["#", "Order", "Customer", "Dest", "Grade", "Qty MT", "Days Left", "Margin/MT", "Priority", "Score"]}
          rows={sorted.map((o, i) => [
            <span style={{ color: C.textMuted }}>{i + 1}</span>,
            <span style={{ fontFamily: "monospace", color: C.cyan }}>{o.id}</span>,
            o.customer,
            o.dest,
            <span style={badge(C.text, C.surface2)}>{o.species} {o.grade}</span>,
            fmt(o.qty, 1),
            <span style={{ color: o.daysLeft <= 7 ? C.red : o.daysLeft <= 10 ? C.amber : C.green, fontWeight: 600 }}>{o.daysLeft}d</span>,
            <span style={{ color: o.margin > 200000 ? C.green : o.margin > 100000 ? C.amber : C.red }}>{fmtINR(o.margin)}</span>,
            <PriorityBadge score={o.priority.total} />,
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.accent }}>{o.priority.total}</span>,
          ])}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={baseCard}>
          <BarChart label="Demand by Destination (MT)" data={Object.entries(destData).map(([k, v]) => ({ label: k, value: v }))} barColor={C.accent} />
        </div>
        <div style={baseCard}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Priority Score Breakdown (Top Order)</div>
          {sorted[0] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Delivery Urgency (40%)", val: sorted[0].priority.urgency, color: C.red },
                { label: "Margin Score (30%)", val: sorted[0].priority.marginScore, color: C.green },
                { label: "Customer Tier (20%)", val: sorted[0].priority.customerScore, color: C.purple },
                { label: "Stock Available (10%)", val: sorted[0].priority.stockScore, color: C.cyan },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textDim, marginBottom: 3 }}>
                    <span>{label}</span><span style={{ color }}>{val}/100</span>
                  </div>
                  <div style={{ height: 6, background: C.surface2, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: "8px 12px", background: C.surface2, borderRadius: 6, fontSize: 13, color: C.accent, fontWeight: 700, textAlign: "center" }}>
                Total: {sorted[0].priority.total}/100 — {sorted[0].id} ({sorted[0].customer})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InventoryPanel({ orders }) {
  const speciesNeeds = {};
  orders.forEach(o => {
    if (!speciesNeeds[o.species]) speciesNeeds[o.species] = 0;
    speciesNeeds[o.species] += o.qty / TOTAL_YIELD;
  });

  const rows = Object.entries(INITIAL_INVENTORY).map(([species, inv]) => {
    const available = inv.inStock - inv.committed;
    const required = speciesNeeds[species] || 0;
    const shortfall = Math.max(0, required - available);
    const purchaseNeeded = shortfall * 1.15;
    const cost = purchaseNeeded * inv.pricePerMT;
    return { species, ...inv, available, required, shortfall, purchaseNeeded, cost };
  });

  const totalCost = rows.reduce((s, r) => s + r.cost, 0);

  // Projected inventory (14 day)
  const dailyCapacity = 6.8;
  const projData = [];
  let stock = rows.reduce((s, r) => s + r.inStock, 0);
  for (let d = 0; d <= 14; d++) {
    projData.push({ day: d, stock: Math.max(0, stock) });
    stock -= dailyCapacity * TOTAL_YIELD;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Total In Stock" value={`${fmt(rows.reduce((s, r) => s + r.inStock, 0), 1)} MT`} color={C.green} />
        <MetricCard label="Total Committed" value={`${fmt(rows.reduce((s, r) => s + r.committed, 0), 1)} MT`} color={C.amber} />
        <MetricCard label="Total Shortfall" value={`${fmt(rows.reduce((s, r) => s + r.shortfall, 0), 1)} MT`} color={C.red} />
        <MetricCard label="Procurement Cost" value={fmtINR(totalCost)} sub="With 15% buffer" color={C.purple} />
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Raw Material Status</div>
        <MiniTable
          headers={["Species", "In Stock", "Committed", "Available", "Required", "Shortfall", "Purchase (15% buf)", "Est. Cost"]}
          rows={rows.map(r => [
            <span style={{ fontWeight: 600, color: C.text }}>{r.species}</span>,
            `${fmt(r.inStock, 1)} MT`,
            `${fmt(r.committed, 1)} MT`,
            <span style={{ color: C.cyan }}>{fmt(r.available, 1)} MT</span>,
            `${fmt(r.required, 1)} MT`,
            <span style={{ color: r.shortfall > 0 ? C.red : C.green, fontWeight: 600 }}>
              {r.shortfall > 0 ? `${fmt(r.shortfall, 1)} MT` : "—"}
            </span>,
            r.purchaseNeeded > 0 ? `${fmt(r.purchaseNeeded, 1)} MT` : "—",
            r.cost > 0 ? fmtINR(r.cost) : "—",
          ])}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={baseCard}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>14-Day Stock Projection</div>
          <div style={{ position: "relative", height: 140 }}>
            <svg viewBox="0 0 300 120" style={{ width: "100%", height: "100%" }}>
              <line x1="0" y1="10" x2="300" y2="10" stroke={C.red} strokeDasharray="4" strokeWidth="1" opacity="0.5" />
              <text x="302" y="14" fill={C.red} fontSize="8">50 MT cap</text>
              {projData.map((p, i) => {
                if (i === 0) return null;
                const prev = projData[i - 1];
                const maxStock = 30;
                return (
                  <line key={i}
                    x1={(i - 1) / 14 * 290 + 5} y1={110 - (prev.stock / maxStock) * 95}
                    x2={i / 14 * 290 + 5} y2={110 - (p.stock / maxStock) * 95}
                    stroke={p.stock <= 0 ? C.red : C.accent} strokeWidth="2"
                  />
                );
              })}
              {projData.filter((_, i) => i % 2 === 0).map((p, i) => (
                <text key={i} x={p.day / 14 * 290 + 5} y="118" fill={C.textMuted} fontSize="7" textAnchor="middle">D{p.day}</text>
              ))}
            </svg>
          </div>
        </div>

        <div style={baseCard}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Supplier Suggestions</div>
          {rows.filter(r => r.shortfall > 0).map(r => {
            const suppliers = SUPPLIERS.filter(s => s.species === r.species);
            return (
              <div key={r.species} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 6 }}>{r.species} — Need {fmt(r.purchaseNeeded, 1)} MT</div>
                {suppliers.map(sup => {
                  const bestGradeMatch = Object.entries(sup.gradeProfile).sort((a, b) => b[1] - a[1])[0];
                  return (
                    <div key={sup.id} style={{ padding: "6px 10px", background: C.surface2, borderRadius: 6, marginBottom: 4, fontSize: 11 }}>
                      <div style={{ color: C.text, fontWeight: 600 }}>{sup.name}</div>
                      <div style={{ color: C.textDim }}>Lead: {sup.leadDays}d · Best grade: {bestGradeMatch[0]} ({(bestGradeMatch[1] * 100).toFixed(0)}%) · {fmtINR(sup.pricePerMT)}/MT</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {rows.every(r => r.shortfall === 0) && <div style={{ color: C.green, fontSize: 12 }}>All stock sufficient</div>}
        </div>
      </div>
    </div>
  );
}

function CapacityPanel({ orders }) {
  const machineData = MACHINES.map(m => {
    const net = machineNetCapacity(m);
    return { ...m, netCapacity: net };
  });
  const bottleneckIdx = machineData.reduce((minI, m, i, arr) => m.netCapacity < arr[minI].netCapacity ? i : minI, 0);
  const effectiveCapacity = 8 * 0.85; // 6.8 from global params

  // 7-day production plan
  const totalRaw = orders.reduce((s, o) => s + o.qty / TOTAL_YIELD, 0);
  const daysNeeded = Math.ceil(totalRaw / effectiveCapacity);
  const plan = [];
  let remaining = totalRaw;
  let cumulative = 0;
  for (let d = 1; d <= 7; d++) {
    const planned = Math.min(effectiveCapacity, remaining);
    remaining = Math.max(0, remaining - planned);
    cumulative += planned * TOTAL_YIELD;
    const util = (planned / effectiveCapacity) * 100;
    plan.push({ day: d, planned, utilization: util, cumulative, remaining });
  }

  // Yield flow
  const sampleInput = 10;
  const yieldChain = calcYieldChain(sampleInput);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {machineData.map((m, i) => (
          <div key={m.id} style={{
            ...baseCard, flex: 1, minWidth: 160, padding: 14,
            borderColor: i === bottleneckIdx ? C.amber : C.border,
            borderWidth: i === bottleneckIdx ? 2 : 1,
          }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "monospace", margin: "4px 0" }}>{fmt(m.netCapacity, 1)}</div>
            <div style={{ fontSize: 10, color: C.textDim }}>MT/day net · {m.count}× · {(m.downtime * 100).toFixed(0)}% down</div>
            {i === bottleneckIdx && <div style={{ ...badge("#000", C.amber), marginTop: 6, fontSize: 9 }}>⚠ BOTTLENECK</div>}
          </div>
        ))}
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>7-Day Production Plan</div>
        <MiniTable
          headers={["Day", "Planned (MT)", "Utilization", "Cumulative Output (MT)", "Remaining (MT)"]}
          rows={plan.map(p => [
            `Day ${p.day}`,
            fmt(p.planned, 2),
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 80, height: 8, background: C.surface2, borderRadius: 4 }}>
                <div style={{ height: "100%", width: `${Math.min(100, p.utilization)}%`, background: p.utilization > 95 ? C.red : p.utilization > 80 ? C.amber : C.green, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 10, color: p.utilization > 95 ? C.red : C.textDim }}>{fmt(p.utilization, 0)}%</span>
            </div>,
            fmt(p.cumulative, 2),
            <span style={{ color: p.remaining > 0 ? C.amber : C.green }}>{fmt(p.remaining, 2)}</span>,
          ])}
        />
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Production Stage Yield Flow (per 10 MT input)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          <div style={{ padding: "10px 14px", background: C.surface2, borderRadius: 8, textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: 10, color: C.textMuted }}>RAW INPUT</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, fontFamily: "monospace" }}>{fmt(sampleInput, 1)}</div>
            <div style={{ fontSize: 9, color: C.textDim }}>MT</div>
          </div>
          {yieldChain.steps.map((step, i) => (
            <div key={step.stage} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 30, textAlign: "center" }}>
                <div style={{ fontSize: 16, color: C.textMuted }}>→</div>
                <div style={{ fontSize: 8, color: YIELD_CHAIN[step.stage].yield > 1 ? C.green : C.red }}>
                  {YIELD_CHAIN[step.stage].yield > 1 ? "+" : ""}{((YIELD_CHAIN[step.stage].yield - 1) * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: "10px 14px", background: STAGE_COLORS[step.stage] + "15", border: `1px solid ${STAGE_COLORS[step.stage]}33`, borderRadius: 8, textAlign: "center", minWidth: 90 }}>
                <div style={{ fontSize: 10, color: STAGE_COLORS[step.stage], fontWeight: 600, textTransform: "uppercase" }}>{YIELD_CHAIN[step.stage].label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>{fmt(step.output, 2)}</div>
                <div style={{ fontSize: 8, color: C.textDim }}>{YIELD_CHAIN[step.stage].loss}</div>
              </div>
            </div>
          ))}
          <div style={{ width: 30, textAlign: "center" }}>
            <div style={{ fontSize: 16, color: C.textMuted }}>→</div>
          </div>
          <div style={{ padding: "10px 14px", background: C.green + "15", border: `1px solid ${C.green}33`, borderRadius: 8, textAlign: "center", minWidth: 80 }}>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>FINISHED</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{fmt(yieldChain.finalOutput, 2)}</div>
            <div style={{ fontSize: 9, color: C.textDim }}>{(TOTAL_YIELD * 100).toFixed(1)}% yield</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkforcePanel() {
  const totalWorkers = 45;
  const shiftHours = 16;

  const stageAlloc = STAGES.map(s => {
    const sampleInputKg = 6800; // daily effective capacity in kg
    const efficiency = EFFICIENCY_PER_STAGE[s];
    const required = Math.ceil(sampleInputKg / (efficiency * shiftHours));
    const allocated = s === "cleaning" ? 8 : s === "cooking" ? 12 : s === "glazing" ? 10 : 8;
    const duration = sampleInputKg / (allocated * efficiency);
    return { stage: s, required, allocated, duration, efficiency };
  });

  const totalAllocated = stageAlloc.reduce((s, a) => s + a.allocated, 0);
  const unallocated = totalWorkers - totalAllocated;

  const ROSTER = [
    { name: "Rajan K", role: "Cleaning Lead", shift: "Morning", efficiency: 1.3, status: "Active", batch: "BAT-001" },
    { name: "Priya M", role: "Cooking Operator", shift: "Morning", efficiency: 1.1, status: "Active", batch: "BAT-001" },
    { name: "Suresh V", role: "Glazing Tech", shift: "Evening", efficiency: 1.0, status: "Standby", batch: "—" },
    { name: "Lakshmi R", role: "Packing Lead", shift: "Morning", efficiency: 1.2, status: "Active", batch: "BAT-002" },
    { name: "Mohan D", role: "QC Inspector", shift: "Morning", efficiency: 1.15, status: "Active", batch: "BAT-003" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Total Workers" value={totalWorkers} color={C.accent} />
        <MetricCard label="Allocated" value={totalAllocated} sub={`${unallocated} unallocated`} color={unallocated >= 0 ? C.green : C.red} />
        <MetricCard label="Morning Shift" value="24" color={C.cyan} />
        <MetricCard label="Evening Shift" value="21" color={C.purple} />
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Stage Allocation & Coverage</div>
        <MiniTable
          headers={["Stage", "Workers Req.", "Allocated", "Coverage", "Efficiency (kg/hr)", "Est. Duration (hrs)"]}
          rows={stageAlloc.map(a => [
            <span style={{ color: STAGE_COLORS[a.stage], fontWeight: 600, textTransform: "capitalize" }}>{a.stage}</span>,
            a.required,
            a.allocated,
            a.allocated >= a.required
              ? <span style={badge(C.green, C.greenDim)}>✓ Sufficient</span>
              : <span style={badge(C.red, C.redDim)}>Short by {a.required - a.allocated}</span>,
            a.efficiency,
            fmt(a.duration, 1),
          ])}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={baseCard}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Skills Radar</div>
          <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 220, margin: "0 auto", display: "block" }}>
            {/* Pentagon grid */}
            {[1, 0.75, 0.5, 0.25].map(scale => {
              const pts = [0, 1, 2, 3, 4].map(i => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return `${100 + Math.cos(angle) * 80 * scale},${100 + Math.sin(angle) * 80 * scale}`;
              }).join(" ");
              return <polygon key={scale} points={pts} fill="none" stroke={C.border} strokeWidth="0.5" />;
            })}
            {/* Available (blue) */}
            <polygon
              points={[0.9, 0.75, 0.85, 0.8, 0.7].map((v, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return `${100 + Math.cos(angle) * 80 * v},${100 + Math.sin(angle) * 80 * v}`;
              }).join(" ")}
              fill={C.accent + "30"} stroke={C.accent} strokeWidth="1.5"
            />
            {/* Required (orange) */}
            <polygon
              points={[0.8, 0.85, 0.7, 0.9, 0.6].map((v, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return `${100 + Math.cos(angle) * 80 * v},${100 + Math.sin(angle) * 80 * v}`;
              }).join(" ")}
              fill={C.amber + "25"} stroke={C.amber} strokeWidth="1.5"
            />
            {/* Labels */}
            {["Cleaning", "Peeling", "Freezing", "Packing", "QC"].map((label, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return <text key={label} x={100 + Math.cos(angle) * 95} y={100 + Math.sin(angle) * 95} fill={C.textDim} fontSize="8" textAnchor="middle" dominantBaseline="middle">{label}</text>;
            })}
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, background: C.accent, borderRadius: 2 }} /><span style={{ fontSize: 10, color: C.textDim }}>Available</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, background: C.amber, borderRadius: 2 }} /><span style={{ fontSize: 10, color: C.textDim }}>Required</span></div>
          </div>
        </div>

        <div style={baseCard}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Employee Roster (Sample)</div>
          <MiniTable compact
            headers={["Name", "Role", "Shift", "Eff.", "Status", "Batch"]}
            rows={ROSTER.map(e => [
              e.name,
              e.role,
              <span style={{ color: e.shift === "Morning" ? C.cyan : C.purple }}>{e.shift}</span>,
              <span style={{ fontFamily: "monospace", color: e.efficiency >= 1.2 ? C.green : C.text }}>{e.efficiency}×</span>,
              <span style={badge(e.status === "Active" ? C.green : C.textMuted, e.status === "Active" ? C.greenDim : C.surface2)}>{e.status}</span>,
              <span style={{ fontFamily: "monospace", color: C.cyan }}>{e.batch}</span>,
            ])}
          />
        </div>
      </div>
    </div>
  );
}

function BatchPanel({ batches, onAdvance }) {
  const statusCounts = { scheduled: 0, active: 0, completed: 0 };
  batches.forEach(b => {
    if (b.currentStage === "scheduled") statusCounts.scheduled++;
    else if (b.currentStage === "completed") statusCounts.completed++;
    else statusCounts.active++;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Total Batches" value={batches.length} color={C.accent} />
        <MetricCard label="In Progress" value={statusCounts.active} color={C.green} />
        <MetricCard label="Scheduled" value={statusCounts.scheduled} color={C.amber} />
        <MetricCard label="Completed" value={statusCounts.completed} color={C.textMuted} />
      </div>

      {/* Gantt */}
      <div style={baseCard}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Production Timeline (Gantt)</div>
        <div style={{ position: "relative" }}>
          {/* Time axis */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, paddingLeft: 80 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} style={{ fontSize: 9, color: C.textMuted }}>{String(6 + i * 2).padStart(2, "0")}:00</span>
            ))}
          </div>
          {batches.map(batch => {
            const stageIdx = STAGES.indexOf(batch.currentStage);
            const startHour = parseInt((batch.stageStartTime || "06:00").split(":")[0]) - 6;
            return (
              <div key={batch.id} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 75, fontSize: 11, color: C.cyan, fontFamily: "monospace" }}>{batch.id}</div>
                <div style={{ flex: 1, position: "relative", height: 20, background: C.surface2, borderRadius: 4 }}>
                  {STAGES.map((s, i) => {
                    if (batch.stages[s] === "pending" && batch.currentStage === "scheduled") return null;
                    const isDone = batch.stages[s] === "done";
                    const isActive = batch.stages[s] === "active";
                    if (!isDone && !isActive) return null;
                    const left = `${(startHour + i * 3) / 16 * 100}%`;
                    const width = `${3 / 16 * 100}%`;
                    return (
                      <div key={s} style={{
                        position: "absolute", left, width, height: "100%",
                        background: isActive ? STAGE_COLORS[s] : STAGE_COLORS[s] + "66",
                        borderRadius: 3,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, color: "#fff", fontWeight: 600, textTransform: "uppercase",
                      }}>
                        {s.slice(0, 4)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {batches.map(batch => {
          const chain = calcYieldChain(batch.inputMT);
          const currentStageIdx = STAGES.indexOf(batch.currentStage);
          const canAdvance = batch.currentStage !== "completed" && batch.currentStage !== "scheduled" && currentStageIdx < STAGES.length - 1;
          const isLastStage = currentStageIdx === STAGES.length - 1;

          return (
            <div key={batch.id} style={{ ...baseCard, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: C.cyan }}>{batch.id}</span>
                  <span style={{ fontSize: 11, color: C.textDim, marginLeft: 8 }}>→ {batch.orderId}</span>
                </div>
                <ProgressDots stages={batch.stages} currentStage={batch.currentStage} />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 11 }}>
                <span style={{ color: C.textDim }}>Input: <span style={{ color: C.text, fontWeight: 600 }}>{fmt(batch.inputMT, 2)} MT</span></span>
                <span style={{ color: C.textDim }}>Output: <span style={{ color: C.green, fontWeight: 600 }}>{fmt(chain.finalOutput, 2)} MT</span></span>
              </div>

              {/* Stage yield mini table */}
              <div style={{ fontSize: 10, marginBottom: 10 }}>
                {chain.steps.map((step, i) => (
                  <div key={step.stage} style={{
                    display: "flex", justifyContent: "space-between", padding: "3px 6px",
                    background: batch.stages[step.stage] === "active" ? STAGE_COLORS[step.stage] + "15" : "transparent",
                    borderRadius: 4, marginBottom: 2,
                  }}>
                    <span style={{ color: STAGE_COLORS[step.stage], textTransform: "capitalize", fontWeight: 500 }}>{step.stage}</span>
                    <span style={{ color: C.textDim }}>{fmt(step.input, 2)} → {fmt(step.output, 2)} MT</span>
                  </div>
                ))}
              </div>

              {(canAdvance || isLastStage) && (
                <button
                  onClick={() => onAdvance(batch.id)}
                  style={{
                    width: "100%", padding: "7px 0", border: "none", borderRadius: 6,
                    background: isLastStage ? C.green : C.accent, color: "#fff",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.target.style.opacity = "0.8"}
                  onMouseLeave={e => e.target.style.opacity = "1"}
                >
                  {isLastStage ? "✓ Complete Batch" : `Advance → ${YIELD_CHAIN[STAGES[currentStageIdx + 1]]?.label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertsPanel({ orders, batches }) {
  const alerts = [];
  const effectiveCapacity = 6.8;

  // Delivery at risk
  orders.forEach(o => {
    const daysLeft = daysBetween(o.deliveryDate);
    const rawNeeded = o.qty / TOTAL_YIELD;
    const prodDays = rawNeeded / effectiveCapacity;
    if (daysLeft < prodDays + 2) {
      alerts.push({ type: "critical", icon: "🚨", title: `Delivery at risk: ${o.id}`, desc: `${o.customer} — ${daysLeft} days left, needs ${fmt(prodDays + 2, 1)} days (incl. cold chain buffer)` });
    }
  });

  // Inventory shortfall
  const totalBTNeeded = orders.filter(o => o.species === "Black Tiger").reduce((s, o) => s + o.qty / TOTAL_YIELD, 0);
  const btAvail = INITIAL_INVENTORY["Black Tiger"].inStock - INITIAL_INVENTORY["Black Tiger"].committed;
  if (totalBTNeeded > btAvail) {
    alerts.push({ type: "critical", icon: "📦", title: "Raw material shortfall: Black Tiger", desc: `Need ${fmt(totalBTNeeded, 1)} MT, available ${fmt(btAvail, 1)} MT. Shortfall: ${fmt(totalBTNeeded - btAvail, 1)} MT` });
  }

  // Bottleneck
  const minMachine = MACHINES.reduce((min, m) => machineNetCapacity(m) < machineNetCapacity(min) ? m : min);
  alerts.push({ type: "warning", icon: "⚙️", title: `Bottleneck: ${minMachine.name}`, desc: `Net capacity ${fmt(machineNetCapacity(minMachine), 1)} MT/day — constrains entire line` });

  // Cold storage
  const totalStock = Object.values(INITIAL_INVENTORY).reduce((s, v) => s + v.inStock, 0);
  if (totalStock > 40) {
    alerts.push({ type: "warning", icon: "❄️", title: "Cold storage utilization high", desc: `${fmt(totalStock, 1)}/50 MT (${fmt(totalStock / 50 * 100, 0)}%) — plan dispatches to free space` });
  }

  // Batch delays
  batches.forEach(b => {
    if (b.currentStage !== "scheduled" && b.currentStage !== "completed") {
      alerts.push({ type: "info", icon: "🔄", title: `${b.id} in ${b.currentStage}`, desc: `Started at ${b.stageStartTime} — monitor for delays` });
    }
  });

  const typeColors = { critical: C.red, warning: C.amber, info: C.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Critical" value={alerts.filter(a => a.type === "critical").length} color={C.red} />
        <MetricCard label="Warnings" value={alerts.filter(a => a.type === "warning").length} color={C.amber} />
        <MetricCard label="Info" value={alerts.filter(a => a.type === "info").length} color={C.accent} />
      </div>

      {alerts.map((alert, i) => (
        <div key={i} style={{
          ...baseCard, padding: 14,
          borderLeft: `4px solid ${typeColors[alert.type]}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span>{alert.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{alert.title}</span>
            <span style={{ ...badge(typeColors[alert.type], typeColors[alert.type] + "22"), marginLeft: "auto", textTransform: "uppercase" }}>{alert.type}</span>
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginLeft: 26 }}>{alert.desc}</div>
        </div>
      ))}
    </div>
  );
}

function SystemDesignPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={baseCard}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Django + React Architecture</div>
        <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 12px" }}>This dashboard is the interactive specification for the production planning module. Below is the recommended Django backend architecture that integrates with your existing ERP (Order Management, Inventory, Purchase, and Project Management modules).</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Django Models */}
          <div style={{ background: C.surface2, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Django Models</div>
            {[
              { name: "PrawnGrade", fields: "code, yield_multiplier, price_multiplier" },
              { name: "ProductionBatch", fields: "order(FK), input_mt, current_stage, start_time" },
              { name: "StageExecution", fields: "batch(FK), stage, input_wt, output_wt, start, end, workers" },
              { name: "MachineConfig", fields: "name, stage, raw_capacity, count, downtime_pct" },
              { name: "YieldChain", fields: "stage, yield_pct, loss_desc" },
              { name: "SupplierGradeProfile", fields: "supplier(FK), grade(FK), expected_pct" },
              { name: "WorkforceAllocation", fields: "employee(FK), batch(FK), stage, shift" },
              { name: "Alert", fields: "type, severity, title, message, resolved" },
            ].map(m => (
              <div key={m.name} style={{ marginBottom: 8, padding: "6px 10px", background: C.surface, borderRadius: 6, borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</div>
                <div style={{ fontSize: 10, color: C.textDim, fontFamily: "monospace" }}>{m.fields}</div>
              </div>
            ))}
          </div>

          {/* API Endpoints */}
          <div style={{ background: C.surface2, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>REST API Endpoints</div>
            {[
              { method: "GET", path: "/api/orders/priority-queue/", desc: "Orders ranked by priority score" },
              { method: "GET", path: "/api/inventory/status/", desc: "Stock levels with shortfall calculations" },
              { method: "GET", path: "/api/capacity/plan/", desc: "7-day production plan with utilization" },
              { method: "POST", path: "/api/batches/{id}/advance/", desc: "Advance batch to next stage" },
              { method: "GET", path: "/api/workforce/coverage/", desc: "Stage allocation and coverage" },
              { method: "GET", path: "/api/alerts/active/", desc: "Current alerts by severity" },
              { method: "POST", path: "/api/procurement/suggest/", desc: "Supplier suggestions for shortfall" },
              { method: "GET", path: "/api/yield/simulate/", desc: "Yield chain simulation" },
            ].map(ep => (
              <div key={ep.path} style={{ marginBottom: 8, padding: "6px 10px", background: C.surface, borderRadius: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ ...badge(ep.method === "GET" ? C.green : C.amber, ep.method === "GET" ? C.greenDim : C.amberDim), fontSize: 9, fontFamily: "monospace" }}>{ep.method}</span>
                  <span style={{ fontSize: 11, color: C.cyan, fontFamily: "monospace" }}>{ep.path}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{ep.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>ERP Integration Points</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { module: "Order Mgmt", integration: "Orders sync → priority queue calculation. Order status updates trigger batch scheduling.", color: C.accent },
            { module: "Inventory", integration: "Stock levels feed Available calc. Batch completion updates finished goods. Cold storage alerts.", color: C.green },
            { module: "Purchase", integration: "Shortfall triggers PR generation. Supplier grade profiles inform PO quantities.", color: C.amber },
            { module: "Project Mgmt", integration: "Process templates map to yield chain. Batch stages = project tasks with time tracking.", color: C.purple },
          ].map(m => (
            <div key={m.module} style={{ background: C.surface2, borderRadius: 8, padding: 14, borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: m.color, marginBottom: 6 }}>{m.module}</div>
              <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>{m.integration}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={baseCard}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Key Business Rules Engine</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { group: "A: Capacity", rules: ["Effective capacity = Machine × OEE", "Bottleneck = min(stage capacities)", "Utilization % with RAG thresholds"], color: C.accent },
            { group: "B: Yield Chain", rules: ["4-stage yield: 92% → 85% → 103% → 99%", "Total yield: 79.74%", "Grade multiplier adjusts per prawn size"], color: C.green },
            { group: "C: Inventory", rules: ["Available = InStock − Committed", "Purchase = Shortfall × 1.15 buffer", "Cold storage overflow alerts"], color: C.amber },
            { group: "D: Workforce", rules: ["Workers = ceil(input_kg / eff / hours)", "Duration = input / (workers × efficiency)", "Coverage: sufficient / short / overstaffed"], color: C.purple },
            { group: "E: Batch Tracking", rules: ["Stage progression with timestamps", "Delay = elapsed > estimated × 1.15", "Inventory auto-deduct on completion"], color: C.cyan },
            { group: "F: Alerts", rules: ["Delivery risk: days < production time", "PO lead time warnings", "Threshold-based auto-generation"], color: C.red },
          ].map(g => (
            <div key={g.group} style={{ background: C.surface2, borderRadius: 8, padding: 14, borderLeft: `3px solid ${g.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: g.color, marginBottom: 8 }}>{g.group}</div>
              {g.rules.map((r, i) => (
                <div key={i} style={{ fontSize: 10, color: C.textDim, padding: "3px 0", display: "flex", gap: 6 }}>
                  <span style={{ color: g.color }}>›</span> {r}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────

const TABS = [
  { id: "orders", label: "Orders", icon: "📋" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "capacity", label: "Capacity", icon: "⚙️" },
  { id: "workforce", label: "Workforce", icon: "👷" },
  { id: "batches", label: "Batches", icon: "🔄" },
  { id: "alerts", label: "Alerts", icon: "🚨" },
  { id: "design", label: "System Design", icon: "🏗️" },
];

export default function PrawnProductionPlanner() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders] = useState(INITIAL_ORDERS);
  const [batches, setBatches] = useState(INITIAL_BATCHES);

  const handleAdvance = useCallback((batchId) => {
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      const currentIdx = STAGES.indexOf(b.currentStage);
      if (currentIdx < 0) return b;

      const newStages = { ...b.stages };
      newStages[b.currentStage] = "done";

      if (currentIdx < STAGES.length - 1) {
        const nextStage = STAGES[currentIdx + 1];
        newStages[nextStage] = "active";
        return { ...b, stages: newStages, currentStage: nextStage, stageStartTime: new Date().toTimeString().slice(0, 5) };
      } else {
        return { ...b, stages: newStages, currentStage: "completed" };
      }
    }));
  }, []);

  const globalParams = {
    machineCapacity: 8, oee: 85, effectiveCapacity: 6.8,
    shiftHours: 16, coldStorage: 50, bufferStock: 15,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>
            <span style={{ color: C.accent }}>🦐</span> Prawn Export Production Planner
          </h1>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>₹100 Cr/yr Target · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          {[
            { label: "Machine Cap", value: `${globalParams.machineCapacity} MT` },
            { label: "OEE", value: `${globalParams.oee}%` },
            { label: "Effective", value: `${globalParams.effectiveCapacity} MT/d`, color: C.green },
            { label: "Shifts", value: `${globalParams.shiftHours}h` },
            { label: "Cold Store", value: `${globalParams.coldStorage} MT` },
            { label: "Buffer", value: `${globalParams.bufferStock}%` },
          ].map(p => (
            <div key={p.label} style={{ textAlign: "center" }}>
              <div style={{ color: C.textMuted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.label}</div>
              <div style={{ color: p.color || C.text, fontWeight: 600, fontFamily: "monospace" }}>{p.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: 2, padding: "0 24px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 16px", border: "none", background: "transparent",
            color: activeTab === tab.id ? C.accent : C.textDim,
            borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "orders" && <OrdersPanel orders={orders} />}
        {activeTab === "inventory" && <InventoryPanel orders={orders} />}
        {activeTab === "capacity" && <CapacityPanel orders={orders} />}
        {activeTab === "workforce" && <WorkforcePanel />}
        {activeTab === "batches" && <BatchPanel batches={batches} onAdvance={handleAdvance} />}
        {activeTab === "alerts" && <AlertsPanel orders={orders} batches={batches} />}
        {activeTab === "design" && <SystemDesignPanel />}
      </div>
    </div>
  );
}
