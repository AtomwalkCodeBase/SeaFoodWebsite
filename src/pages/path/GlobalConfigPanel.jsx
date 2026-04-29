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