import { useState, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   v3 SAMPLE DATA — mirrors API responses from:
   /api/planning/orders/priority-queue/
   /api/planning/inventory/status/
   /api/planning/capacity/plan/
   /api/planning/engine/report/
   /api/planning/batches/
   /api/planning/alerts/active/
   ═══════════════════════════════════════════════════════════════════════ */

const ORDERS = [
  { id: "o1", ref: "ORD-001", customer: "Nippon Suisan", dest: "Japan", product: "IQF-CKD", productName: "IQF Cooked 1kg", grade: "20/25", qty: 4.5, price: 850000, delivery: "2026-05-12", tier: "TIER_2", remaining: 4.5, fulfilled: 0, yieldPct: 78.5, score: 82, label: "CRITICAL", urgency: 60, margin: 72, custScore: 75, stockScore: 100, daysLeft: 8, estDays: 0.8, canStart: true, stockAvail: 5.2, rawNeeded: 5.73 },
  { id: "o2", ref: "ORD-002", customer: "Thai Union", dest: "Thailand", product: "RAW-BLK", productName: "Raw Block 2kg", grade: "26/30", qty: 3.2, price: 620000, delivery: "2026-05-15", tier: "TIER_2", remaining: 3.2, fulfilled: 0, yieldPct: 94.8, score: 64, label: "URGENT", urgency: 45, margin: 55, custScore: 75, stockScore: 100, daysLeft: 11, estDays: 0.5, canStart: true, stockAvail: 2.5, rawNeeded: 3.38 },
  { id: "o3", ref: "ORD-003", customer: "Maruha Nichiro", dest: "Japan", product: "IQF-CKD", productName: "IQF Cooked 1kg", grade: "16/20", qty: 5.0, price: 920000, delivery: "2026-05-13", tier: "TIER_2", remaining: 5.0, fulfilled: 0, yieldPct: 78.5, score: 76, label: "CRITICAL", urgency: 55, margin: 85, custScore: 75, stockScore: 100, daysLeft: 9, estDays: 0.9, canStart: true, stockAvail: 3.8, rawNeeded: 6.37 },
  { id: "o4", ref: "ORD-004", customer: "Red Lobster", dest: "USA", product: "PD-RAW", productName: "PD Raw IQF", grade: "20/25", qty: 6.0, price: 780000, delivery: "2026-05-18", tier: "TIER_3", remaining: 6.0, fulfilled: 0, yieldPct: 84.8, score: 45, label: "STANDARD", urgency: 30, margin: 48, custScore: 50, stockScore: 100, daysLeft: 14, estDays: 1.0, canStart: true, stockAvail: 5.2, rawNeeded: 7.08 },
  { id: "o5", ref: "ORD-005", customer: "Sysco EU", dest: "Germany", product: "RAW-BLK", productName: "Raw Block 2kg", grade: "31/40", qty: 3.8, price: 540000, delivery: "2026-05-21", tier: "TIER_3", remaining: 3.8, fulfilled: 0, yieldPct: 94.8, score: 38, label: "STANDARD", urgency: 15, margin: 30, custScore: 50, stockScore: 0, daysLeft: 17, estDays: 0.6, canStart: false, stockAvail: 0, rawNeeded: 4.01 },
  { id: "o6", ref: "ORD-006", customer: "Clearwater", dest: "Canada", product: "WHL-CKD", productName: "Whole Cooked", grade: "13/15", qty: 2.5, price: 1050000, delivery: "2026-05-16", tier: "TIER_2", remaining: 2.5, fulfilled: 0, yieldPct: 83.5, score: 58, label: "URGENT", urgency: 40, margin: 90, custScore: 75, stockScore: 0, daysLeft: 12, estDays: 0.4, canStart: false, stockAvail: 0, rawNeeded: 2.99 },
];

const INVENTORY = [
  { grade: "8/12", species: "Black Tiger", inStock: 0.8, committed: 0, available: 0.8, required: 0, shortfall: 0, purchase: 0, price: 777000, cost: 0, orders: 0 },
  { grade: "13/15", species: "Black Tiger", inStock: 0, committed: 0, available: 0, required: 2.5, shortfall: 2.5, purchase: 2.88, price: 693000, cost: 1995840, orders: 1 },
  { grade: "16/20", species: "Black Tiger", inStock: 3.8, committed: 0, available: 3.8, required: 5.0, shortfall: 1.2, purchase: 1.38, price: 630000, cost: 869400, orders: 1 },
  { grade: "20/25", species: "Black Tiger", inStock: 5.2, committed: 0, available: 5.2, required: 10.5, shortfall: 5.3, purchase: 6.1, price: 588000, cost: 3586800, orders: 2 },
  { grade: "26/30", species: "Vannamei", inStock: 2.5, committed: 0, available: 2.5, required: 3.2, shortfall: 0.7, purchase: 0.81, price: 356500, cost: 288765, orders: 1 },
  { grade: "31/40", species: "Vannamei", inStock: 0, committed: 0, available: 0, required: 3.8, shortfall: 3.8, purchase: 4.37, price: 310000, cost: 1354700, orders: 1 },
];

const CAPACITY_PLAN = [
  { day: 1, date: "2026-05-04", planned: 6.5, capacity: 6.8, util: 95.6, status: "RED", cumOut: 5.18, batches: 3 },
  { day: 2, date: "2026-05-05", planned: 6.8, capacity: 6.8, util: 100, status: "RED", cumOut: 10.60, batches: 3 },
  { day: 3, date: "2026-05-06", planned: 5.2, capacity: 6.8, util: 76.5, status: "GREEN", cumOut: 14.74, batches: 2 },
  { day: 4, date: "2026-05-07", planned: 4.0, capacity: 6.8, util: 58.8, status: "GREEN", cumOut: 17.93, batches: 2 },
  { day: 5, date: "2026-05-08", planned: 2.5, capacity: 6.8, util: 36.8, status: "GREEN", cumOut: 19.92, batches: 1 },
  { day: 6, date: "2026-05-09", planned: 0, capacity: 6.8, util: 0, status: "GREEN", cumOut: 19.92, batches: 0 },
  { day: 7, date: "2026-05-10", planned: 0, capacity: 6.8, util: 0, status: "GREEN", cumOut: 19.92, batches: 0 },
];

const BATCHES = [
  { id: "b1", num: "BAT-20260504-001", type: "SUB_BATCH", product: "IQF-CKD", grade: "20/25", input: 3.0, expected: 2.36, actual: null, status: "IN_PROGRESS", activity: "Cooking", scheduled: "2026-05-04", steps: [
    { name: "Cleaning", status: "done", yield: 0.92 }, { name: "Cooking", status: "active", yield: 0.85 }, { name: "IQF Freezing", status: "pending", yield: 0.98 }, { name: "Glazing", status: "pending", yield: 1.03 }, { name: "Packing", status: "pending", yield: 0.99 }
  ]},
  { id: "b2", num: "BAT-20260504-002", type: "SUB_BATCH", product: "IQF-CKD", grade: "16/20", input: 3.8, expected: 2.98, actual: null, status: "IN_PROGRESS", activity: "Cleaning", scheduled: "2026-05-04", steps: [
    { name: "Cleaning", status: "active", yield: 0.92 }, { name: "Cooking", status: "pending", yield: 0.85 }, { name: "IQF Freezing", status: "pending", yield: 0.98 }, { name: "Glazing", status: "pending", yield: 1.03 }, { name: "Packing", status: "pending", yield: 0.99 }
  ]},
  { id: "b3", num: "BAT-20260504-003", type: "SUB_BATCH", product: "RAW-BLK", grade: "26/30", input: 2.5, expected: 2.37, actual: null, status: "SCHEDULED", activity: "", scheduled: "2026-05-04", steps: [
    { name: "Cleaning", status: "pending", yield: 0.92 }, { name: "Block Freezing", status: "pending", yield: 0.99 }, { name: "Glazing", status: "pending", yield: 1.05 }, { name: "Packing", status: "pending", yield: 0.99 }
  ]},
  { id: "b4", num: "BAT-20260505-001", type: "SUB_BATCH", product: "PD-RAW", grade: "20/25", input: 5.2, expected: 4.41, actual: null, status: "SCHEDULED", activity: "", scheduled: "2026-05-05", steps: [
    { name: "Cleaning", status: "pending", yield: 0.92 }, { name: "Deveining", status: "pending", yield: 0.95 }, { name: "IQF Freezing", status: "pending", yield: 0.98 }, { name: "Packing", status: "pending", yield: 0.99 }
  ]},
];

const ALERTS = [
  { severity: "CRITICAL", category: "DELIVERY_RISK", title: "Delivery at risk: ORD-001", msg: "Nippon Suisan — IQF-CKD 20/25 — 8d left, needs processing" },
  { severity: "WARNING", category: "STOCK_SHORTFALL", title: "No stock: 13/15 Black Tiger", msg: "ORD-006 needs 2.5 MT — none available. Create PR." },
  { severity: "WARNING", category: "STOCK_SHORTFALL", title: "No stock: 31/40 Vannamei", msg: "ORD-005 needs 3.8 MT — none available. Create PR." },
  { severity: "WARNING", category: "CAPACITY_OVERLOAD", title: "Day 1-2 near full capacity", msg: "95-100% utilization. Consider overtime or deferral." },
  { severity: "INFO", category: "BOTTLENECK", title: "Bottleneck: Deveining Station", msg: "Net capacity 11.4 MT/day — lowest among all equipment." },
];

// ─── DESIGN TOKENS ───────────────────────────────────────────────────
const C = { bg: "#080c14", s: "#0f1520", s2: "#171f2e", bd: "#1c2538", tx: "#dfe4ed", dm: "#8b95a8", mu: "#5b6578", bl: "#4da6ff", tl: "#36d6b5", gn: "#43d98c", am: "#f0b429", rd: "#f06060", pr: "#9b7dfa", co: "#f28b5e", pk: "#e86baf" };
const mn = "'IBM Plex Mono', monospace", sn = "'Outfit', system-ui, sans-serif";

const Card = ({ children, style, a }) => <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, borderTop: a ? `3px solid ${a}` : undefined, ...style }}>{children}</div>;
const H = ({ icon, title, sub }) => <div style={{ marginBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 16 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>{title}</span></div>{sub && <div style={{ fontSize: 10, color: C.mu, marginTop: 1, marginLeft: 23 }}>{sub}</div>}</div>;
const M = ({ l, v, c = C.bl, s: sz }) => <div style={{ background: C.s2, borderRadius: 7, padding: sz ? "5px 9px" : "9px 13px", minWidth: sz ? 90 : 120 }}><div style={{ fontSize: 8, color: C.mu, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 1 }}>{l}</div><div style={{ fontSize: sz ? 13 : 18, fontWeight: 700, color: c, fontFamily: mn }}>{v}</div></div>;
const Tg = ({ children, c = C.bl }) => <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 9, fontSize: 9, fontWeight: 600, color: c, background: `${c}18` }}>{children}</span>;
const Br = ({ v, mx, c, h = 7 }) => <div style={{ height: h, background: C.s2, borderRadius: 3, flex: 1 }}><div style={{ height: "100%", width: `${Math.min(100, mx > 0 ? (v / mx) * 100 : 0)}%`, background: c, borderRadius: 3, transition: "width 0.3s" }} /></div>;
const fmt = (n, d = 2) => Number(n).toFixed(d);
const fmtINR = n => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const Tbl = ({ headers, rows }) => (
  <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
    <thead><tr>{headers.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "5px 7px", color: C.mu, borderBottom: `1px solid ${C.bd}`, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: `1px solid ${C.bd}08` }}>{r.map((c, j) => <td key={j} style={{ padding: "5px 7px", color: C.tx, whiteSpace: "nowrap" }}>{c}</td>)}</tr>)}</tbody>
  </table></div>
);

const Dots = ({ steps }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "done" ? C.gn : s.status === "active" ? C.bl : C.bd, boxShadow: s.status === "active" ? `0 0 6px ${C.bl}` : "none" }} title={s.name} />
        {i < steps.length - 1 && <div style={{ width: 10, height: 1.5, background: s.status === "done" ? C.gn : C.bd }} />}
      </div>
    ))}
  </div>
);

// ─── TABS ────────────────────────────────────────────────────────────

function OrdersTab() {
  const sorted = [...ORDERS].sort((a, b) => b.score - a.score);
  const totalDemand = ORDERS.reduce((s, o) => s + o.qty, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <M l="Active orders" v={ORDERS.length} /><M l="Total demand" v={`${fmt(totalDemand, 1)} MT`} c={C.gn} /><M l="At risk" v={ORDERS.filter(o => o.daysLeft < 10).length} c={C.rd} /><M l="Can start today" v={ORDERS.filter(o => o.canStart).length} c={C.tl} />
      </div>
      <Card><H icon="📋" title="Priority queue" sub="GET /api/planning/orders/priority-queue/ · Ranked by planning engine" />
        <Tbl headers={["#", "Order", "Customer", "Product", "Grade", "Qty", "Days", "Yield", "Stock", "Score", "Priority"]}
          rows={sorted.map((o, i) => [
            <span style={{ color: C.mu }}>{i + 1}</span>,
            <span style={{ fontFamily: mn, color: C.bl }}>{o.ref}</span>, o.customer,
            <Tg c={C.pr}>{o.product}</Tg>,
            <span style={{ fontFamily: mn }}>{o.grade}</span>,
            `${fmt(o.qty, 1)} MT`,
            <span style={{ color: o.daysLeft <= 7 ? C.rd : o.daysLeft <= 10 ? C.am : C.gn, fontWeight: 600 }}>{o.daysLeft}d</span>,
            <span style={{ fontFamily: mn, color: C.dm }}>{o.yieldPct}%</span>,
            <span style={{ fontFamily: mn, color: o.stockAvail > 0 ? C.gn : C.rd }}>{fmt(o.stockAvail, 1)}</span>,
            <span style={{ fontFamily: mn, fontWeight: 700, color: C.bl }}>{o.score}</span>,
            <Tg c={o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}>{o.label}</Tg>,
          ])} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card><H icon="🌍" title="Demand by destination" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100 }}>
            {Object.entries(ORDERS.reduce((a, o) => { a[o.dest] = (a[o.dest] || 0) + o.qty; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 8, fontFamily: mn, color: C.dm }}>{fmt(v, 1)}</span>
                <div style={{ width: "100%", maxWidth: 28, height: Math.max(4, v / totalDemand * 80), background: C.bl, borderRadius: "3px 3px 0 0", opacity: 0.7 }} />
                <span style={{ fontSize: 8, color: C.mu, marginTop: 2 }}>{k}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card><H icon="📦" title="Demand by product" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {Object.entries(ORDERS.reduce((a, o) => { a[o.product] = (a[o.product] || 0) + o.qty; return a; }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 60, fontSize: 10, fontFamily: mn, color: C.pr }}>{k}</span>
                <Br v={v} mx={totalDemand} c={C.pr} h={8} />
                <span style={{ fontSize: 10, fontFamily: mn, color: C.dm }}>{fmt(v, 1)} MT</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function InventoryTab() {
  const totalStock = INVENTORY.reduce((s, r) => s + r.inStock, 0);
  const totalShortfall = INVENTORY.filter(r => r.shortfall > 0).length;
  const totalCost = INVENTORY.reduce((s, r) => s + r.cost, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <M l="Total in stock" v={`${fmt(totalStock, 1)} MT`} c={C.gn} /><M l="Cold storage" v={`${fmt(totalStock / 50 * 100, 0)}% of 50 MT`} c={totalStock > 40 ? C.am : C.tl} /><M l="Grades short" v={totalShortfall} c={C.rd} /><M l="Procurement cost" v={fmtINR(totalCost)} c={C.pr} />
      </div>
      <Card><H icon="📦" title="Grade-wise inventory" sub="GET /api/planning/inventory/status/ · Reads from ERP ItemBatch" />
        <Tbl headers={["Grade", "Species", "In stock", "Committed", "Available", "Required", "Shortfall", "Purchase (15%)", "Est. cost", "Orders"]}
          rows={INVENTORY.map(r => [
            <span style={{ fontFamily: mn, fontWeight: 700, color: C.bl }}>{r.grade}</span>, r.species,
            <span style={{ fontFamily: mn }}>{fmt(r.inStock, 1)}</span>,
            <span style={{ fontFamily: mn, color: C.am }}>{fmt(r.committed, 1)}</span>,
            <span style={{ fontFamily: mn, color: C.tl }}>{fmt(r.available, 1)}</span>,
            <span style={{ fontFamily: mn }}>{fmt(r.required, 1)}</span>,
            <span style={{ fontFamily: mn, fontWeight: 600, color: r.shortfall > 0 ? C.rd : C.gn }}>{r.shortfall > 0 ? fmt(r.shortfall, 1) : "—"}</span>,
            r.purchase > 0 ? <span style={{ fontFamily: mn }}>{fmt(r.purchase, 1)} MT</span> : "—",
            r.cost > 0 ? <span style={{ fontFamily: mn }}>{fmtINR(r.cost)}</span> : "—",
            <span style={{ fontFamily: mn, color: C.dm }}>{r.orders}</span>,
          ])} />
      </Card>
      <Card a={C.tl}><H icon="📉" title="14-day stock projection" sub="GET /api/planning/inventory/projection/?days=14" />
        <div style={{ position: "relative", height: 110 }}>
          <svg viewBox="0 0 300 100" style={{ width: "100%", height: "100%" }}>
            <line x1="0" y1="8" x2="300" y2="8" stroke={C.rd} strokeDasharray="3" strokeWidth="0.5" opacity="0.5" />
            <text x="302" y="11" fill={C.rd} fontSize="6">50 MT cap</text>
            {Array.from({ length: 15 }, (_, d) => {
              const stock = Math.max(0, totalStock - d * 6.8 * 0.797);
              const prev = Math.max(0, totalStock - (d - 1) * 6.8 * 0.797);
              if (d === 0) return null;
              return <line key={d} x1={(d - 1) / 14 * 290 + 5} y1={90 - (prev / 15) * 75} x2={d / 14 * 290 + 5} y2={90 - (stock / 15) * 75} stroke={stock <= 0 ? C.rd : C.bl} strokeWidth="1.5" />;
            })}
            {[0, 4, 7, 10, 14].map(d => <text key={d} x={d / 14 * 290 + 5} y="98" fill={C.mu} fontSize="6" textAnchor="middle">D{d}</text>)}
          </svg>
        </div>
      </Card>
    </div>
  );
}

function CapacityTab() {
  const effCap = 6.8;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <M l="Effective capacity" v={`${effCap} MT/d`} c={C.tl} /><M l="Bottleneck" v="Deveining Stn" c={C.am} /><M l="Avg utilization" v={`${fmt(CAPACITY_PLAN.reduce((s, d) => s + d.util, 0) / 7, 0)}%`} c={C.pr} /><M l="7-day output" v={`${fmt(CAPACITY_PLAN[CAPACITY_PLAN.length - 1].cumOut, 1)} MT`} c={C.gn} />
      </div>
      <Card><H icon="📊" title="7-day production plan" sub="GET /api/planning/capacity/plan/?days=7" />
        <Tbl headers={["Day", "Date", "Planned", "Utilization", "Status", "Cumulative", "Batches"]}
          rows={CAPACITY_PLAN.map(d => [
            `Day ${d.day}`, d.date,
            <span style={{ fontFamily: mn }}>{fmt(d.planned, 1)} MT</span>,
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 70, height: 7, background: C.s2, borderRadius: 3 }}><div style={{ height: "100%", width: `${Math.min(100, d.util)}%`, background: d.status === "RED" ? C.rd : d.status === "AMBER" ? C.am : C.gn, borderRadius: 3 }} /></div><span style={{ fontSize: 10, fontFamily: mn, color: d.status === "RED" ? C.rd : C.dm }}>{fmt(d.util, 0)}%</span></div>,
            <Tg c={d.status === "RED" ? C.rd : d.status === "AMBER" ? C.am : C.gn}>{d.status}</Tg>,
            <span style={{ fontFamily: mn }}>{fmt(d.cumOut, 1)} MT</span>,
            <span style={{ fontFamily: mn, color: C.dm }}>{d.batches}</span>,
          ])} />
      </Card>
      <Card a={C.bl}><H icon="📈" title="Capacity vs planned" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 100, padding: "0 4px" }}>
          {CAPACITY_PLAN.map(d => (
            <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: 7, fontFamily: mn, color: C.dm }}>{fmt(d.planned, 1)}</span>
              <div style={{ width: "100%", maxWidth: 24, height: Math.max(2, d.planned / effCap * 70), background: d.util > 95 ? C.rd : d.util > 80 ? C.am : C.gn, borderRadius: "3px 3px 0 0" }} />
              <div style={{ width: "100%", maxWidth: 24, height: 1, background: C.bl, marginTop: -1 * Math.max(2, effCap / effCap * 70), opacity: 0 }} />
              <span style={{ fontSize: 8, color: C.mu, marginTop: 2 }}>D{d.day}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px dashed ${C.bl}30`, marginTop: 4, paddingTop: 4, fontSize: 9, color: C.dm, textAlign: "center" }}>
          Blue line = effective capacity ({effCap} MT/d). Bars above = over capacity.
        </div>
      </Card>
    </div>
  );
}

function BatchesTab() {
  const [batches, setBatches] = useState(BATCHES);
  const [allocating, setAllocating] = useState(null); // batch ID being allocated
  const [allocAmounts, setAllocAmounts] = useState({});

  // Advance batch to next activity
  const advanceBatch = useCallback((batchId) => {
    // In real app: POST /api/planning/batches/{id}/advance-activity/
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      const steps = [...b.steps];
      const activeIdx = steps.findIndex(s => s.status === "active");
      if (activeIdx < 0) {
        // SCHEDULED → start first step
        steps[0] = { ...steps[0], status: "active" };
        return { ...b, steps, status: "IN_PROGRESS", activity: steps[0].name };
      }
      steps[activeIdx] = { ...steps[activeIdx], status: "done" };
      if (activeIdx < steps.length - 1) {
        // Move to next step
        steps[activeIdx + 1] = { ...steps[activeIdx + 1], status: "active" };
        return { ...b, steps, activity: steps[activeIdx + 1].name };
      }
      // Last step done → compute actual output and move to ALLOCATING
      let weight = b.input;
      steps.forEach(s => { weight *= s.yield; });
      return { ...b, steps, status: "ALLOCATING", activity: "", actual: parseFloat(weight.toFixed(3)) };
    }));
  }, []);

  // Auto-allocate: engine distributes to highest-priority orders
  const autoAllocate = useCallback((batchId) => {
    // In real app: POST /api/planning/batches/{id}/auto-allocate/
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      // Simulate: allocate to first matching order
      const matching = ORDERS.filter(o => o.grade === b.grade && o.product === b.product)
        .sort((a, b) => b.score - a.score);
      const allocs = [];
      let remaining = b.actual || b.expected;
      for (const o of matching) {
        if (remaining <= 0) break;
        const qty = Math.min(remaining, o.remaining);
        allocs.push({ order: o.ref, customer: o.customer, qty: parseFloat(qty.toFixed(3)) });
        remaining -= qty;
      }
      return { ...b, status: "COMPLETED", allocations: allocs };
    }));
  }, []);

  // Open manual allocation
  const openAllocate = useCallback((batchId) => {
    const b = batches.find(x => x.id === batchId);
    if (!b) return;
    const matching = ORDERS.filter(o => o.grade === b.grade && o.product === b.product);
    const amounts = {};
    matching.forEach(o => { amounts[o.ref] = 0; });
    setAllocAmounts(amounts);
    setAllocating(batchId);
  }, [batches]);

  // Confirm manual allocation
  const confirmAllocate = useCallback(() => {
    // In real app: POST /api/planning/batches/{id}/allocate/ for each order
    setBatches(prev => prev.map(b => {
      if (b.id !== allocating) return b;
      const allocs = Object.entries(allocAmounts)
        .filter(([_, qty]) => qty > 0)
        .map(([ref, qty]) => {
          const o = ORDERS.find(x => x.ref === ref);
          return { order: ref, customer: o?.customer || "", qty };
        });
      const totalAlloc = allocs.reduce((s, a) => s + a.qty, 0);
      const isComplete = totalAlloc >= (b.actual || b.expected);
      return { ...b, status: isComplete ? "COMPLETED" : "ALLOCATING", allocations: allocs };
    }));
    setAllocating(null);
  }, [allocating, allocAmounts]);

  const statusCounts = { SCHEDULED: 0, IN_PROGRESS: 0, ALLOCATING: 0, COMPLETED: 0 };
  batches.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });

  const allocBatch = allocating ? batches.find(b => b.id === allocating) : null;
  const allocOrders = allocBatch ? ORDERS.filter(o => o.grade === allocBatch.grade && o.product === allocBatch.product) : [];
  const allocTotal = Object.values(allocAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const allocAvailable = allocBatch ? (allocBatch.actual || allocBatch.expected) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
        <M l="Total batches" v={batches.length} />
        <M l="In progress" v={statusCounts.IN_PROGRESS} c={C.gn} />
        <M l="Scheduled" v={statusCounts.SCHEDULED} c={C.am} />
        <M l="Awaiting allocation" v={statusCounts.ALLOCATING} c={C.pr} />
        <M l="Completed" v={statusCounts.COMPLETED} c={C.tl} />
      </div>

      {/* Gantt timeline */}
      <Card>
        <H icon="⏱️" title="Batch timeline" sub="POST /api/planning/batches/{id}/advance-activity/ to progress" />
        {batches.map(b => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", marginBottom: 6, gap: 8 }}>
            <span style={{ width: 140, fontFamily: mn, fontSize: 10, color: C.bl, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.num}</span>
            <Tg c={C.pr}>{b.product}</Tg>
            <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, width: 35 }}>{b.grade}</span>
            <div style={{ flex: 1, position: "relative", height: 16, background: C.s2, borderRadius: 4 }}>
              {b.steps.map((s, i) => {
                if (s.status === "pending") return null;
                const colors = { Cleaning: C.tl, Cooking: C.rd, "IQF Freezing": C.bl, "Block Freezing": C.bl, Glazing: C.gn, Packing: C.pr, Deveining: C.pk, "Light Wash": C.tl };
                const w = 100 / b.steps.length;
                return <div key={i} style={{ position: "absolute", left: `${i * w}%`, width: `${w}%`, height: "100%", background: s.status === "active" ? (colors[s.name] || C.bl) : `${colors[s.name] || C.bl}55`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 600 }}>{s.name.slice(0, 5)}</div>;
              })}
            </div>
            <Tg c={b.status === "COMPLETED" ? C.tl : b.status === "ALLOCATING" ? C.pr : b.status === "IN_PROGRESS" ? C.gn : C.am}>{b.status}</Tg>
          </div>
        ))}
      </Card>

      {/* Batch cards with action buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {batches.map(b => {
          const isScheduled = b.status === "SCHEDULED";
          const isInProgress = b.status === "IN_PROGRESS";
          const isAllocating = b.status === "ALLOCATING";
          const isCompleted = b.status === "COMPLETED";
          const activeStep = b.steps.find(s => s.status === "active");
          const nextStep = (() => {
            const ai = b.steps.findIndex(s => s.status === "active");
            return ai >= 0 && ai < b.steps.length - 1 ? b.steps[ai + 1] : null;
          })();
          const isLastStep = b.steps.findIndex(s => s.status === "active") === b.steps.length - 1;

          return (
            <Card key={b.id} style={{
              padding: 14,
              borderLeft: `3px solid ${isCompleted ? C.tl : isAllocating ? C.pr : isInProgress ? C.gn : C.am}`,
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <span style={{ fontFamily: mn, fontSize: 13, fontWeight: 700, color: C.bl }}>{b.num}</span>
                  <span style={{ fontSize: 10, color: C.dm, marginLeft: 6 }}>{b.product} · {b.grade}</span>
                </div>
                <Dots steps={b.steps} />
              </div>

              {/* Weight info */}
              <div style={{ display: "flex", gap: 8, fontSize: 10, marginBottom: 8 }}>
                <span style={{ color: C.dm }}>In: <span style={{ color: C.tx, fontWeight: 600 }}>{fmt(b.input, 2)} MT</span></span>
                <span style={{ color: C.dm }}>Exp: <span style={{ color: C.gn, fontWeight: 600 }}>{fmt(b.expected, 2)} MT</span></span>
                {b.actual && <span style={{ color: C.dm }}>Actual: <span style={{ color: C.tl, fontWeight: 600 }}>{fmt(b.actual, 3)} MT</span></span>}
                <Tg c={isCompleted ? C.tl : isAllocating ? C.pr : isInProgress ? C.gn : C.am}>{b.status}</Tg>
              </div>

              {/* Step list */}
              <div style={{ fontSize: 9, marginBottom: 10 }}>
                {b.steps.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "2px 6px",
                    background: s.status === "active" ? `${C.bl}10` : "transparent",
                    borderRadius: 3, marginBottom: 1,
                  }}>
                    <span style={{ color: s.status === "active" ? C.bl : s.status === "done" ? C.gn : C.mu }}>
                      {s.status === "done" ? "✓ " : s.status === "active" ? "▸ " : "  "}{s.name}
                    </span>
                    <span style={{ fontFamily: mn, color: s.yield > 1 ? C.gn : s.yield < 0.9 ? C.rd : C.am }}>{(s.yield * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              {/* ── ACTION BUTTONS ── */}

              {/* SCHEDULED → Start first activity */}
              {isScheduled && (
                <button onClick={() => advanceBatch(b.id)} style={{
                  width: "100%", padding: "8px 0", border: "none", borderRadius: 8,
                  background: C.tl, color: "#000", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: sn,
                }}>
                  Start {b.steps[0].name}
                </button>
              )}

              {/* IN_PROGRESS → Advance to next activity or complete */}
              {isInProgress && activeStep && (
                <button onClick={() => advanceBatch(b.id)} style={{
                  width: "100%", padding: "8px 0", border: "none", borderRadius: 8,
                  background: isLastStep ? C.gn : C.bl, color: isLastStep ? "#000" : "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: sn,
                }}>
                  {isLastStep
                    ? `Complete ${activeStep.name} → ready for allocation`
                    : `Complete ${activeStep.name} → start ${nextStep?.name}`
                  }
                </button>
              )}

              {/* ALLOCATING → Auto-allocate or manual allocate */}
              {isAllocating && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => autoAllocate(b.id)} style={{
                    flex: 1, padding: "8px 0", border: "none", borderRadius: 8,
                    background: C.pr, color: "#fff", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: sn,
                  }}>
                    Auto-allocate to orders
                  </button>
                  <button onClick={() => openAllocate(b.id)} style={{
                    flex: 1, padding: "8px 0", border: `1px solid ${C.pr}40`,
                    borderRadius: 8, background: "transparent", color: C.pr,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: sn,
                  }}>
                    Manual allocate
                  </button>
                </div>
              )}

              {/* COMPLETED → Show allocation summary */}
              {isCompleted && b.allocations && (
                <div style={{ background: C.s2, borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Allocated to orders</div>
                  {b.allocations.map((a, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 10 }}>
                      <span><span style={{ fontFamily: mn, color: C.bl }}>{a.order}</span> <span style={{ color: C.dm }}>({a.customer})</span></span>
                      <span style={{ fontFamily: mn, color: C.tl, fontWeight: 600 }}>{fmt(a.qty, 3)} MT</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.bd}`, paddingTop: 4, marginTop: 4, fontSize: 10 }}>
                    <span style={{ color: C.dm }}>Total allocated</span>
                    <span style={{ fontFamily: mn, color: C.gn, fontWeight: 700 }}>{fmt(b.allocations.reduce((s, a) => s + a.qty, 0), 3)} MT</span>
                  </div>
                </div>
              )}

              {/* API reference */}
              <div style={{ marginTop: 6, fontSize: 8, color: C.mu }}>
                {isScheduled && "POST /batches/{id}/advance-activity/"}
                {isInProgress && "POST /batches/{id}/advance-activity/"}
                {isAllocating && "POST /batches/{id}/auto-allocate/ or /allocate/"}
                {isCompleted && "GET /orders/{id}/fulfillment/"}
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── ALLOCATION MODAL ── */}
      {allocating && allocBatch && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 1000,
        }} onClick={() => setAllocating(null)}>
          <div style={{
            background: C.s, border: `1px solid ${C.bd}`, borderRadius: 14,
            padding: 24, width: "100%", maxWidth: 560, maxHeight: "80vh",
            overflow: "auto", borderTop: `3px solid ${C.pr}`,
          }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.tx }}>Allocate batch output to orders</div>
                <div style={{ fontSize: 11, color: C.dm, marginTop: 2 }}>
                  <span style={{ fontFamily: mn, color: C.bl }}>{allocBatch.num}</span> ·
                  <Tg c={C.pr}>{allocBatch.product}</Tg>
                  <span style={{ fontFamily: mn, marginLeft: 4 }}>{allocBatch.grade}</span>
                </div>
              </div>
              <button onClick={() => setAllocating(null)} style={{
                width: 28, height: 28, border: `1px solid ${C.bd}`, borderRadius: 6,
                background: "transparent", color: C.dm, fontSize: 14, cursor: "pointer",
              }}>✕</button>
            </div>

            {/* Available output */}
            <div style={{ background: C.s2, borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase", letterSpacing: 0.5 }}>Batch output available</div>
                <div style={{ fontFamily: mn, fontSize: 22, fontWeight: 700, color: C.tl }}>{fmt(allocAvailable, 3)} MT</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase", letterSpacing: 0.5 }}>Allocated so far</div>
                <div style={{ fontFamily: mn, fontSize: 22, fontWeight: 700, color: allocTotal > allocAvailable ? C.rd : C.bl }}>{fmt(allocTotal, 3)} MT</div>
              </div>
            </div>

            {/* Allocation bar */}
            <div style={{ height: 10, background: C.s2, borderRadius: 5, marginBottom: 16, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${Math.min(100, (allocTotal / allocAvailable) * 100)}%`,
                background: allocTotal > allocAvailable ? C.rd : allocTotal >= allocAvailable * 0.99 ? C.gn : C.bl,
                borderRadius: 5, transition: "width 0.2s",
              }} />
            </div>

            {/* Order rows */}
            <div style={{ fontSize: 10, color: C.mu, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Matching orders ({allocBatch.product} {allocBatch.grade}) — ranked by priority
            </div>
            {allocOrders.sort((a, b) => b.score - a.score).map(o => (
              <div key={o.ref} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: C.s2, borderRadius: 8, marginBottom: 6,
                borderLeft: `3px solid ${o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: mn, color: C.bl, fontSize: 12, fontWeight: 600 }}>{o.ref}</span>
                    <Tg c={o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}>{o.label}</Tg>
                    <span style={{ fontFamily: mn, color: C.bl, fontSize: 11 }}>{o.score}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.dm, marginTop: 2 }}>
                    {o.customer} · needs {fmt(o.remaining, 1)} MT · {o.daysLeft}d left
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="range" min="0" max={Math.min(o.remaining, allocAvailable)} step="0.01"
                    value={allocAmounts[o.ref] || 0}
                    onChange={e => setAllocAmounts(prev => ({ ...prev, [o.ref]: parseFloat(e.target.value) }))}
                    style={{ width: 80, accentColor: C.pr }} />
                  <input type="number" min="0" max={Math.min(o.remaining, allocAvailable)} step="0.01"
                    value={allocAmounts[o.ref] || 0}
                    onChange={e => setAllocAmounts(prev => ({ ...prev, [o.ref]: parseFloat(e.target.value) || 0 }))}
                    style={{
                      width: 60, background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 5,
                      padding: "4px 6px", color: C.tx, fontSize: 12, fontFamily: mn, textAlign: "right",
                    }} />
                  <span style={{ fontSize: 10, color: C.mu }}>MT</span>
                </div>
              </div>
            ))}

            {/* Remaining unallocated */}
            {allocTotal < allocAvailable && (
              <div style={{ padding: "8px 12px", background: `${C.am}10`, borderRadius: 8, marginTop: 8, fontSize: 10, color: C.am }}>
                {fmt(allocAvailable - allocTotal, 3)} MT unallocated — will remain in finished goods inventory
              </div>
            )}
            {allocTotal > allocAvailable && (
              <div style={{ padding: "8px 12px", background: `${C.rd}10`, borderRadius: 8, marginTop: 8, fontSize: 10, color: C.rd }}>
                Over-allocated by {fmt(allocTotal - allocAvailable, 3)} MT — reduce quantities
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setAllocating(null)} style={{
                flex: 1, padding: "9px 0", border: `1px solid ${C.bd}`, borderRadius: 8,
                background: "transparent", color: C.dm, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: sn,
              }}>Cancel</button>
              <button onClick={confirmAllocate} disabled={allocTotal <= 0 || allocTotal > allocAvailable} style={{
                flex: 2, padding: "9px 0", border: "none", borderRadius: 8,
                background: allocTotal <= 0 || allocTotal > allocAvailable ? C.s2 : C.pr,
                color: allocTotal <= 0 || allocTotal > allocAvailable ? C.mu : "#fff",
                fontSize: 12, fontWeight: 600,
                cursor: allocTotal > 0 && allocTotal <= allocAvailable ? "pointer" : "not-allowed",
                fontFamily: sn,
              }}>
                Confirm allocation ({fmt(allocTotal, 3)} MT to {Object.values(allocAmounts).filter(v => v > 0).length} orders)
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 8, color: C.mu }}>
              POST /api/planning/batches/{"{id}"}/allocate/ for each order · {"{"}order_plan_id, quantity_mt{"}"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 9 }}>
        <M l="Critical" v={ALERTS.filter(a => a.severity === "CRITICAL").length} c={C.rd} /><M l="Warning" v={ALERTS.filter(a => a.severity === "WARNING").length} c={C.am} /><M l="Info" v={ALERTS.filter(a => a.severity === "INFO").length} c={C.bl} />
      </div>
      {ALERTS.map((a, i) => {
        const sc = { CRITICAL: C.rd, WARNING: C.am, INFO: C.bl }[a.severity];
        return (
          <Card key={i} style={{ padding: 13, borderLeft: `4px solid ${sc}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 14 }}>{a.severity === "CRITICAL" ? "🔴" : a.severity === "WARNING" ? "🟡" : "🔵"}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{a.title}</span>
              <Tg c={sc}>{a.category}</Tg>
            </div>
            <div style={{ fontSize: 11, color: C.dm, marginLeft: 22 }}>{a.msg}</div>
          </Card>
        );
      })}
    </div>
  );
}

function PlanningTab() {
  const sorted = [...ORDERS].sort((a, b) => b.score - a.score);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card a={C.tl}><H icon="🧠" title="Planning engine output" sub="GET /api/planning/engine/report/" />
        <div style={{ fontSize: 11, color: C.dm, marginBottom: 12 }}>The engine walks the priority queue, matches graded stock, and recommends batches within daily capacity.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.slice(0, 4).map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: C.s2, borderRadius: 6 }}>
              <span style={{ fontFamily: mn, color: C.mu, width: 18 }}>{i + 1}</span>
              <span style={{ fontFamily: mn, color: C.bl, width: 60 }}>{o.ref}</span>
              <Tg c={o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}>{o.label}</Tg>
              <Tg c={C.pr}>{o.product}</Tg>
              <span style={{ fontFamily: mn, color: C.dm, width: 35, fontSize: 10 }}>{o.grade}</span>
              <span style={{ fontFamily: mn, color: C.tx, width: 50, fontSize: 10 }}>{fmt(o.remaining, 1)} MT</span>
              <span style={{ fontSize: 10, color: o.canStart ? C.gn : C.rd }}>{o.canStart ? "✓ Stock" : "✗ No stock"}</span>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: mn, fontWeight: 700, color: C.bl, fontSize: 13 }}>{o.score}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card a={C.pr}><H icon="📦" title="Recommended batches" sub="POST /api/planning/engine/generate/ to create these" />
        <Tbl headers={["Batch", "Product", "Grade", "Input MT", "Priority", "Fulfills"]}
          rows={[
            ["BAT-001", <Tg c={C.pr}>IQF-CKD</Tg>, "20/25", "3.0 MT", <span style={{ fontFamily: mn, color: C.bl }}>82</span>, "ORD-001 (3.0)"],
            ["BAT-002", <Tg c={C.pr}>IQF-CKD</Tg>, "16/20", "3.8 MT", <span style={{ fontFamily: mn, color: C.bl }}>76</span>, "ORD-003 (3.8)"],
            ["BAT-003", <Tg c={C.pr}>RAW-BLK</Tg>, "26/30", "2.5 MT", <span style={{ fontFamily: mn, color: C.bl }}>64</span>, "ORD-002 (2.5)"],
          ]} />
        <div style={{ marginTop: 8, fontSize: 10, color: C.am }}>Capacity used: 9.3 / 6.8 MT — Day 1 over capacity, will spill to Day 2</div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card a={C.rd}><H icon="⚠️" title="Orders at risk" />
          {ORDERS.filter(o => o.daysLeft < 10).map(o => (
            <div key={o.id} style={{ padding: "5px 8px", background: C.s2, borderRadius: 6, marginBottom: 4, fontSize: 10 }}>
              <span style={{ fontWeight: 600, color: C.tx }}>{o.ref}</span> — {o.customer} · <Tg c={C.pr}>{o.product}</Tg> · <span style={{ color: C.rd }}>{o.daysLeft}d left</span>
            </div>
          ))}
        </Card>
        <Card a={C.am}><H icon="🛒" title="Procurement suggestions" sub="GET /api/planning/engine/procurement-suggestions/" />
          {INVENTORY.filter(r => r.shortfall > 0).map(r => (
            <div key={r.grade} style={{ padding: "5px 8px", background: C.s2, borderRadius: 6, marginBottom: 4, fontSize: 10 }}>
              <span style={{ fontWeight: 600, color: C.am }}>{r.grade} {r.species}</span> — need {fmt(r.purchase, 1)} MT unsorted · {fmtINR(r.cost)}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────

const TABS = [
  { id: "orders", label: "Orders", icon: "📋" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "capacity", label: "Capacity", icon: "📊" },
  { id: "batches", label: "Batches", icon: "🔄" },
  { id: "alerts", label: "Alerts", icon: "🚨" },
  { id: "planning", label: "Planning engine", icon: "🧠" },
];

export default function ProductionPlannerV4() {
  const [tab, setTab] = useState("orders");
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.tx, fontFamily: sn }}>
      <div style={{ background: C.s, borderBottom: `1px solid ${C.bd}`, padding: "11px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}><span style={{ color: C.tl }}>🦐</span> Production planner <Tg c={C.pr}>v3</Tg></div>
          <div style={{ fontSize: 9, color: C.mu }}>Product-aware · Yield per ProcessFlow · ERP-integrated</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <M l="Eff. cap" v="6.8 MT" c={C.tl} s /><M l="Orders" v={ORDERS.length} c={C.bl} s /><M l="Alerts" v={ALERTS.length} c={C.rd} s />
        </div>
      </div>
      <div style={{ display: "flex", gap: 1, padding: "0 18px", background: C.s, borderBottom: `1px solid ${C.bd}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 12px", border: "none", background: "transparent", color: tab === t.id ? C.tl : C.mu, borderBottom: tab === t.id ? `2px solid ${C.tl}` : "2px solid transparent", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: sn }}>{t.icon} {t.label}</button>
        ))}
      </div>
      <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "orders" && <OrdersTab />}
        {tab === "inventory" && <InventoryTab />}
        {tab === "capacity" && <CapacityTab />}
        {tab === "batches" && <BatchesTab />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "planning" && <PlanningTab />}
      </div>
    </div>
  );
}
