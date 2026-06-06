import { useState, useEffect } from "react";
import { AddPlanningConfig, EditPlanningConfig, getPlanningConfig } from "../../../services/productServices";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "../../../components/Button";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { useFormHandler } from "../../../hooks/useFormHandler";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import Card from "../../../components/Card";
import { AiOutlineSetting } from "react-icons/ai";
import { GiTargeting } from "react-icons/gi";

const EMPTY_FORM = {
  label: "",
  name: "",
  is_active: true,
  machine_capacity_mt: "",
  oee_percentage: "",
  shift_hours: "",
  shifts_per_day: "",
  cold_storage_capacity_mt: "",
  procurement_buffer_pct: "",
  priority_weight_urgency: 0.4,
  priority_weight_margin: 0.3,
  priority_weight_customer: 0.2,
  priority_weight_stock: 0.1,
  annual_revenue_target: "",
};

const SCORE_ITEMS = [
  { key: "urgency", label: "Urgency", weightKey: "priority_weight_urgency", value: 60, color: "bg-error", textColor: "text-error", barColor: "bg-error" },
  { key: "margin", label: "Margin", weightKey: "priority_weight_margin", value: 72, color: "bg-success", textColor: "text-success", barColor: "bg-success" },
  { key: "customer", label: "Customer", weightKey: "priority_weight_customer", value: 75, color: "bg-accent", textColor: "text-primary", barColor: "bg-primary" },
  { key: "stock", label: "Stock", weightKey: "priority_weight_stock", value: 100, color: "bg-info", textColor: "text-info", barColor: "bg-info" },
];

const WEIGHT_BAR_COLORS = ["bg-error", "bg-success", "bg-accent", "bg-info"];

export default function CapacityConfigScreen() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState({ open: false, mode: "add" });

  
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['planning-config'],
    queryFn: () => getPlanningConfig(),
    select: (res) => res?.data?.[0] || null,
    onError: () => toast.error('Failed to load plan config details.'),
  });

  const effectiveCap = config ? ((config.machine_capacity_mt * config.oee_percentage) / 100).toFixed(1) : 0;

  const dailyOutput = config ? (effectiveCap * 0.8).toFixed(1) : 0;

  const annualMT = config ? (dailyOutput * 300).toFixed(0) : 0;

  const revenueCr = config ? (config.annual_revenue_target / 1e7).toFixed(0) : 0;

  const totalScore = config ? SCORE_ITEMS.reduce((sum, item) => {
    return sum + item.value * (config[item.weightKey] || 0);
  }, 0).toFixed(0)
    : 0;

  const weightPcts = config ? SCORE_ITEMS.map((s) => Math.round((config[s.weightKey] || 0) * 100)) : [0, 0, 0, 0];

  const openAdd = () => setModal({ open: true, mode: "add" });
  const openEdit = () => setModal({ open: true, mode: "edit" });
  const close = () => setModal((m) => ({ ...m, open: false }));


const addMutation = useMutation({
  mutationFn: AddPlanningConfig,

  onSuccess: () => {
    toast.success("Planning config added successfully");

    queryClient.invalidateQueries({
      queryKey: ["planning-config"],
    });

    close();
  },

  onError: (err) => {
    console.error("Create config failed", err);
    toast.error("Failed to add config");
  },
});

const editMutation = useMutation({
  mutationFn: ({ id, data }) =>
    EditPlanningConfig(data, id),

  onSuccess: () => {
    toast.success("Planning config updated successfully");

    queryClient.invalidateQueries({
      queryKey: ["planning-config"],
    });

    close();
  },

  onError: (err) => {
    console.error("Update config failed", err);
    toast.error("Failed to update config");
  },
});

const getChangedFields = (original, updated) => {
  const changed = {};

  Object.keys(updated).forEach((key) => {
    if (
      String(updated[key]) !==
      String(original[key] ?? "")
    ) {
      changed[key] = updated[key];
    }
  });

  return changed;
};

const handleSubmit = (form) => {
  const payload = {
    label: form.label,
    name: form.name,

    machine_capacity_mt: Number(form.machine_capacity_mt),
    oee_percentage: Number(form.oee_percentage),

    shift_hours: Number(form.shift_hours),
    shifts_per_day: Number(form.shifts_per_day),

    cold_storage_capacity_mt: Number(
      form.cold_storage_capacity_mt
    ),

    procurement_buffer_pct: Number(
      form.procurement_buffer_pct
    ),

    priority_weight_urgency: Number(
      form.priority_weight_urgency
    ),

    priority_weight_margin: Number(
      form.priority_weight_margin
    ),

    priority_weight_customer: Number(
      form.priority_weight_customer
    ),

    priority_weight_stock: Number(
      form.priority_weight_stock
    ),

    annual_revenue_target: Number(
      form.annual_revenue_target
    ),
  };

  if (modal.mode === "edit") {
    const changedPayload = getChangedFields(
      config,
      payload
    );

    if (Object.keys(changedPayload).length === 0) {
      toast.info("No changes detected");
      return;
    }

    editMutation.mutate({
      id: config.id,
      data: changedPayload,
    });

    return;
  }

  addMutation.mutate(payload);
};

  if (isLoading) {
  return <div>Loading...</div>
}

if (error) {
  return <div>Error loading config</div>
}

  if (!config) {
    return (
      <>
        <div className="flex items-center justify-center text-text-light">
          No planning config found
        </div>

        <div className="flex justify-center items-center p-5">
          <Button variant="primary" onClick={openAdd}><FiPlus />{addMutation.isPending ? "Adding..." : "Add"}</Button>
        </div>
        <ConfigModal
          open={modal.open}
          mode={modal.mode}
          onClose={close}
          onSubmit={handleSubmit}
          initial={modal.mode === "edit" ? config : EMPTY_FORM}
        />
      </>
    );
  }

    return(
          <div className="min-h-screen font-poppins transition-colors duration-300">
      <div className="mx-auto space-y-4">

        {/* ── KPI Row ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex gap-3 flex-wrap">
            <KpiCard label="Effective Capacity"  value={`${effectiveCap} MT/d`} valueClass="text-success" />
            <KpiCard label="Daily Output (Est.)" value={`${dailyOutput} MT/d`}  valueClass="text-secondary" />
            <KpiCard label="Annual"        value={`${annualMT} MT`}       valueClass="text-warning" />
            <KpiCard label="Revenue Est."         value={`₹${revenueCr} Cr`}    valueClass="text-primary" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEdit}><FiEdit2 /> {editMutation.isPending ? "Editing..." : "Edit"}</Button>

          </div>
        </div>

        {/* ── Capacity Parameters ── */}
        <SectionCard gradient="border-primary/40">
          <SectionHeader
            icon={<AiOutlineSetting className="text-primary" />}
            title="Capacity parameters"
          />
          <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <ReadField label="Machine capacity" value={config.machine_capacity_mt} unit="MT/d" />
            <ReadField label="OEE %" value={config.oee_percentage} unit="%" />
            {/* <ReadField label="Effective cap." value={effectiveCap} unit="MT/d" /> */}
            <ReadField label="Shift hours" value={config.shift_hours} unit="hrs" />
            <ReadField label="Shifts/day" value={config.shifts_per_day} />
            <ReadField label="Cold storage" value={config.cold_storage_capacity_mt} unit="MT" />
            <ReadField label="Procurement buffer" value={config.procurement_buffer_pct} unit="%" />
          </div>
          </div>
        </SectionCard>

        {/* ── Priority Scoring Weights ── */}
        <SectionCard gradient="border-accent/40">
          <SectionHeader
            icon={<GiTargeting className="text-accent" />}
            title="Priority scoring weights"
            sub="Drives order ranking in planning engine. Must sum to 1.00."
          />
          <div className="px-4 pb-4 space-y-3">

            {/* Weight inputs row */}
            <div className="grid grid-cols-4 md:grid-cols-4 gap-3 mb-3">
              {[
                { label: "Delivery urgency", key: "priority_weight_urgency"  },
                { label: "Margin/MT",        key: "priority_weight_margin"   },
                { label: "Customer tier",    key: "priority_weight_customer" },
                { label: "Stock available",  key: "priority_weight_stock"    },
             ].map((f) => {
            const value = Number(config?.[f.key]);
            return (
                <ReadField key={f.key} label={f.label} value={!isNaN(value) ? value.toFixed(1) : "0.0"} />
                );
            })}
            </div>

            {/* Weight bar */}
            <div className="flex rounded-3 overflow-hidden h-8 mb-3">
              {SCORE_ITEMS.map((item, i) => (
                <div
                  key={item.key}
                  className={`${WEIGHT_BAR_COLORS[i]} flex items-center justify-center text-1 font-bold text-white transition-all duration-500`}
                  style={{ width: `${weightPcts[i]}%` }}
                >
                  {item.label[0]} {weightPcts[i]}%
                </div>
              ))}
              <div className="ml-3 flex items-center text-2 font-bold text-success shrink-0 self-center">
                Σ=1.00 ✓
              </div>
            </div>

            {/* Live score preview */}
            <div className="rounded-4 border border-border bg-backgroundAlt p-3 mb-3">
              <p className="text-1 font-semibold tracking-widest uppercase text-text-light mb-3">
                Live Score Preview — Sample Order (8 days, 72% margin, Tier 2, Stock available)
              </p>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  {SCORE_ITEMS.map((item) => (
                    <ScoreRow key={item.key} item={item} weight={config[item.weightKey]} />
                  ))}
                </div>
                <div className="flex flex-col items-end justify-center shrink-0">
                  <p className="text-1 font-semibold uppercase tracking-widest text-text-light mb-1">Score</p>
                  <p className="text-8 font-bold text-warning">{totalScore}</p>
                </div>
              </div>
            </div>

          </div>
        </SectionCard>

      </div>

      <ConfigModal
        open={modal.open}
        mode={modal.mode}
        onClose={close}
        onSubmit={handleSubmit}
        initial={modal.mode === "edit" ? config : EMPTY_FORM}
      />
    </div>
    )
  }

const ConfigModal = ({ open, onClose, onSubmit, initial, mode }) => {
  const { form, handleChange, resetForm, setForm } = useFormHandler(initial ?? EMPTY_FORM);

  // Sync form with initial data whenever modal opens or initial changes
  useEffect(() => {
    if (open && initial) {
      setForm(initial);
    }
  }, [open, initial, setForm]);

  const weightSum = (
    +form.priority_weight_urgency +
    +form.priority_weight_margin +
    +form.priority_weight_customer +
    +form.priority_weight_stock
  ).toFixed(2);

  const weightValid = parseFloat(weightSum) === 1.0;

  return (
    <Modal title={`${mode === "add" ? "Add" : "Edit"} Configuration`} isOpen={open} onClose={() => { resetForm(); onClose();}} onSave={() => onSubmit(form)} saveButtonText={`${mode === "add" ? "Add" : "Edit"} Config`} cancelButtonText="Cancel" maxHeight="max-h-[90vh]" width="max-w-3xl">
            <form className="space-y-6">
            <Section title="Capacity Parameters">
              <div className="grid grid-cols-2 gap-4">
            {mode !== "edit" &&  <div className="col-span-2">
                <InputField label="Planning Config Name" name="label" type="text" value={form.label} onChange={handleChange} required={true} />
              </div>}

              {/* <div className="space-y-6"> */}

            {/* <div className="grid grid-cols-2 gap-4"> */}
              <InputField label="Machine Capacity" name="machine_capacity_mt" type="number" value={form.machine_capacity_mt} onChange={handleChange} unit="MT/d" required={true}/>
              <InputField label="OEE %"               name="oee_percentage"           type="number" value={form.oee_percentage}           onChange={handleChange} unit="%" required={true}/>
              <InputField label="Shift Hours"         name="shift_hours"              type="number" value={form.shift_hours}              onChange={handleChange} unit="hrs" required={true}/>
              <InputField label="Shifts/day"          name="shifts_per_day"           type="number" value={form.shifts_per_day}           onChange={handleChange} required={true} />
              <InputField label="Cold Storage"        name="cold_storage_capacity_mt" type="number" value={form.cold_storage_capacity_mt} onChange={handleChange} unit="MT" required={true} />
              <InputField label="Procurement Buffer"  name="procurement_buffer_pct"   type="number" value={form.procurement_buffer_pct}   onChange={handleChange} unit="%" required={true} />
              <InputField label="Annual Revenue Target" name="annual_revenue_target"  type="number" value={form.annual_revenue_target}    onChange={handleChange} className="col-span-2" required={true}/>
            </div>
          </Section>

            <Section title="Priority Weights (must sum to 1.00)">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Delivery Urgency" name="priority_weight_urgency"  type="number" value={form.priority_weight_urgency}  onChange={handleChange} required={true} />
              <InputField label="Margin/MT"        name="priority_weight_margin"   type="number" value={form.priority_weight_margin}   onChange={handleChange} required={true} />
              <InputField label="Customer Tier"    name="priority_weight_customer" type="number" value={form.priority_weight_customer} onChange={handleChange} required={true}/>
              <InputField label="Stock Available"  name="priority_weight_stock"    type="number" value={form.priority_weight_stock}    onChange={handleChange} required={true}/>
            </div>
            <div className={`mt-3 text-1 font-semibold ${weightValid ? "text-success" : "text-error"}`}>
              Σ = {weightSum} {weightValid ? "✓" : "— must equal 1.00"}
            </div>
          </Section>
              {/* </div> */}
            </form>
    </Modal>

  );
};

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-md font-bold text-primary mb-3 uppercase tracking-wide">{title}</h3>
    <hr className="border-border mb-4" />
    {children}
  </div>
);

const KpiCard = ({ label, value, valueClass }) => (
  <div className="rounded-4 border border-border bg-card px-4 py-3 min-w-[160px] shadow-sm">
    <p className="text-1 font-semibold tracking-widest uppercase text-text-light mb-2">{label}</p>
    <p className={`text-6 font-bold font-mono leading-none ${valueClass}`}>{value}</p>
  </div>
);

export const ReadField = ({ label, value, unit, className = "" }) => (
  <div className={`flex flex-col gap-1 w-full min-w-0 ${className}`}>
    <label className="text-1 font-medium text-text-light">{label}</label>
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-3 border border-border bg-backgroundAlt px-3 py-2 text-2 font-semibold text-text">
        {value}
      </div>
      {unit && <span className="text-1 text-text-light font-medium shrink-0">{unit}</span>}
    </div>
  </div>
);

const SectionCard = ({ children, gradient }) => (
  <div className={`mb-3 rounded-4 border bg-card shadow-sm overflow-hidden ${gradient ?? "border-border"}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, sub }) => (
  <div className="px-4 py-4">
    <div className="flex items-center gap-3 mb-1">
      <span className="text-6 mb-3">{icon}</span>
      <h2 className="text-4 font-bold text-text">{title}</h2>
    </div>
    {sub && <p className="text-1 text-text-light ml-5">{sub}</p>}
  </div>
);

const ScoreRow = ({ item, weight }) => {
  const score = (item.value * weight).toFixed(1);
  const barPct = Math.min(item.value, 100);
  const safeWeight = Number(weight) || 0; 
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 text-2 text-text-light">{item.label}</span>
      <span className="text-1 text-text-light">{item.value} ×</span>
      <span className={`text-2 font-bold ${item.textColor}`}>{safeWeight.toFixed(2)}</span>
      <span className="text-1 text-text-light">= </span>
      <span className={`text-2 font-bold ${item.textColor} w-10`}>{score}</span>
      <div className="flex-1 h-2 rounded-5 bg-backgroundAlt overflow-hidden">
        <div className={`h-full rounded-5 ${item.barColor}`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
};