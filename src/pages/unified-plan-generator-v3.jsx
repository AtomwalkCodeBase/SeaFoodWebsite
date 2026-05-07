import { useState, useMemo, useCallback } from "react";

/*
THE COMPLETE DAILY PRODUCTION WORKFLOW:
═══════════════════════════════════════
This screen is the SINGLE entry point for production planning.
The manager uses it every morning to plan both phases:

PHASE 1 — PRE-GRADING (raw material → graded stock)
  Trigger: GRN received, ungraded raw material in cold storage
  Flow:
    1. Manager sees "Ungraded raw material" section with pending GRNs
    2. Creates parent batch(es) for pre-grading activities (cleaning/wash)
    3. Floor runs pre-grading → then QC/grading session
    4. Grading session records grade-wise split → sub-batches auto-created
    5. Graded stock appears in inventory

  APIs:
    GET  /api/planning/grading-sessions/?status=IN_PROGRESS   ← pending sessions
    POST /api/planning/batches/                                ← create parent batch
    POST /api/planning/batches/{id}/advance-activity/          ← run pre-grading
    POST /api/planning/grading-sessions/{id}/record-grades/    ← grade split
    POST /api/planning/batches/{id}/create-sub-batches/        ← sub-batches

PHASE 2 — POST-GRADING (graded stock → finished goods → orders)
  Trigger: Graded stock available in inventory + outstanding orders
  Flow:
    1. Manager sees priority-ranked orders with available graded stock
    2. Engine recommends sub-batches within daily capacity
    3. Manager adjusts, approves → sub-batches created
    4. Floor runs post-grading activities (cook/freeze/glaze/pack)
    5. Output auto-allocated to orders

  APIs:
    GET  /api/planning/engine/report/?date=...                 ← recommendations
    GET  /api/planning/inventory/status/                       ← grade-wise stock
    POST /api/planning/engine/generate/                        ← create sub-batches
    POST /api/planning/batches/{id}/advance-activity/          ← run post-grading
    POST /api/planning/batches/{id}/auto-allocate/             ← allocate output
*/

const C = {
  bg: "#080c14", s: "#0f1520", s2: "#171f2e", s3: "#1e2940", bd: "#1c2538",
  tx: "#dfe4ed", dm: "#8b95a8", mu: "#5b6578",
  bl: "#4da6ff", tl: "#36d6b5", gn: "#43d98c", am: "#f0b429",
  rd: "#f06060", pr: "#9b7dfa", co: "#f28b5e",
};
const mn = "'IBM Plex Mono', monospace", sn = "'Outfit', system-ui, sans-serif";

// ─── SAMPLE DATA ─────────────────────────────────────────────────────

// Phase 1: Ungraded raw material (from recent GRNs, not yet graded)
const UNGRADED_RAW = [
  { id: "grn-1", grn: "GRN-2026-0041", supplier: "KeralaFish Exports", species: "Black Tiger", receivedMT: 12.0, receivedDate: "2026-05-03", erpBatch: "BAT-INW-041", location: "Cold Store A", status: "PENDING", gradingSession: null },
  { id: "grn-2", grn: "GRN-2026-0042", supplier: "Coastal Marine", species: "Vannamei", receivedMT: 8.0, receivedDate: "2026-05-04", erpBatch: "BAT-INW-042", location: "Cold Store B", status: "PENDING", gradingSession: null },
];

// Expected grade distribution (from SupplierGradeProfile)
const SUPPLIER_PROFILES = {
  "KeralaFish Exports": { "8/12": 5, "13/15": 10, "16/20": 20, "20/25": 35, "26/30": 20, "31/40": 8, "41/50": 2 },
  "Coastal Marine": { "26/30": 55, "31/40": 35, "41/50": 10 },
};

// Phase 1: Parent batches already in progress (cleaning/pre-grading)
const PARENT_BATCHES = [
  { id: "pb-1", num: "BAT-P-20260504-001", grn: "GRN-2026-0040", supplier: "Bay of Bengal", species: "Black Tiger", inputMT: 10.0, status: "IN_PROGRESS", activity: "Cleaning", expectedCleanedMT: 9.2 },
];

// Phase 1: Grading sessions ready (cleaning done, awaiting grade recording)
const READY_FOR_GRADING = [
  { id: "gs-1", parentBatch: "BAT-P-20260503-001", species: "Black Tiger", cleanedMT: 9.2, supplier: "Bay of Bengal", status: "GRADING" },
];

// Phase 2: Already graded stock (from ERP ItemBatch)
const GRADED_STOCK = [
  { grade: "16/20", species: "Black Tiger", available: 3.8, committed: 0 },
  { grade: "20/25", species: "Black Tiger", available: 5.2, committed: 0 },
  { grade: "26/30", species: "Vannamei", available: 2.5, committed: 0 },
  { grade: "26/30", species: "Black Tiger", available: 1.8, committed: 0 },
];

// Phase 2: Outstanding orders
const ORDERS = [
  { id: "o1", ref: "ORD-001", customer: "Nippon Suisan", product: "IQF-CKD", grade: "20/25", remaining: 4.5, daysLeft: 8, score: 82, label: "CRITICAL", yieldPct: 78.5 },
  { id: "o3", ref: "ORD-003", customer: "Maruha Nichiro", product: "IQF-CKD", grade: "16/20", remaining: 5.0, daysLeft: 9, score: 76, label: "CRITICAL", yieldPct: 78.5 },
  { id: "o2", ref: "ORD-002", customer: "Thai Union", product: "RAW-BLK", grade: "26/30", remaining: 3.2, daysLeft: 11, score: 64, label: "URGENT", yieldPct: 94.8 },
  { id: "o6", ref: "ORD-006", customer: "Clearwater", product: "WHL-CKD", grade: "13/15", remaining: 2.5, daysLeft: 12, score: 58, label: "URGENT", yieldPct: 83.5 },
  { id: "o4", ref: "ORD-004", customer: "Red Lobster", product: "PD-RAW", grade: "20/25", remaining: 6.0, daysLeft: 14, score: 45, label: "STANDARD", yieldPct: 84.8 },
  { id: "o5", ref: "ORD-005", customer: "Sysco EU", product: "RAW-BLK", grade: "31/40", remaining: 3.8, daysLeft: 17, score: 38, label: "STANDARD", yieldPct: 94.8 },
];

const EFF_CAPACITY = 6.8;
const fmt = (n, d = 2) => Number(n).toFixed(d);
const fmtINR = n => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ─── Reusable ────────────────────────────────────────────────────────
const Card = ({ children, style, a }) => <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, borderTop: a ? `3px solid ${a}` : undefined, ...style }}>{children}</div>;
const Tg = ({ children, c = C.bl }) => <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600, color: c, background: `${c}18` }}>{children}</span>;
const M = ({ l, v, c = C.bl, s: sm }) => <div style={{ background: C.s2, borderRadius: 7, padding: sm ? "5px 9px" : "9px 13px", minWidth: sm ? 90 : 120 }}><div style={{ fontSize: 8, color: C.mu, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 1 }}>{l}</div><div style={{ fontSize: sm ? 13 : 18, fontWeight: 700, color: c, fontFamily: mn }}>{v}</div></div>;
const Br = ({ v, mx, c, h = 7 }) => <div style={{ height: h, background: C.s2, borderRadius: 3, flex: 1 }}><div style={{ height: "100%", width: `${Math.min(100, mx > 0 ? (v / mx) * 100 : 0)}%`, background: c, borderRadius: 3, transition: "width 0.3s" }} /></div>;

const Btn = ({ children, onClick, color = C.tl, disabled, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "7px 16px", border: outline ? `1px solid ${color}40` : "none",
    borderRadius: 8, background: outline ? "transparent" : disabled ? C.s2 : color,
    color: outline ? color : disabled ? C.mu : "#000", fontWeight: 600, fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: sn, opacity: disabled ? 0.5 : 1,
  }}>{children}</button>
);

// ─── PHASE 1: Pre-Grading Planning ──────────────────────────────────

function Phase1Section({ onCreateParent, onStartGrading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Ungraded raw material from GRNs */}
      <Card a={C.co}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📥</span> Ungraded raw material
            </div>
            <div style={{ fontSize: 10, color: C.mu, marginTop: 1 }}>Received via GRN, needs pre-grading activities (cleaning) then grade sorting</div>
          </div>
          <div style={{ fontSize: 10, color: C.co }}>{UNGRADED_RAW.length} pending GRNs</div>
        </div>

        {UNGRADED_RAW.map(raw => {
          const profile = SUPPLIER_PROFILES[raw.supplier] || {};
          const topGrades = Object.entries(profile).sort((a, b) => b[1] - a[1]).slice(0, 3);
          return (
            <div key={raw.id} style={{ padding: "12px 14px", background: C.s2, borderRadius: 10, marginBottom: 8, borderLeft: `3px solid ${C.co}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: mn, color: C.co, fontSize: 12, fontWeight: 600 }}>{raw.grn}</span>
                  <Tg c={C.am}>{raw.species}</Tg>
                  <span style={{ fontSize: 11, color: C.dm }}>{raw.supplier}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: mn, fontSize: 14, fontWeight: 700, color: C.tx }}>{raw.receivedMT} MT</span>
                  <Btn onClick={() => onCreateParent(raw)} color={C.co}>Create parent batch</Btn>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.dm }}>
                <span>Received: {raw.receivedDate}</span>
                <span>ERP batch: {raw.erpBatch}</span>
                <span>Location: {raw.location}</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.mu }}>
                <span>Expected grades:</span>
                {topGrades.map(([g, pct]) => (
                  <span key={g} style={{ fontFamily: mn, color: C.dm }}>{g} ({pct}%)</span>
                ))}
                <span>+ others</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 9, color: C.mu }}>
                API: POST /api/planning/batches/ → creates PARENT batch type with pre-grading activities
              </div>
            </div>
          );
        })}
      </Card>

      {/* Parent batches in progress (being cleaned) */}
      {PARENT_BATCHES.length > 0 && (
        <Card a={C.tl}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>🔄</span> Parent batches in progress
            <span style={{ fontSize: 10, color: C.mu, fontWeight: 400 }}>Pre-grading activities running</span>
          </div>
          {PARENT_BATCHES.map(pb => (
            <div key={pb.id} style={{ padding: "10px 12px", background: C.s2, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: mn, color: C.tl, fontSize: 12, fontWeight: 600 }}>{pb.num}</span>
              <Tg c={C.am}>{pb.species}</Tg>
              <span style={{ fontFamily: mn, color: C.tx }}>{pb.inputMT} MT</span>
              <Tg c={C.gn}>{pb.activity}</Tg>
              <span style={{ fontSize: 10, color: C.dm }}>Expected cleaned: {pb.expectedCleanedMT} MT</span>
              <div style={{ flex: 1 }} />
              <Btn onClick={() => {}} color={C.tl} outline>Advance activity</Btn>
              <div style={{ fontSize: 9, color: C.mu }}>POST /batches/{"{id}"}/advance-activity/</div>
            </div>
          ))}
        </Card>
      )}

      {/* Ready for grading (cleaning done) */}
      {READY_FOR_GRADING.length > 0 && (
        <Card a={C.pr}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>⚖️</span> Ready for grading
            <span style={{ fontSize: 10, color: C.mu, fontWeight: 400 }}>Pre-grading done, QC sorts into grades</span>
          </div>
          {READY_FOR_GRADING.map(gs => (
            <div key={gs.id} style={{ padding: "12px 14px", background: C.s2, borderRadius: 10, borderLeft: `3px solid ${C.pr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: mn, color: C.pr, fontSize: 12, fontWeight: 600 }}>{gs.parentBatch}</span>
                  <Tg c={C.am}>{gs.species}</Tg>
                  <span style={{ fontFamily: mn, color: C.tx }}>{gs.cleanedMT} MT cleaned</span>
                </div>
                <Btn onClick={() => onStartGrading(gs)} color={C.pr}>Record grades</Btn>
              </div>

              {/* Grade entry form */}
              <div style={{ background: C.s, borderRadius: 8, padding: 10, marginTop: 6 }}>
                <div style={{ fontSize: 10, color: C.mu, marginBottom: 6 }}>Enter grade-wise weight from QC sorting:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["8/12", "13/15", "16/20", "20/25", "26/30", "31/40", "41/50"].map(g => (
                    <div key={g} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, width: 32 }}>{g}</span>
                      <input type="number" placeholder="0.0" step="0.1" min="0"
                        style={{ width: 55, background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 5, padding: "4px 6px", color: C.tx, fontSize: 11, fontFamily: mn, textAlign: "right" }} />
                      <span style={{ fontSize: 9, color: C.mu }}>MT</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: mn, fontSize: 10, color: C.rd, width: 32 }}>Waste</span>
                    <input type="number" placeholder="0.0" step="0.1" min="0"
                      style={{ width: 55, background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 5, padding: "4px 6px", color: C.rd, fontSize: 11, fontFamily: mn, textAlign: "right" }} />
                    <span style={{ fontSize: 9, color: C.mu }}>MT</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: C.mu }}>
                    POST /grading-sessions/{"{id}"}/record-grades/ → creates sub-batches + updates inventory
                  </span>
                  <Btn color={C.pr}>Confirm grades & create sub-batches</Btn>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── PHASE 2: Post-Grading Planning ─────────────────────────────────

function Phase2Section() {
  const [generated, setGenerated] = useState(false);
  const [approved, setApproved] = useState(false);
  const [batches, setBatches] = useState([]);

  const handleGenerate = () => {
    let cap = EFF_CAPACITY;
    const recs = [];
    for (const o of ORDERS) {
      if (cap <= 0) break;
      const stock = GRADED_STOCK.filter(s => s.grade === o.grade).reduce((s, g) => s + g.available, 0);
      if (stock <= 0) continue;
      const size = Math.min(o.remaining, stock, cap);
      if (size < 0.1) continue;
      recs.push({ id: `r-${o.id}`, order: o, inputMT: parseFloat(size.toFixed(2)), expectedOut: parseFloat((size * o.yieldPct / 100).toFixed(2)), included: true });
      cap -= size;
    }
    setBatches(recs);
    setGenerated(true);
  };

  const totalPlanned = batches.filter(b => b.included).reduce((s, b) => s + b.inputMT, 0);
  const util = (totalPlanned / EFF_CAPACITY) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Available graded stock */}
      <Card a={C.gn}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>📦</span> Graded stock available
            </div>
            <div style={{ fontSize: 10, color: C.mu, marginTop: 1 }}>From ERP ItemBatch · Ready for post-grading activities</div>
          </div>
          {!generated && <Btn onClick={handleGenerate} color={C.tl}>Generate batch plan</Btn>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {GRADED_STOCK.map((s, i) => (
            <div key={i} style={{ padding: "8px 12px", background: C.s2, borderRadius: 8, minWidth: 120, textAlign: "center" }}>
              <div style={{ fontFamily: mn, fontSize: 13, fontWeight: 700, color: C.bl }}>{s.grade}</div>
              <div style={{ fontSize: 9, color: C.dm }}>{s.species}</div>
              <div style={{ fontFamily: mn, fontSize: 16, fontWeight: 700, color: s.available > 0 ? C.gn : C.mu, marginTop: 2 }}>{fmt(s.available, 1)} MT</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Orders needing these grades */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 15 }}>📋</span> Outstanding orders (priority ranked)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ORDERS.map(o => {
            const stock = GRADED_STOCK.filter(s => s.grade === o.grade).reduce((s, g) => s + g.available, 0);
            return (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.s2, borderRadius: 8, borderLeft: `3px solid ${o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}` }}>
                <span style={{ fontFamily: mn, color: C.bl, width: 55, fontSize: 11 }}>{o.ref}</span>
                <span style={{ width: 90, fontSize: 11, color: C.tx }}>{o.customer}</span>
                <Tg c={C.pr}>{o.product}</Tg>
                <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, width: 32 }}>{o.grade}</span>
                <span style={{ fontFamily: mn, fontSize: 11, color: C.tx, width: 45 }}>{fmt(o.remaining, 1)} MT</span>
                <span style={{ fontSize: 10, color: o.daysLeft <= 7 ? C.rd : o.daysLeft <= 10 ? C.am : C.gn, width: 30 }}>{o.daysLeft}d</span>
                <span style={{ fontSize: 10, color: stock > 0 ? C.gn : C.rd, width: 60 }}>{stock > 0 ? `✓ ${fmt(stock, 1)} MT` : "✗ No stock"}</span>
                <Tg c={o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}>{o.label}</Tg>
                <span style={{ fontFamily: mn, fontWeight: 700, color: C.bl, fontSize: 12 }}>{o.score}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Generated plan */}
      {generated && (
        <>
          {/* Capacity bar */}
          <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dm, marginBottom: 4 }}>
              <span>Planned: {fmt(totalPlanned, 1)} MT</span>
              <span>Capacity: {EFF_CAPACITY} MT/day</span>
              <span style={{ color: util > 100 ? C.rd : util > 80 ? C.am : C.gn }}>{fmt(util, 0)}% utilized</span>
            </div>
            <div style={{ height: 12, background: C.s2, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, util)}%`, background: util > 100 ? C.rd : util > 80 ? C.am : C.gn, borderRadius: 6, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Batch list */}
          <Card a={C.tl}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>🔧 Recommended post-grading batches</div>
                <div style={{ fontSize: 10, color: C.mu }}>Adjust quantities or exclude before approving</div>
              </div>
              {!approved ? (
                <Btn onClick={() => setApproved(true)} color={C.gn} disabled={batches.filter(b => b.included).length === 0}>
                  Approve & create {batches.filter(b => b.included).length} batches
                </Btn>
              ) : (
                <span style={{ padding: "7px 16px", background: `${C.gn}15`, border: `1px solid ${C.gn}40`, borderRadius: 8, color: C.gn, fontWeight: 600, fontSize: 12 }}>
                  ✓ {batches.filter(b => b.included).length} batches created
                </span>
              )}
            </div>

            {batches.map(b => (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: b.included ? C.s2 : `${C.rd}06`, borderRadius: 8, marginBottom: 6,
                opacity: b.included ? 1 : 0.4, borderLeft: `3px solid ${b.order.label === "CRITICAL" ? C.rd : b.order.label === "URGENT" ? C.am : C.mu}`,
              }}>
                <button onClick={() => setBatches(prev => prev.map(x => x.id === b.id ? { ...x, included: !x.included } : x))} disabled={approved}
                  style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${b.included ? C.gn : C.rd}`, background: b.included ? C.gn : "transparent", cursor: approved ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>
                  {b.included ? "✓" : ""}
                </button>
                <span style={{ fontFamily: mn, color: C.bl, fontSize: 11, width: 55 }}>{b.order.ref}</span>
                <span style={{ width: 80, fontSize: 11, color: C.tx }}>{b.order.customer}</span>
                <Tg c={C.pr}>{b.order.product}</Tg>
                <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, width: 30 }}>{b.order.grade}</span>
                <input type="range" min="0" max="8" step="0.1" value={b.inputMT} disabled={approved || !b.included}
                  onChange={e => setBatches(prev => prev.map(x => x.id === b.id ? { ...x, inputMT: parseFloat(e.target.value), expectedOut: parseFloat((parseFloat(e.target.value) * b.order.yieldPct / 100).toFixed(2)) } : x))}
                  style={{ width: 80, accentColor: C.tl }} />
                <span style={{ fontFamily: mn, fontSize: 12, fontWeight: 700, color: C.tl, width: 50 }}>{fmt(b.inputMT, 1)} MT</span>
                <span style={{ fontSize: 10, color: C.dm }}>→ {fmt(b.expectedOut, 1)} MT out</span>
                <span style={{ fontFamily: mn, fontSize: 11, color: C.bl, width: 24 }}>{b.order.score}</span>
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: 9, color: C.mu }}>
              POST /api/planning/engine/generate/ → creates ProductionBatch (SUB_BATCH type) records in DB
            </div>
          </Card>

          {/* Orders with no stock */}
          {ORDERS.filter(o => GRADED_STOCK.filter(s => s.grade === o.grade).reduce((s, g) => s + g.available, 0) === 0).length > 0 && (
            <Card a={C.rd}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.rd, marginBottom: 8 }}>📦 Orders blocked — no graded stock</div>
              <div style={{ fontSize: 10, color: C.dm, marginBottom: 8 }}>
                These need raw material. Either process ungraded stock (Phase 1 above) or create a Purchase Requisition in your ERP.
              </div>
              {ORDERS.filter(o => GRADED_STOCK.filter(s => s.grade === o.grade).reduce((s, g) => s + g.available, 0) === 0).map(o => (
                <div key={o.id} style={{ padding: "6px 10px", background: C.s2, borderRadius: 6, marginBottom: 4, fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: mn, color: C.bl }}>{o.ref}</span>
                  <span style={{ color: C.tx }}>{o.customer}</span>
                  <Tg c={C.pr}>{o.product}</Tg>
                  <span style={{ fontFamily: mn, color: C.dm }}>{o.grade}</span>
                  <span style={{ fontFamily: mn, color: C.rd }}>{fmt(o.remaining, 1)} MT needed</span>
                  <div style={{ flex: 1 }} />
                  <Btn color={C.am} outline>Create PR in ERP</Btn>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────

export default function UnifiedPlanGenerator() {
  const [planDate, setPlanDate] = useState("2026-05-04");
  const [activePhase, setActivePhase] = useState("both"); // both | phase1 | phase2

  const ungradedTotal = UNGRADED_RAW.reduce((s, r) => s + r.receivedMT, 0);
  const gradedTotal = GRADED_STOCK.reduce((s, r) => s + r.available, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.tx, fontFamily: sn }}>
      {/* Header */}
      <div style={{ background: C.s, borderBottom: `1px solid ${C.bd}`, padding: "12px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: C.tl }}>🦐</span> Daily production plan</div>
            <div style={{ fontSize: 10, color: C.mu }}>Pre-grading (raw → graded) + post-grading (graded → finished) in one screen</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 9, color: C.mu }}>Plan date</label>
              <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)}
                style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "5px 10px", color: C.tx, fontSize: 12, fontFamily: mn }} />
            </div>
            <M l="Ungraded" v={`${fmt(ungradedTotal, 0)} MT`} c={C.co} s />
            <M l="Graded" v={`${fmt(gradedTotal, 1)} MT`} c={C.gn} s />
            <M l="Capacity" v={`${EFF_CAPACITY} MT`} c={C.tl} s />
          </div>
        </div>
      </div>

      {/* Phase selector */}
      <div style={{ display: "flex", gap: 1, padding: "0 20px", background: C.s, borderBottom: `1px solid ${C.bd}` }}>
        {[
          { id: "both", label: "Full day plan", icon: "📋" },
          { id: "phase1", label: "Phase 1: Pre-grading", icon: "📥", desc: "Raw → graded" },
          { id: "phase2", label: "Phase 2: Post-grading", icon: "🔧", desc: "Graded → finished" },
        ].map(p => (
          <button key={p.id} onClick={() => setActivePhase(p.id)} style={{
            padding: "9px 14px", border: "none", background: "transparent",
            color: activePhase === p.id ? C.tl : C.mu,
            borderBottom: activePhase === p.id ? `2px solid ${C.tl}` : "2px solid transparent",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: sn,
          }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Workflow overview */}
        {activePhase === "both" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
            {[
              { label: "GRN received", color: C.co, icon: "📥" },
              { label: "Pre-grading", color: C.tl, icon: "🧹" },
              { label: "Grade sorting", color: C.pr, icon: "⚖️" },
              { label: "Graded stock", color: C.gn, icon: "📦" },
              { label: "Post-grading", color: C.bl, icon: "🔧" },
              { label: "Finished goods", color: C.gn, icon: "✅" },
              { label: "Allocate to orders", color: C.am, icon: "📋" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ padding: "5px 10px", background: `${step.color}10`, border: `1px solid ${step.color}30`, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 12 }}>{step.icon}</div>
                  <div style={{ fontSize: 8, color: step.color, fontWeight: 600, marginTop: 1 }}>{step.label}</div>
                </div>
                {i < 6 && <span style={{ color: C.mu, fontSize: 11 }}>→</span>}
              </div>
            ))}
          </div>
        )}

        {/* Phase 1 */}
        {(activePhase === "both" || activePhase === "phase1") && (
          <div>
            {activePhase === "both" && (
              <div style={{ fontSize: 13, fontWeight: 600, color: C.co, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.co, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000", fontWeight: 700 }}>1</div>
                Pre-grading: raw material → grading → graded inventory
              </div>
            )}
            <Phase1Section onCreateParent={() => {}} onStartGrading={() => {}} />
          </div>
        )}

        {/* Divider */}
        {activePhase === "both" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.bd }} />
            <span style={{ fontSize: 10, color: C.mu }}>Grading complete → stock available → plan post-grading below</span>
            <div style={{ flex: 1, height: 1, background: C.bd }} />
          </div>
        )}

        {/* Phase 2 */}
        {(activePhase === "both" || activePhase === "phase2") && (
          <div>
            {activePhase === "both" && (
              <div style={{ fontSize: 13, fontWeight: 600, color: C.bl, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.bl, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000", fontWeight: 700 }}>2</div>
                Post-grading: graded stock → processing → orders fulfilled
              </div>
            )}
            <Phase2Section />
          </div>
        )}
      </div>
    </div>
  );
}
