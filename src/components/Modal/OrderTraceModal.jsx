import { useEffect, useState } from "react";
import {
  FiTruck,
  FiBox,
  FiGitBranch,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiClipboard,
  FiSend,
  FiPackage,
} from "react-icons/fi";
import { FaRoute } from "react-icons/fa";
import Modal from "../Modal";
import Badge from "../Badge";

const fmt = {
  date: (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—",

  mt: (v) =>
    `${parseFloat(v || 0).toFixed(2)} MT`,
};

// Walks parent_batch up to the root (oldest) and returns oldest -> newest.
const flattenLineage = (node) => {
  if (!node) return [];
  const parentChain = node.parent_batch ? flattenLineage(node.parent_batch) : [];
  return [...parentChain, node];
};

const getStageMeta = (movements = []) => {
  const inMove = movements.find((m) => m.flow_type === "IN") || null;
  const outMoves = movements.filter((m) => m.flow_type === "OUT");
  return { inMove, outMoves };
};

/**
 * -----------------------------------------------------------------------
 * Fixed business flow: Purchase Request -> GRN -> Purchase Order -> Batch
 * -> Completed Batch -> Sales Order
 * -----------------------------------------------------------------------
 * The API only gives us a recursive parent_batch chain (raw material at
 * the root, the shipped batch at the tip). We map that chain onto the
 * named flow like this:
 *
 *   - Root node (oldest, no parent_batch)      -> Purchase Request + GRN
 *     (both live on the same IN movement: `po` and `grn_number`)
 *   - Any node(s) in between                    -> Purchase Order + Batch
 *     (one PO/Batch pair per intermediate node — usually just one)
 *   - Tip node (newest, the one that shipped)    -> Completed Batch + Sales Order
 *
 * If a chain is only 1 level deep (raw material shipped with no
 * processing in between), Purchase Order/Batch/Completed Batch are
 * skipped and we go straight from GRN to Sales Order.
 * -----------------------------------------------------------------------
 */
const buildStageFlow = (traceability) => {
  const levels = flattenLineage(traceability);
  if (levels.length === 0) return [];

  const stages = [];
  const first = levels[0];
  const last = levels[levels.length - 1];
  const middle = levels.slice(1, levels.length - 1);
  const firstMeta = getStageMeta(first.movements);

  stages.push({
    key: `pr-${first.batch.id}`,
    stage: "Purchase Request",
    icon: FiFileText,
    colorClass: "bg-warning",
    refValue: firstMeta.inMove?.po?.number || "—",
    item: first.item,
    batch: first.batch,
    qty: firstMeta.inMove?.quantity_in_base_unit,
    date: first.batch.created_date,
    extra: [],
  });

  stages.push({
    key: `grn-${first.batch.id}`,
    stage: "GRN",
    icon: FiTruck,
    colorClass: "bg-info",
    refValue: firstMeta.inMove?.grn_number || "—",
    item: first.item,
    batch: first.batch,
    qty: firstMeta.inMove?.quantity_in_base_unit,
    date: first.batch.created_date,
    extra: [],
  });

  middle.forEach((level) => {
    const meta = getStageMeta(level.movements);

    stages.push({
      key: `po-${level.batch.id}`,
      stage: "Purchase Order",
      icon: FiClipboard,
      colorClass: "bg-primary",
      refValue: meta.inMove?.po?.number || "—",
      item: level.item,
      batch: level.batch,
      qty: meta.inMove?.quantity_in_base_unit,
      date: level.batch.created_date,
      extra: [],
    });

    stages.push({
      key: `batch-${level.batch.id}`,
      stage: "Out Batch",
      icon: FiPackage,
      colorClass: "bg-error",
      refValue: level.batch.batch_number,
      item: level.item,
      batch: level.batch,
      qty: null,
      date: level.batch.created_date,
      extra: meta.outMoves.map((m) => ({
        label: m.ref_number || "—",
        qty: m.quantity_in_base_unit,
      })),
    });
  });

  // Only add Completed Batch / Sales Order as separate stages when there's
  // an actual distinct tip node (chain depth >= 2). For a 1-level chain,
  // "first" and "last" are the same node — Sales Order still gets added
  // if that single node itself shipped to a sale order.
  if (levels.length >= 2) {
    const lastMeta = getStageMeta(last.movements);

    stages.push({
      key: `completed-${last.batch.id}`,
      stage: "Completed Batch",
      icon: FiCheckCircle,
      colorClass: "bg-success",
      refValue: last.batch.batch_number,
      item: last.item,
      batch: last.batch,
      qty: null,
      date: last.batch.created_date,
      extra: [],
    });

    stages.push({
      key: `so-${last.batch.id}`,
      stage: "Sales Order",
      icon: FiSend,
      colorClass: "bg-success",
      refValue: lastMeta.inMove?.sale_order?.number || "—",
      item: last.item,
      batch: last.batch,
      qty: lastMeta.inMove?.quantity_in_base_unit,
      date: last.batch.created_date,
      extra: [],
    });
  } else if (firstMeta.inMove?.sale_order) {
    stages.push({
      key: `so-${first.batch.id}`,
      stage: "Sales Order",
      icon: FiSend,
      colorClass: "bg-success",
      refValue: firstMeta.inMove.sale_order.number,
      item: first.item,
      batch: first.batch,
      qty: firstMeta.inMove.quantity_in_base_unit,
      date: first.batch.created_date,
      extra: [],
    });
  }

  return stages;
};

const StageNode = ({ stage, isSelected, isLast, onClick }) => {
  const Icon = stage.icon;

  return (
    <div className="flex items-center flex-shrink-0">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 px-2 group"
      >
        <div
          className={`w-10 h-10 rounded-full ${stage.colorClass} text-white
            flex items-center justify-center shadow-sm transition-transform
            ${isSelected ? "ring-4 ring-primaryLight scale-105" : "group-hover:scale-105"}`}
        >
          <Icon size={17} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wide text-center whitespace-nowrap
          ${isSelected ? "text-primary" : "text-textLight"}`}>
          {stage.stage}
        </span>
        <span className="text-[10px] font-semibold text-text max-w-[90px] truncate">
          {stage.refValue}
        </span>
      </button>

      {!isLast && (
        <FiChevronRight size={16} className="text-border mx-0.5 flex-shrink-0" />
      )}
    </div>
  );
};

const StageDetailPanel = ({ stage }) => {
  if (!stage) return null;
  const Icon = stage.icon;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mt-3">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full ${stage.colorClass} text-white
          flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-text">{stage.stage}</h4>
            <Badge variant="primary">{stage.refValue}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <p className="text-[10px] text-textLight uppercase">Product</p>
              <p className="text-xs font-semibold text-text mt-0.5 truncate">
                {stage.item?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-textLight uppercase">Batch</p>
              <p className="text-xs font-semibold text-primary mt-0.5 truncate">
                {stage.batch?.batch_number || "—"}
              </p>
            </div>
            {stage.qty !== null && stage.qty !== undefined && (
              <div>
                <p className="text-[10px] text-textLight uppercase">Quantity</p>
                <p className="text-xs font-semibold text-text mt-0.5">
                  {fmt.mt(stage.qty)}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-textLight uppercase">Date</p>
              <p className="text-xs font-semibold text-text mt-0.5">
                {fmt.date(stage.date)}
              </p>
            </div>
          </div>

          {stage.extra?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-textLight uppercase mb-1.5">
                Out batch for prodcution
              </p>
              <div className="flex flex-wrap gap-2">
                {stage.extra.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-backgroundAlt border border-border
                      rounded-lg px-2.5 py-1.5"
                  >
                    <FiGitBranch size={11} className="text-primary" />
                    <span className="text-[10px] font-semibold text-text">{e.label}</span>
                    <span className="text-[10px] text-textLight">{fmt.mt(e.qty)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Horizontal 6-node stepper for one contributing batch's lineage, with a
// detail panel below driven by whichever node is currently selected.
const StageFlow = ({ traceability }) => {
  const stages = buildStageFlow(traceability);
  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(stages.length - 1, 0)
  );

  if (stages.length === 0) {
    return (
      <p className="text-center text-sm text-textLight py-5">
        No source history available.
      </p>
    );
  }

  const selected = stages[selectedIndex];
  return (
    <div>
      <div className="flex items-center gap-1">
        <div className="flex items-center overflow-x-auto py-2 flex-1 no-scrollbar">
          {stages.map((stage, i) => (
            <StageNode
              key={stage.key}
              stage={stage}
              isSelected={i === selectedIndex}
              isLast={i === stages.length - 1}
              onClick={() => setSelectedIndex(i)}
            />
          ))}
        </div>
      </div>

      <StageDetailPanel stage={selected} />
    </div>
  );
};

const TraceShipmentCard = ({ entry, open, onToggle }) => (
  <div className="border border-border rounded-xl bg-backgroundAlt overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left px-4 py-3 bg-card border-b border-border
        hover:bg-backgroundAlt transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <FiChevronDown size={16} className="text-textLight flex-shrink-0" />
          ) : (
            <FiChevronRight size={16} className="text-textLight flex-shrink-0" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FiGitBranch size={15} className="text-success flex-shrink-0" />
              <span className="text-sm font-bold text-text truncate"> Completed Batch</span>
            </div>
            <p className="text-sm font-bold text-primary mt-1 truncate">
              {entry.batch.batch_number}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-textLight uppercase">Batch Quantity</p>
          <p className="text-sm font-bold text-success">
            {fmt.mt(entry.movement.quantity_in_base_unit)}
          </p>
        </div>
      </div>
    </button>

    {open && (
      <div className="p-4 bg-backgroundAlt">
        <StageFlow traceability={entry.traceability} />
      </div>
    )}
  </div>
);

const StatPill = ({ label, value, valueClass }) => (
  <div className="bg-backgroundAlt rounded-lg px-3 py-2 text-center">
    <p className="text-xs text-textLight">{label}</p>
    <p className={`text-sm font-bold mt-0.5 ${valueClass || "text-text"}`}>{value}</p>
  </div>
);

const TraceModalContent = ({ trace, loading = false, error = false }) => {
  const batches = trace?.batches || [];

  const [openMap, setOpenMap] = useState({});

  useEffect(() => {
    if (batches.length === 0) return;
    setOpenMap((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const initial = {};
      batches.forEach((entry) => {
        initial[entry.batch.id] = false;
      });
      return initial;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace?.order?.number]);

  if (loading) {
    return <p className="text-center text-textLight py-10 text-sm">Loading trace…</p>;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <FiAlertTriangle size={28} className="mx-auto text-error mb-2" />
        <p className="text-sm font-semibold text-error">Couldn't load trace data.</p>
        <p className="text-xs text-textLight mt-1">Please try again.</p>
      </div>
    );
  }

  if (!trace) {
    return <p className="text-center text-textLight py-10 text-sm">No trace data found.</p>;
  }


  const toggleAll = () => {
    const next = {};
    batches.forEach((e) => { next[e.batch.id] = !allOpen; });
    setOpenMap(next);
  };

  const toggleOne = (id) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalStages = batches.reduce(
    (sum, entry) => sum + buildStageFlow(entry.traceability).length,
    0
  );
  const totalBatchQuantity = batches.reduce(
    (sum, entry) =>
      sum + parseFloat(entry.movement?.quantity_in_base_unit || 0),
    0
  );
  const outBatchNumbers = new Set();

  batches.forEach((entry) => {
    const movements =
      entry.traceability?.parent_batch?.movements || [];

    movements.forEach((movement) => {
      if (
        movement.flow_type === "OUT" &&
        movement.ref_number
      ) {
        outBatchNumbers.add(movement.ref_number);
      }
    });
  });

  const totalOutBatches = outBatchNumbers.size;
  return (
    <div className="space-y-4">
      {/* EXPLANATION */}
      {batches.length > 0 && (
        <div className="flex items-start gap-2 bg-backgroundAlt border border-border
          rounded-lg px-3 py-2.5">
          <p className="text-xs text-textLight leading-relaxed">
            Each batch below follows the same path: Purchase Request → GRN →
            Purchase Order → Batch → Completed Batch → Sales Order. Tap any step to see its details.
          </p>
        </div>
      )}

      {/* ORDER SUMMARY */}
      <div className="bg-accentLight border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] text-textLight uppercase tracking-wider">Sales Order</p>
            <h3 className="text-base font-bold text-primary mt-0.5">{trace.order?.number || "—"}</h3>
            <p className="text-xs text-textLight mt-1">Complete product source history</p>
          </div>

          <div className="flex items-center gap-2 bg-green-100 border border-green-200
            text-success rounded-full px-2.5 py-1">
            <FiCheckCircle size={13} />
            <span className="text-[11px] font-semibold">
              {batches.length > 0 ? "Trace Available" : "No Source Found"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatPill label="Total Batches" value={totalOutBatches} />
          <StatPill label="Fulfilled Quantity" value={fmt.mt(totalBatchQuantity)} />
          <StatPill
            label="Status"
            value={batches.length > 0 ? "Traceable" : "Unavailable"}
            valueClass={batches.length > 0 ? "text-success" : "text-error"}
          />
        </div>
      </div>

      {/* SHIPMENT BATCHES */}
      {batches.length === 0 ? (
        <div className="text-center py-8">
          <FiBox size={30} className="mx-auto text-textLight mb-2" />
          <p className="text-sm font-semibold text-text">No contributing batches found</p>
          <p className="text-xs text-textLight mt-1">
            There is currently no source batch history available for this order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider">Product History</h4>
            <div className="flex items-center gap-3">
              <span className="text-xs text-textLight">
                {batches.length} Completed {batches.length === 1 ? "batch" : "batches"}
              </span>
              {batches.length > 1 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {/* {allOpen ? "Collapse all" : "Expand all"} */}
                </button>
              )}
            </div>
          </div>

          {batches.map((entry) => (
            <TraceShipmentCard
              key={entry.batch.id}
              entry={entry}
              open={!!openMap[entry.batch.id]}
              onToggle={() => toggleOne(entry.batch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const OrderTraceModal = ({ isOpen, onClose, trace, loading, error }) => {
  const orderNumber = trace?.order?.number || "Order Trace";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inventory Trace - ${orderNumber}`}
      width="max-w-5xl"
      showSaveButton={false}
      cancelButtonText="Close"
    >
      <TraceModalContent trace={trace} loading={loading} error={error} />
    </Modal>
  );
};

export default OrderTraceModal;