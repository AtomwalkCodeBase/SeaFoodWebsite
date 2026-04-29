import { useState, useMemo, useCallback } from "react";

// ─── v3 SAMPLE DATA (mirrors all configurable models) ────────────────

const INIT_CONFIG = {
  label: "Production — ₹100Cr Operation",
  machine_capacity_mt: 8.0, oee_percentage: 85,
  shift_hours: 16, shifts_per_day: 2,
  cold_storage_capacity_mt: 50, procurement_buffer_pct: 15,
  priority_weight_urgency: 0.40, priority_weight_margin: 0.30,
  priority_weight_customer: 0.20, priority_weight_stock: 0.10,
  annual_revenue_target: 1000000000,
};

const SPECIES = [
  { id: "sp-1", name: "Black Tiger", scientific: "Penaeus monodon", alias: "BT", basePrice: 420000, procCost: 45000, certs: ["EU Approved", "FDA Registered", "BAP Certified"] },
  { id: "sp-2", name: "Vannamei", scientific: "Litopenaeus vannamei", alias: "VN", basePrice: 310000, procCost: 45000, certs: ["EU Approved", "BAP Certified"] },
];

const GRADES = [
  { id: "g1", species: "sp-1", code: "8/12", label: "Extra Colossal", min: 8, max: 12, pm: 1.85, ym: 1.06 },
  { id: "g2", species: "sp-1", code: "13/15", label: "Colossal", min: 13, max: 15, pm: 1.65, ym: 1.04 },
  { id: "g3", species: "sp-1", code: "16/20", label: "Extra Jumbo", min: 16, max: 20, pm: 1.50, ym: 1.02 },
  { id: "g4", species: "sp-1", code: "20/25", label: "Jumbo", min: 20, max: 25, pm: 1.40, ym: 1.00 },
  { id: "g5", species: "sp-1", code: "26/30", label: "Extra Large", min: 26, max: 30, pm: 1.20, ym: 0.98 },
  { id: "g6", species: "sp-1", code: "31/40", label: "Large", min: 31, max: 40, pm: 1.05, ym: 0.96 },
  { id: "g7", species: "sp-1", code: "41/50", label: "Medium", min: 41, max: 50, pm: 0.90, ym: 0.94 },
  { id: "g8", species: "sp-2", code: "26/30", label: "Extra Large", min: 26, max: 30, pm: 1.15, ym: 0.98 },
  { id: "g9", species: "sp-2", code: "31/40", label: "Large", min: 31, max: 40, pm: 1.00, ym: 0.96 },
];

// v3 KEY CHANGE: Yield chain is PER PRODUCT via Product → ProcessFlow → ProcessActivity → ActivityYieldConfig
const PRODUCTS = [
  {
    id: "p1", code: "IQF-CKD", name: "IQF Cooked Prawns 1kg",
    processFlow: "IQF Cooking Process", species: ["sp-1", "sp-2"],
    steps: [
      { seq: 1, activity: "Cleaning", yield: 0.92, pre: true, eff: 200, loss: "Shells, heads, waste", equip: "Cleaning Line A" },
      { seq: 2, activity: "Cooking", yield: 0.85, pre: false, eff: 150, loss: "Moisture & protein", equip: "Cooking Line A" },
      { seq: 3, activity: "IQF Freezing", yield: 0.98, pre: false, eff: 180, loss: "Minor sublimation", equip: "IQF Tunnel" },
      { seq: 4, activity: "Glazing", yield: 1.03, pre: false, eff: 220, loss: "Glaze adds weight", equip: "Glazing Unit A" },
      { seq: 5, activity: "Packing", yield: 0.99, pre: false, eff: 160, loss: "Minor spillage", equip: "Packing Line A" },
    ],
  },
  {
    id: "p2", code: "RAW-BLK", name: "Raw Block Frozen 2kg",
    processFlow: "Raw Block Process", species: ["sp-1", "sp-2"],
    steps: [
      { seq: 1, activity: "Cleaning", yield: 0.92, pre: true, eff: 200, loss: "Shells, heads, waste", equip: "Cleaning Line A" },
      { seq: 2, activity: "Block Freezing", yield: 0.99, pre: false, eff: 250, loss: "Minimal loss", equip: "Plate Freezer" },
      { seq: 3, activity: "Glazing", yield: 1.05, pre: false, eff: 220, loss: "Heavy glaze", equip: "Glazing Unit A" },
      { seq: 4, activity: "Packing", yield: 0.99, pre: false, eff: 160, loss: "Minor spillage", equip: "Packing Line A" },
    ],
  },
  {
    id: "p3", code: "PD-RAW", name: "Peeled & Deveined Raw IQF",
    processFlow: "PD Raw Process", species: ["sp-1"],
    steps: [
      { seq: 1, activity: "Cleaning", yield: 0.92, pre: true, eff: 200, loss: "Shells, heads, waste", equip: "Cleaning Line A" },
      { seq: 2, activity: "Deveining", yield: 0.95, pre: false, eff: 120, loss: "Vein removal loss", equip: "Deveining Station" },
      { seq: 3, activity: "IQF Freezing", yield: 0.98, pre: false, eff: 180, loss: "Minor sublimation", equip: "IQF Tunnel" },
      { seq: 4, activity: "Packing", yield: 0.99, pre: false, eff: 160, loss: "Minor spillage", equip: "Packing Line A" },
    ],
  },
  {
    id: "p4", code: "WHL-CKD", name: "Whole Cooked Shell-On",
    processFlow: "Whole Cooked Process", species: ["sp-1"],
    steps: [
      { seq: 1, activity: "Light Wash", yield: 0.98, pre: true, eff: 300, loss: "Surface debris only", equip: "Wash Line" },
      { seq: 2, activity: "Cooking", yield: 0.87, pre: false, eff: 150, loss: "Moisture loss (shell-on)", equip: "Cooking Line A" },
      { seq: 3, activity: "Glazing", yield: 1.04, pre: false, eff: 220, loss: "Glaze coating", equip: "Glazing Unit A" },
      { seq: 4, activity: "Packing", yield: 0.99, pre: false, eff: 160, loss: "Minor spillage", equip: "Packing Line A" },
    ],
  },
];

const MACHINES = [
  { id: "m1", name: "Cleaning Line A", equip: "EQ-CLN-01", capacity: 10, count: 2, downtime: 0.08 },
  { id: "m2", name: "Cooking Line A", equip: "EQ-CKR-01", capacity: 8, count: 3, downtime: 0.10 },
  { id: "m3", name: "IQF Tunnel", equip: "EQ-IQF-01", capacity: 6, count: 2, downtime: 0.05 },
  { id: "m4", name: "Plate Freezer", equip: "EQ-PLF-01", capacity: 7, count: 1, downtime: 0.06 },
  { id: "m5", name: "Glazing Unit A", equip: "EQ-GLZ-01", capacity: 9, count: 2, downtime: 0.04 },
  { id: "m6", name: "Packing Line A", equip: "EQ-PKG-01", capacity: 7, count: 2, downtime: 0.07 },
  { id: "m7", name: "Deveining Station", equip: "EQ-DVN-01", capacity: 4, count: 3, downtime: 0.05 },
];

const SUPPLIERS = [
  { id: "s1", name: "KeralaFish Exports", species: "Black Tiger", lead: 3, price: 420000, grades: { "8/12": 5, "13/15": 10, "16/20": 20, "20/25": 35, "26/30": 20, "31/40": 8, "41/50": 2 } },
  { id: "s2", name: "Coastal Marine Pvt", species: "Vannamei", lead: 2, price: 310000, grades: { "26/30": 55, "31/40": 35, "41/50": 10 } },
  { id: "s3", name: "Bay of Bengal Co", species: "Black Tiger", lead: 4, price: 395000, grades: { "8/12": 8, "13/15": 12, "16/20": 22, "20/25": 30, "26/30": 18, "31/40": 8, "41/50": 2 } },
];

// ─── DESIGN TOKENS ───────────────────────────────────────────────────
const C = {
  bg: "#080c14", surface: "#0f1520", surface2: "#171f2e", border: "#1c2538",
  text: "#dfe4ed", dim: "#8b95a8", muted: "#5b6578",
  blue: "#4da6ff", teal: "#36d6b5", green: "#43d98c", amber: "#f0b429",
  red: "#f06060", purple: "#9b7dfa", coral: "#f28b5e", pink: "#e86baf",
};
const mono = "'IBM Plex Mono', 'Fira Code', monospace";
const sans = "'Outfit', 'DM Sans', system-ui, sans-serif";

// ─── REUSABLE ────────────────────────────────────────────────────────

const Card = ({ children, style, accent }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, borderTop: accent ? `3px solid ${accent}` : undefined, ...style }}>{children}</div>
);

const Heading = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: C.text, fontFamily: sans }}>{title}</span>
    </div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, marginLeft: 25 }}>{sub}</div>}
  </div>
);

const Metric = ({ label, value, color = C.blue, small }) => (
  <div style={{ background: C.surface2, borderRadius: 8, padding: small ? "6px 10px" : "10px 14px", minWidth: small ? 100 : 130 }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: small ? 14 : 20, fontWeight: 700, color, fontFamily: mono }}>{value}</div>
  </div>
);

const Tag = ({ children, color = C.blue, bg }) => (
  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600, color, background: bg || `${color}20`, letterSpacing: 0.4 }}>{children}</span>
);

const Input = ({ label, value, onChange, suffix, disabled, help, width, step, min, max, type = "number" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: width || 120 }}>
    <label style={{ fontSize: 10, color: C.dim, fontWeight: 500 }}>{label}</label>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input type={type} value={value} disabled={disabled} min={min} max={max} step={step || "any"}
        onChange={e => onChange?.(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={{ background: disabled ? C.surface2 : C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: "6px 10px", color: disabled ? C.muted : C.text, fontSize: 13, fontFamily: type === "number" ? mono : sans, width: "100%", outline: "none" }} />
      {suffix && <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>{suffix}</span>}
    </div>
    {help && <span style={{ fontSize: 9, color: C.muted }}>{help}</span>}
  </div>
);

const Bar = ({ value, max, color, h = 7 }) => (
  <div style={{ height: h, background: C.surface2, borderRadius: 4, flex: 1 }}>
    <div style={{ height: "100%", width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
  </div>
);

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr>{headers.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "5px 8px", color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: `1px solid ${C.border}10` }}>{row.map((cell, ci) => <td key={ci} style={{ padding: "5px 8px", color: C.text, whiteSpace: "nowrap" }}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

// ─── TAB 1: GLOBAL CONFIG ────────────────────────────────────────────

function GlobalConfigTab({ config, setConfig }) {
  const eff = config.machine_capacity_mt * (config.oee_percentage / 100);
  const set = k => v => setConfig(p => ({ ...p, [k]: v }));

  // Sample priority score demo
  const demo = useMemo(() => {
    const u = Math.max(0, Math.min(100, 100 - 8 * 5));
    const m = 72, c = 75, s = 100;
    return { u, m, c, s, total: u * config.priority_weight_urgency + m * config.priority_weight_margin + c * config.priority_weight_customer + s * config.priority_weight_stock };
  }, [config]);

  const wSum = config.priority_weight_urgency + config.priority_weight_margin + config.priority_weight_customer + config.priority_weight_stock;
  const wValid = Math.abs(wSum - 1.0) < 0.01;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Metric label="Effective capacity" value={`${eff.toFixed(1)} MT/d`} color={C.teal} />
        <Metric label="Daily output (est.)" value={`${(eff * 0.797).toFixed(1)} MT/d`} color={C.green} />
        <Metric label="Annual (300d)" value={`${Math.round(eff * 0.797 * 300)} MT`} color={C.amber} />
        <Metric label="Revenue est." value={`₹${((eff * 0.797 * 300 * 750000) / 10000000).toFixed(0)} Cr`} color={C.purple} />
      </div>

      <Card accent={C.blue}>
        <Heading icon="⚙️" title="Capacity parameters" sub="API: GET /api/planning/config/active/" />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Input label="Machine capacity" value={config.machine_capacity_mt} onChange={set("machine_capacity_mt")} suffix="MT/d" />
          <Input label="OEE %" value={config.oee_percentage} onChange={set("oee_percentage")} suffix="%" min={0} max={100} />
          <Input label="Effective cap." value={eff.toFixed(2)} disabled suffix="MT/d" />
          <Input label="Shift hours" value={config.shift_hours} onChange={set("shift_hours")} suffix="hrs" />
          <Input label="Shifts/day" value={config.shifts_per_day} onChange={set("shifts_per_day")} />
          <Input label="Cold storage" value={config.cold_storage_capacity_mt} onChange={set("cold_storage_capacity_mt")} suffix="MT" />
          <Input label="Procurement buffer" value={config.procurement_buffer_pct} onChange={set("procurement_buffer_pct")} suffix="%" />
        </div>
      </Card>

      <Card accent={C.purple}>
        <Heading icon="🎯" title="Priority scoring weights" sub="Drives order ranking in planning engine. Must sum to 1.00." />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
          <Input label="Delivery urgency" value={config.priority_weight_urgency} onChange={set("priority_weight_urgency")} step={0.05} min={0} max={1} />
          <Input label="Margin/MT" value={config.priority_weight_margin} onChange={set("priority_weight_margin")} step={0.05} min={0} max={1} />
          <Input label="Customer tier" value={config.priority_weight_customer} onChange={set("priority_weight_customer")} step={0.05} min={0} max={1} />
          <Input label="Stock available" value={config.priority_weight_stock} onChange={set("priority_weight_stock")} step={0.05} min={0} max={1} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", gap: 1, height: 18, borderRadius: 4, overflow: "hidden" }}>
            {[{ w: config.priority_weight_urgency, c: C.red, l: "U" }, { w: config.priority_weight_margin, c: C.green, l: "M" }, { w: config.priority_weight_customer, c: C.purple, l: "C" }, { w: config.priority_weight_stock, c: C.blue, l: "S" }].map(({ w, c, l }) => (
              <div key={l} style={{ width: `${w * 100}%`, background: c, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, color: "#fff", fontWeight: 700 }}>{l} {(w * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, fontFamily: mono, color: wValid ? C.green : C.red, fontWeight: 700 }}>Σ={wSum.toFixed(2)} {wValid ? "✓" : "✗"}</span>
        </div>

        <div style={{ marginTop: 14, padding: 12, background: C.surface2, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Live score preview — sample order (8 days, 72% margin, Tier 2, stock available)</div>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 250 }}>
              {[{ l: "Urgency", v: demo.u, w: config.priority_weight_urgency, c: C.red },
                { l: "Margin", v: demo.m, w: config.priority_weight_margin, c: C.green },
                { l: "Customer", v: demo.c, w: config.priority_weight_customer, c: C.purple },
                { l: "Stock", v: demo.s, w: config.priority_weight_stock, c: C.blue }].map(({ l, v, w, c }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{ width: 60, color: C.dim }}>{l}</span>
                  <span style={{ width: 24, fontFamily: mono, color: C.muted, textAlign: "right" }}>{v}</span>
                  <span style={{ color: C.muted, fontSize: 9 }}>×</span>
                  <span style={{ width: 28, fontFamily: mono, color: c }}>{w.toFixed(2)}</span>
                  <span style={{ color: C.muted, fontSize: 9 }}>=</span>
                  <span style={{ width: 28, fontFamily: mono, color: c, fontWeight: 600 }}>{(v * w).toFixed(1)}</span>
                  <Bar value={v * w} max={50} color={c} />
                </div>
              ))}
            </div>
            <Metric label="Score" value={demo.total.toFixed(0)} color={demo.total >= 75 ? C.red : demo.total >= 50 ? C.amber : C.muted} small />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 2: SPECIES & GRADES ─────────────────────────────────────────

function SpeciesGradesTab() {
  const [sel, setSel] = useState("sp-1");
  const sp = SPECIES.find(s => s.id === sel);
  const gr = GRADES.filter(g => g.species === sel);
  const maxCost = sp ? Math.max(...gr.map(g => sp.basePrice * g.pm)) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {SPECIES.map(s => (
          <button key={s.id} onClick={() => setSel(s.id)} style={{ padding: "7px 14px", border: `1px solid ${sel === s.id ? C.teal : C.border}`, borderRadius: 8, background: sel === s.id ? `${C.teal}15` : C.surface, color: sel === s.id ? C.teal : C.dim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: sans }}>
            {s.name} <span style={{ fontSize: 9, opacity: 0.6 }}>({s.alias})</span>
          </button>
        ))}
      </div>

      {sp && (
        <Card accent={C.teal}>
          <Heading icon="🦐" title={sp.name} sub={`${sp.scientific} · Extends ERP ItemCategory "${sp.alias}" · API: GET /api/planning/species/`} />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
            <Input label="Base price/MT" value={sp.basePrice} suffix="₹" width={140} />
            <Input label="Processing cost/MT" value={sp.procCost} suffix="₹" width={140} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: C.dim }}>Export certifications</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{sp.certs.map(c => <Tag key={c} color={C.green}>{c}</Tag>)}</div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Heading icon="📐" title="Grade configuration" sub="Each grade extends ERP StockItem with price & yield multipliers" />
        <Table
          headers={["Grade", "Label", "Count/lb", "Price×", "RM cost/MT", "Yield×", "Margin/MT"]}
          rows={gr.map(g => {
            const rmCost = sp.basePrice * g.pm;
            const margin = 750000 - rmCost - sp.procCost;
            return [
              <span style={{ fontFamily: mono, fontWeight: 700, color: C.blue }}>{g.code}</span>, g.label,
              <span style={{ fontFamily: mono, color: C.dim }}>{g.min}–{g.max}</span>,
              <span style={{ fontFamily: mono, color: g.pm > 1.4 ? C.amber : C.text }}>{g.pm.toFixed(3)}</span>,
              <span style={{ fontFamily: mono }}>₹{(rmCost / 1000).toFixed(0)}K</span>,
              <span style={{ fontFamily: mono, color: g.ym > 1 ? C.green : g.ym < 1 ? C.red : C.text }}>{g.ym.toFixed(3)}</span>,
              <span style={{ fontFamily: mono, fontWeight: 600, color: margin > 150000 ? C.green : margin > 0 ? C.amber : C.red }}>₹{(margin / 1000).toFixed(0)}K</span>,
            ];
          })}
        />
      </Card>

      <Card accent={C.purple}>
        <Heading icon="💰" title="Grade price comparison" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 120, padding: "0 6px" }}>
          {gr.map(g => {
            const cost = sp.basePrice * g.pm;
            return (
              <div key={g.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 2 }}>
                <span style={{ fontSize: 8, color: C.dim, fontFamily: mono }}>₹{(cost / 1000).toFixed(0)}K</span>
                <div style={{ width: "100%", maxWidth: 30, height: Math.max(4, (cost / maxCost) * 95), background: `linear-gradient(to top, ${C.purple}, ${C.blue})`, borderRadius: "3px 3px 0 0", opacity: 0.75 }} />
                <span style={{ fontSize: 9, color: C.muted, fontFamily: mono }}>{g.code}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 3: YIELD CHAIN (PER PRODUCT — v3 key change) ────────────────

function YieldChainTab() {
  const [selProd, setSelProd] = useState("p1");
  const [inputMT, setInputMT] = useState(10);
  const product = PRODUCTS.find(p => p.id === selProd);

  const chain = useMemo(() => {
    if (!product) return [];
    let w = inputMT;
    return product.steps.map(s => {
      const out = w * s.yield;
      const r = { ...s, input: w, output: out, loss: w - out };
      w = out;
      return r;
    });
  }, [product, inputMT]);

  const totalYield = product ? product.steps.reduce((a, s) => a * s.yield, 1) : 0;
  const finalOutput = inputMT * totalYield;
  const preYield = product ? product.steps.filter(s => s.pre).reduce((a, s) => a * s.yield, 1) : 1;
  const postYield = product ? product.steps.filter(s => !s.pre).reduce((a, s) => a * s.yield, 1) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Product selector — THIS IS THE v3 CHANGE */}
      <div>
        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Select product (each has its own ProcessFlow → yield chain)</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {PRODUCTS.map(p => {
            const y = p.steps.reduce((a, s) => a * s.yield, 1);
            return (
              <button key={p.id} onClick={() => setSelProd(p.id)} style={{
                padding: "8px 12px", border: `1px solid ${selProd === p.id ? C.teal : C.border}`,
                borderRadius: 8, background: selProd === p.id ? `${C.teal}12` : C.surface,
                color: selProd === p.id ? C.teal : C.dim, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: sans, textAlign: "left",
              }}>
                <div>{p.code}</div>
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>{p.name} · {(y * 100).toFixed(1)}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {product && (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <Metric label="Total yield" value={`${(totalYield * 100).toFixed(1)}%`} color={C.teal} />
            <Metric label="Pre-grading yield" value={`${(preYield * 100).toFixed(1)}%`} color={C.amber} />
            <Metric label="Post-grading yield" value={`${(postYield * 100).toFixed(1)}%`} color={C.purple} />
            <Metric label="Final output" value={`${finalOutput.toFixed(2)} MT`} color={C.green} />
            <Input label="Simulate input" value={inputMT} onChange={setInputMT} suffix="MT" width={90} min={0.1} step={0.5} />
          </div>

          <Card>
            <Heading icon="🔗" title={`${product.code} — ${product.name}`} sub={`ProcessFlow: "${product.processFlow}" · API: GET /api/planning/yield-configs/by-product/${product.id}/`} />
            <Table
              headers={["#", "Activity (ProcessActivity)", "Phase", "Yield %", "Input MT", "Output MT", "Loss/Gain", "Worker eff.", "Equipment", "Loss reason"]}
              rows={chain.map(s => [
                <span style={{ fontFamily: mono, color: C.muted }}>{s.seq}</span>,
                <span style={{ fontWeight: 600, color: C.text }}>{s.activity}</span>,
                <Tag color={s.pre ? C.teal : C.purple}>{s.pre ? "PRE-GRADE" : "POST-GRADE"}</Tag>,
                <span style={{ fontFamily: mono, fontWeight: 700, color: s.yield > 1 ? C.green : s.yield < 0.9 ? C.red : C.amber }}>{(s.yield * 100).toFixed(1)}%</span>,
                <span style={{ fontFamily: mono }}>{s.input.toFixed(3)}</span>,
                <span style={{ fontFamily: mono }}>{s.output.toFixed(3)}</span>,
                <span style={{ fontFamily: mono, color: s.loss > 0 ? C.red : C.green }}>{s.loss > 0 ? `−${s.loss.toFixed(3)}` : `+${Math.abs(s.loss).toFixed(3)}`}</span>,
                <span style={{ fontFamily: mono }}>{s.eff} kg/hr</span>,
                <span style={{ fontSize: 10, color: C.dim }}>{s.equip}</span>,
                <span style={{ fontSize: 10, color: C.muted }}>{s.loss_desc || s.loss}</span>,
              ])}
            />
          </Card>

          {/* Material flow visualization */}
          <Card accent={C.teal}>
            <Heading icon="📉" title="Material flow" sub={`${inputMT} MT input → ${finalOutput.toFixed(2)} MT output`} />
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "4px 0" }}>
              <div style={{ padding: "8px 10px", background: C.surface2, borderRadius: 8, textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 8, color: C.muted }}>RAW</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.blue, fontFamily: mono }}>{inputMT.toFixed(1)}</div>
              </div>
              {chain.map((s, i) => {
                const sc = s.pre ? C.teal : [C.red, C.amber, C.green, C.purple, C.coral][i % 5];
                return (
                  <div key={s.seq} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ width: 22, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: C.muted }}>→</div>
                      <div style={{ fontSize: 7, color: s.yield > 1 ? C.green : C.red, fontFamily: mono }}>{s.yield > 1 ? "+" : ""}{((s.yield - 1) * 100).toFixed(0)}%</div>
                    </div>
                    <div style={{ padding: "7px 10px", background: `${sc}10`, border: `1px solid ${sc}30`, borderRadius: 8, textAlign: "center", minWidth: 70 }}>
                      <div style={{ fontSize: 8, color: sc, fontWeight: 600, textTransform: "uppercase" }}>{s.activity}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: mono }}>{s.output.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ width: 22, textAlign: "center" }}><span style={{ fontSize: 12, color: C.muted }}>→</span></div>
              <div style={{ padding: "8px 10px", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 8, textAlign: "center", minWidth: 60 }}>
                <div style={{ fontSize: 8, color: C.green, fontWeight: 600 }}>FINISHED</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: mono }}>{finalOutput.toFixed(2)}</div>
              </div>
            </div>
          </Card>

          {/* Compare all products */}
          <Card>
            <Heading icon="📊" title="Product yield comparison" sub="Same raw input, different routes, different outputs" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PRODUCTS.map(p => {
                const y = p.steps.reduce((a, s) => a * s.yield, 1);
                const out = inputMT * y;
                const isSel = p.id === selProd;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: isSel ? 1 : 0.7 }}>
                    <span style={{ width: 70, fontSize: 11, fontWeight: isSel ? 700 : 400, color: isSel ? C.teal : C.dim, fontFamily: mono }}>{p.code}</span>
                    <span style={{ width: 50, fontSize: 11, fontFamily: mono, color: C.text }}>{(y * 100).toFixed(1)}%</span>
                    <Bar value={y} max={1} color={isSel ? C.teal : C.muted} h={10} />
                    <span style={{ width: 65, fontSize: 11, fontFamily: mono, color: C.green, textAlign: "right" }}>{out.toFixed(2)} MT</span>
                    <span style={{ fontSize: 9, color: C.muted }}>{p.steps.length} steps</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── TAB 4: MACHINES ─────────────────────────────────────────────────

function MachinesTab() {
  const data = MACHINES.map(m => ({ ...m, net: m.capacity * m.count * (1 - m.downtime) }));
  const minNet = Math.min(...data.map(d => d.net));
  const maxNet = Math.max(...data.map(d => d.net));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {data.map(m => (
          <Card key={m.id} style={{ flex: "1 1 140px", minWidth: 130, padding: 12, borderColor: m.net === minNet ? C.amber : C.border, borderWidth: m.net === minNet ? 2 : 1 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>{m.name}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: mono, margin: "3px 0" }}>{m.net.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: C.dim }}>MT/d net · {m.count}× · {(m.downtime * 100).toFixed(0)}% down</div>
            {m.net === minNet && <Tag color="#000" bg={C.amber}>BOTTLENECK</Tag>}
          </Card>
        ))}
      </div>

      <Card>
        <Heading icon="🏭" title="Machine capacity config" sub="Extends ERP EquipmentMachine via MachineCapacityConfig · API: GET /api/planning/machines/status/" />
        <Table
          headers={["Machine", "ERP Equipment", "Raw cap.", "Count", "Downtime", "Net capacity", "vs best", "Used by products"]}
          rows={data.map(m => {
            const usedBy = PRODUCTS.filter(p => p.steps.some(s => s.equip === m.name)).map(p => p.code);
            return [
              <span style={{ fontWeight: 600, color: C.text }}>{m.name}</span>,
              <span style={{ fontFamily: mono, fontSize: 10, color: C.dim }}>{m.equip}</span>,
              <span style={{ fontFamily: mono }}>{m.capacity} MT</span>,
              <span style={{ fontFamily: mono }}>{m.count}×</span>,
              <span style={{ fontFamily: mono, color: C.amber }}>{(m.downtime * 100).toFixed(0)}%</span>,
              <span style={{ fontFamily: mono, fontWeight: 700, color: m.net === minNet ? C.amber : C.green }}>{m.net.toFixed(1)} MT</span>,
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Bar value={m.net} max={maxNet} color={m.net === minNet ? C.amber : C.green} />
                <span style={{ fontSize: 9, fontFamily: mono, color: C.muted }}>{((m.net / maxNet) * 100).toFixed(0)}%</span>
              </div>,
              <div style={{ display: "flex", gap: 3 }}>{usedBy.map(c => <Tag key={c} color={C.blue}>{c}</Tag>)}</div>,
            ];
          })}
        />
      </Card>
    </div>
  );
}

// ─── TAB 5: SUPPLIERS ────────────────────────────────────────────────

function SuppliersTab() {
  const [sel, setSel] = useState("s1");
  const sup = SUPPLIERS.find(s => s.id === sel);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SUPPLIERS.map(s => (
          <button key={s.id} onClick={() => setSel(s.id)} style={{ padding: "7px 12px", border: `1px solid ${sel === s.id ? C.coral : C.border}`, borderRadius: 8, background: sel === s.id ? `${C.coral}12` : C.surface, color: sel === s.id ? C.coral : C.dim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: sans }}>
            {s.name} <span style={{ fontSize: 9, opacity: 0.6 }}>· {s.species}</span>
          </button>
        ))}
      </div>
      {sup && (
        <>
          <Card accent={C.coral}>
            <Heading icon="🚚" title={sup.name} sub={`${sup.species} · Lead: ${sup.lead}d · ₹${(sup.price / 1000).toFixed(0)}K/MT · API: GET /api/planning/supplier-profiles/by-supplier/${sup.id}/`} />
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Grade distribution per 10 MT (from SupplierGradeProfile historical data):</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
              {Object.entries(sup.grades).map(([g, pct]) => (
                <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <span style={{ fontSize: 8, fontFamily: mono, color: C.dim }}>{pct}%</span>
                  <span style={{ fontSize: 7, fontFamily: mono, color: C.muted }}>{(pct / 100 * 10).toFixed(1)}MT</span>
                  <div style={{ width: "100%", maxWidth: 28, height: Math.max(3, pct * 2.2), background: pct >= 30 ? C.coral : pct >= 15 ? C.amber : C.muted, borderRadius: "3px 3px 0 0", marginTop: 2 }} />
                  <span style={{ fontSize: 8, fontFamily: mono, color: C.muted, marginTop: 2 }}>{g}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Heading icon="🧮" title="Purchase calculator" sub="How much unsorted to buy for a target grade" />
            {(() => {
              const best = Object.entries(sup.grades).sort((a, b) => b[1] - a[1])[0];
              const need = 4.5, unsorted = need / (best[1] / 100), buffered = unsorted * 1.15, cost = buffered * sup.price;
              return (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Metric label={`Need ${need} MT of ${best[0]}`} value={`${best[0]} @ ${best[1]}%`} color={C.coral} small />
                  <Metric label="Unsorted purchase" value={`${unsorted.toFixed(1)} MT`} color={C.amber} small />
                  <Metric label="With 15% buffer" value={`${buffered.toFixed(1)} MT`} color={C.blue} small />
                  <Metric label="Est. cost" value={`₹${(cost / 100000).toFixed(1)}L`} color={C.green} small />
                </div>
              );
            })()}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── TAB 6: API REFERENCE ────────────────────────────────────────────

function ApiTab() {
  const endpoints = [
    { method: "GET", path: "/api/planning/config/active/", desc: "Active planning config" },
    { method: "PUT", path: "/api/planning/config/{id}/", desc: "Update planning config" },
    { method: "GET", path: "/api/planning/species/", desc: "Species with grades" },
    { method: "GET", path: "/api/planning/grades/", desc: "All grade configs" },
    { method: "GET", path: "/api/planning/yield-configs/by-product/{id}/", desc: "Yield chain for a product" },
    { method: "GET", path: "/api/planning/machines/status/", desc: "Machines with bottleneck detection" },
    { method: "GET", path: "/api/planning/supplier-profiles/by-supplier/{id}/", desc: "Supplier grade profiles" },
    { method: "GET", path: "/api/planning/orders/priority-queue/", desc: "Orders ranked by planning engine" },
    { method: "GET", path: "/api/planning/engine/report/", desc: "Full planning report" },
    { method: "POST", path: "/api/planning/engine/generate/", desc: "Generate daily plan + create batches" },
    { method: "POST", path: "/api/planning/batches/{id}/advance-activity/", desc: "Advance batch to next step" },
    { method: "POST", path: "/api/planning/batches/{id}/create-sub-batches/", desc: "Create graded sub-batches" },
    { method: "POST", path: "/api/planning/batches/{id}/auto-allocate/", desc: "Auto-allocate output to orders" },
    { method: "GET", path: "/api/planning/engine/yield-simulation/", desc: "Simulate yield for product+grade" },
    { method: "GET", path: "/api/planning/engine/procurement-suggestions/", desc: "Supplier suggestions for shortfalls" },
    { method: "GET", path: "/api/planning/dashboard/summary/", desc: "Dashboard summary metrics" },
  ];

  return (
    <Card>
      <Heading icon="🔌" title="v3 API endpoints" sub="All endpoints require IsAuthenticated. Base path: /api/planning/" />
      <Table
        headers={["Method", "Endpoint", "Description"]}
        rows={endpoints.map(ep => [
          <Tag color={ep.method === "GET" ? C.green : C.amber} bg={ep.method === "GET" ? `${C.green}20` : `${C.amber}20`}>{ep.method}</Tag>,
          <span style={{ fontFamily: mono, fontSize: 11, color: C.blue }}>{ep.path}</span>,
          <span style={{ color: C.dim, fontSize: 11 }}>{ep.desc}</span>,
        ])}
      />
    </Card>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────

const TABS = [
  { id: "config", label: "Planning config", icon: "⚙️" },
  { id: "species", label: "Species & grades", icon: "🦐" },
  { id: "yield", label: "Yield chain", icon: "🔗" },
  { id: "machines", label: "Machines", icon: "🏭" },
  { id: "suppliers", label: "Suppliers", icon: "🚚" },
  { id: "api", label: "API reference", icon: "🔌" },
];

export default function ConfigDashboardV3() {
  const [tab, setTab] = useState("config");
  const [config, setConfig] = useState(INIT_CONFIG);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: sans }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
            <span style={{ color: C.teal }}>🦐</span> Production planning configuration <Tag color={C.purple}>v3</Tag>
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Extends ERP: Product → ProcessFlow → ProcessActivity → ActivityYieldConfig</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Metric label="Eff. cap." value={`${(config.machine_capacity_mt * config.oee_percentage / 100).toFixed(1)} MT`} color={C.teal} small />
          <Metric label="Products" value={PRODUCTS.length} color={C.purple} small />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 1, padding: "0 20px", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 13px", border: "none", background: "transparent",
            color: tab === t.id ? C.teal : C.muted,
            borderBottom: tab === t.id ? `2px solid ${C.teal}` : "2px solid transparent",
            fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: sans,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        {tab === "config" && <GlobalConfigTab config={config} setConfig={setConfig} />}
        {tab === "species" && <SpeciesGradesTab />}
        {tab === "yield" && <YieldChainTab />}
        {tab === "machines" && <MachinesTab />}
        {tab === "suppliers" && <SuppliersTab />}
        {tab === "api" && <ApiTab />}
      </div>
    </div>
  );
}
