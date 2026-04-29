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
  