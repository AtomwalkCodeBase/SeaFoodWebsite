import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { AddYieldConfig, getProcessActivityList, getProductList, getYieldConfig, UpdateYieldConfig } from "../services/productServices";
import { toast } from "react-toastify";
import ConfirmPopup from "../components/ConfirmPopup";

// ── Reusable Components ───────────────────────────────────────────────────────

const Badge = ({ type }) => {
  const isPre = type === "PRE-GRADE";
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider border ${isPre ? "bg-phasePre text-phasePreText border-phasePreText" : "bg-phasePost text-phasePostText border-phasePostText"}`}>
      {type}
    </span>
  );
};

const StatCard = ({ label, value, colorClass }) => (
  <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex-1 min-w-[130px]">
    <div className="text-xs font-medium uppercase tracking-wider text-textLight mb-2">
      {label}
    </div>
    <div className={`text-3xl font-bold ${colorClass || 'text-text'}`}>{value}</div>
  </div>
);

const ProductTab = ({ product, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 pl-2 pr-5 rounded-xl cursor-pointer text-left transition-all duration-200 min-w-[165px] font-body shadow-sm ${active
      ? "border-2 border-primary bg-gradient-to-br from-secondary to-primary text-white shadow-md shadow-primary/30"
      : "border border-border bg-card text-text hover:border-primary"
      }`}
  >
    <div className="text-sm font-bold">{product.label}</div>
    <div className={`text-[10px] mt-0.5 ${active ? "opacity-85" : "opacity-60"}`}>{product.desc}</div>
    <div className={`text-base font-bold mt-1.5 ${active ? "text-white" : "text-primary"}`}>
      {product.yield}%
    </div>
  </button>
);

const FlowNode = ({ node, isLast }) => {
  const isRaw = node.label === "RAW";
  const isFinished = node.label === "FINISHED";
  const isPos = node.delta?.startsWith("+");

  let nodeStyle = "border-border bg-card shadow-sm";
  let valColor = "text-text";

  if (isFinished) {
    nodeStyle = "border-success/40 bg-success/10 shadow-sm";
    valColor = "text-success";
  } else if (isRaw) {
    nodeStyle = "border-primary/40 bg-primary/10 shadow-sm";
    valColor = "text-primary";
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`rounded-lg px-3.5 py-2.5 text-center min-w-[72px] sm:min-w-[90px] border ${nodeStyle}`}>
        <div className="text-[9px] font-semibold tracking-wider text-textLight mb-1">
          {node.label}
        </div>
        <div className={`text-lg font-bold leading-none ${valColor}`}>
          {node.val}
        </div>
        {node.delta && (
          <div className={`text-[10px] font-semibold mt-1 ${isPos ? "text-success" : "text-error"}`}>
            {node.delta}
          </div>
        )}
      </div>
      {!isLast && <span className="text-textLight text-base">→</span>}
    </div>
  );
};

const YieldBar = ({ product, inputMT, active }) => {
  const output = (inputMT * product.yield / 100).toFixed(2);
  return (
    <div className="flex items-center gap-3 py-1 border-b border-border last:border-b-0">
      <div className={`w-18 text-xs font-semibold ${active ? "text-primary" : "text-textLight"}`}>{product.label}</div>
      <div className="text-xs text-textLight w-10">{product.yield}%</div>
      <div className="flex-1 bg-backgroundAlt rounded-md h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-md transition-all duration-500 ease-in-out ${active ? "bg-gradient-to-r from-primary to-secondary" : "bg-border"}`}
          style={{ width: `${product.yield}%` }}
        />
      </div>
      <div className="text-xs font-semibold text-text min-w-[52px] text-right">{output} MT</div>
      <div className="text-[10px] text-textLight w-12">{product.steps} steps</div>
    </div>
  );
};

const SectionCard = ({ children, className = "" }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, sub }) => (
  <div className="p-2  border-b border-border">
    <div className="text-base font-bold flex items-center gap-2.5 text-text">
      <span>{icon}</span> {title}
    </div>
    {sub && <div className="text-xs text-textLight mt-1">{sub}</div>}
  </div>
);

// ── Derived helpers ───────────────────────────────────────────────────────────
const yieldColorClass = (pct) => (pct >= 100 ? "text-success" : pct >= 95 ? "text-primary" : "text-warning");
const lossGainColorClass = (loss) => (loss >= 0 ? "text-success" : "text-error");

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function YieldConfigScreen() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [activitiesData, setActivitiesData] = useState([]);
  const [yieldsData, setYieldsData] = useState([]);
  const [inputMT, setInputMT] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    process_activity: "",
    sequence: "",
    yield_percentage: "",
    loss_description: "",
    is_pre_grading: false,
    worker_efficiency_kg_per_hour: "",
    processing_cost_per_mt: ""
  });

  const handleEditClick = (rawYield) => {
    setEditFormData({
      id: rawYield?.yield_percentage || "",
      process_activity: rawYield?.process_activity || "",
      sequence: rawYield?.sequence || "",
      yield_percentage: rawYield?.yield_percentage || "",
      loss_description: rawYield?.loss_description || "",
      is_pre_grading: rawYield?.is_pre_grading || false,
      worker_efficiency_kg_per_hour: rawYield?.worker_efficiency_kg_per_hour || "",
      processing_cost_per_mt: rawYield?.processing_cost_per_mt || ""
    });
    setIsModalOpen(true);
  };

  // Chart theme colors corresponding to light theme
  const chartColors = {
    textLight: "#5A7A8A",
    primary: "#0E7A91",
    border: "#C8DDED",
    card: "#FFFFFF",
    text: "#0D2B3E"
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchDetails(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProductList();
      const list = res.data || [];
      setProducts(list);
      if (list.length > 0) {
        setSelectedProductId(list[0].id);
      }
    } catch (error) {
      toast.error("Failed to load product list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (productId) => {
    try {
      const actRes = await getProcessActivityList({ product_id: productId });
      setActivitiesData(actRes.data || []);

      const yieldRes = await getYieldConfig({ product_id: productId });
      setYieldsData(yieldRes.data || []);
    } catch (error) {
      toast.error("Failed to load process details.");
    }
  };

  if (loading) {
    return (
      <div className="font-body bg-background min-h-screen p-6 flex items-center justify-center">
        <div className="text-text font-semibold">Loading configuration...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="font-body bg-background min-h-screen p-6 flex items-center justify-center">
        <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center max-w-md">
          <h2 className="text-lg font-bold text-text mb-2">No Products Configured</h2>
          <p className="text-textLight text-sm">Please add a product or ensure the API returns valid data to view the yield configuration.</p>
        </div>
      </div>
    );
  }

  // Combine activities and yields for the selected product
  let currentInputMT = inputMT;

  const combinedActivities = activitiesData
    .map((act) => {
      const y = yieldsData.find((y) => y.process_activity === act.activity_id) || {};
      return { act, y };
    })
    .sort((a, b) => {
      const seqA = a.y.sequence || 999;
      const seqB = b.y.sequence || 999;
      return seqA - seqB;
    })
    .map(({ act, y }, index) => {
      const yieldPct = y.yield_percentage ? parseFloat(y.yield_percentage) : 0;
      const outputMT = currentInputMT * (yieldPct / 100);
      const loss = outputMT - currentInputMT;

      const row = {
        id: index + 1,
        name: act.activity_name || y.activity_name || "Unknown",
        phase: y.is_pre_grading ? "PRE-GRADE" : "POST-GRADE",
        yieldPct: yieldPct,
        inputMT: currentInputMT,
        outputMT: outputMT,
        loss: loss,
        workerEff: y.worker_efficiency_kg_per_hour ? `${y.worker_efficiency_kg_per_hour} kg/hr` : "N/A",
        equipment: act.a_equipment_name || "N/A",
        lossReason: y.loss_description || "-",
        rawYield: {
          process_activity: act.activity_id,
          ...y
        }
      };
      currentInputMT = outputMT;
      return row;
    });

  const finalOutput = currentInputMT.toFixed(2);
  const calculatedTotalYieldPct = combinedActivities.length > 0
    ? ((currentInputMT / inputMT) * 100).toFixed(1)
    : 100.0;

  const preGradeYield = combinedActivities.find((a) => a.phase === "PRE-GRADE")?.yieldPct ?? 100;
  const postGradeYield = combinedActivities
    .filter((a) => a.phase === "POST-GRADE")
    .reduce((acc, a) => acc * (a.yieldPct / 100), 100)
    .toFixed(1);

  const processFlowName = yieldsData.length > 0 ? yieldsData[0].process_flow_name : "Default Process";

  // Hardcode random yield for other tabs as requested
  const hardcodedYields = [78.1, 94.7, 84.8, 87.8];
  const uiProducts = products.map((p, i) => {
    const fallbackYield = hardcodedYields[i % hardcodedYields.length];
    return {
      id: p.id,
      label: p.product_code || `P-${p.id}`,
      desc: p.product_name || "Unknown Product",
      yield: p.id === selectedProductId && combinedActivities.length > 0 ? calculatedTotalYieldPct : fallbackYield,
      steps: p.id === selectedProductId ? combinedActivities.length : 4
    };
  });

  const activeUiProduct = uiProducts.find(p => p.id === selectedProductId) || uiProducts[0];

  const chartData = uiProducts.map((p) => ({
    name: p.label,
    yield: parseFloat(p.yield),
    output: +(inputMT * (parseFloat(p.yield) / 100)).toFixed(2),
  }));

  const flow = [{ label: "RAW", val: inputMT, delta: null }];
  combinedActivities.forEach(a => {
    flow.push({
      label: a.name.toUpperCase(),
      val: a.outputMT.toFixed(2),
      delta: `${a.loss >= 0 ? '+' : ''}${((a.yieldPct) - 100).toFixed(1)}%`
    });
  });
  if (flow.length > 1) {
    flow.push({ label: "FINISHED", val: currentInputMT.toFixed(2), delta: null });
  }

  const handleSubmit = async () => {
    const payload = {
      id: editFormData.id,
      process_activity: editFormData.process_activity,
      sequence: editFormData.sequence,
      yield_percentage: editFormData.yield_percentage,
      loss_description: editFormData.loss_description,
      is_pre_grading: editFormData.is_pre_grading,
      worker_efficiency_kg_per_hour: editFormData.worker_efficiency_kg_per_hour,
      processing_cost_per_mt: editFormData.processing_cost_per_mt || ""
    };

    try {
    let response;

    if (payload.id) {
      // ✅ UPDATE
      response = await UpdateYieldConfig(payload);
    } else {
      // ✅ CREATE
      response = await AddYieldConfig(payload);
    }

      // console.log("AddYieldConfig", payload);
      // const response = {status : 200}

      if (response.status === 200 || response.status === 201) {
        toast.success("Yield Configuration Saved.");
        setIsConfirmOpen(false);
        setIsModalOpen(false);
        fetchDetails(selectedProductId);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="font-body bg-background min-h-screen p-1 transition-colors duration-300">
      <div className="mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold tracking-widest text-textLight uppercase">
            Select Product (each has its own processflow → yield chain)
          </div>
        </div>

        {/* ── Product Tabs ── */}
        <div className="flex gap-3 mb-3 flex-wrap">
          {uiProducts.map((p) => (
            <ProductTab key={p.id} product={p} active={p.id === selectedProductId} onClick={() => setSelectedProductId(p.id)} />
          ))}
        </div>

        {/* ── KPI Cards ── */}
        <div className="flex gap-3 mb-3 flex-wrap">
          <StatCard label="Total Yield" value={`${activeUiProduct.yield}%`} colorClass="text-warning" />
          <StatCard label="Pre-Grading Yield" value={`${preGradeYield.toFixed(1)}%`} colorClass="text-secondary" />
          <StatCard label="Post-Grading Yield" value={`${postGradeYield}%`} colorClass="text-[#C97AFF]" />
          <StatCard label="Final Output" value={`${finalOutput} MT`} colorClass="text-success" />
          {/* Simulate Input */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm min-w-[180px]">
            <div className="text-xs font-medium uppercase tracking-wider text-textLight mb-2">
              Simulate Input
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" value={inputMT} min={1} max={9999}
                onChange={(e) => setInputMT(+e.target.value || 1)}
                className="w-20 p-1.5 px-2.5 text-base font-bold rounded-lg border border-border bg-inputBg text-text outline-none font-body focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-textLight font-medium">MT</span>
            </div>
          </div>
        </div>

        {/* ── Activity Table ── */}
        <SectionCard className="p-3 mb-3 overflow-hidden">
          <SectionHeader
            icon="🔗"
            title={`${activeUiProduct.label} — ${activeUiProduct.desc}`}
            sub={`ProcessFlow: "${processFlowName}"`}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-backgroundAlt">
                  {["#", "Activity (ProcessActivity)", "Phase", "Yield %", "Input MT", "Output MT", "Loss/Gain", "Worker Eff.", "Equipment", "Loss Reason", "Action"].map((h) => (
                    <th key={h} className="p-2.5 px-3.5 text-left text-[10px] font-semibold tracking-wider text-textLight whitespace-nowrap uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {combinedActivities.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="p-6 text-center text-textLight">No activities found for this product.</td>
                  </tr>
                ) : (
                  combinedActivities.map((a, i) => (
                    <tr key={a.id} className={`border-t border-border ${i % 2 === 0 ? "bg-transparent" : "bg-backgroundAlt"}`}>
                      <td className="p-3 px-3.5 text-textLight font-medium">{a.id}</td>
                      <td className="p-3 px-3.5 font-semibold text-text">{a.name}</td>
                      <td className="p-3 px-3.5"><Badge type={a.phase} /></td>
                      <td className={`p-3 px-3.5 font-bold ${yieldColorClass(a.yieldPct)}`}>{a.yieldPct.toFixed(1)}%</td>
                      <td className="p-3 px-3.5 text-textLight">{a.inputMT.toFixed(3)}</td>
                      <td className="p-3 px-3.5 font-semibold text-text">{a.outputMT.toFixed(3)}</td>
                      <td className={`p-3 px-3.5 font-bold ${lossGainColorClass(a.loss)}`}>
                        {a.loss >= 0 ? "+" : ""}{a.loss.toFixed(3)}
                      </td>
                      <td className="p-3 px-3.5 text-textLight whitespace-nowrap">{a.workerEff}</td>
                      <td className="p-3 px-3.5 text-textLight whitespace-nowrap">{a.equipment}</td>
                      <td className="p-3 px-3.5 text-textLight text-xs">{a.lossReason}</td>
                      <td className="p-3 px-3.5">
                        <button
                          onClick={() => handleEditClick(a.rawYield)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200"
                        >
                          {a.yieldPct ? "Edit" : "Add"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── Material Flow + Chart ── */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {/* Material Flow */}
          <SectionCard className="flex-[2] min-w-[300px] border-l-4 border-l-primary">
            <SectionHeader icon="📦" title="Material Flow" sub={`${inputMT} MT input → ${finalOutput} MT output`} />
            <div className="p-5 px-6 flex flex-wrap gap-2 items-center">
              {flow.length > 1 ? flow.map((node, i) => (
                <FlowNode key={i} node={node} isLast={i === flow.length - 1} />
              )) : (
                <div className="text-textLight text-sm">No flow data available.</div>
              )}
            </div>
          </SectionCard>

          {/* Bar Chart */}
          {/* <SectionCard className="flex-1 min-w-[260px]">
            <SectionHeader icon="📊" title="Yield by Product" sub="Yield % comparison across products" />
            <div className="p-4 px-6 pb-5">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fill: chartColors.textLight, fontSize: 11, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[70, 100]} tick={{ fill: chartColors.textLight, fontSize: 11, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: chartColors.card, border: `1px solid ${chartColors.border}`, borderRadius: 10, fontFamily: "Poppins", fontSize: 12, color: chartColors.text }}
                    labelStyle={{ color: chartColors.text, fontWeight: 600 }}
                    formatter={(v, n) => [`${v}${n === "yield" ? "%" : " MT"}`, n === "yield" ? "Yield" : "Output"]}
                  />
                  <Bar dataKey="yield" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.name === activeUiProduct.label ? chartColors.primary : chartColors.border} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard> */}
        </div>

        {/* ── Product Yield Comparison ── */}
        <SectionCard>
          <SectionHeader icon="🟧" title="Product Yield Comparison" sub="Same raw input, different routes, different outputs" />
          <div className="p-4 px-3 pb-4">
            {uiProducts.map((p) => (
              <YieldBar key={p.id} product={p} inputMT={inputMT} active={p.id === selectedProductId} />
            ))}
          </div>
        </SectionCard>

      </div>

    <ConfirmPopup
      isOpen={isConfirmOpen}
      onClose={() => setIsConfirmOpen(false)}
      onConfirm={handleSubmit}
      title="Confirmation"
      message="Are you sure you want to save this?"
      confirmLabel="Yes"
    />

      {/* ── Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-4 font-body">
            <div className="flex justify-between items-center mb-3  ">
              <h3 className="text-lg font-bold text-text">Edit Yield Configuration</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textLight hover:text-error text-2xl font-bold leading-none">&times;</button>
            </div>
            <div className="space-y-6">
              <input type="hidden" name="process_activity" value={editFormData.process_activity} />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Sequence</label>
                <input
                  type="number"
                  value={editFormData.sequence}
                  onChange={(e) => setEditFormData({ ...editFormData, sequence: e.target.value })}
                  className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Yield Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.yield_percentage}
                  onChange={(e) => setEditFormData({ ...editFormData, yield_percentage: e.target.value })}
                  className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Loss Description</label>
                <input
                  type="text"
                  value={editFormData.loss_description}
                  onChange={(e) => setEditFormData({ ...editFormData, loss_description: e.target.value })}
                  className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="preGradeCheck"
                  checked={editFormData.is_pre_grading}
                  onChange={(e) => setEditFormData({ ...editFormData, is_pre_grading: e.target.checked })}
                  className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                />
                <label htmlFor="preGradeCheck" className="text-sm font-semibold text-text cursor-pointer">Is Pre-Grading</label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Worker Efficiency (kg/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.worker_efficiency_kg_per_hour}
                  onChange={(e) => setEditFormData({ ...editFormData, worker_efficiency_kg_per_hour: e.target.value })}
                  className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Processing Cost Per MT</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.processing_cost_per_mt}
                  onChange={(e) => setEditFormData({ ...editFormData, processing_cost_per_mt: e.target.value })}
                  className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

            </div>
            <div className="mt-8 flex justify-end gap-3 mt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-text font-semibold hover:bg-backgroundAlt transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsConfirmOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-secondary transition-colors shadow-md shadow-primary/30 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
