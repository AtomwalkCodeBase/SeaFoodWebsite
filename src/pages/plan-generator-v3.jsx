import { useState, useMemo, useCallback } from "react";

/*
WORKFLOW THIS SCREEN COVERS:
─────────────────────────────
1. Manager opens this screen each morning
2. Selects the planning date (today by default)
3. Clicks "Generate Plan" → engine runs, returns recommendations
4. Manager sees:
   - Priority-ranked orders with stock availability
   - Recommended batches with quantities
   - Capacity usage and warnings
5. Manager can:
   - Adjust batch quantities (slider/input)
   - Defer orders to next day
   - Split or merge batches
   - Add notes per batch
6. Manager clicks "Approve & Create Batches"
   → POST /api/planning/engine/generate/ with adjustments
   → ProductionBatch records created in DB
   → Floor supervisor sees them in the Batches tab

API CALLS:
  Step 3: GET /api/planning/engine/report/?date=2026-05-04
  Step 6: POST /api/planning/engine/generate/ {date, adjustments}
  Background: GET /api/planning/inventory/status/
  Background: GET /api/planning/capacity/plan/?days=3
*/

const C = {
  bg: "#080c14", s: "#0f1520", s2: "#171f2e", s3: "#1e2940", bd: "#1c2538",
  tx: "#dfe4ed", dm: "#8b95a8", mu: "#5b6578",
  bl: "#4da6ff", tl: "#36d6b5", gn: "#43d98c", am: "#f0b429",
  rd: "#f06060", pr: "#9b7dfa", co: "#f28b5e",
};
const mn = "'IBM Plex Mono', monospace";
const sn = "'Outfit', system-ui, sans-serif";

// ─── Sample data (mirrors GET /api/planning/engine/report/) ──────────

const SAMPLE_ORDERS = [
  { id: "o1", ref: "ORD-001", customer: "Nippon Suisan", dest: "Japan", product: "IQF-CKD", grade: "20/25", qty: 4.5, remaining: 4.5, price: 850000, daysLeft: 8, score: 82, label: "CRITICAL", canStart: true, stockAvail: 5.2, rawNeeded: 5.73, yieldPct: 78.5, margin: 217000 },
  { id: "o3", ref: "ORD-003", customer: "Maruha Nichiro", dest: "Japan", product: "IQF-CKD", grade: "16/20", qty: 5.0, remaining: 5.0, price: 920000, daysLeft: 9, score: 76, label: "CRITICAL", canStart: true, stockAvail: 3.8, rawNeeded: 6.37, yieldPct: 78.5, margin: 285000 },
  { id: "o2", ref: "ORD-002", customer: "Thai Union", dest: "Thailand", product: "RAW-BLK", grade: "26/30", qty: 3.2, remaining: 3.2, price: 620000, daysLeft: 11, score: 64, label: "URGENT", canStart: true, stockAvail: 2.5, rawNeeded: 3.38, yieldPct: 94.8, margin: 155000 },
  { id: "o6", ref: "ORD-006", customer: "Clearwater", dest: "Canada", product: "WHL-CKD", grade: "13/15", qty: 2.5, remaining: 2.5, price: 1050000, daysLeft: 12, score: 58, label: "URGENT", canStart: false, stockAvail: 0, rawNeeded: 2.99, yieldPct: 83.5, margin: 312000 },
  { id: "o4", ref: "ORD-004", customer: "Red Lobster", dest: "USA", product: "PD-RAW", grade: "20/25", qty: 6.0, remaining: 6.0, price: 780000, daysLeft: 14, score: 45, label: "STANDARD", canStart: true, stockAvail: 5.2, rawNeeded: 7.08, yieldPct: 84.8, margin: 147000 },
  { id: "o5", ref: "ORD-005", customer: "Sysco EU", dest: "Germany", product: "RAW-BLK", grade: "31/40", qty: 3.8, remaining: 3.8, price: 540000, daysLeft: 17, score: 38, label: "STANDARD", canStart: false, stockAvail: 0, rawNeeded: 4.01, yieldPct: 94.8, margin: 85000 },
];

const EFF_CAPACITY = 6.8;

// ─── Reusable ────────────────────────────────────────────────────────

const Card = ({ children, style, a }) => <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 12, padding: 18, borderTop: a ? `3px solid ${a}` : undefined, ...style }}>{children}</div>;
const Tg = ({ children, c = C.bl }) => <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600, color: c, background: `${c}18` }}>{children}</span>;
const fmt = (n, d = 2) => Number(n).toFixed(d);
const fmtINR = n => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function PlanGenerator() {
  const [planDate, setPlanDate] = useState("2026-05-04");
  const [phase, setPhase] = useState("idle"); // idle → generated → approved
  const [batches, setBatches] = useState([]);
  const [deferred, setDeferred] = useState(new Set());
  const [adjustments, setAdjustments] = useState({});

  // Generate plan from engine
  const handleGenerate = useCallback(() => {
    const recs = [];
    let capacityLeft = EFF_CAPACITY;

    for (const order of SAMPLE_ORDERS) {
      if (deferred.has(order.id)) continue;
      if (capacityLeft <= 0) break;
      if (!order.canStart) continue;

      const batchSize = Math.min(order.remaining, order.stockAvail, capacityLeft);
      if (batchSize < 0.1) continue;

      recs.push({
        id: `rec-${order.id}`,
        orderId: order.id,
        orderRef: order.ref,
        customer: order.customer,
        product: order.product,
        grade: order.grade,
        inputMT: parseFloat(batchSize.toFixed(3)),
        originalMT: parseFloat(batchSize.toFixed(3)),
        expectedOutput: parseFloat((batchSize * order.yieldPct / 100).toFixed(3)),
        score: order.score,
        label: order.label,
        daysLeft: order.daysLeft,
        notes: "",
        included: true,
      });
      capacityLeft -= batchSize;
    }
    setBatches(recs);
    setPhase("generated");
  }, [deferred]);

  // Adjust batch quantity
  const adjustBatch = useCallback((batchId, field, value) => {
    setBatches(prev => prev.map(b => {
      if (b.id !== batchId) return b;
      if (field === "inputMT") {
        const v = Math.max(0, Math.min(10, parseFloat(value) || 0));
        const order = SAMPLE_ORDERS.find(o => o.id === b.orderId);
        return { ...b, inputMT: v, expectedOutput: parseFloat((v * order.yieldPct / 100).toFixed(3)) };
      }
      if (field === "included") return { ...b, included: value };
      if (field === "notes") return { ...b, notes: value };
      return b;
    }));
  }, []);

  // Toggle defer order
  const toggleDefer = useCallback((orderId) => {
    setDeferred(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  // Approve and create
  const handleApprove = useCallback(() => {
    // In real app: POST /api/planning/engine/generate/
    // with { date: planDate, batches: activeBatches }
    setPhase("approved");
  }, []);

  const activeBatches = batches.filter(b => b.included);
  const totalPlanned = activeBatches.reduce((s, b) => s + b.inputMT, 0);
  const totalOutput = activeBatches.reduce((s, b) => s + b.expectedOutput, 0);
  const utilization = EFF_CAPACITY > 0 ? (totalPlanned / EFF_CAPACITY) * 100 : 0;
  const overCapacity = totalPlanned > EFF_CAPACITY;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.tx, fontFamily: sn }}>
      {/* Header */}
      <div style={{ background: C.s, borderBottom: `1px solid ${C.bd}`, padding: "12px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              <span style={{ color: C.tl }}>🦐</span> Daily production plan
              {phase === "approved" && <Tg c={C.gn}>APPROVED</Tg>}
            </div>
            <div style={{ fontSize: 10, color: C.mu, marginTop: 1 }}>
              Review engine recommendations → adjust → approve → batches created on floor
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <label style={{ fontSize: 9, color: C.mu }}>Plan date</label>
              <input type="date" value={planDate} onChange={e => { setPlanDate(e.target.value); setPhase("idle"); setBatches([]); }}
                style={{ background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 6, padding: "5px 10px", color: C.tx, fontSize: 12, fontFamily: mn }} />
            </div>
            {phase === "idle" && (
              <button onClick={handleGenerate} style={{ padding: "10px 20px", border: "none", borderRadius: 8, background: C.tl, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: sn }}>
                Generate plan
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── STEP 1: Order queue with defer toggles ── */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>📋 Outstanding orders</div>
              <div style={{ fontSize: 10, color: C.mu }}>Ranked by priority score. Toggle "Defer" to skip an order today.</div>
            </div>
            <div style={{ fontSize: 11, color: C.dm }}>{SAMPLE_ORDERS.length} orders · {SAMPLE_ORDERS.filter(o => o.canStart).length} have stock</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SAMPLE_ORDERS.map(o => {
              const isDef = deferred.has(o.id);
              return (
                <div key={o.id} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  background: isDef ? `${C.rd}08` : C.s2, borderRadius: 8,
                  opacity: isDef ? 0.5 : 1, transition: "all 0.2s",
                  borderLeft: `3px solid ${o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}`,
                }}>
                  <span style={{ fontFamily: mn, color: C.bl, width: 60, fontSize: 11 }}>{o.ref}</span>
                  <span style={{ width: 100, fontSize: 11, color: C.tx }}>{o.customer}</span>
                  <Tg c={C.pr}>{o.product}</Tg>
                  <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, width: 35 }}>{o.grade}</span>
                  <span style={{ fontFamily: mn, fontSize: 11, color: C.tx, width: 50 }}>{fmt(o.remaining, 1)} MT</span>
                  <span style={{ fontSize: 10, color: o.daysLeft <= 7 ? C.rd : o.daysLeft <= 10 ? C.am : C.gn, width: 35 }}>{o.daysLeft}d</span>
                  <span style={{ fontSize: 10, color: o.canStart ? C.gn : C.rd, width: 55 }}>
                    {o.canStart ? `✓ ${fmt(o.stockAvail, 1)}MT` : "✗ No stock"}
                  </span>
                  <span style={{ fontFamily: mn, fontWeight: 700, color: C.bl, width: 28 }}>{o.score}</span>
                  <Tg c={o.label === "CRITICAL" ? C.rd : o.label === "URGENT" ? C.am : C.mu}>{o.label}</Tg>
                  <div style={{ flex: 1 }} />
                  {phase !== "approved" && (
                    <button onClick={() => toggleDefer(o.id)} style={{
                      padding: "3px 10px", border: `1px solid ${isDef ? C.gn : C.rd}30`, borderRadius: 6,
                      background: "transparent", color: isDef ? C.gn : C.rd, fontSize: 10, fontWeight: 600,
                      cursor: "pointer", fontFamily: sn,
                    }}>
                      {isDef ? "Include" : "Defer"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {SAMPLE_ORDERS.some(o => !o.canStart) && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: `${C.am}10`, borderRadius: 8, fontSize: 10, color: C.am }}>
              ⚠ {SAMPLE_ORDERS.filter(o => !o.canStart).length} orders have no graded stock.
              Create purchase requisitions via your ERP, or wait for next grading session.
            </div>
          )}
        </Card>

        {/* ── STEP 2: Generated plan — adjustable batches ── */}
        {phase !== "idle" && (
          <>
            {/* Capacity bar */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "10px 16px", flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Daily capacity usage</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 16, background: C.s2, borderRadius: 8, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(100, utilization)}%`,
                      background: overCapacity ? `linear-gradient(90deg, ${C.am}, ${C.rd})` : utilization > 80 ? C.am : C.gn,
                      borderRadius: 8, transition: "width 0.3s",
                    }} />
                    {/* Capacity line */}
                    <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 2, background: C.bl }} />
                  </div>
                  <span style={{
                    fontFamily: mn, fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: "right",
                    color: overCapacity ? C.rd : utilization > 80 ? C.am : C.gn,
                  }}>{fmt(utilization, 0)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dm, marginTop: 4 }}>
                  <span>Planned: {fmt(totalPlanned, 1)} MT</span>
                  <span>Capacity: {EFF_CAPACITY} MT</span>
                  <span>Est. output: {fmt(totalOutput, 1)} MT</span>
                </div>
                {overCapacity && (
                  <div style={{ marginTop: 6, fontSize: 10, color: C.rd, fontWeight: 600 }}>
                    ⚠ Over capacity by {fmt(totalPlanned - EFF_CAPACITY, 1)} MT — reduce batch sizes or defer an order
                  </div>
                )}
              </div>
              <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "10px 16px", minWidth: 130, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase" }}>Batches</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.bl, fontFamily: mn }}>{activeBatches.length}</div>
              </div>
              <div style={{ background: C.s, border: `1px solid ${C.bd}`, borderRadius: 10, padding: "10px 16px", minWidth: 130, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.mu, textTransform: "uppercase" }}>Orders covered</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.gn, fontFamily: mn }}>
                  {activeBatches.length} / {SAMPLE_ORDERS.filter(o => !deferred.has(o.id) && o.canStart).length}
                </div>
              </div>
            </div>

            {/* Batch cards */}
            <Card a={C.tl}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>🔧 Recommended batches</div>
                  <div style={{ fontSize: 10, color: C.mu }}>Adjust quantities, exclude batches, or add notes before approving.</div>
                </div>
                {phase === "generated" && (
                  <button onClick={handleApprove} disabled={activeBatches.length === 0 || overCapacity} style={{
                    padding: "10px 24px", border: "none", borderRadius: 8,
                    background: activeBatches.length === 0 || overCapacity ? C.s2 : C.gn,
                    color: activeBatches.length === 0 || overCapacity ? C.mu : "#000",
                    fontWeight: 700, fontSize: 13, cursor: activeBatches.length > 0 && !overCapacity ? "pointer" : "not-allowed",
                    fontFamily: sn,
                  }}>
                    ✓ Approve & create {activeBatches.length} batches
                  </button>
                )}
                {phase === "approved" && (
                  <div style={{ padding: "10px 24px", background: `${C.gn}15`, border: `1px solid ${C.gn}40`, borderRadius: 8, color: C.gn, fontWeight: 700, fontSize: 13 }}>
                    ✓ {activeBatches.length} batches created
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {batches.map((b, i) => {
                  const order = SAMPLE_ORDERS.find(o => o.id === b.orderId);
                  return (
                    <div key={b.id} style={{
                      display: "flex", gap: 12, padding: "12px 14px",
                      background: b.included ? C.s2 : `${C.rd}06`,
                      borderRadius: 10, border: `1px solid ${b.included ? C.bd : `${C.rd}20`}`,
                      opacity: b.included ? 1 : 0.45, transition: "all 0.2s",
                      alignItems: "center",
                    }}>
                      {/* Toggle */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <button onClick={() => adjustBatch(b.id, "included", !b.included)}
                          disabled={phase === "approved"}
                          style={{
                            width: 22, height: 22, borderRadius: 6,
                            border: `2px solid ${b.included ? C.gn : C.rd}`,
                            background: b.included ? C.gn : "transparent",
                            cursor: phase === "approved" ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, color: "#fff", fontWeight: 700,
                          }}>
                          {b.included ? "✓" : ""}
                        </button>
                        <span style={{ fontSize: 8, color: C.mu }}>{i + 1}</span>
                      </div>

                      {/* Order info */}
                      <div style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontFamily: mn, color: C.bl, fontSize: 12, fontWeight: 600 }}>{b.orderRef}</span>
                          <Tg c={b.label === "CRITICAL" ? C.rd : b.label === "URGENT" ? C.am : C.mu}>{b.label}</Tg>
                        </div>
                        <div style={{ fontSize: 10, color: C.dm, marginTop: 2 }}>{b.customer} · {b.daysLeft}d left</div>
                      </div>

                      {/* Product + grade */}
                      <div style={{ minWidth: 100 }}>
                        <Tg c={C.pr}>{b.product}</Tg>
                        <span style={{ fontFamily: mn, fontSize: 10, color: C.dm, marginLeft: 4 }}>{b.grade}</span>
                      </div>

                      {/* Quantity slider + input */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input type="range" min="0" max={Math.min(order?.stockAvail || 10, 10)} step="0.1"
                            value={b.inputMT} disabled={phase === "approved" || !b.included}
                            onChange={e => adjustBatch(b.id, "inputMT", e.target.value)}
                            style={{ flex: 1, accentColor: C.tl, height: 4 }} />
                          <input type="number" min="0" max="10" step="0.1"
                            value={b.inputMT} disabled={phase === "approved" || !b.included}
                            onChange={e => adjustBatch(b.id, "inputMT", e.target.value)}
                            style={{
                              width: 60, background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 5,
                              padding: "3px 6px", color: C.tx, fontSize: 12, fontFamily: mn, textAlign: "right",
                            }} />
                          <span style={{ fontSize: 10, color: C.mu }}>MT</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.mu }}>
                          <span>Stock: {fmt(order?.stockAvail || 0, 1)} MT</span>
                          <span>Output: {fmt(b.expectedOutput, 2)} MT</span>
                        </div>
                      </div>

                      {/* Yield */}
                      <div style={{ textAlign: "center", minWidth: 50 }}>
                        <div style={{ fontSize: 8, color: C.mu }}>Yield</div>
                        <div style={{ fontFamily: mn, fontSize: 12, color: C.tl, fontWeight: 600 }}>
                          {order?.yieldPct}%
                        </div>
                      </div>

                      {/* Margin */}
                      <div style={{ textAlign: "center", minWidth: 55 }}>
                        <div style={{ fontSize: 8, color: C.mu }}>Margin</div>
                        <div style={{ fontFamily: mn, fontSize: 11, color: order?.margin > 200000 ? C.gn : C.am }}>
                          {fmtINR(order?.margin || 0)}
                        </div>
                      </div>

                      {/* Notes */}
                      {phase !== "approved" && b.included && (
                        <input type="text" placeholder="Notes..." value={b.notes}
                          onChange={e => adjustBatch(b.id, "notes", e.target.value)}
                          style={{
                            flex: 1, background: C.bg, border: `1px solid ${C.bd}`, borderRadius: 5,
                            padding: "4px 8px", color: C.tx, fontSize: 10, fontFamily: sn, minWidth: 80,
                          }} />
                      )}
                      {phase === "approved" && b.notes && (
                        <span style={{ fontSize: 10, color: C.dm, flex: 1 }}>{b.notes}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Not covered */}
            {(() => {
              const notCovered = SAMPLE_ORDERS.filter(o =>
                !deferred.has(o.id) && o.canStart && !activeBatches.find(b => b.orderId === o.id)
              );
              const noStock = SAMPLE_ORDERS.filter(o => !o.canStart && !deferred.has(o.id));
              const deferredOrders = SAMPLE_ORDERS.filter(o => deferred.has(o.id));

              if (notCovered.length === 0 && noStock.length === 0 && deferredOrders.length === 0) return null;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  {notCovered.length > 0 && (
                    <Card a={C.am}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.am, marginBottom: 8 }}>
                        ⏳ Pushed to next day ({notCovered.length})
                      </div>
                      <div style={{ fontSize: 10, color: C.dm, marginBottom: 6 }}>No capacity left today</div>
                      {notCovered.map(o => (
                        <div key={o.id} style={{ padding: "4px 8px", background: C.s2, borderRadius: 6, marginBottom: 3, fontSize: 10 }}>
                          <span style={{ color: C.bl }}>{o.ref}</span> · {o.product} {o.grade} · {fmt(o.remaining, 1)} MT · {o.daysLeft}d
                        </div>
                      ))}
                    </Card>
                  )}
                  {noStock.length > 0 && (
                    <Card a={C.rd}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.rd, marginBottom: 8 }}>
                        📦 No stock ({noStock.length})
                      </div>
                      <div style={{ fontSize: 10, color: C.dm, marginBottom: 6 }}>Create PR in ERP or wait for grading</div>
                      {noStock.map(o => (
                        <div key={o.id} style={{ padding: "4px 8px", background: C.s2, borderRadius: 6, marginBottom: 3, fontSize: 10 }}>
                          <span style={{ color: C.bl }}>{o.ref}</span> · {o.product} {o.grade} · needs {fmt(o.remaining, 1)} MT
                        </div>
                      ))}
                    </Card>
                  )}
                  {deferredOrders.length > 0 && (
                    <Card a={C.mu}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.mu, marginBottom: 8 }}>
                        ⏸ Manually deferred ({deferredOrders.length})
                      </div>
                      {deferredOrders.map(o => (
                        <div key={o.id} style={{ padding: "4px 8px", background: C.s2, borderRadius: 6, marginBottom: 3, fontSize: 10 }}>
                          <span style={{ color: C.bl }}>{o.ref}</span> · {o.customer} · {o.daysLeft}d left
                        </div>
                      ))}
                    </Card>
                  )}
                </div>
              );
            })()}

            {/* Approved confirmation */}
            {phase === "approved" && (
              <Card a={C.gn} style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.gn, marginBottom: 4 }}>
                  {activeBatches.length} production batches created
                </div>
                <div style={{ fontSize: 12, color: C.dm, marginBottom: 12 }}>
                  Plan date: {planDate} · Total input: {fmt(totalPlanned, 1)} MT · Expected output: {fmt(totalOutput, 1)} MT
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  {activeBatches.map(b => (
                    <div key={b.id} style={{ padding: "6px 12px", background: C.s2, borderRadius: 8, fontSize: 11 }}>
                      <span style={{ fontFamily: mn, color: C.bl }}>{b.orderRef}</span>
                      <span style={{ color: C.dm }}> → </span>
                      <Tg c={C.pr}>{b.product}</Tg>
                      <span style={{ fontFamily: mn, color: C.tl, marginLeft: 4 }}>{fmt(b.inputMT, 1)} MT</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 10, color: C.mu }}>
                  Floor supervisor can now see these batches in the Batches tab.
                  Use "Advance activity" to progress each batch through its processing route.
                </div>
              </Card>
            )}
          </>
        )}

        {/* Idle state */}
        {phase === "idle" && (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.tx, marginBottom: 4 }}>Ready to plan</div>
            <div style={{ fontSize: 12, color: C.dm, maxWidth: 400, margin: "0 auto" }}>
              Select a date and click "Generate plan". The engine will rank orders by priority,
              match them to available graded stock, and recommend batches within your daily capacity.
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, fontSize: 10, color: C.mu }}>
              <span>📋 {SAMPLE_ORDERS.length} orders</span>
              <span>·</span>
              <span>⚡ {EFF_CAPACITY} MT/day capacity</span>
              <span>·</span>
              <span>📦 {SAMPLE_ORDERS.filter(o => o.canStart).length} with stock</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
