import { useState } from "react";
import {
  FiUsers, FiUserCheck, FiSun, FiMoon, FiAlertTriangle,
  FiClock, FiPlus, FiX, FiChevronDown, FiChevronUp, FiBarChart2,
} from "react-icons/fi";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import Layout from "../../components/Layout";
import { useAssignWorker, useGetEmployeeList, useGetWorkAvailable, useGetWorkCoverage, useReleaseWorker } from "../../hooks/useProductQueries";
import StatsCard from "../../components/StatsCard";
import DataTable, { Td } from "../../components/Datatable";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Card from "../../components/Card";
import { SectionHeader } from "../../components/EmptyState";
import { theme } from "../../styles/Theme";

// ─── coverage badge ───────────────────────────────────────────────────────────

const getCoverageStatusMeta = (status) => {
  const map = {
    SUFFICIENT: { label: "✓ Sufficient", variant: "success" },
    SHORT:       { label: "⚠ Short",      variant: "error"       },
    OVER:        { label: "↑ Over",        variant: "info"      },
  };

  return map[status] || map.SHORT;
};

// ─── activity row ─────────────────────────────────────────────────────────────

const ActivityRow = ({ activity, employees, onAssign, onRelease, assigning }) => {
  const [open, setOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");

  const stageColor = {
    "Cleaning":             "text-primary",
    "Cooking":              "text-error",
    "Glazing":              "text-purple-500",
    "Packing":              "text-warning",
    "Light Wash":           "text-secondary",
    "Post Grading Cleaning":"text-accent",
  };
  const color = stageColor[activity.activity_name] || "text-textLight";

  const handleAssign = () => {
    if (!selectedEmp) return;
    onAssign(activity.batch_activity_id, selectedEmp);
    setSelectedEmp("");
  };

  return (
    <div className="border-b border-border last:border-0">
      {/* main row */}
      <div
        className="grid grid-cols-[1fr_80px_80px_140px_100px_100px_36px] gap-2 items-center px-4 py-3 hover:bg-backgroundAlt transition-colors cursor-pointer text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`font-semibold ${color}`}>{activity.activity_name}</span>
        <span className="text-text">{activity.workers_required}</span>
        <span className="text-text">{activity.workers_allocated}</span>
        <CoverageBadge status={activity.coverage_status} />
        <span className="text-text">{activity.worker_efficiency_kg_hr}</span>
        <span className="text-text">{activity.estimated_duration_hours?.toFixed(1)}</span>
        <span className="text-textLight">
          {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
        </span>
      </div>

      {/* expanded: allocated employees + assign */}
      {open && (
        <div className="px-4 pb-3 bg-accentLight space-y-3">
          {/* batch ref */}
          <p className="text-xs text-textLight pt-2">
            Batch: <strong className="text-text">{activity.batch_number}</strong>
            &nbsp;·&nbsp;Input: <strong className="text-text">{activity.input_weight_mt} MT</strong>
          </p>

          {/* allocated employees */}
          {activity.allocated_employees?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activity.allocated_employees.map((emp) => (
                <div key={emp.employee_id} className="flex items-center gap-1.5 bg-card border border-border rounded-full pl-2.5 pr-1.5 py-1">
                  <span className="text-xs font-medium text-text">{emp.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRelease(activity.batch_activity_id, emp.employee_id); }}
                    className="w-4 h-4 rounded-full bg-backgroundAlt flex items-center justify-center hover:bg-red-100 hover:text-error transition-colors"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textLight italic">No workers assigned yet</p>
          )}

          {/* assign form */}
          {activity.coverage_status !== "SUFFICIENT" && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 min-w-[180px] text-xs bg-inputBg border border-border rounded-lg px-3 py-1.5 text-text focus:outline-none focus:border-primary"
              >
                <option value="">Select employee…</option>
                {(employees || []).map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.name} ({e.shift})
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedEmp || assigning}
                onClick={(e) => { e.stopPropagation(); handleAssign(); }}
                className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-40"
              >
                <FiPlus size={12} /> Assign
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── skills radar ─────────────────────────────────────────────────────────────

const SkillsRadar = ({ skillGaps }) => {
  const data = (skillGaps || []).map((g) => ({
    subject:   g.activity_type,
    Available: g.total_allocated,
    Required:  g.total_required,
  }));

  if (!data.length) return (
    <Card style={{border: `1px solid ${theme.colors.primaryLight}`}}>
      <SectionHeader title="Skills Radar" icon={<FiBarChart2 className="text-primary" size={18} />} />
   <div className="flex justify-center items-center h-52">
    <h4 className="text-center m-0">No employee assigned</h4>
  </div>
    </Card>
  );

  return (
    <Card style={{border: `1px solid ${theme.colors.primaryLight}`}}>
      <SectionHeader title="Skills Radar" icon={<FiBarChart2 className="text-primary" size={18} />} />
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--tw-border-opacity, #C8DDED)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 500 , fill: theme.colors.textLight }} />
          <Tooltip
            contentStyle={{ background: 'var(--color-card)', border: "1px solid #C8DDED", borderRadius: 8, fontSize: 12, color: 'var(--color-text)' }}
          />
          <Radar name="Available" dataKey="Available" stroke={theme.colors.success} fill={theme.colors.success} fillOpacity={0.25} />
          <Radar name="Required"  dataKey="Required"  stroke={theme.colors.error} fill={theme.colors.error} fillOpacity={0.15} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-textLight">
          <span className="w-3 h-3 rounded-sm bg-primary opacity-80 inline-block" /> Available
        </span>
        <span className="flex items-center gap-1.5 text-xs text-textLight">
          <span className="w-3 h-3 rounded-sm bg-error opacity-80 inline-block" /> Required
        </span>
      </div>
      </Card>
  );
};

// ─── employee roster ──────────────────────────────────────────────────────────

const ROSTER_COLS = ["Name", "Shift", "Status"];

const EmployeeRoster = ({ employees }) => (
  <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full">
    <div className="px-4 py-3 border-b border-border">
      <p className="font-semibold text-text text-sm flex items-center gap-2">
        <FiUserCheck className="text-primary" size={15} />
        Available Employees
      </p>
    </div>
    <div className="overflow-auto" style={{ maxHeight: 320 }}>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-backgroundAlt">
            {ROSTER_COLS.map((c) => (
              <th key={c} className="px-4 py-2 text-left text-textLight font-semibold uppercase tracking-wider">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(employees || []).map((emp) => (
            <tr key={emp.employee_id} className="border-t border-border hover:bg-backgroundAlt transition-colors">
              <td className="px-4 py-2 font-medium text-text">{emp.name}</td>
              <td className="px-4 py-2">
                <span className={`font-semibold ${emp.shift === "MORNING" ? "text-warning" : "text-secondary"}`}>
                  {emp.shift === "MORNING" ? "Morning" : "Evening"}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="bg-green-100 text-success border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Available
                </span>
              </td>
            </tr>
          ))}
          {!employees?.length && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-textLight">No employees available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── shortages panel ──────────────────────────────────────────────────────────

const ShortagesPanel = ({ shortages }) => {
  if (!shortages?.length) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
      <p className="text-xs font-bold text-error flex items-center gap-2 mb-3">
        <FiAlertTriangle size={13} /> Staffing Shortages
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {shortages.map((s, i) => (
          <div key={i} className="bg-white border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-text">{s.activity}</p>
            <p className="text-xs text-text-light mt-0.5">{s.batch}</p>
            <p className="text-xs text-error font-bold mt-1">Short by {s.short_by}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── activity table columns ───────────────────────────────────────────────────

const TABLE_COLS = ["Stage", "Workers Req.", "Allocated", "Coverage", "Efficiency (kg/hr)", "Est. Duration (hrs)", ""];

// ─── main screen ──────────────────────────────────────────────────────────────

const getEmployeeId = (employee) => employee?.emp_id ?? employee?.employee_id;
const getEmployeeName = (employee) => employee?.name ?? employee?.employee_name ?? "";
const getActivityKey = (activity) => activity?.batch_activity_id ?? activity?.id;

const WorkforceScreen = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedEmpByActivity, setSelectedEmpByActivity] = useState({});

  // ── replace these with your real tanstack hooks ──
  const { data: totalWorker, isLoading: totalWorkerLoading } = useGetEmployeeList();
  const { data: coverage, isLoading: coverageLoading } = useGetWorkCoverage(true , {date: selectedDate});
  const { data: available, isLoading: availableLoading } = useGetWorkAvailable(true, {date:selectedDate});
  const workerList = (totalWorker || []).filter((worker) => worker.is_manager === false);
  const { mutate: assignWorker, isLoading: assigningWorker } = useAssignWorker();
  const { mutate: releaseWorker, isLoading: releasing } = useReleaseWorker();
  const assigning = assigningWorker || releasing;

  const morningCount = (available?.employees || []).filter((e) => e.shift === "MORNING").length;
  const eveningCount = (available?.employees || []).filter((e) => e.shift === "EVENING").length;

  const STATUS_CARD = [
    {label: "Total Workers", value: coverage?.total_workers_allocated ?? available?.total_available , icon: <FiUsers />, color: "primary"},
    {label: "Allocated", value: coverage?.total_workers_allocated, icon: <FiUserCheck />, color: "secondary"},
    {label: "Morning Shift", value: morningCount, icon: <FiSun />, color: "accent"},
    {label: "Evening Shift", value: eveningCount, icon: <FiMoon />, color: "success"}
  ]

  const assignableEmployees =
    available?.employees?.length > 0
      ? available.employees
      : workerList;

  const handleAssign = (activity) => {
    const activityId = getActivityKey(activity);
    const selectedId = selectedEmpByActivity[activityId];
    if (!selectedId) return;

    const employee = assignableEmployees.find(
      (emp) => String(getEmployeeId(emp)) === String(selectedId)
    );
    if (!employee) return;

    assignWorker({
      id: activityId,
      employee_id: getEmployeeId(employee),
      name: getEmployeeName(employee),
    });
    // console.log({
    //   id: activityId,
    //   employee_id: getEmployeeId(employee),
    //   name: getEmployeeName(employee),
    // })

    setSelectedEmpByActivity((prev) => ({ ...prev, [activityId]: "" }));
  };

  const handleRelease = (activity, employee) => {
    const allocationId = employee.id;
    releaseWorker({ allocation_id: allocationId });
  };

  return (
    <Layout title="Workforce &amp; Coverage">
    <div className="p-4 space-y-5">

      {/* date picker */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* <h1 className="text-xl font-bold text-text">Workforce &amp; Coverage</h1> */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-sm bg-inputBg border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-primary"
        />
      </div>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-4 lg:grid-cols-4 gap-3">
        {STATUS_CARD.map((stat) => (
          <StatsCard label={stat.label} icon={stat.icon} value={stat.value} color={stat.color} />
        ))}
      </div>

      {/* ── shortages ── */}
      <ShortagesPanel shortages={coverage?.shortages} />

      {/* ── stage allocation table ── */}
      <Card className="mt-4">
      <DataTable
      columns={TABLE_COLS}
      data={coverage?.activities || []}
      getRowKey={(activity) => getActivityKey(activity)}
      expandedRow={expandedRow}
      renderRow={(activity, rowKey) => {
        const status = getCoverageStatusMeta(activity.coverage_status);
        const isExpanded = String(expandedRow) === String(rowKey);
        return(
        <>
        <Td>{activity.activity_name}</Td>
        <Td>{activity.workers_required}</Td>
        <Td>{activity.workers_allocated}</Td>
        <Td><Badge variant={status.variant}>{status.label}</Badge></Td>
        <Td>{activity.worker_efficiency_kg_hr}</Td>
        <Td>{activity.estimated_duration_hours?.toFixed(1)}</Td>
        <Td>
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedRow((prev) =>
                String(prev) === String(rowKey) ? null : rowKey
              );
            }}
          >
            {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </Button>
        </Td>
        </>
  )}}
  renderExpandedRow={(activity) => {
    const activityId = getActivityKey(activity);
    const selectedEmp = selectedEmpByActivity[activityId] || "";

    return (
      <div className="px-4 pb-3 bg-accentLight space-y-3">
        <p className="text-xs text-textLight pt-2">
          Batch: <strong className="text-text">{activity.batch_number}</strong>
          &nbsp;·&nbsp;Input: <strong className="text-text">{activity.input_weight_mt} MT</strong>
        </p>

        {activity.allocated_employees?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activity.allocated_employees.map((emp) => (
              <div
                key={getEmployeeId(emp)}
                className="flex items-center gap-1.5 bg-card border border-border rounded-full pl-2.5 pr-1.5 py-1"
              >
                <span className="text-xs font-medium text-text">
                  {getEmployeeName(emp)} ({getEmployeeId(emp) || "--"})
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRelease(activity, emp);
                  }}
                  className="w-4 h-4 rounded-full bg-backgroundAlt flex items-center justify-center hover:bg-red-100 hover:text-error transition-colors"
                >
                  <FiX size={10} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-textLight italic">No workers assigned yet</p>
        )}

        {activity.coverage_status !== "SUFFICIENT" && (
          <div className="flex items-end gap-2 flex-wrap">
            <InputField
              type="select"
              label="Employee"
              value={selectedEmp}
              onChange={(e) =>
                setSelectedEmpByActivity((prev) => ({
                  ...prev,
                  [activityId]: e.target.value,
                }))
              }
              onClick={(e) => e.stopPropagation()}
              options={assignableEmployees.map((emp) => ({
                value: String(getEmployeeId(emp)),
                label: `${getEmployeeName(emp)} (${emp.shift || "NA"})`,
              }))}
            />
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAssign(activity);
              }}
              disabled={!selectedEmp || assigning}
            >
              <FiPlus size={12} /> Assign
            </Button>
          </div>
        )}
      </div>
    );
  }}
      />
      </Card>

      {/* <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-text text-sm">Stage Allocation &amp; Coverage</p>
        </div>

        <div className="grid grid-cols-[1fr_80px_80px_140px_100px_100px_36px] gap-2 px-4 py-2 bg-backgroundAlt text-xs font-semibold text-textLight uppercase tracking-wider">
          {TABLE_COLS.map((col, i) => <span key={i}>{col}</span>)}
        </div>

        {(coverage?.activities || []).map((activity) => (
          <ActivityRow
            key={activity.batch_activity_id}
            activity={activity}
            employees={available?.employees}
            onAssign={assignWorker}
            onRelease={releaseWorker}
            assigning={assigning}
          />
        ))}

        {!coverage?.activities?.length && (
          <p className="text-center text-textLight text-sm py-8">
            No activities for this date. Select a date with active batches.
          </p>
        )}
      </div> */}

      {/* ── radar + roster ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkillsRadar skillGaps={coverage?.skill_gaps} />
        <EmployeeRoster employees={available?.employees} />
      </div>

    </div>
    </Layout>
  );
};

export default WorkforceScreen;



