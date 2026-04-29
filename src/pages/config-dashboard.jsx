import { useState, useMemo, useCallback } from "react";

// ─── SAMPLE DATA (mirrors all configurable models) ───────────────────

const INIT_PLANNING_CONFIG = {
  label: "Production — ₹100Cr Operation",
  machine_capacity_mt: 8.0,
  oee_percentage: 85,
  shift_hours: 16,
  shifts_per_day: 2,
  cold_storage_capacity_mt: 50,
  procurement_buffer_pct: 15,
  priority_weight_urgency: 0.40,
  priority_weight_margin: 0.30,
  priority_weight_customer: 0.20,
  priority_weight_stock: 0.10,
  annual_revenue_target: 1000000000,
};

const INIT_SPECIES = [
  { id: "sp-1", name: "Black Tiger", scientific: "Penaeus monodon", category_alias: "BT", base_price: 420000, processing_cost: 45000, certifications: ["EU Approved", "FDA Registered", "BAP Certified"], active: true },
  { id: "sp-2", name: "Vannamei", scientific: "Litopenaeus vannamei", category_alias: "VN", base_price: 310000, processing_cost: 45000, certifications: ["EU Approved", "BAP Certified"], active: true },
];

const INIT_GRADES = [
  { id: "g1", species: "sp-1", code: "8/12", label: "Extra Colossal", min: 8, max: 12, priceMult: 1.85, yieldMult: 1.06 },
  { id: "g2", species: "sp-1", code: "13/15", label: "Colossal", min: 13, max: 15, priceMult: 1.65, yieldMult: 1.04 },
  { id: "g3", species: "sp-1", code: "16/20", label: "Extra Jumbo", min: 16, max: 20, priceMult: 1.50, yieldMult: 1.02 },
  { id: "g4", species: "sp-1", code: "20/25", label: "Jumbo", min: 20, max: 25, priceMult: 1.40, yieldMult: 1.00 },
  { id: "g5", species: "sp-1", code: "26/30", label: "Extra Large", min: 26, max: 30, priceMult: 1.20, yieldMult: 0.98 },
  { id: "g6", species: "sp-1", code: "31/40", label: "Large", min: 31, max: 40, priceMult: 1.05, yieldMult: 0.96 },
  { id: "g7", species: "sp-1", code: "41/50", label: "Medium", min: 41, max: 50, priceMult: 0.90, yieldMult: 0.94 },
  { id: "g8", species: "sp-2", code: "26/30", label: "Extra Large", min: 26, max: 30, priceMult: 1.15, yieldMult: 0.98 },
  { id: "g9", species: "sp-2", code: "31/40", label: "Large", min: 31, max: 40, priceMult: 1.00, yieldMult: 0.96 },
];

const INIT_YIELD_STEPS = [
  { id: "y1", name: "Cleaning", sequence: 1, yield_pct: 0.92, loss: "Shells, heads, waste", parent: true, efficiency: 200 },
  { id: "y2", name: "Cooking", sequence: 2, yield_pct: 0.85, loss: "Moisture & protein loss", parent: false, efficiency: 150 },
  { id: "y3", name: "Glazing", sequence: 3, yield_pct: 1.03, loss: "Glaze adds weight", parent: false, efficiency: 180 },
  { id: "y4", name: "Packing", sequence: 4, yield_pct: 0.99, loss: "Minor spillage", parent: false, efficiency: 160 },
];

const INIT_MACHINES = [
  { id: "m1", name: "Cleaning Line A", activity: "Cleaning", capacity: 10, count: 2, downtime: 0.08 },
  { id: "m2", name: "Cooking Line A", activity: "Cooking", capacity: 8, count: 3, downtime: 0.10 },
  { id: "m3", name: "Glazing Unit A", activity: "Glazing", capacity: 6, count: 2, downtime: 0.05 },
  { id: "m4", name: "Packing Line A", activity: "Packing", capacity: 7, count: 2, downtime: 0.07 },
];

const INIT_SUPPLIERS = [
  { id: "s1", name: "KeralaFish Exports", species: "Black Tiger", lead: 3, price: 420000, grades: { "8/12": 5, "13/15": 10, "16/20": 20, "20/25": 35, "26/30": 20, "31/40": 8, "41/50": 2 } },
  { id: "s2", name: "Coastal Marine Pvt", species: "Vannamei", lead: 2, price: 310000, grades: { "26/30": 55, "31/40": 35, "41/50": 10 } },
  { id: "s3", name: "Bay of Bengal Co", species: "Black Tiger", lead: 4, price: 395000, grades: { "8/12": 8, "13/15": 12, "16/20": 22, "20/25": 30, "26/30": 18, "31/40": 8, "41/50": 2 } },
];

// ─── DESIGN TOKENS ───────────────────────────────────────────────────
const T = {
  bg: "#0b0f19", card: "#111827", card2: "#1a2236", border: "#1e293b",
  text: "#e2e8f0", dim: "#94a3b8", muted: "#64748b",
  blue: "#38bdf8", teal: "#2dd4bf", green: "#34d399", amber: "#fbbf24",
  red: "#f87171", purple: "#a78bfa", coral: "#fb923c", pink: "#f472b6",
  blueB: "#0c4a6e", tealB: "#134e4a", greenB: "#064e3b", amberB: "#78350f",
  redB: "#7f1d1d", purpleB: "#3b0764",
};

const font = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const mono = "'JetBrains Mono', 'Fira Code', monospace";

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────

function Card({ children, style, accent }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: 20, borderTop: accent ? `3px solid ${accent}` : undefined,
      ...style,
    }}>{children}</div>
  );
}

function SectionTitle({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{title}</span>
      </div>
      {desc && <div style={{ fontSize: 12, color: T.muted, marginTop: 2, marginLeft: 26 }}>{desc}</div>}
    </div>
  );
}

function Field({ label, help, value, onChange, type = "number", suffix, width, disabled, min, max, step }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: width || 120 }}>
      <label style={{ fontSize: 11, color: T.dim, fontWeight: 500 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type={type} value={value} disabled={disabled}
          min={min} max={max} step={step || (type === "number" ? "any" : undefined)}
          onChange={e => onChange?.(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          style={{
            background: disabled ? T.card2 : T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "6px 10px", color: disabled ? T.muted : T.text, fontSize: 13,
            fontFamily: type === "number" ? mono : font, width: "100%", outline: "none",
          }}
        />
        {suffix && <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>{suffix}</span>}
      </div>
      {help && <span style={{ fontSize: 10, color: T.muted, lineHeight: 1.3 }}>{help}</span>}
    </div>
  );
}

function ComputedValue({ label, value, color = T.blue, size = "lg" }) {
  return (
    <div style={{
      background: T.card2, borderRadius: 8, padding: size === "lg" ? "10px 14px" : "6px 10px",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: size === "lg" ? 20 : 15, fontWeight: 700, color, fontFamily: mono }}>{value}</span>
    </div>
  );
}

function Badge({ children, color = T.blue, bg = T.blueB }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 10,
      fontSize: 10, fontWeight: 600, color, background: bg, letterSpacing: 0.4,
    }}>{children}</span>
  );
}

function BarSegment({ value, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height, background: T.card2, borderRadius: 4, flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

function MiniTable({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>{headers.map((h, i) => (
            <th key={i} style={{ textAlign: "left", padding: "6px 8px", color: T.muted, borderBottom: `1px solid ${T.border}`, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${T.border}15` }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "6px 8px", color: T.text, whiteSpace: "nowrap" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TAB: GLOBAL PLANNING CONFIG ─────────────────────────────────────

function GlobalConfigPanel({ config, setConfig }) {
  const eff = config.machine_capacity_mt * (config.oee_percentage / 100);
  const dailyOutputMT = eff * (INIT_YIELD_STEPS.reduce((a, s) => a * s.yield_pct, 1));
  const annualCapacityMT = dailyOutputMT * 300;
  const annualRevenue = annualCapacityMT * 750000;
  const set = (k) => (v) => setConfig(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <ComputedValue label="Effective daily capacity" value={`${eff.toFixed(1)} MT/day`} color={T.teal} />
        <ComputedValue label="Daily finished output" value={`${dailyOutputMT.toFixed(2)} MT/day`} color={T.green} />
        <ComputedValue label="Annual capacity (300 days)" value={`${annualCapacityMT.toFixed(0)} MT/yr`} color={T.amber} />
        <ComputedValue label="Est. annual revenue" value={`₹${(annualRevenue / 10000000).toFixed(1)} Cr`} color={T.purple} />
      </div>

      <Card accent={T.blue}>
        <SectionTitle icon="⚙️" title="Capacity parameters" desc="Machine capacity × OEE = effective daily capacity" />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="Machine capacity" value={config.machine_capacity_mt} onChange={set("machine_capacity_mt")} suffix="MT/day" help="Max physical throughput" />
          <Field label="OEE %" value={config.oee_percentage} onChange={set("oee_percentage")} suffix="%" min={0} max={100} help="Overall equipment effectiveness" />
          <Field label="Effective capacity" value={eff.toFixed(2)} disabled suffix="MT/day" help="= Capacity × OEE" />
          <Field label="Shift hours" value={config.shift_hours} onChange={set("shift_hours")} suffix="hrs" help="Total production hours/day" />
          <Field label="Shifts per day" value={config.shifts_per_day} onChange={set("shifts_per_day")} help="Number of shifts" />
        </div>
      </Card>

      <Card accent={T.teal}>
        <SectionTitle icon="❄️" title="Storage & procurement" desc="Cold storage limits and purchase buffer" />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Field label="Cold storage capacity" value={config.cold_storage_capacity_mt} onChange={set("cold_storage_capacity_mt")} suffix="MT" help="Maximum raw prawn storage" />
          <Field label="Procurement buffer" value={config.procurement_buffer_pct} onChange={set("procurement_buffer_pct")} suffix="%" help="Extra % when purchasing" />
          <Field label="Annual revenue target" value={(config.annual_revenue_target / 10000000).toFixed(0)} onChange={v => set("annual_revenue_target")(v * 10000000)} suffix="Cr ₹" help="Business target" />
        </div>
      </Card>

      <Card accent={T.purple}>
        <SectionTitle icon="🎯" title="Priority scoring weights" desc="How orders are ranked. Must total 1.00." />
        {(() => {
          const total = config.priority_weight_urgency + config.priority_weight_margin + config.priority_weight_customer + config.priority_weight_stock;
          const valid = Math.abs(total - 1.0) < 0.01;
          return (
            <>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <Field label="Delivery urgency" value={config.priority_weight_urgency} onChange={set("priority_weight_urgency")} step={0.05} min={0} max={1} help="Closer deadline = higher" />
                <Field label="Margin per MT" value={config.priority_weight_margin} onChange={set("priority_weight_margin")} step={0.05} min={0} max={1} help="Higher profit = higher" />
                <Field label="Customer tier" value={config.priority_weight_customer} onChange={set("priority_weight_customer")} step={0.05} min={0} max={1} help="Repeat/strategic = higher" />
                <Field label="Stock available" value={config.priority_weight_stock} onChange={set("priority_weight_stock")} step={0.05} min={0} max={1} help="Grade in stock = higher" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, display: "flex", gap: 2, height: 20, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${config.priority_weight_urgency * 100}%`, background: T.red, borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#fff", fontWeight: 600 }}>{(config.priority_weight_urgency * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: `${config.priority_weight_margin * 100}%`, background: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#000", fontWeight: 600 }}>{(config.priority_weight_margin * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: `${config.priority_weight_customer * 100}%`, background: T.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#fff", fontWeight: 600 }}>{(config.priority_weight_customer * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ width: `${config.priority_weight_stock * 100}%`, background: T.blue, borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#000", fontWeight: 600 }}>{(config.priority_weight_stock * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontFamily: mono, color: valid ? T.green : T.red, fontWeight: 700 }}>
                  Σ = {total.toFixed(2)} {valid ? "✓" : "≠ 1.00"}
                </span>
              </div>
            </>
          );
        })()}
      </Card>

      <Card accent={T.amber}>
        <SectionTitle icon="📊" title="Live priority score example" desc="How a sample order would score with current weights" />
        {(() => {
          const days = 8, marginRatio = 0.72, tier = "TIER_2", hasStock = true;
          const u = Math.max(0, Math.min(100, 100 - days * 5));
          const m = marginRatio * 100;
          const c = 75;
          const s = hasStock ? 100 : 0;
          const total = u * config.priority_weight_urgency + m * config.priority_weight_margin + c * config.priority_weight_customer + s * config.priority_weight_stock;
          return (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Urgency (8 days left)", val: u, w: config.priority_weight_urgency, color: T.red, contrib: u * config.priority_weight_urgency },
                  { label: "Margin (72% of best)", val: m, w: config.priority_weight_margin, color: T.green, contrib: m * config.priority_weight_margin },
                  { label: "Customer (Tier 2)", val: c, w: config.priority_weight_customer, color: T.purple, contrib: c * config.priority_weight_customer },
                  { label: "Stock (available)", val: s, w: config.priority_weight_stock, color: T.blue, contrib: s * config.priority_weight_stock },
                ].map(({ label, val, w, color, contrib }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.dim, width: 160 }}>{label}</span>
                    <span style={{ fontSize: 11, fontFamily: mono, color: T.muted, width: 32 }}>{val}</span>
                    <span style={{ fontSize: 10, color: T.muted }}>×</span>
                    <span style={{ fontSize: 11, fontFamily: mono, color, width: 32 }}>{w.toFixed(2)}</span>
                    <span style={{ fontSize: 10, color: T.muted }}>=</span>
                    <span style={{ fontSize: 12, fontFamily: mono, color, fontWeight: 600, width: 36 }}>{contrib.toFixed(1)}</span>
                    <BarSegment value={contrib} max={50} color={color} />
                  </div>
                ))}
              </div>
              <ComputedValue label="Total score" value={total.toFixed(0)} color={total >= 75 ? T.red : total >= 50 ? T.amber : T.muted} />
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ─── TAB: SPECIES & GRADES ───────────────────────────────────────────

function SpeciesGradesPanel() {
  const [selSpecies, setSelSpecies] = useState("sp-1");
  const species = INIT_SPECIES.find(s => s.id === selSpecies);
  const grades = INIT_GRADES.filter(g => g.species === selSpecies);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {INIT_SPECIES.map(sp => (
          <button key={sp.id} onClick={() => setSelSpecies(sp.id)} style={{
            padding: "8px 16px", border: `1px solid ${selSpecies === sp.id ? T.teal : T.border}`,
            borderRadius: 8, background: selSpecies === sp.id ? T.tealB : T.card, color: selSpecies === sp.id ? T.teal : T.dim,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {sp.name} <span style={{ fontSize: 10, opacity: 0.7 }}>({sp.category_alias})</span>
          </button>
        ))}
      </div>

      {species && (
        <Card accent={T.teal}>
          <SectionTitle icon="🦐" title={`${species.name} — species configuration`} desc={`${species.scientific} · Linked to ERP ItemCategory "${species.category_alias}"`} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <Field label="Base price per MT" value={species.base_price} suffix="₹" width={150} />
            <Field label="Processing cost/MT" value={species.processing_cost} suffix="₹" width={140} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11, color: T.dim, fontWeight: 500 }}>Export certifications</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {species.certifications.map(c => <Badge key={c} color={T.green} bg={T.greenB}>{c}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle icon="📐" title="Grade configuration" desc="Each grade maps to an ERP StockItem (SKU). Price & yield multipliers drive planning calculations." />
        <MiniTable
          headers={["Grade", "Label", "Count/lb", "Price mult.", "RM cost/MT", "Yield mult.", "Eff. yield %", "Margin/MT"]}
          rows={grades.map(g => {
            const rmCost = species.base_price * g.priceMult;
            const totalYield = INIT_YIELD_STEPS.reduce((a, s) => a * s.yield_pct, 1) * g.yieldMult;
            const margin = 750000 - rmCost - species.processing_cost;
            return [
              <span style={{ fontFamily: mono, fontWeight: 700, color: T.blue }}>{g.code}</span>,
              g.label,
              <span style={{ fontFamily: mono, color: T.dim }}>{g.min}–{g.max}</span>,
              <span style={{ fontFamily: mono, color: g.priceMult > 1.4 ? T.amber : T.text }}>{g.priceMult.toFixed(3)}</span>,
              <span style={{ fontFamily: mono }}>{`₹${(rmCost / 1000).toFixed(0)}K`}</span>,
              <span style={{ fontFamily: mono, color: g.yieldMult > 1 ? T.green : g.yieldMult < 1 ? T.red : T.text }}>{g.yieldMult.toFixed(3)}</span>,
              <span style={{ fontFamily: mono }}>{(totalYield * 100).toFixed(1)}%</span>,
              <span style={{ fontFamily: mono, color: margin > 150000 ? T.green : margin > 0 ? T.amber : T.red, fontWeight: 600 }}>
                {`₹${(margin / 1000).toFixed(0)}K`}
              </span>,
            ];
          })}
        />
      </Card>

      <Card accent={T.purple}>
        <SectionTitle icon="💰" title="Grade price comparison" desc="RM cost per MT across grades (base × multiplier)" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "0 8px" }}>
          {grades.map(g => {
            const cost = species.base_price * g.priceMult;
            const maxCost = Math.max(...grades.map(gr => species.base_price * gr.priceMult));
            const h = (cost / maxCost) * 110;
            return (
              <div key={g.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 2 }}>
                <span style={{ fontSize: 9, color: T.dim, fontFamily: mono }}>{`₹${(cost/1000).toFixed(0)}K`}</span>
                <div style={{ width: "100%", maxWidth: 36, height: h, background: `linear-gradient(to top, ${T.purple}, ${T.blue})`, borderRadius: "4px 4px 0 0", opacity: 0.8 }} />
                <span style={{ fontSize: 10, color: T.muted, fontFamily: mono }}>{g.code}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: YIELD CHAIN ────────────────────────────────────────────────

function YieldChainPanel() {
  const [inputMT, setInputMT] = useState(10);

  const chain = useMemo(() => {
    let w = inputMT;
    return INIT_YIELD_STEPS.map(s => {
      const out = w * s.yield_pct;
      const loss = w - out;
      const result = { ...s, input: w, output: out, loss };
      w = out;
      return result;
    });
  }, [inputMT]);

  const totalYield = INIT_YIELD_STEPS.reduce((a, s) => a * s.yield_pct, 1);
  const finalOutput = inputMT * totalYield;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <ComputedValue label="Total yield chain" value={`${(totalYield * 100).toFixed(2)}%`} color={T.teal} />
        <ComputedValue label="Final output" value={`${finalOutput.toFixed(2)} MT`} color={T.green} />
        <ComputedValue label="Total loss" value={`${(inputMT - finalOutput).toFixed(2)} MT`} color={T.red} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
          <Field label="Simulate input" value={inputMT} onChange={setInputMT} suffix="MT" width={100} min={0.1} step={0.5} />
        </div>
      </div>

      <Card>
        <SectionTitle icon="🔗" title="Processing activity yield chain" desc="Each activity is from your ERP Process Template. Yield % and efficiency are planning parameters." />
        <MiniTable
          headers={["Seq", "Activity", "Yield %", "Parent/Sub", "Input MT", "Output MT", "Loss/gain", "Worker eff.", "Loss reason"]}
          rows={chain.map(s => [
            <span style={{ fontFamily: mono, color: T.muted }}>{s.sequence}</span>,
            <span style={{ fontWeight: 600, color: T.text }}>{s.name}</span>,
            <span style={{
              fontFamily: mono, fontWeight: 700,
              color: s.yield_pct > 1 ? T.green : s.yield_pct < 0.9 ? T.red : T.amber
            }}>{(s.yield_pct * 100).toFixed(1)}%</span>,
            <Badge color={s.parent ? T.teal : T.purple} bg={s.parent ? T.tealB : T.purpleB}>{s.parent ? "PRE-GRADE" : "POST-GRADE"}</Badge>,
            <span style={{ fontFamily: mono }}>{s.input.toFixed(3)}</span>,
            <span style={{ fontFamily: mono }}>{s.output.toFixed(3)}</span>,
            <span style={{ fontFamily: mono, color: s.loss > 0 ? T.red : T.green }}>
              {s.loss > 0 ? `−${s.loss.toFixed(3)}` : `+${Math.abs(s.loss).toFixed(3)}`}
            </span>,
            <span style={{ fontFamily: mono }}>{s.efficiency} kg/hr</span>,
            <span style={{ fontSize: 11, color: T.muted }}>{s.loss_desc}</span>,
          ])}
        />
      </Card>

      <Card accent={T.teal}>
        <SectionTitle icon="📉" title="Material flow visualization" desc={`${inputMT} MT input → ${finalOutput.toFixed(2)} MT output`} />
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "4px 0" }}>
          <div style={{ padding: "8px 12px", background: T.card2, borderRadius: 8, textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 9, color: T.muted }}>RAW</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.blue, fontFamily: mono }}>{inputMT.toFixed(1)}</div>
          </div>
          {chain.map((s, i) => {
            const stageColor = s.parent ? T.teal : [T.red, T.green, T.purple][i - 1] || T.blue;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 28, textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: T.muted }}>→</div>
                  <div style={{ fontSize: 8, color: s.yield_pct > 1 ? T.green : T.red, fontFamily: mono }}>
                    {s.yield_pct > 1 ? "+" : ""}{((s.yield_pct - 1) * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{
                  padding: "8px 12px", background: `${stageColor}15`, border: `1px solid ${stageColor}33`,
                  borderRadius: 8, textAlign: "center", minWidth: 80,
                }}>
                  <div style={{ fontSize: 9, color: stageColor, fontWeight: 600, textTransform: "uppercase" }}>{s.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: mono }}>{s.output.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
          <div style={{ width: 28, textAlign: "center" }}><div style={{ fontSize: 14, color: T.muted }}>→</div></div>
          <div style={{ padding: "8px 12px", background: `${T.green}15`, border: `1px solid ${T.green}33`, borderRadius: 8, textAlign: "center", minWidth: 70 }}>
            <div style={{ fontSize: 9, color: T.green, fontWeight: 600 }}>FINISHED</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: mono }}>{finalOutput.toFixed(2)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB: MACHINE CAPACITY ───────────────────────────────────────────

function MachinePanel() {
  const data = INIT_MACHINES.map(m => ({
    ...m, net: m.capacity * m.count * (1 - m.downtime),
  }));
  const minNet = Math.min(...data.map(d => d.net));
  const maxNet = Math.max(...data.map(d => d.net));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {data.map(m => (
          <Card key={m.id} style={{
            flex: 1, minWidth: 140, padding: 14,
            borderColor: m.net === minNet ? T.amber : T.border,
            borderWidth: m.net === minNet ? 2 : 1,
          }}>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: mono, margin: "4px 0" }}>{m.net.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: T.dim }}>MT/day net · {m.count}× · {(m.downtime * 100).toFixed(0)}% down</div>
            {m.net === minNet && <Badge color="#000" bg={T.amber}>BOTTLENECK</Badge>}
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle icon="🏭" title="Machine configuration" desc="Net capacity = raw × count × (1 − downtime). Lowest = bottleneck." />
        <MiniTable
          headers={["Machine", "Activity", "Raw cap.", "Count", "Downtime", "Net capacity", "vs bottleneck"]}
          rows={data.map(m => [
            <span style={{ fontWeight: 600, color: T.text }}>{m.name}</span>,
            m.activity,
            <span style={{ fontFamily: mono }}>{m.capacity} MT</span>,
            <span style={{ fontFamily: mono }}>{m.count}×</span>,
            <span style={{ fontFamily: mono, color: T.amber }}>{(m.downtime * 100).toFixed(0)}%</span>,
            <span style={{ fontFamily: mono, fontWeight: 700, color: m.net === minNet ? T.amber : T.green }}>{m.net.toFixed(1)} MT</span>,
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BarSegment value={m.net} max={maxNet} color={m.net === minNet ? T.amber : T.green} />
              <span style={{ fontSize: 10, fontFamily: mono, color: T.muted }}>{((m.net / maxNet) * 100).toFixed(0)}%</span>
            </div>,
          ])}
        />
      </Card>
    </div>
  );
}

// ─── TAB: SUPPLIER GRADE PROFILES ────────────────────────────────────

function SupplierPanel() {
  const [selSup, setSelSup] = useState("s1");
  const sup = INIT_SUPPLIERS.find(s => s.id === selSup);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {INIT_SUPPLIERS.map(s => (
          <button key={s.id} onClick={() => setSelSup(s.id)} style={{
            padding: "8px 14px", border: `1px solid ${selSup === s.id ? T.coral : T.border}`,
            borderRadius: 8, background: selSup === s.id ? `${T.coral}15` : T.card,
            color: selSup === s.id ? T.coral : T.dim, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {s.name} <span style={{ fontSize: 10, opacity: 0.6 }}>· {s.species}</span>
          </button>
        ))}
      </div>

      {sup && (
        <>
          <Card accent={T.coral}>
            <SectionTitle icon="🚚" title={sup.name} desc={`${sup.species} · Lead time: ${sup.lead} days · Price: ₹${(sup.price/1000).toFixed(0)}K/MT`} />
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 12 }}>
              Expected grade distribution per 10 MT purchased (from historical data):
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140 }}>
              {Object.entries(sup.grades).map(([grade, pct]) => {
                const qty = (pct / 100) * 10;
                return (
                  <div key={grade} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: 9, color: T.dim, fontFamily: mono }}>{pct}%</span>
                    <span style={{ fontSize: 8, color: T.muted, fontFamily: mono }}>{qty.toFixed(1)}MT</span>
                    <div style={{
                      width: "100%", maxWidth: 32, height: Math.max(4, pct * 2.5),
                      background: pct >= 30 ? T.coral : pct >= 15 ? T.amber : T.muted,
                      borderRadius: "3px 3px 0 0", marginTop: 2,
                    }} />
                    <span style={{ fontSize: 9, color: T.muted, fontFamily: mono, marginTop: 2 }}>{grade}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon="🧮" title="Purchase planning calculator" desc="How much unsorted to buy for a target grade quantity" />
            {(() => {
              const targetGrade = Object.entries(sup.grades).sort((a, b) => b[1] - a[1])[0];
              const targetMT = 4.5;
              const purchaseNeeded = targetMT / (targetGrade[1] / 100);
              const withBuffer = purchaseNeeded * 1.15;
              const cost = withBuffer * sup.price;
              return (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <ComputedValue label={`Need ${targetMT} MT of ${targetGrade[0]}`} value={`${targetGrade[0]} @ ${targetGrade[1]}%`} color={T.coral} size="sm" />
                  <ComputedValue label="Unsorted purchase" value={`${purchaseNeeded.toFixed(1)} MT`} color={T.amber} size="sm" />
                  <ComputedValue label="With 15% buffer" value={`${withBuffer.toFixed(1)} MT`} color={T.blue} size="sm" />
                  <ComputedValue label="Estimated cost" value={`₹${(cost / 100000).toFixed(1)}L`} color={T.green} size="sm" />
                </div>
              );
            })()}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────

const TABS = [
  { id: "global", label: "Planning config", icon: "⚙️" },
  { id: "species", label: "Species & grades", icon: "🦐" },
  { id: "yield", label: "Yield chain", icon: "🔗" },
  { id: "machines", label: "Machines", icon: "🏭" },
  { id: "suppliers", label: "Supplier profiles", icon: "🚚" },
];

export default function ConfigDashboard() {
  const [tab, setTab] = useState("global");
  const [config, setConfig] = useState(INIT_PLANNING_CONFIG);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: font }}>
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            <span style={{ color: T.teal }}>🦐</span> Production planning configuration
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
            All parameters that drive the planning engine. Changes here affect order prioritization, batch sizing, and capacity planning.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
          <ComputedValue label="Eff. capacity" value={`${(config.machine_capacity_mt * config.oee_percentage / 100).toFixed(1)} MT`} color={T.teal} size="sm" />
          <ComputedValue label="OEE" value={`${config.oee_percentage}%`} color={T.green} size="sm" />
        </div>
      </div>

      <div style={{
        display: "flex", gap: 1, padding: "0 20px", background: T.card,
        borderBottom: `1px solid ${T.border}`, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", border: "none", background: "transparent",
            color: tab === t.id ? T.teal : T.muted,
            borderBottom: tab === t.id ? `2px solid ${T.teal}` : "2px solid transparent",
            fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: font,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "global" && <GlobalConfigPanel config={config} setConfig={setConfig} />}
        {tab === "species" && <SpeciesGradesPanel />}
        {tab === "yield" && <YieldChainPanel />}
        {tab === "machines" && <MachinePanel />}
        {tab === "suppliers" && <SupplierPanel />}
      </div>
    </div>
  );
}
