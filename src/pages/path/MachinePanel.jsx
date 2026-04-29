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
                        <SectionTitle icon="🚚" title={sup.name} desc={`${sup.species} · Lead time: ${sup.lead} days · Price: ₹${(sup.price / 1000).toFixed(0)}K/MT`} />
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
