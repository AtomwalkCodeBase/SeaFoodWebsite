import React, { useEffect, useMemo, useState } from "react";
import {  useQueryClient } from "@tanstack/react-query";
import { AddYieldConfig, UpdateYieldConfig } from "../services/productServices";
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
import Card from "../components/Card";
import { theme } from "../styles/Theme";
import { useAllYieldConfig, useProcessActivityList, useProduct, useYieldConfig } from "../hooks/useProductQueries";
import DataTable, { Td } from "../components/DataTable";
import { QUERY_KEYS } from "../constants";

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

  const {data: productsData , isLoading: productsLoading} = useProduct();
  const {data: activitiesData , isLoading: processActivityLoading} = useProcessActivityList(!!selectedProductId, selectedProductId);
  const {data: yieldData , isLoading: yieldLoading} = useYieldConfig(true, selectedProductId);
  const {data: yieldAllData , isLoading: yieldAllLoading} = useAllYieldConfig();

  const mergedYieldData = useMemo(() => {
  if (!yieldData || !yieldAllData) return null;

  const matchedYieldConfigs = yieldAllData.filter(
    (item) => item.process_flow_name === yieldData.process_flow_name
  );

  const configMap = matchedYieldConfigs.reduce(
    (acc, item) => { acc[item.sequence] = item;
      return acc;
    },{}
  );

  const mergedSteps = yieldData.steps?.map((step) => ({
      ...step,
      yield_config_data: configMap[step.sequence] || null,
    })) || [];

  return {
    ...yieldData,
    steps: mergedSteps,
  };
}, [yieldData, yieldAllData]);

// console.log("mergedYieldData", mergedYieldData)


  useEffect(() => {
  if (productsData?.length > 0 && !selectedProductId) {
    setSelectedProductId(productsData[0].id);
  }
}, [productsData, selectedProductId]);

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

  const handleEditClick = (rawYield, fullYieldData) => {
    // console.log("rawYield", fullYieldData)
    setForm({
      id: rawYield.id || "",
      process_activity: String(rawYield.process_activity_id || rawYield.process_activity),
      sequence: rawYield.sequence || "",
      yield_percentage: rawYield.yield_pct || rawYield.yield_percentage || "",
      loss_description: fullYieldData.loss_description || "",
      is_pre_grading: Boolean(rawYield.is_pre_grading),
      worker_efficiency_kg_per_hour: rawYield.worker_efficiency_kg_per_hour || "",
      processing_cost_per_mt: rawYield.processing_cost_per_mt || "",
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
  try {
    if (form.id) {
      const originalData = steps.find((item) => String(item?.yield_config_data?.id) === String(form.id))?.yield_config_data;

      // console.log("originalData", originalData)

      const normalizedOriginal = {
        process_activity: String(originalData?.process_activity || ""),
        sequence: originalData?.sequence || "",
        yield_percentage: originalData?.yield_percentage || "",
        loss_description: originalData?.loss_description || "",
        is_pre_grading: Boolean(originalData?.is_pre_grading),
        worker_efficiency_kg_per_hour: originalData?.worker_efficiency_kg_per_hour || "",
        processing_cost_per_mt: originalData?.processing_cost_per_mt || "",
      };

      const changedPayload = getChangedFields( normalizedOriginal, form);

      if (Object.keys(changedPayload).length === 0) {
        toast.info("No changes detected");
        return;
      }

      // console.log({id: form.id, ...changedPayload})

      await UpdateYieldConfig({id: form.id, ...changedPayload});

      toast.success("Yield data updated successfully");
    } else {
      // ADD API payload
      const payload = {
        product_id: selectedProductId,
        process_activity: Number(form.process_activity),
        sequence: Number(form.sequence),
        yield_percentage: form.yield_percentage,
        loss_description: form.loss_description,
        is_pre_grading: form.is_pre_grading,
        worker_efficiency_kg_per_hour:form.worker_efficiency_kg_per_hour,
        processing_cost_per_mt:form.processing_cost_per_mt,
      };

      await AddYieldConfig(payload);
      toast.success("Yield data add successfully");
    }

    setIsModalOpen(false);
    setIsConfirmOpen(false);
    await queryClient.invalidateQueries([QUERY_KEYS.YIELD_BY_PRODUCT, selectedProductId]);

  } catch (error) {
    handleApiError(error, form.id? "Failed to update" : "Failed to save")
  }
};

const finalOutput = (inputMT * (yieldData?.total_yield_pct / 100)).toFixed(3);

const STATS_CARD_DATA = [
  {label: "Total Yield", value: `${yieldData?.total_yield_pct || 0}%` , colorClass: "text-warning"},
  {label: "Pre-Grading Yield", value: `${yieldData?.pre_grading_yield_pct || 0}%`, colorClass:"text-secondary"},
  {label:"Post-Grading Yield", value: `${yieldData?.post_grading_yield_pct || 0}%`, colorClass: "text-[#C97AFF]"},
  {label:"Final Output", value: `${finalOutput || 0} MT`, colorClass:"text-success"},
]

const steps = mergedYieldData?.steps || [];
let runningInput = inputMT;

const processedSteps = [];
steps.forEach((step) => {
  const inputQty = runningInput;
  const outputQty = inputQty * (step.yield_pct / 100);
  const lossQty = outputQty - inputQty;

  processedSteps.push({
    ...step,
    inputQty,
    outputQty,
    lossQty,
  });
  runningInput = outputQty;
});

const flow = [
  {
    label: "RAW",
    val: `${inputMT.toFixed(2)} MT`,
  },

  ...processedSteps.map((step) => ({
    label: step.activity_name,

    val: `${step.outputQty.toFixed(2)} MT`,

    delta: `${
      step.lossQty >= 0 ? "+" : ""
    }${step.lossQty.toFixed(2)}`,
  })),

  {
    label: "FINISHED",

    val: `${
      processedSteps[
        processedSteps.length - 1
      ]?.outputQty?.toFixed(2) ||
      inputMT.toFixed(2)
    } MT`,
  },
];
  return (
//         {/* Yield Comparison */}
//         <SectionCard>
//           <SectionHeader icon="📊" title="Product Yield Comparison" sub="Same raw input, different routes" />
//           <div className="p-5">
//             {uiProducts.map((p) => (
//               <YieldBar key={p.id} product={p} inputMT={inputMT} active={p.id === selectedProductId} />
//             ))}
//           </div>
//         </SectionCard>
//       </div>
    <div className="font-body min-h-screen transition-colors duration-300">
      <div className="mx-auto max-w-[1400px]">

        <div className="flex gap-3 mb-4 flex-wrap">
          {productsData?.map((p) => (
            <ProductTab key={p.id} product={p} active={p.id === selectedProductId} onClick={() => setSelectedProductId(p.id)}/>
          ))}
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          {STATS_CARD_DATA.map((data) => (
            <StatCard key={data.label} label={data.label} value={data.value} colorClass={data.colorClass} />
          ))}

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

         <Card style={{border: `1px solid ${theme.colors.border}`}} hoverable={false}>
           <div className="flex justify-between items-center border-b border-border mb-2">
             <SectionHeader icon="🔗" title={`${yieldData?.product_code} — ${yieldData?.product_name}`}  border={false}/>
             {(() => {const yieldActivityIds = new Set(
                steps?.map(s => String(s.process_activity_id).trim())
              );

              const hasMissingActivities = activitiesData?.some(act => {
                const actId1 = String(act.id || "").trim();
                const actId2 = String(act.activity_id || "").trim();
                return !yieldActivityIds.has(actId1) && !yieldActivityIds.has(actId2);
              });

              return hasMissingActivities  && (
                 <Button size="sm" onClick={handleAddNew}>
                   <FaPlus /> Add Yield Step
                 </Button>
              );
              })()}
           </div>

           <DataTable
           columns={["#", "Activity", "Phase", "Yield %", "Input MT", "Output MT", "Loss/Gain", "Worker Eff.", "Equipment", "Loss Reason", "Action"]}
           data={processedSteps}
           emptyMessage="No yield steps configured for this product."
           isLoading={yieldLoading}
           renderRow={(step) => {

            return(
            <>
            <Td>{step.sequence || 0}</Td>
            <Td>{step.activity_name || "--"}</Td>
            <Td><Badge variant={step.phase === "POST_GRADE" ? "success" : "forward"}>{step.phase || "--"}</Badge></Td>
            <Td className={`${step.yield_pct.toFixed(1) < 90 ? "text-error" : step.yield_pct.toFixed(1) > 100 ? "text-success" : "text-warning"} font-semibold`}>{step.yield_pct.toFixed(1) || 0}%</Td>
            <Td>{step.inputQty.toFixed(3) || 0}</Td>
            <Td>{step.outputQty.toFixed(3) || 0}</Td>
            <Td className={`${step.lossQty >= 0 ? "text-success": "text-error"} font-semibold`}> {step.lossQty >= 0 ? "+" : ""}{step.lossQty.toFixed(3) || 0}</Td>
            <Td>{step.worker_efficiency || "--"}</Td>
            <Td>{step.equipment[0] || "--"}</Td>
            <Td>{step.loss_description || "--"}</Td>
            <Td>
              <Button size="sm" variant="outline"  onClick={() => handleEditClick(step.yield_config_data, step)} title="Edit" iconOnly={true}>
               <HiOutlinePencilAlt /> Edit
             </Button>
            </Td>
            </>
            )
           } 
           }
           
           />
         </Card>

         <div className="flex gap-4 mb-6 flex-wrap">
           <SectionCard className="flex-[2] min-w-[300px] border-l-4 border-l-primary">
             <SectionHeader icon="📦" title="Material Flow" subtitle={`${inputMT} MT input → ${finalOutput} MT output`}/>
             <div className="p-6 flex flex-wrap gap-3 items-center">
               {flow.map((node, i) => (
                 <FlowNode key={i} node={node} isLast={i === flow.length - 1} />
               ))}
             </div>
           </SectionCard>
         </div>
{/* 
          <SectionCard>
           <SectionHeader icon="📊" title="Product Yield Comparison" sub="Same raw input, different routes" />
           <div className="p-5">
             {productsData.map((p) => (
               <YieldBar key={p.id} product={p} inputMT={inputMT} active={p.id === selectedProductId} />
             ))}
           </div>
         </SectionCard> */}
        </div>

     {isModalOpen && (
        <Modal title={form.id ? "Edit Yield Step" : "Add New Yield Step"} isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); resetForm()}} onSave={() => setIsConfirmOpen(true)} saveButtonText={form.id ? "Edit Step" : "Add Step"} >

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
              />
              {/* </div> */}

 </Modal>
      )}

      <ConfirmPopup
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Confirmation"
        message="Are you sure you want to save this yield configuration?"
        confirmLabel="Yes"
      />

        </div>
  );
}

const ProductTab = ({ product, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-2 pl-2 pr-5 rounded-xl cursor-pointer text-left transition-all duration-200 min-w-[165px] font-body shadow-sm ${
      active
        ? "border-2 border-primary bg-gradient-to-br from-secondary to-primary text-white shadow-md shadow-primary/30"
        : "border border-border bg-card text-text hover:border-primary"
    }`}
  >
    <div className="text-sm font-bold">{product.product_code}</div>
    <div className={`text-[10px] mt-0.5 ${active ? "opacity-85" : "opacity-60"}`}>{product.product_name}</div>
    {/* <div className={`text-base font-bold mt-1.5 ${active ? "text-white" : "text-primary"}`}>{product.yield}%</div> */}
  </button>
);

const StatCard = ({ label, value, colorClass = "text-text" }) => (
  <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex-1 min-w-[130px]">
    <div className="text-xs font-medium uppercase tracking-wider text-textLight mb-2">{label}</div>
    <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
  </div>
);

const SectionCard = ({ children, className = "" }) => (
  <div className={`bg-card border border-border rounded-2xl shadow-sm ${className}`}>{children}</div>
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