import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AddYieldConfig,
  getAllYieldConfig,
  getProcessActivityList,
  getProductList,
  getYieldConfig,
  UpdateYieldConfig,
} from "../services/productServices";
import { toast } from "react-toastify";
import ConfirmPopup from "../components/ConfirmPopup";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { FaPlus } from "react-icons/fa";
import { SectionHeader } from "../components/EmptyState";
import { HiOutlinePencilAlt } from "react-icons/hi";
import Modal from "../components/Modal";
import { getChangedFields, useFormHandler } from "../hooks/useFormHandler";
import InputField from "../components/InputField";
import { handleApiError } from "../utils";

// ── Reusable Components ───────────────────────────────────────────────────────
const StatCard = ({ label, value, colorClass = "text-text" }) => (
  <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex-1 min-w-[130px]">
    <div className="text-xs font-medium uppercase tracking-wider text-textLight mb-2">{label}</div>
    <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
  </div>
);

const ProductTab = ({ product, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 pl-2 pr-5 rounded-xl cursor-pointer text-left transition-all duration-200 min-w-[165px] font-body shadow-sm ${
      active
        ? "border-2 border-primary bg-gradient-to-br from-secondary to-primary text-white shadow-md shadow-primary/30"
        : "border border-border bg-card text-text hover:border-primary"
    }`}
  >
    <div className="text-sm font-bold">{product.label}</div>
    <div className={`text-[10px] mt-0.5 ${active ? "opacity-85" : "opacity-60"}`}>{product.desc}</div>
    {/* <div className={`text-base font-bold mt-1.5 ${active ? "text-white" : "text-primary"}`}>{product.yield}%</div> */}
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
        <div className="text-[9px] font-semibold tracking-wider text-textLight mb-1">{node.label}</div>
        <div className={`text-lg font-bold leading-none ${valColor}`}>{node.val}</div>
        {node.delta && (
          <div className={`text-[10px] font-semibold mt-1 ${isPos ? "text-success" : "text-error"}`}>{node.delta}</div>
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
          className={`h-full rounded-md transition-all duration-500 ease-in-out ${
            active ? "bg-gradient-to-r from-primary to-secondary" : "bg-border"
          }`}
          style={{ width: `${product.yield}%` }}
        />
      </div>
      <div className="text-xs font-semibold text-text min-w-[52px] text-right">{output} MT</div>
      <div className="text-[10px] text-textLight w-12">{product.steps} steps</div>
    </div>
  );
};

const SectionCard = ({ children, className = "" }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-sm ${className}`}>{children}</div>
);

// ── Helpers ───────────────────────────────────────────────────────────
const yieldColorClass = (pct) =>
  pct >= 100 ? "text-success" : pct >= 95 ? "text-primary" : "text-warning";
const lossGainColorClass = (loss) => (loss >= 0 ? "text-success" : "text-error");

// ── Main Component ────────────────────────────────────────────────────────────
export default function YieldConfigScreen() {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [inputMT, setInputMT] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const editFormData = {
    id: "",
    process_activity: "",
    sequence: "",
    yield_percentage: "",
    loss_description: "",
    is_pre_grading: false,
    worker_efficiency_kg_per_hour: "",
    processing_cost_per_mt: "",
  };

  const { form, setForm, handleChange, resetForm } = useFormHandler(editFormData);


  // Queries
  const { data: productsData = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () =>  getProductList(),
    select: (res) => res.data,
  });

  const { data: activitiesData = [] } = useQuery({
    queryKey: ["activities", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const res = await getProcessActivityList({ product_id: selectedProductId });
      return res.data || [];
    },
    enabled: !!selectedProductId,
  });

  const { data: yieldResponse } = useQuery({
    queryKey: ["yields", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const res = await getYieldConfig(null, selectedProductId);
      return res.data || null;
    },
    enabled: !!selectedProductId,
  });

  const { data: allYieldConfig } = useQuery({
    queryKey: ["allYields"],
    queryFn: () =>  getAllYieldConfig(),
    select: (res) => res.data,
  });

  // Set initial product
  useEffect(() => {
    if (productsData.length > 0 && !selectedProductId) {
      setSelectedProductId(productsData[0].id);
    }
  }, [productsData, selectedProductId]);

  const steps = yieldResponse?.steps || [];
  const totalYieldPct = yieldResponse?.total_yield_pct || 0;
  const preGradeYield = yieldResponse?.pre_grading_yield_pct || 0;
  const postGradeYield = yieldResponse?.post_grading_yield_pct || 0;

  // Merge activities with yield steps
  // Merge activities with yield steps + allYieldConfig
  const combinedActivities = useMemo(() => {
    const yieldActivityIds = new Set(steps.map(s => String(s.process_activity_id).trim()));

    // Assuming allYieldConfig is already fetched and available
    const allYieldMap = new Map(
      (allYieldConfig || []).map(item => [
        String(item.process_activity || item.process_activity_id).trim(),
        item
      ])
    );

    return steps
      .map((step, index) => {
        const act = activitiesData.find(a => 
          String(a.id || "").trim() === String(step.process_activity_id).trim() ||
          String(a.activity_id || "").trim() === String(step.process_activity_id).trim()
        ) || {};

        // Match with allYieldConfig
        const matchingYieldConfig = allYieldMap.get(String(step.process_activity_id).trim()) || {};

        const yieldPct = parseFloat(step.yield_pct || 100);

        return {
          id: index + 1,
          name: step.activity_name || "Unknown",
          phase: step.phase === "PRE_GRADE" ? "PRE-GRADE" : "POST-GRADE",
          yieldPct,
          yieldRaw: yieldPct / 100,
          inputMT: 0,
          outputMT: 0,
          loss: 0,
          workerEff: step.worker_efficiency ? `${step.worker_efficiency} kg/hr` : "N/A",
          equipment: act.a_equipment_name || step.equipment?.join(", ") || "N/A",
          lossReason: step.loss_description || "-",
          
          // As per your requirement
          rawYield: matchingYieldConfig,           // Full yield config record
          rawStepsData: step,                      // Original step data
        };
      })
      .sort((a, b) => (a.rawStepsData.sequence || 999) - (b.rawStepsData.sequence || 999));
  }, [steps, activitiesData, allYieldConfig]);

  // Calculate running totals
  let currentInputMT = inputMT;
  const processedActivities = combinedActivities.map((item) => {
    const outputMT = currentInputMT * item.yieldRaw;
    const loss = outputMT - currentInputMT;

    const result = {
      ...item,
      inputMT: currentInputMT,
      outputMT: parseFloat(outputMT.toFixed(3)),
      loss: parseFloat(loss.toFixed(3)),
    };

    currentInputMT = outputMT;
    return result;
  });

  const finalOutput = parseFloat(currentInputMT.toFixed(2));

  const activeProduct = productsData?.find((p) => p.id === selectedProductId);

  const uiProducts = productsData.map((p, i) => ({
    id: p.id,
    label: p.product_code || `P-${p.id}`,
    desc: p.product_name || "Unknown Product",
    yield: p.id === selectedProductId ? totalYieldPct : [78.1, 94.7, 84.8, 87.8][i % 4],
    steps: p.id === selectedProductId ? steps.length : 5,
  }));

  const activeUiProduct = uiProducts.find((p) => p.id === selectedProductId) || uiProducts[0];

  // Material Flow
  const flow = [
    { label: "RAW", val: inputMT.toFixed(1), delta: null },
    ...processedActivities.map((a) => ({
      label: a.name.toUpperCase(),
      val: a.outputMT.toFixed(2),
      delta: `${a.loss >= 0 ? "+" : ""}${((a.yieldPct) - 100).toFixed(1)}%`,
    })),
    { label: "FINISHED", val: finalOutput.toFixed(2), delta: null },
  ];

  if (productsLoading) {
    return <div className="font-body bg-background min-h-screen p-6 flex items-center justify-center">Loading configuration...</div>;
  }

  if (productsData.length === 0) {
    return (
      <div className="font-body bg-background min-h-screen p-6 flex items-center justify-center">
        <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center max-w-md">
          <h2 className="text-lg font-bold text-text mb-2">No Products Configured</h2>
          <p className="text-textLight text-sm">Please add a product.</p>
        </div>
      </div>
    );
  }

  const handleEditClick = (rawYield) => {
    // console.log("rawYield", rawYield)
    setForm({
      id: rawYield.id || "",
      process_activity: String(rawYield.process_activity_id || rawYield.process_activity),
      sequence: rawYield.sequence || "",
      yield_percentage: rawYield.yield_pct || rawYield.yield_percentage || "",
      loss_description: rawYield.loss_description || "",
      is_pre_grading: Boolean(rawYield.is_pre_grading),
      worker_efficiency_kg_per_hour: rawYield.worker_efficiency_kg_per_hour || "",
      processing_cost_per_mt: rawYield.processing_cost_per_mt || "",
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    resetForm();

    setForm((prev) => ({
      ...prev,
      sequence: String(steps.length + 1),
    }));
    setIsModalOpen(true);
  };

  // const handleSubmit = async () => {
  //   const payload = {
  //     ...editFormData,
  //     product_id: selectedProductId,
  //     process_activity: editFormData.process_activity, // Must be from process activity response id
  //   };

  //   try {
  //     let response;
  //     if (payload.id) {
  //       response = await UpdateYieldConfig(payload);
  //     } else {
  //       response = await AddYieldConfig(payload);
  //     }

  //     if (response?.status === 200 || response?.status === 201) {
  //       toast.success("Yield Configuration Saved.");
  //       setIsModalOpen(false);
  //       setIsConfirmOpen(false);
  //     }
  //   } catch (error) {
  //     toast.error("Failed to save configuration.");
  //   }
  // };

  // console.log("processedActivities", processedActivities)

  const handleSubmit = async () => {
  try {
    if (form.id) {
      // Existing/original API data
      const originalData = steps.find(
        (item) => String(item.id) === String(form.id)
      );

      // Normalize original object
      const normalizedOriginal = {
        process_activity: String(
          originalData?.process_activity || ""
        ),
        sequence: originalData?.sequence || "",
        yield_percentage:
          originalData?.yield_percentage || "",
        loss_description:
          originalData?.loss_description || "",
        is_pre_grading:
          Boolean(originalData?.is_pre_grading),
        worker_efficiency_kg_per_hour:
          originalData?.worker_efficiency_kg_per_hour || "",
        processing_cost_per_mt:
          originalData?.processing_cost_per_mt || "",
      };

      // Get only changed fields
      const changedPayload = getChangedFields( normalizedOriginal, form);

      if (Object.keys(changedPayload).length === 0) {
        toast.info("No changes detected");
        return;
      }

      await UpdateYieldConfig({
        id: form.id,
        ...changedPayload,
      });

      toast.success("Updated successfully");
    } else {
      // ADD API payload
      const payload = {
        product_id: selectedProductId,
        process_activity: Number(form.process_activity),
        sequence: Number(form.sequence),
        yield_percentage: form.yield_percentage,
        loss_description: form.loss_description,
        is_pre_grading: form.is_pre_grading,
        worker_efficiency_kg_per_hour:
          form.worker_efficiency_kg_per_hour,
        processing_cost_per_mt:
          form.processing_cost_per_mt,
      };

      await AddYieldConfig(payload);

      toast.success("Saved successfully");
    }

    setIsModalOpen(false);
    setIsConfirmOpen(false);

    await queryClient.invalidateQueries(['yields'])
  } catch (error) {
    // toast.error(
    //   form.id
    //     ? "Failed to update"
    //     : "Failed to save"
    // );
    handleApiError(error, form.id? "Failed to update" : "Failed to save")
  }
};
  return (
    <div className="font-body min-h-screen transition-colors duration-300">
      <div className="mx-auto max-w-[1400px]">
        {/* Product Tabs */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {uiProducts.map((p) => (
            <ProductTab
              key={p.id}
              product={p}
              active={p.id === selectedProductId}
              onClick={() => setSelectedProductId(p.id)}
            />
          ))}
        </div>

        {/* KPI Cards */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <StatCard label="Total Yield" value={`${totalYieldPct.toFixed(1)}%`} colorClass="text-warning" />
          <StatCard label="Pre-Grading Yield" value={`${preGradeYield.toFixed(1)}%`} colorClass="text-secondary" />
          <StatCard label="Post-Grading Yield" value={`${postGradeYield.toFixed(1)}%`} colorClass="text-[#C97AFF]" />
          <StatCard label="Final Output" value={`${finalOutput} MT`} colorClass="text-success" />

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm min-w-[180px]">
            <div className="text-xs font-medium uppercase tracking-wider text-textLight mb-2">Simulate Input</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputMT}
                min={1}
                max={9999}
                onChange={(e) => setInputMT(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-20 p-2 text-base font-bold rounded-lg border border-border bg-inputBg text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-textLight font-medium">MT</span>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <SectionCard className="mb-6">
          <div className="flex justify-between items-center p-3 border-b border-border">
            <SectionHeader
              icon="🔗"
              title={`${activeUiProduct.label} — ${activeUiProduct.desc}`}
              sub="Process Flow"
            />
            {(() => {
              const yieldActivityIds = new Set(
                steps.map(s => String(s.process_activity_id).trim())
              );

              const hasMissingActivities = activitiesData.some(act => {
                const actId1 = String(act.id || "").trim();
                const actId2 = String(act.activity_id || "").trim();
                return !yieldActivityIds.has(actId1) && !yieldActivityIds.has(actId2);
              });

              return hasMissingActivities && (
                <Button onClick={handleAddNew}>
                  <FaPlus /> Add Yield Step
                </Button>
              );
            })()}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-backgroundAlt">
                  {["#", "Activity", "Phase", "Yield %", "Input MT", "Output MT", "Loss/Gain", "Worker Eff.", "Equipment", "Loss Reason", "Action"].map((h) => (
                    <th key={h} className="p-3 px-4 text-left text-[10px] font-semibold tracking-wider text-textLight uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-textLight">
                      No yield steps configured for this product.
                    </td>
                  </tr>
                ) : (
                  processedActivities.map((a, i) => (
                    <tr key={a.id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-backgroundAlt"}`}>
                      <td className="p-3 px-4 text-textLight font-medium">{a.id}</td>
                      <td className="p-3 px-4 font-semibold text-text">{a.name}</td>
                      <td className="p-3 px-4">
                        <Badge variant={a.phase === "PRE-GRADE" ? "success" : "forward"}>{a.phase}</Badge>
                      </td>
                      <td className={`p-3 px-4 font-bold ${yieldColorClass(a.yieldPct)}`}>
                        {a.yieldPct.toFixed(1)}%
                      </td>
                      <td className="p-3 px-4 font-semibold text-textLight">{a.inputMT.toFixed(3)}</td>
                      <td className="p-3 px-4 font-semibold text-text">{a.outputMT.toFixed(3)}</td>
                      <td className={`p-3 px-4 font-bold ${lossGainColorClass(a.loss)}`}>
                        {a.loss >= 0 ? "+" : ""}{a.loss}
                      </td>
                      <td className="p-3 px-4 text-textLight font-semibold whitespace-nowrap">{a.workerEff}</td>
                      <td className="p-3 px-4 text-textLight whitespace-nowrap">{a.equipment}</td>
                      <td className="p-3 px-4 text-textLight text-xs break-words max-w-[180px]">{a.lossReason}</td>
                      <td className="p-3 px-4">
                        <Button size="sm" variant="outline"  onClick={() => handleEditClick(a.rawYield)} title="Edit" iconOnly={true}>
                          <HiOutlinePencilAlt /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Material Flow */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <SectionCard className="flex-[2] min-w-[300px] border-l-4 border-l-primary">
            <SectionHeader
              icon="📦"
              title="Material Flow"
              sub={`${inputMT} MT input → ${finalOutput} MT output`}
            />
            <div className="p-6 flex flex-wrap gap-3 items-center">
              {flow.map((node, i) => (
                <FlowNode key={i} node={node} isLast={i === flow.length - 1} />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Yield Comparison */}
        <SectionCard>
          <SectionHeader icon="📊" title="Product Yield Comparison" sub="Same raw input, different routes" />
          <div className="p-5">
            {uiProducts.map((p) => (
              <YieldBar key={p.id} product={p} inputMT={inputMT} active={p.id === selectedProductId} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <Modal title={editFormData.id ? "Edit Yield Step" : "Add New Yield Step"} isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); resetForm()}} onSave={() => setIsConfirmOpen(true)} >

            {/* <div className="space-y-7"> */}

              <InputField
                label="Activity"
                name="process_activity"
                type="select"
                value={form.process_activity}
                onChange={handleChange}
                options={activitiesData.map((c) => ({ value: String(c.id), label: c.activity_name }))}
                required
              />

              <InputField
                label="Sequence"
                name="sequence"
                type="number"
                value={form.sequence}
                onChange={handleChange}
                required
              />

              <InputField
                label="Yield Percentage"
                name="yield_percentage"
                type="number"
                value={form.yield_percentage}
                onChange={handleChange}
                required
                placeholder="Enter between 0 to 1"
              />

              <InputField
                label="Loss Description"
                name="loss_description"
                type="text"
                value={form.loss_description}
                onChange={handleChange}
              />

              <InputField
                label="Is Pre-Grading"
                name="is_pre_grading"
                type="checkbox"
                value={form.is_pre_grading}
                onChange={handleChange}
                required
              />

              <InputField
                label="Worker Efficiency (kg/hr)"
                name="worker_efficiency_kg_per_hour"
                type="number"
                value={form.worker_efficiency_kg_per_hour}
                onChange={handleChange}
                required
              />

              <InputField
                label="Processing Cost (per MT)"
                name="processing_cost_per_mt"
                type="number"
                value={form.processing_cost_per_mt}
                onChange={handleChange}
                required
              />
              {/* </div> */}

 </Modal>
      )}

      <ConfirmPopup
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Save Changes"
        message="Are you sure you want to save this yield configuration?"
        confirmLabel="Save"
      />
    </div>
  );
}