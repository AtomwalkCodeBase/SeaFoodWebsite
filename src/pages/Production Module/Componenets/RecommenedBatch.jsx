import { useState, useCallback } from "react";
import {
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiClock,
  FiZap, FiChevronDown, FiChevronUp, FiCheck, FiInfo,
} from "react-icons/fi";
import { MdOutlineFactory } from "react-icons/md";
import Card from "../../../components/Card";
import { useTheme } from "../../../context/ThemeContext";

// ─── helpers ─────────────────────────────────────────────────────────────────

const utilColor = (pct) =>
  pct >= 90 ? "bg-error" : pct >= 60 ? "bg-warning" : "bg-success";

const labelVariant = (label = "") => {
  const l = label.toUpperCase();
  if (l === "CRITICAL") return { bg: "bg-red-100",    text: "text-error",   border: "border-red-200"   };
  if (l === "URGENT")   return { bg: "bg-yellow-100", text: "text-warning", border: "border-yellow-200" };
  return                       { bg: "bg-blue-100",   text: "text-info",    border: "border-blue-200"   };
};

// ─── CapacitySummaryBar ───────────────────────────────────────────────────────

const CapacitySummaryBar = ({ data, batchState }) => {
  const totalPlanned  = batchState.filter((b) => b.included).reduce((s, b) => s + Number(b.qty), 0);
  const utilization   = data.capacity_available_mt
    ? Math.min((totalPlanned / data.capacity_available_mt) * 100, 100) : 0;
  const batchCount    = batchState.filter((b) => b.included).length;
  const coveredOrders = batchState.reduce((s, b) => s + (b.orders?.length || 0), 0);
  const totalOrders   = data.priority_queue?.length || 0;

  return (
    <div className="flex flex-row gap-3 w-full mb-5">
      <div className="flex-[5]">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-text text-sm">Daily Capacity Usage</p>
            <span className={`text-xl font-bold ${utilization >= 90 ? "text-error" : utilization >= 60 ? "text-warning" : "text-success"}`}>
              {Math.round(utilization)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-background-alt rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${utilColor(utilization)}`} style={{ width: `${utilization}%` }} />
          </div>
          <div className="flex justify-between text-xs text-textLight mt-2">
            <span>Planned: <strong className="text-text">{totalPlanned.toFixed(1)} MT</strong></span>
            <span>Capacity: <strong className="text-text">{data.capacity_available_mt} MT</strong></span>
            <span>Est. output: <strong className="text-text">{(totalPlanned * 0.785).toFixed(1)} MT</strong></span>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center h-full">
          <p className="text-xs text-textLight font-semibold tracking-wider uppercase">Batches</p>
          <h2 className="text-2xl font-bold text-text mt-1">{batchCount}</h2>
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col items-center justify-center h-full">
          <p className="text-xs text-textLight font-semibold tracking-wider uppercase">Orders Covered</p>
          <h2 className="text-2xl font-bold text-text mt-1">
            {coveredOrders}<span className="text-base text-textLight font-normal"> / {totalOrders}</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

// ─── AlertsPanel — 3-column layout ───────────────────────────────────────────

const ALERT_COL_HEIGHT = 5; // max items before scroll

const AlertColumn = ({ title, icon: Icon, iconClass, items, emptyText, borderClass, bgClass }) => (
  <div className={`flex-1 border ${borderClass} ${bgClass} rounded-xl overflow-hidden`}>
    {/* header */}
    <div className={`flex items-center gap-2 px-3 py-2 border-b ${borderClass}`}>
      <Icon size={13} className={iconClass} />
      <span className={`text-xs font-bold ${iconClass}`}>{title}</span>
      {items.length > 0 && (
        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${iconClass} bg-white bg-opacity-60`}>
          {items.length}
        </span>
      )}
    </div>
    {/* scrollable list — max 5 items */}
    <div
      className="overflow-y-auto"
      style={{ maxHeight: `${ALERT_COL_HEIGHT * 72}px` }}
    >
      {items.length === 0 ? (
        <p className="text-xs text-textLight px-3 py-4 text-center">{emptyText}</p>
      ) : (
        items.map((a, i) => (
          <div key={i} className={`px-3 py-2 ${i < items.length - 1 ? `border-b ${borderClass}` : ""}`}>
            <p className="text-xs font-semibold text-text leading-tight">{a.title}</p>
            <p className="text-xs text-textLight mt-0.5 leading-snug">{a.message}</p>
            {a.category && (
              <span className="text-xs text-textLight opacity-60 mt-0.5 block">
                {a.category.replace(/_/g, " ")}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  </div>
);

const AlertsPanel = ({ alerts = [], ordersAtRisk = [], stockShortfalls = [] }) => {
  const [open, setOpen] = useState(true);
  const {theme} = useTheme();

  // bucket all alerts by severity
  const allAlerts = [
    ...alerts,
    ...ordersAtRisk.map((o) => ({
      severity: "CRITICAL",
      category: "DELIVERY_RISK",
      title: `Delivery at risk: ${o.order}`,
      message: `${o.customer} — ${o.product} ${o.grade} — ${o.days_left}d left, needs ${o.days_needed}d`,
    })),
    ...stockShortfalls.map((s) => ({
      severity: "WARNING",
      category: "STOCK_SHORTFALL",
      title: `Stock shortfall: ${s.order}`,
      message: `${s.product} ${s.grade} — needs ${s.needed_mt} MT, short by ${s.shortfall_mt} MT`,
    })),
  ];

  // dedupe by title
  const seen = new Set();
  const unique = allAlerts.filter((a) => {
    if (seen.has(a.title)) return false;
    seen.add(a.title);
    return true;
  });

  const critical = unique.filter((a) => a.severity === "CRITICAL");
  const warning  = unique.filter((a) => ["WARNING", "URGENT"].includes(a.severity));
  const info     = unique.filter((a) => !["CRITICAL", "WARNING", "URGENT"].includes(a.severity));

  const total = unique.length;

  return (
    <div className="mb-5">
      {/* collapsible header */}
      {/* <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-card border-2 border-primary rounded-xl px-4 py-3 text-sm font-semibold text-text shadow-sm hover:bg-backgroundAlt transition-colors"
      > */}
      <Card onClick={() => setOpen((v) => !v)} variant='primary' className="cursor-pointer mt-4">
        <div className="flex items-center justify-between">

        <span className="flex items-center gap-2 text-text font-semibold">
          <FiAlertCircle className="text-error" size={16} />
          Alerts &amp; Warnings
          {critical.length > 0 && (
            <span className="bg-error text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {critical.length} Critical
            </span>
          )}
          {warning.length > 0 && (
            <span className="bg-warning text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {warning.length} Warning
            </span>
          )}
          {info.length > 0 && (
            <span className="bg-info text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {info.length} Info
            </span>
          )}
        </span>

        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
  </div>
            </Card>
      {/* </button> */}

      {open && total > 0 && (
        <div className="mt-2 flex gap-3">
          <AlertColumn
            title="CRITICAL"
            icon={FiAlertCircle}
            iconClass="text-error"
            borderClass="border-red-200"
            bgClass="bg-red-50"
            items={critical}
            emptyText="No critical alerts"
          />
          <AlertColumn
            title="WARNING"
            icon={FiAlertTriangle}
            iconClass="text-warning"
            borderClass="border-yellow-200"
            bgClass="bg-yellow-50"
            items={warning}
            emptyText="No warnings"
          />
          <AlertColumn
            title="INFO"
            icon={FiInfo}
            iconClass="text-info"
            borderClass="border-blue-200"
            bgClass="bg-blue-50"
            items={info}
            emptyText="No info alerts"
          />
        </div>
      )}
    </div>
  );
};

// ─── MachineUtilization ───────────────────────────────────────────────────────

const MachineUtilization = ({ machines = [] }) => {
  const [open, setOpen] = useState(false);
  if (!machines.length) return null;

  return (
    <div className="mb-5">
      {/* <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 text-sm font-semibold text-text shadow-sm hover:bg-backgroundAlt transition-colors"
      > */}
       <Card onClick={() => setOpen((v) => !v)} variant='secondary' className="cursor-pointer">
        <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-text font-semibold">
          <MdOutlineFactory className="text-primary" size={16} />
          Machine Utilization
        </span>
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </div>
        </Card>
      {/* </button> */}
      {open && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {machines.map((m, i) => {
            const pct = Math.min(m.utilization_pct, 100);
            const statusColor = m.status === "GREEN" ? "text-success" : m.status === "AMBER" ? "text-warning" : "text-error";
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-text truncate">{m.name}</span>
                  <span className={`text-xs font-bold ${statusColor}`}>{m.status}</span>
                </div>
                <div className="w-full h-1.5 bg-backgroundAlt rounded-full overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${utilColor(pct)}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-textLight">
                  <span>Used: <strong className="text-text">{m.used_mt} MT</strong></span>
                  <span>Remaining: <strong className="text-text">{m.remaining_mt} MT</strong></span>
                  <span className="font-bold text-text">{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── BatchCard ────────────────────────────────────────────────────────────────
// Matches the dark-card layout in the reference image:
// Row 1: [checkbox] [order-id] [label badge] [product badge] [grade badge] · [customer] · [Xd left]
// Row 2: slider ──────●── [qty input] MT  |  Output: X MT  Yield: XX%  Margin: ₹X,XX,XXX
// Row 3: Notes… (full width input)

const BatchCard = ({ batch, index, state, priorityQueueMap, onToggle, onQtyChange, onNotesChange }) => {
  // look up order info from priority_queue by order reference
  const orderRef  = batch.fulfills_orders?.[0]?.order;
  const queueItem = priorityQueueMap?.[orderRef];
  const order     = queueItem?.order || {};

  const maxQty      = queueItem?.remaining_mt || batch.input_weight_mt * 2;
  const yieldPct    = queueItem?.yield_chain_pct ?? 78.5;
  const outputMt    = (Number(state.qty) * yieldPct) / 100;
  const marginPerMt = order.margin_per_mt ?? 0;
  const totalMargin = marginPerMt * outputMt;
  const daysLeft    = order.days_until_delivery ?? null;
  const label       = queueItem?.label || batch.label || "";
  const lv          = labelVariant(label);

  const daysColor =
    daysLeft === null ? "text-textLight"
    : daysLeft < 0   ? "text-error font-semibold"
    : daysLeft <= 3  ? "text-warning font-semibold"
    :                  "text-success";

  const formatMargin = (v) =>
    v === 0 ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(v));

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden mb-3 ${
        state.included
          ? "bg-card border-primary shadow-sm"
          : "bg-background-alt border-border opacity-55"
      }`}
    >
      <div className="px-4 py-3">
        {/* ── Row 1: order meta ── */}
        <div className="flex items-center gap-2 flex-wrap mb-3 max-w-full flex-1">
          {/* checkbox */}
          {/* <button
            onClick={() => onToggle(index)}
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
              state.included ? "bg-primary border-primary text-white" : "border-border bg-background-alt"
            }`}
          >
            {state.included && <FiCheck size={11} />}
          </button> */}
          <div
  onClick={() => onToggle(index)}
  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 cursor-pointer transition-colors ${
    state.included ? "bg-primary border-primary text-white" : "border-border bg-backgroundAlt"
  }`}
>
  {state.included && <FiCheck size={11} />}
</div>

            <div className="flex flex-col">
              <div>
          {/* order id */}
          <span className="text-xs font-bold text-primary">
            {orderRef || "—"}
          </span>

          {/* priority label */}
          {label && (
            <span className={`text-xs font-bold px-2 py-0.5 ml-2 rounded-full border ${lv.bg} ${lv.text} ${lv.border}`}>
              {label}
            </span>
          )}

              </div>

              <div>

                    {/* customer */}
          <span className="text-xs text-textLight truncate max-w-[160px]">
            {order.customer_name || "—"}
          </span>

          {/* days left */}
          {daysLeft !== null && (
            <>
              <span className="text-textLight text-xs">·</span>
              <span className={`text-xs ${daysColor}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
              </span>
            </>
          )}
              </div>

          </div>

<div>

                 {/* product name — push to end */}
          {order.product_name && (
            <span className="text-xs text-textLight italic truncate max-w-[180px]">
              {order.product_name}
            </span>
          )}
<div>

          {/* product code + grade */}
          <span className="text-xs font-semibold bg-primaryLight text-primary px-2 py-0.5 rounded-full">
            {batch.product_code}
          </span>
          <span className="text-xs font-semibold bg-backgroundAlt text-textLight px-2 py-0.5 rounded-full">
            {batch.grade_code}
          </span>
</div>
</div>

          {/* separator dot */}
          <span className="text-textLight text-xs">·</span>



        <div className="flex items-center gap-4 flex-wrap">
 

          {/* slider */}
          <div className="flex-1 min-w-[120px]">
            <input
              type="range"
              min={0.1}
              max={maxQty}
              step={0.1}
              disabled={!state.included}
              value={state.qty}
              onChange={(e) => onQtyChange(index, parseFloat(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-primary disabled:opacity-40"
            />
                     {/* stock label */}
          <span className="text-xs text-textLight whitespace-nowrap mx-auto">
            Stock: <strong className="text-text">{queueItem?.stock_available_mt ?? "—"} MT</strong>
          </span>
          </div>

          {/* number input */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.1}
              max={maxQty}
              step={0.1}
              disabled={!state.included}
              value={state.qty}
              onChange={(e) => onQtyChange(index, parseFloat(e.target.value))}
              className="w-16 text-sm font-bold text-text text-center bg-backgroundAlt border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-primary disabled:opacity-40"
            />
            <span className="text-xs text-textLight">MT</span>
          </div>

          {/* divider */}
          <div className="w-px h-6 bg-border" />

          {/* output */}
          <div className="text-center">
            <p className="text-xs text-textLight leading-none">Output</p>
            <p className="text-xs font-semibold text-text mt-0.5">{outputMt.toFixed(2)} MT</p>
          </div>

          {/* yield */}
          <div className="text-center">
            <p className="text-xs text-textLight leading-none">Yield</p>
            <p className="text-xs font-bold text-success mt-0.5">{yieldPct.toFixed(1)}%</p>
          </div>

          {/* margin */}
          {/* <div className="text-center">
            <p className="text-xs text-textLight leading-none">Margin</p>
            <p className={`text-xs font-bold mt-0.5 ${totalMargin >= 0 ? "text-success" : "text-error"}`}>
              {totalMargin < 0 ? "−" : ""}{formatMargin(totalMargin)}
            </p>
          </div> */}
                <div className="px-4 pb-3">
        <input
          type="text"
          placeholder="Notes…"
          disabled={!state.included}
          value={state.notes || ""}
          onChange={(e) => onNotesChange(index, e.target.value)}
          className="w-full text-xs bg-inputBg border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-textLight focus:outline-none focus:border-primary disabled:opacity-40"
        />
      </div>
        </div>
   
        </div>

        {/* ── Row 2: slider + qty + output + yield + margin ── */}
      </div>

      {/* ── Row 3: notes full width ── */}

    </div>
  );
};

// ─── RecommendedBatch (main) ──────────────────────────────────────────────────

const RecommendedBatch = ({
  data = {},
  loading = false,
  batchState = [],
  setBatchState,
  onApprove,
  onDefer,
}) => {
  const handleToggle = useCallback(
    (i) => setBatchState((prev) => prev.map((b, idx) => (idx === i ? { ...b, included: !b.included } : b))),
    [setBatchState]
  );
  const handleQty = useCallback(
    (i, v) => setBatchState((prev) => prev.map((b, idx) => (idx === i ? { ...b, qty: v } : b))),
    [setBatchState]
  );
  const handleNotes = useCallback(
    (i, v) => setBatchState((prev) => prev.map((b, idx) => (idx === i ? { ...b, notes: v } : b))),
    [setBatchState]
  );

  // build a lookup map: order_reference → priority_queue item
  const priorityQueueMap = {};
  (data.priority_queue || []).forEach((item) => {
    if (item.order?.erp_order_reference) {
      priorityQueueMap[item.order.erp_order_reference] = item;
    }
  });

  const includedBatches = batchState.filter((b) => b.included);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-textLight text-sm animate-pulse">
        Generating plan…
      </div>
    );
  }

  if (!data.recommended_batches?.length && !data.alerts?.length) return null;

  return (
    <div className="space-y-4">
      <CapacitySummaryBar data={data} batchState={batchState} />

            {/* batch list */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FiZap className="text-primary" size={16} />
            <span className="font-semibold text-text text-sm">Recommended Batches</span>
            <span className="text-xs text-textLight bg-backgroundAlt px-2 py-0.5 rounded-full">
              {data.recommended_batches?.length || 0} batches
            </span>
          </div>
          <p className="text-xs text-textLight">Adjust quantities or deselect before approving</p>
        </div>

        <div className="p-4 space-y-3">
          {(data.recommended_batches || []).map((batch, i) => (
            <BatchCard
              key={i}
              batch={batch}
              index={i}
              state={batchState[i] || { included: true, qty: batch.input_weight_mt, notes: "" }}
              priorityQueueMap={priorityQueueMap}
              onToggle={handleToggle}
              onQtyChange={handleQty}
              onNotesChange={handleNotes}
            />
          ))}
        </div>

        {/* approve footer */}
        <div className="px-4 py-3 border-t border-border bg-accentLight flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-textLight">
            <strong className="text-text">{includedBatches.length}</strong>{" "}
            batch{includedBatches.length !== 1 ? "es" : ""} selected ·{" "}
            <strong className="text-text">
              {includedBatches.reduce((s, b) => s + Number(b.qty), 0).toFixed(1)} MT
            </strong>{" "}
            planned
          </p>
          <button
            disabled={includedBatches.length === 0}
            onClick={onApprove}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FiCheck size={14} />
            Approve &amp; Create {includedBatches.length} Batch{includedBatches.length !== 1 ? "es" : ""}
          </button>
        </div>
      </div>

      <AlertsPanel
        alerts={data.alerts}
        ordersAtRisk={data.orders_at_risk}
        stockShortfalls={data.stock_shortfalls}
      />

      <MachineUtilization machines={data.machine_utilization} />

      {/* deferred orders */}
      {data.excluded_orders?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-textLight uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FiClock size={12} /> Pushed to Next Day ({data.excluded_orders.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {data.excluded_orders.map((o) => (
              <span key={o} className="text-xs bg-backgroundAlt text-textLight px-2.5 py-1 rounded-full border border-border">
                {o}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendedBatch;
export { CapacitySummaryBar, AlertsPanel, MachineUtilization };