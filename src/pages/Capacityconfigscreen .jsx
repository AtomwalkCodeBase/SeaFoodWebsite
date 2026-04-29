import { useState, useEffect } from "react";
import { AiOutlineSetting } from "react-icons/ai";
import { GiTargeting } from "react-icons/gi";
import { FiPlus, FiEdit2, FiX, FiCheck } from "react-icons/fi";
import { AddPlanningConfig, getPlanningConfig } from "../services/productServices";
import { toast } from "react-toastify";

// ── Constants ─────────────────────────────────
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
  { key: "urgency",  label: "Urgency",  weightKey: "priority_weight_urgency",  value: 60,  color: "bg-error",   textColor: "text-error",   barColor: "bg-error"   },
  { key: "margin",   label: "Margin",   weightKey: "priority_weight_margin",   value: 72,  color: "bg-success", textColor: "text-success", barColor: "bg-success" },
  { key: "customer", label: "Customer", weightKey: "priority_weight_customer", value: 75,  color: "bg-accent",  textColor: "text-primary", barColor: "bg-primary" },
  { key: "stock",    label: "Stock",    weightKey: "priority_weight_stock",    value: 100, color: "bg-info",    textColor: "text-info",    barColor: "bg-info"    },
];

const WEIGHT_BAR_COLORS = ["bg-error", "bg-success", "bg-accent", "bg-info"];

// ── Reusable Components ───────────────────────

/** Top KPI stat card */
const KpiCard = ({ label, value, valueClass }) => (
  <div className="rounded-4 border border-border bg-card px-4 py-3 min-w-[160px] shadow-sm">
    <p className="text-1 font-semibold tracking-widest uppercase text-textLight mb-2">{label}</p>
    <p className={`text-6 font-bold font-mono leading-none ${valueClass}`}>{value}</p>
  </div>
);

/** Labelled read-only field with optional unit suffix */
const ReadField = ({ label, value, unit, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-1 font-medium text-textLight">{label}</label>
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-3 border border-border bg-backgroundAlt px-3 py-2 text-2 font-semibold text-text">
        {value}
      </div>
      {unit && <span className="text-1 text-textLight font-medium shrink-0">{unit}</span>}
    </div>
  </div>
);

/** Modal input field */
const ModalField = ({ label, name, type = "text", value, onChange, unit, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-1 font-medium text-textLight">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={type === "number" ? "any" : undefined}
        className="flex-1 rounded-3 border border-border bg-background px-3 py-2 text-2 font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
      />
      {unit && <span className="text-1 text-textLight shrink-0">{unit}</span>}
    </div>
  </div>
);

/** Section wrapper card */
const SectionCard = ({ children, gradient }) => (
  <div className={`mb-3 rounded-4 border bg-card shadow-sm overflow-hidden ${gradient ?? "border-border"}`}>
    {children}
  </div>
);

/** Section header row */
const SectionHeader = ({ icon, title, sub }) => (
  <div className="px-4 py-4">
    <div className="flex items-center gap-3 mb-1">
      <span className="text-6 mb-3">{icon}</span>
      <h2 className="text-4 font-bold text-text">{title}</h2>
    </div>
    {sub && <p className="text-1 text-textLight ml-5">{sub}</p>}
  </div>
);

/** Icon button */
const IconBtn = ({ onClick, icon, label, variant = "primary" }) => {
  const base = "flex items-center gap-2 px-3 py-2 rounded-3 text-2 font-semibold transition-all duration-200";
  const variants = {
    primary: "bg-primary hover:bg-btnHover text-white shadow-sm",
    outline: "border border-primary text-primary hover:bg-primary/10",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {icon} {label}
    </button>
  );
};

/** Score preview row */
const ScoreRow = ({ item, weight }) => {
  const score = (item.value * weight).toFixed(1);
  const barPct = Math.min(item.value, 100);
  const safeWeight = Number(weight) || 0; 
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 text-2 text-textLight">{item.label}</span>
      <span className="text-1 text-textLight">{item.value} ×</span>
      <span className={`text-2 font-bold ${item.textColor}`}>{safeWeight.toFixed(2)}</span>
      <span className="text-1 text-textLight">= </span>
      <span className={`text-2 font-bold ${item.textColor} w-10`}>{score}</span>
      <div className="flex-1 h-2 rounded-5 bg-backgroundAlt overflow-hidden">
        <div className={`h-full rounded-5 ${item.barColor}`} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
};

// ── Add/Edit Modal ────────────────────────────
const ConfigModal = ({ open, onClose, onSubmit, initial, mode }) => {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);

  useEffect(() => { if (open) setForm(initial ?? EMPTY_FORM); }, [open, initial]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : type === "number" ? +value : value }));
  };

  const weightSum = (
    +form.priority_weight_urgency +
    +form.priority_weight_margin +
    +form.priority_weight_customer +
    +form.priority_weight_stock
  ).toFixed(2);

  const weightValid = parseFloat(weightSum) === 1.0;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-4 border border-border bg-card shadow-xl">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <h3 className="text-4 font-bold text-text">
            {mode === "add" ? "Add Config" : "Edit Config"}
          </h3>
          <button onClick={onClose} className="text-textLight hover:text-error transition mb-3">
            <FiX className="text-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 py-4 space-y-4">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Label"        name="label" value={form.label} onChange={handle} className="col-span-1" />
            <ModalField label="Config Name"  name="name"  value={form.name}  onChange={handle} className="col-span-1" />
          </div>

          {/* Capacity */}
          <div>
            <p className="text-1 font-semibold uppercase tracking-widest text-textLight mb-3">Capacity Parameters</p>
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Machine Capacity"    name="machine_capacity_mt"      type="number" value={form.machine_capacity_mt}      onChange={handle} unit="MT/d" />
              <ModalField label="OEE %"               name="oee_percentage"           type="number" value={form.oee_percentage}           onChange={handle} unit="%" />
              <ModalField label="Shift Hours"         name="shift_hours"              type="number" value={form.shift_hours}              onChange={handle} unit="hrs" />
              <ModalField label="Shifts/day"          name="shifts_per_day"           type="number" value={form.shifts_per_day}           onChange={handle} />
              <ModalField label="Cold Storage"        name="cold_storage_capacity_mt" type="number" value={form.cold_storage_capacity_mt} onChange={handle} unit="MT" />
              <ModalField label="Procurement Buffer"  name="procurement_buffer_pct"   type="number" value={form.procurement_buffer_pct}   onChange={handle} unit="%" />
              <ModalField label="Annual Revenue Target" name="annual_revenue_target"  type="number" value={form.annual_revenue_target}    onChange={handle} className="col-span-2" />
            </div>
          </div>

          {/* Priority Weights */}
          <div>
            <p className="text-1 font-semibold uppercase tracking-widest text-textLight mb-3">Priority Weights (must sum to 1.00)</p>
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Delivery Urgency" name="priority_weight_urgency"  type="number" value={form.priority_weight_urgency}  onChange={handle} />
              <ModalField label="Margin/MT"        name="priority_weight_margin"   type="number" value={form.priority_weight_margin}   onChange={handle} />
              <ModalField label="Customer Tier"    name="priority_weight_customer" type="number" value={form.priority_weight_customer} onChange={handle} />
              <ModalField label="Stock Available"  name="priority_weight_stock"    type="number" value={form.priority_weight_stock}    onChange={handle} />
            </div>
            <div className={`mt-3 text-1 font-semibold ${weightValid ? "text-success" : "text-error"}`}>
              Σ = {weightSum} {weightValid ? "✓" : "— must equal 1.00"}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-border">
          <IconBtn onClick={onClose}            icon={<FiX />}     label="Cancel" variant="outline" />
          <IconBtn onClick={() => onSubmit(form)} icon={<FiCheck />} label="Save"   variant="primary" />
        </div>
      </div>
    </div>
  );
};

// ── Main Screen ───────────────────────────────
export default function CapacityConfigScreen() {
  const [config, setConfig] = useState(null);

  const [modal, setModal] = useState({ open: false, mode: "add" });

  // Derived KPIs
const effectiveCap = config
  ? ((config.machine_capacity_mt * config.oee_percentage) / 100).toFixed(1)
  : 0;

const dailyOutput = config ? (effectiveCap * 0.8).toFixed(1) : 0;

const annualMT = config ? (dailyOutput * 300).toFixed(0) : 0;

const revenueCr = config
  ? (config.annual_revenue_target / 1e7).toFixed(0)
  : 0;

const totalScore = config
  ? SCORE_ITEMS.reduce((sum, item) => {
      return sum + item.value * (config[item.weightKey] || 0);
    }, 0).toFixed(0)
  : 0;

const weightPcts = config
  ? SCORE_ITEMS.map((s) => Math.round((config[s.weightKey] || 0) * 100))
  : [0, 0, 0, 0];

  const openAdd  = () => setModal({ open: true, mode: "add"  });
  const openEdit = () => setModal({ open: true, mode: "edit" });
  const close    = () => setModal((m) => ({ ...m, open: false }));

//   const handleSubmit = (form) => {
//     console.log("form", form)
//     setConfig(form);
//     close();
//   };

  useEffect(() => {
    fetchPlanningConfig();
  }, []);

    const fetchPlanningConfig = async () => {
      try {
        const res = await getPlanningConfig();
        setConfig(res?.data?.[0] || null);
      } catch (error) {
        toast.error("Failed to load plan config details.");
      }
    };

const handleSubmit = async (form) => {
  const payload = {
    label: form.label,
    name: form.name,
    machine_capacity_mt: form.machine_capacity_mt,
    oee_percentage: form.oee_percentage,
    shift_hours: form.shift_hours,
    shifts_per_day: form.shifts_per_day,
    cold_storage_capacity_mt: form.cold_storage_capacity_mt,
    procurement_buffer_pct: form.procurement_buffer_pct,

    priority_weight_urgency: form.priority_weight_urgency,
    priority_weight_margin: form.priority_weight_margin,
    priority_weight_customer: form.priority_weight_customer,
    priority_weight_stock: form.priority_weight_stock,

    annual_revenue_target: form.annual_revenue_target,
  };

  try {
    console.log("AddPlanningConfig",payload)
    await AddPlanningConfig(payload);
    toast.success("Add capacity planning success")
    await fetchPlanningConfig();
    close();
  } catch (err) {
    console.error("Create config failed", err);
  }
};

if (!config) {
  return (
    <>
    <div className="flex items-center justify-center text-textLight">
      No planning config found
    </div>

    <div className="flex gap-2">
            <IconBtn onClick={openAdd}  icon={<FiPlus />}   label="Add"  variant="primary" />
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

  return (
    <div className="min-h-screen bg-background p-4 font-poppins transition-colors duration-300">
      <div className="mx-auto space-y-4">

        {/* ── KPI Row ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex gap-3 flex-wrap">
            <KpiCard label="Effective Capacity"  value={`${effectiveCap} MT/d`} valueClass="text-success" />
            <KpiCard label="Daily Output (Est.)" value={`${dailyOutput} MT/d`}  valueClass="text-secondary" />
            <KpiCard label="Annual (300d)"        value={`${annualMT} MT`}       valueClass="text-warning" />
            <KpiCard label="Revenue Est."         value={`₹${revenueCr} Cr`}    valueClass="text-primary" />
          </div>
          <div className="flex gap-2">
            <IconBtn onClick={openAdd}  icon={<FiPlus />}   label="Add"  variant="primary" />
            <IconBtn onClick={openEdit} icon={<FiEdit2 />}  label="Edit" variant="outline" />
          </div>
        </div>

        {/* ── Capacity Parameters ── */}
        <SectionCard gradient="border-primary/40">
          <SectionHeader
            icon={<AiOutlineSetting className="text-primary" />}
            title="Capacity parameters"
            // sub="API: GET /api/planning/config/active/"
          />
          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <ReadField label="Machine capacity" value={config.machine_capacity_mt} unit="MT/d" />
              <ReadField label="OEE %"            value={config.oee_percentage}      unit="%" />
              <ReadField label="Effective cap."   value={effectiveCap}               unit="MT/d" />
              <ReadField label="Shift hours"      value={config.shift_hours}         unit="hrs" />
              <ReadField label="Shifts/day"       value={config.shifts_per_day} />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <ReadField label="Cold storage"       value={config.cold_storage_capacity_mt} unit="MT" />
              <ReadField label="Procurement buffer" value={config.procurement_buffer_pct}   unit="%" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
              <p className="text-1 font-semibold tracking-widest uppercase text-textLight mb-3">
                Live Score Preview — Sample Order (8 days, 72% margin, Tier 2, Stock available)
              </p>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  {SCORE_ITEMS.map((item) => (
                    <ScoreRow key={item.key} item={item} weight={config[item.weightKey]} />
                  ))}
                </div>
                <div className="flex flex-col items-end justify-center shrink-0">
                  <p className="text-1 font-semibold uppercase tracking-widest text-textLight mb-1">Score</p>
                  <p className="text-8 font-bold text-warning">{totalScore}</p>
                </div>
              </div>
            </div>

          </div>
        </SectionCard>

      </div>

      {/* ── Modal ── */}
      <ConfigModal
        open={modal.open}
        mode={modal.mode}
        onClose={close}
        onSubmit={handleSubmit}
        initial={modal.mode === "edit" ? config : EMPTY_FORM}
      />
    </div>
  );
}