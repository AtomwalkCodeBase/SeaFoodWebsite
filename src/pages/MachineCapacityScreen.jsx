import { RiAlertFill } from "react-icons/ri";
import { GiFactory } from "react-icons/gi";
import { getMachineCapacity, getProcessActivityList } from "../services/productServices";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ConfirmPopup from "../components/ConfirmPopup";

// ── Dummy data (replace with your own) ───────
const MACHINES = [
    { id: "EQ-CLN-01", name: "Cleaning Line A", rawCap: 10, count: 2, downtime: 8, netCap: 18.4, vsBest: 85, isBottleneck: false, products: ["IQF-CKD", "RAW-BLK", "PD-RAW"] },
    { id: "EQ-CKR-01", name: "Cooking Line A", rawCap: 8, count: 3, downtime: 10, netCap: 21.6, vsBest: 100, isBottleneck: false, products: ["IQF-CKD", "WHL-CKD"] },
    { id: "EQ-IQF-01", name: "IQF Tunnel", rawCap: 6, count: 2, downtime: 5, netCap: 11.4, vsBest: 53, isBottleneck: false, products: ["IQF-CKD", "PD-RAW"] },
    { id: "EQ-PLF-01", name: "Plate Freezer", rawCap: 7, count: 1, downtime: 6, netCap: 6.6, vsBest: 30, isBottleneck: true, products: ["RAW-BLK"] },
    { id: "EQ-GLZ-01", name: "Glazing Unit A", rawCap: 9, count: 2, downtime: 4, netCap: 17.3, vsBest: 80, isBottleneck: false, products: ["IQF-CKD", "RAW-BLK", "WHL-CKD"] },
    { id: "EQ-PKG-01", name: "Packing Line A", rawCap: 7, count: 2, downtime: 7, netCap: 13.0, vsBest: 60, isBottleneck: false, products: ["IQF-CKD", "RAW-BLK", "PD-RAW", "WHL-CKD"] },
    { id: "EQ-DVN-01", name: "Deveining Station", rawCap: 4, count: 3, downtime: 5, netCap: 11.4, vsBest: 53, isBottleneck: false, products: ["PD-RAW"] },
];

const PRODUCT_COLORS = {
    "IQF-CKD": "bg-primary/10 text-primary border border-primary/30",
    "RAW-BLK": "bg-secondary/10 text-secondary border border-secondary/30",
    "PD-RAW": "bg-accent/20 text-accent border border-accent/30",
    "WHL-CKD": "bg-warning/10 text-warning border border-warning/30",
};

// ── Reusable Components ───────────────────────

/** Capacity summary card (top scroll row) */
const CapacityCard = ({ machine }) => (
    <div
        className={[
            "min-w-[200px] rounded-2xl p-4 border transition-all duration-200 shrink-0",
            machine.isBottleneck
                ? "border-warning bg-warning/5 shadow-lg shadow-warning/20"
                : "border-border bg-card shadow-md",
        ].join(" ")}
    >
        <p className="text-xs font-semibold tracking-widest uppercase text-textLight mb-2">
            {machine.name}
        </p>
        <p className="text-2xl font-bold text-text leading-none mb-1">
            {machine.netCap}
        </p>
        <p className="text-xs text-textLight">
            MT/d net · {machine.count}× · {machine.downtime}% down
        </p>
        {machine.isBottleneck && (
            <span className="mt-3 inline-flex items-center gap-1 bg-warning text-text text-xs font-bold px-3 py-0.5 rounded-full">
                <RiAlertFill className="text-sm" /> BOTTLENECK
            </span>
        )}
    </div>
);

/** Progress bar for vsBest % */
const VsBestBar = ({ pct }) => {
    const color =
        pct >= 90 ? "bg-success" :
            pct >= 55 ? "bg-primary" :
                pct >= 35 ? "bg-warning" : "bg-error";

    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-2 rounded-full bg-backgroundAlt overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-textLight w-8 text-right">{pct}%</span>
        </div>
    );
};

/** Product tag chip */
const ProductChip = ({ label }) => (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRODUCT_COLORS[label] ?? "bg-backgroundAlt text-textLight"}`}>
        {label}
    </span>
);

/** Table header cell */
const TH = ({ children, className = "" }) => (
    <th className={`px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-textLight ${className}`}>
        {children}
    </th>
);

/** Table data cell */
const TD = ({ children, className = "" }) => (
    <td className={`px-4 py-4 text-sm text-text ${className}`}>
        {children}
    </td>
);

/** Full table row */
const MachineRow = ({ machine, isOdd, setIsAddModalOpen }) => (
    <tr className={`border-t border-border ${isOdd ? "bg-backgroundAlt/40" : ""}`}>
        <TD><span className="font-semibold">{machine.name}</span></TD>
        <TD><span className="text-xs text-textLight font-mono">{machine.id}</span></TD>
        <TD><span className="font-semibold">{machine.rawCap} MT</span></TD>
        <TD><span className="font-semibold">{machine.count}×</span></TD>
        <TD>
            <span className={`font-bold ${machine.downtime >= 8 ? "text-error" : "text-warning"}`}>
                {machine.downtime}%
            </span>
        </TD>
        <TD>
            <span className="font-bold text-success">{machine.netCap} MT</span>
        </TD>
        {/* <TD><VsBestBar pct={machine.vsBest} /></TD> */}
    <TD>
      <div className="flex flex-wrap gap-1.5">
        {machine.products.length === 0 ? (
          <span className="text-textLight text-xs">No usage</span>
        ) : (
          machine.products.map((p, i) => (
            <span key={i} className="text-xs bg-backgroundAlt px-2 py-0.5 rounded">
              {p}
            </span>
          ))
        )}
      </div>
    </TD>
    <TD>
    <button
    onClick={() => setIsAddModalOpen(true)}
    lassName="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200"
    >
          + Add
    </button>
    </TD>
    </tr>
);

// ── Main Screen ───────────────────────────────
export default function MachineCapacityScreen() {
    const [machines, setMachines] = useState([]);
    const [activities, setActivities] = useState([]);
    const [formData, setFormData] = useState({
        equipment: "",
        display_name: "",
        raw_capacity_mt_per_day: "",
        machine_count: "",
        downtime_percentage: ""
    });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    getMachines();
    getActivities();

  }, []);

const getMachines = async () => {
  try {
    const res = await getMachineCapacity(); // your API
    setMachines(res.data || []);
  } catch {
    toast.error("Failed to load machines");
  }
};

const getActivities = async () => {
  try {
    const res = await getProcessActivityList({ product_id: 1 });
    setActivities(res.data || []);
  } catch {
    toast.error("Failed to load activities");
  }
};

const handleSave = async () => {
  const payload = {
    equipment: formData.equipment,
    display_name: formData.display_name,
    raw_capacity_mt_per_day: Number(formData.raw_capacity_mt_per_day),
    machine_count: Number(formData.machine_count),
    downtime_percentage: Number(formData.downtime_percentage)
  };

  console.log("Payload:", payload);

  try {
    // const res = await AddMachineCapacity(payload);

    toast.success("Saved successfully");

    setIsConfirmOpen(false);
    setIsAddModalOpen(false);

    getMachines(); // refresh
  } catch {
    toast.error("Failed to save");
  }
};

const validActivities = activities.filter(
  (a) => a.a_equipment_name && a.a_equipment_name !== null
);

const mappedMachines = (machines.length ? machines : MACHINES).map((m) => {
  const relatedActivities = validActivities.filter(
    (a) => a.a_equipment_name === m.equipment_name
  );

  return {
    id: m.id,
    name: m.display_name ? m.display_name : m.equipment_name, // ✅ fix #3
    rawCap: parseFloat(m.raw_capacity_mt_per_day || m.rawCap || 0),
    count: m.machine_count || m.count,
    downtime: parseFloat(m.downtime_percentage || m.downtime || 0),
    netCap: parseFloat(m.net_capacity_mt_per_day || m.netCap || 0),
    isBottleneck: false,
    products: relatedActivities.map((a) => a.activity_name),
    equipmentId: m.equipment || null // needed for add
  };
});

    return (
        <>
        <div className="min-h-screen bg-background p-1 font-body transition-colors duration-300">
            <div className="mx-auto space-y-6">

                {/* ── Capacity Cards Row ── */}
                <div className="flex gap-4 overflow-x-auto mb-3 scrollbar-thin">
                    {mappedMachines.length === 0 ? (
                    <div className="text-textLight">No machines available</div>
                    ) : (
                    mappedMachines.map((m) => (
                        <CapacityCard key={m.id} machine={m} />
                    ))
                    )}
                </div>

                {/* ── Machine Capacity Config Table ── */}
                <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">

                    {/* Section Header */}
                    <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-3">
                            <GiFactory className="text-2xl text-primary mb-3" />
                            <div>
                                <h2 className="text-lg font-bold text-text">
                                    Machine capacity config
                                </h2>
                            </div>
                        </div>
                                <p className="text-xs text-textLight mt-0.5">
                                    Extends ERP EquipmentMachine via MachineCapacityConfig
                                </p>
                    </div>
                    {/* <SectionHeader
                        icon={<GiFactory className="text-2xl text-primary" />}
                        title="Machine capacity config"
                        sub="Extends ERP EquipmentMachine via MachineCapacityConfig"
                    /> */}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-backgroundAlt">
                                <tr>
                                    <TH>Machine</TH>
                                    <TH>ERP Equipment</TH>
                                    <TH>Raw Cap.</TH>
                                    <TH>Count</TH>
                                    <TH>Downtime</TH>
                                    <TH>Net Capacity</TH>
                                    {/* <TH className="min-w-[130px]">Vs Best</TH> */}
                                    <TH>Used by Products</TH>
                                    <TH>Action</TH>
                                </tr>
                            </thead>
                            <tbody>
                                {mappedMachines.map((m, i) => (
                                    <MachineRow key={m.id} machine={m} isOdd={i % 2 !== 0} setIsAddModalOpen={setIsAddModalOpen}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>

<ConfirmPopup
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleSave}
  title="Confirmation"
  message="Are you sure you want to save this?"
  confirmLabel="Yes"
/>


        {isAddModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white p-5 rounded-xl w-[400px]">
      <h3 className="font-bold mb-3">Add Machine Capacity</h3>

      <input
        placeholder="Display Name"
        value={formData.display_name}
        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        placeholder="Raw Capacity"
        value={formData.raw_capacity_mt_per_day}
        onChange={(e) => setFormData({ ...formData, raw_capacity_mt_per_day: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        placeholder="Machine Count"
        value={formData.machine_count}
        onChange={(e) => setFormData({ ...formData, machine_count: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        placeholder="Downtime %"
        value={formData.downtime_percentage}
        onChange={(e) => setFormData({ ...formData, downtime_percentage: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <div className="flex justify-end gap-2">
        <button onClick={() => setIsAddModalOpen(false)}>Cancel</button>
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-primary text-white px-3 py-1 rounded"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
        </>
    );
}