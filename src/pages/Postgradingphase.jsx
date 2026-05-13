import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiBox, FiList, FiZap, FiTruck, FiCheckCircle, FiAlertTriangle,
  FiActivity,
} from 'react-icons/fi';
import { AdvanceBatchActivity, AutoAllocateBatch, CreateParentBatch, getBatchList, getInventoryStatus, GetItemCategory, GetOrdersList, GetPlanningReport, getProcessActivityList, ManualAllocateBatch } from '../services/productServices';
import { ActionButton, Badge, EmptyState, MetricCard, Panel, StepFlow } from '../components/EmptyState';
import Button from '../components/Button';
import { toast } from 'react-toastify';
import DataTable, { Td } from '../components/Datatable';
import { PlanningResult } from './DaliyProductionPlan';
import AllocateBatchModal from '../components/Modal/AllocateBatchModal';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_GRADED_STOCK = [
  { grade: '16/20', species: 'Black Tiger', quantityMt: 3.8 },
  { grade: '20/25', species: 'Black Tiger', quantityMt: 5.2 },
  { grade: '26/30', species: 'Vannamei', quantityMt: 2.5 },
  { grade: '26/30', species: 'Black Tiger', quantityMt: 1.8 },
];

const PRIORITY_BADGE = { CRITICAL: 'critical', URGENT: 'urgent', STANDARD: 'standard' };
const PROCESS_BADGE = { 'IQF-CKD': 'iof', 'RAW-BLK': 'raw', 'WHL-CKD': 'whl', 'PD-RAW': 'pd' };

const MOCK_ORDERS = [
  { id: 'ORD-001', buyer: 'Nippon Suisan', process: 'IQF-CKD', grade: '20/25', requiredMt: 4.5, ageDays: 8, availableMt: 5.2, priority: 'CRITICAL', score: 82 },
  { id: 'ORD-003', buyer: 'Maruha Nichiro', process: 'IQF-CKD', grade: '16/20', requiredMt: 5.6, ageDays: 9, availableMt: 3.8, priority: 'CRITICAL', score: 76 },
  { id: 'ORD-002', buyer: 'Thai Union', process: 'RAW-BLK', grade: '26/30', requiredMt: 3.2, ageDays: 11, availableMt: 4.3, priority: 'URGENT', score: 64 },
  { id: 'ORD-006', buyer: 'Clearwater', process: 'WHL-CKD', grade: '13/15', requiredMt: 2.5, ageDays: 12, availableMt: 0, priority: 'URGENT', score: 58 },
  { id: 'ORD-004', buyer: 'Red Lobster', process: 'PD-RAW', grade: '20/25', requiredMt: 6.0, ageDays: 14, availableMt: 5.2, priority: 'STANDARD', score: 45 },
  { id: 'ORD-005', buyer: 'Sysco EU', process: 'RAW-BLK', grade: '31/40', requiredMt: 3.8, ageDays: 17, availableMt: 0, priority: 'STANDARD', score: 38 },
];

const MOCK_BATCHES = [
  { id: 'BAT-S-001', orderId: 'ORD-001', grade: '20/25', species: 'Black Tiger', inputMt: 2.5, outputMt: 1.99, currentStep: 'Glazing' },
  { id: 'BAT-S-002', orderId: 'ORD-001', grade: '16/20', species: 'Black Tiger', inputMt: 3.14, outputMt: 2.5, currentStep: 'Cooking' },
];

// ── Stock Badge ───────────────────────────────────────────────────────────────
function StockAvailability({ availableMt }) {
  if (availableMt === 0)
    return <span className="text-xs text-error font-semibold flex items-center gap-1"><FiAlertTriangle size={10} /> No stock</span>;
  return <span className="text-xs text-success font-semibold">✓ {availableMt} MT</span>;
}

// ── Score Bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 75 ? 'bg-error' : score >= 60 ? 'bg-warning' : 'bg-text-light';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-backgroundAlt rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-text">{score}</span>
    </div>
  );
}

// ── Order Row ──────────────────────────────────────────────────────────────────
function OrderRow({ order }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-backgroundAlt transition-colors">
      <Badge label={order.erp_order_reference} variant="grn" />
      <span className="text-sm font-medium text-text min-w-[100px]">{order.customer_name}</span>
      {/* <Badge label={order.process} variant={PROCESS_BADGE[order.process] ?? 'default'} /> */}
      <span className="text-xs text-text-light">{order.product_name}</span>
      <span className="text-xs text-text-light">{order.grade_code}</span>
      <span className="text-xs text-text font-medium">{order.remaining_qty_mt} MT</span>
      <span className="text-xs text-text-light">{order.days_until_delivery}d</span>
      <StockAvailability availableMt={order.remaining_qty_mt} />
      <Badge label={order.priority} variant={PRIORITY_BADGE[order.priority_override]} />
      <div className="ml-auto">
        <ScoreBar score={order.score || 0} />
      </div>
    </div>
  );
}

// ── Batch Step Progress ────────────────────────────────────────────────────────
const PROCESS_STEPS = ['Cleaning', 'Cooking', 'Glazing', 'Packing'];

function BatchCard({ batch }) {
  const qc = useQueryClient();
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const manualAllocations = useState({});

  console.log("batch", batch)

  const completedActivities = useMemo(() => {
    return batch.activity_logs?.filter((log) => log.status === "COMPLETED").map((log) => log.activity_name) || [];
  }, [batch.activity_logs]);

  const currentActivityName = batch.current_activity_name;
  const [selectedActivityName, setSelectedActivityName] = useState(currentActivityName);

  const { data: processActivities = [] } = useQuery({
    queryKey: ['processActivities', batch.product],
    queryFn: () => getProcessActivityList({ product_id: batch.product}),
    select: (res) => res.data,
    enabled: !!batch.product,
  });

    const { data: orderList = [], isLoading: ordersLoading, error: ordersError } = useQuery({
      queryKey: ['orders'],
      queryFn: () => GetOrdersList(),
      select: (res) => res.data,
      onError: () => toast.error('Failed to load orders'),
    });

  const matchingOrders = useMemo(() => {
    return orderList.filter((o) =>o.grade_code === batch.grade_code && o.product_code === batch.product_code);
  }, [batch]);

  console.log("completedActivities", completedActivities)
  



  const dynamicSteps = useMemo(() => {
    if (processActivities.length > 0) {
      return processActivities.sort((a, b) => a.id - b.id).map((act) => act.activity_name);
    }
    return PROCESS_STEPS; // fallback
  }, [processActivities]);

  useEffect(() => {
  if (batch.status === "SCHEDULED") {
    setSelectedActivityName(dynamicSteps[0]);
  } else if (currentActivityName) {
    setSelectedActivityName(currentActivityName);
  }
}, [currentActivityName, batch.status, dynamicSteps]);

  const currentIdx = dynamicSteps.indexOf(currentActivityName);
  const selectedLog = batch.activity_logs?.find((log) => log.activity_name === selectedActivityName);

  const displayInput = selectedLog?.input_weight_mt || batch.input_weight_mt || '0';
  const displayExpected = selectedLog?.expected_output_mt || '0';
  const displayActual = selectedLog?.actual_output_mt || '-';

const isLastStep = currentIdx === dynamicSteps.length - 1;

const canAdvance =
  batch.status === "SCHEDULED" ||
  (currentIdx >= 0 &&
    batch.status !== "ALLOCATING");

const nextStepLabel =
  batch.status === "SCHEDULED"
    ? dynamicSteps[0]
    : isLastStep
    ? "Complete Batch"
    : dynamicSteps[currentIdx + 1];

  const advanceMutation = useMutation({
    mutationFn: () =>  AdvanceBatchActivity(batch.id),
    onSuccess: () => {
      toast.success(
  batch.status === "SCHEDULED"
    ? `Started ${dynamicSteps[0]}`
    : `Advance to ${nextStepLabel}`
);
      qc.invalidateQueries(['batches'])
    },
    onError: (error) => {
        toast.error(error?.message || "Failed to advance batch activity");
      },
  });
  
  const autoAllocateMutation = useMutation({
    mutationFn: () => AutoAllocateBatch(batch.id),
    onSuccess: () => {
      toast.success("Auto allocation completed");
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['batches']);
    },
  });

  const manualAllocateMutation = useMutation({
    mutationFn: (payload) => ManualAllocateBatch(batch.id ,payload),
    onSuccess: () => {
      toast.success("Allocation completed");
      setIsAllocateModalOpen(false);

      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['batches']);
    },
  });



  return (
    <>
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={batch.batch_number} variant="grn" />
        {/* <span className="text-xs text-text-light">→ {batch.orderId || "--"}</span> */}
        <Badge label={batch.species} variant="species" />
        <span className="text-xs text-text-light">
          Input: <strong className="text-text">{batch.input_weight_mt || "--"} MT</strong>,
          {' '}{' '}{' '}{' '}Expected Output: <strong className="text-secondary">{batch.expected_output_mt || "--"} MT</strong>,
          {' '}{' '}{' '}{' '}Actual Output: <strong className="text-secondary">{batch.actual_output_mt || "Not finished yet"} MT</strong>
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {dynamicSteps.map((step, i) => {
          const isDone = batch.activity_logs?.some((log) => log.activity_name === step && log.status === "COMPLETED");
          const isActive = step === currentActivityName;
          const isSelected = step === selectedActivityName;

          return (
            <div 
              key={step} 
              className="flex-1 text-center cursor-pointer"
              onClick={() => setSelectedActivityName(step)}
            >
              <div className={`text-[10px] font-semibold rounded px-1 py-0.5 transition-all ${
                isDone 
                  ? 'bg-success/15 text-success'                     // ← Green preserved for completed
                  : isActive 
                  ? 'bg-secondary/20 text-secondary font-medium' 
                  : 'bg-backgroundAlt text-text-light'
              } ${isSelected ? 'ring-2 ring-offset-2 ring-secondary' : ''}`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Activity Details */}
      <div className="bg-backgroundAlt rounded-lg p-3 text-sm">
        <p className="font-semibold text-text mb-2">
          {selectedActivityName} 
          {selectedActivityName === currentActivityName && (
            <span className="ml-2 text-secondary text-xs ">(In Progress)</span>
          )}
        </p>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-text-light">Input</span><br />
            <strong className="text-text">{displayInput} MT</strong>
          </div>
          <div>
            <span className="text-text-light">Expected Output</span><br />
            <strong className="text-text">{displayExpected} MT</strong>
          </div>
          <div>
            <span className="text-text-light">Actual Output</span><br />
            <strong className={`${
              displayActual === '-' ? 'text-text-light' : 'text-secondary'
            }`}>
              {displayActual} MT
            </strong>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {canAdvance && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => advanceMutation.mutate()}
          loading={advanceMutation.isPending}
        >
          Advance → {nextStepLabel}
        </Button>
      )}

        {batch.status === "ALLOCATING" && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => autoAllocateMutation.mutate()}
              loading={autoAllocateMutation.isPending}
            >
              Auto-allocate to order
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAllocateModalOpen(true)}
            >
              Manual allocate
            </Button>
          </>
)}
      </div>
    </div>

    {isAllocateModalOpen && (
  <AllocateBatchModal
    batch={batch}
    isOpen={isAllocateModalOpen}
    orders={matchingOrders}
    onClose={() => setIsAllocateModalOpen(false)}
    onConfirm={(allocations) => {
      const payload = {
        batch_id: batch.id,
        allocations: Object.entries(allocations).map(
          ([order_plan_id, quantity_mt]) => ({
            order_plan_id,
            quantity_mt: Number(quantity_mt || 0),
          })
        ),
      };

      manualAllocateMutation.mutate(payload);
    }}
  />
)}
</>
  );
}

// ── Graded Stock Summary ───────────────────────────────────────────────────────
function GradedStockPanel({ onGenerate, planLoading  }) {



    const {data: InventoryCategoryList = [], isLoading: InventoryCategoryLoading, error: InventoryCategoryError } = useQuery  ({
      queryKey: ['inventory'],
      queryFn: () => GetItemCategory(),
      select: (res) => res.data,
      onError: () => toast.error('Failed to load inventory list'),
    });

    const {data: InventoryStatusList = [], isLoading: InventoryStatusLoading, error: InventoryStatusError } = useQuery  ({
      queryKey: ['inventoryStatus'],
      queryFn: () => getInventoryStatus(),
      select: (res) => res.data,
      onError: () => toast.error('Failed to load inventory list'),
    });

    const gradedStockData = (InventoryStatusList?.grades || []).map(
    (item) => {
      const matchedSpecies = InventoryCategoryList.find(
        (cat) => String(cat.id) === String(item.species)
      );

      return {
        grade: item.grade_code,
        species: matchedSpecies?.name || "Unknown",
        quantityMt: item.available_mt,
      };
    }
  );



  return (
    <>
    <Panel accent="post">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiBox className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Graded stock available</h3>
          <span className="text-xs text-text-light">From ERP ItemBatch – ready for post-grading</span>
        </div>
        <Button variant="primary" size="sm"   onClick={onGenerate} loading={planLoading}>
          Generate batch plan
        </Button>
      </div>
      <div>
        {(InventoryCategoryLoading || InventoryStatusLoading) ? (
          <EmptyState message="Loading Batches..." />
        ) : (InventoryCategoryError || InventoryStatusError) ? (
          <EmptyState message="Failed to load batches" />
        ) : (() => {
          return gradedStockData.length === 0 ? (
            <EmptyState icon={FiActivity} message="No batches in progress"/>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border">
              {gradedStockData.map((s, index) => {
                return (
                  <div
                    key={`${s.grade}-${s.species}-${index}`}
                    className="min-w-[220px] flex-shrink-0"
                  >
                    <MetricCard
                        label={`${s.grade} ${s.species}`}
                        value={s.quantityMt}
                        unit="MT"
                        color="text-secondary"
                        sub="Available stock"
                      />
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </Panel>


    </>
  );
}

// ── Phase 2 Root ───────────────────────────────────────────────────────────────
export function PostGradingPhase() {
  const qc = useQueryClient();
      const [selectedDate, setSelectedDate] = useState("");
    const [showPlan, setShowPlan] = useState(false);
    const [deferredOrders, setDeferredOrders] = useState(new Set());
    const [batchState, setBatchState] = useState([]);

  const STEPS = [
    { label: 'Graded stock', icon: FiBox },
    { label: 'Batch plan', icon: FiZap },
    { label: 'Processing', icon: FiList },
    { label: 'Orders fulfilled', icon: FiTruck },
  ];

   const today = new Date().toISOString().slice(0, 10);

const { data: planData, isLoading: planLoading, refetch: fetchPlan } = useQuery({
    queryKey: ['planning-engine', today],
    queryFn: () => GetPlanningReport(today),
    enabled: false,
    select: (res) => res.data,
    onError: () => toast.error("Failed to generate plan"),
  });

useEffect(() => {
  if (planData?.recommended_batches) {

    const mapped = planData.recommended_batches.map((batch, i) => {

      // find matching priority queue item
      const matchedPriority = planData.priority_queue?.find(
        (pq) =>
          pq.product_code === batch.product_code &&
          pq.grade_code === batch.grade_code
      );

      return {
        id: i,

        // order details
        orderId:
          matchedPriority?.order?.erp_order_reference ||
          `BATCH-${i}`,

        customer:
          matchedPriority?.order?.customer_name ||
          "Unknown Customer",

        daysLeft:
          matchedPriority?.order?.days_until_delivery || 0,

        // batch details
        product: batch.product_code,
        grade: batch.grade_code,
        qty: batch.input_weight_mt,

        included: true,
        notes: "",

        // metrics
        yieldPct: matchedPriority?.yield_chain_pct || 0,

        margin:
          matchedPriority?.order?.margin_per_mt || 0,

        priority:
          matchedPriority?.label || "NORMAL",

        score:
          matchedPriority?.total || 0,

        stockAvailable:
          matchedPriority?.stock_available_mt || 0,

        estimatedDays:
          matchedPriority?.estimated_completion_days || 0,

        orders: batch.fulfills_orders || [],
      };
    });

    setBatchState(mapped);
  }
}, [planData]);

  const handleGeneratePlan = async () => {
    await fetchPlan();
    setShowPlan(true);
  };

  const orderColumns = [ 'ORDER ID', 'CUSTOMER', 'PRODUCT', 'Grade', 'Required', 'DAYS LEFT', 'Stock', 'PRIORITY', 'Score'];
  const { data: orderList = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load orders'),
  });

  const { data: batchList = [], isLoading: batchLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatchList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load batches'),
  });

const activeSubBatches = useMemo(() => {
  return batchList.filter(batch => batch.batch_type === "SUB_BATCH" && batch.status !== "COMPLETED");
}, [batchList]);



  return (
    <div className="space-y-5">
      {/* Flow indicator */}
      {/* <Panel>
        <StepFlow steps={STEPS} current={1} />
      </Panel> */}

      {/* Stock & batch generation */}
      <GradedStockPanel   onGenerate={handleGeneratePlan} planLoading={planLoading} />

      {/* Orders queue */}
      <Panel accent="post">
        <div className="flex items-center gap-2 mb-3">
          <FiList className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Outstanding orders</h3>
          <span className="text-xs text-text-light">Priority ranked by engine score</span>
        </div>

        {/* Column headers */}
        {/* <div className="hidden sm:flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-light border-b border-border mb-1">
          <span className="w-24">Order</span>
          <span className="min-w-[100px]">Buyer</span>
          <span className="w-20">Process</span>
          <span className="w-14">Grade</span>
          <span className="w-14">Required</span>
          <span className="w-10">Age</span>
          <span className="w-16">Stock</span>
          <span className="w-16">Priority</span>
          <span className="ml-auto w-20">Score</span>
        </div>

        <div className="divide-y divide-border/50">
          {MOCK_ORDERS.map((o) => <OrderRow key={o.id} order={o} />)}
        </div> */}
        <DataTable
          columns={orderColumns}
          data={orderList}
          isLoading={ordersLoading}
          emptyMessage="No orders found"
          renderRow={(order) => (
            <>
              <Td><Badge label={order.erp_order_reference} variant="grn" /></Td>
              <Td>{order.customer_name}</Td>
              <Td>{order.product_name}</Td>
              <Td>{order.grade_code}</Td>
              <Td>{order.remaining_qty_mt} MT</Td>
              <Td>{order.days_until_delivery}d</Td>
              <Td><StockAvailability availableMt={order.remaining_qty_mt} /></Td>
              <Td><Badge label={order.priority} variant={PRIORITY_BADGE[order.priority_override]} /></Td>
              <Td>
                 <ScoreBar score={order.score || 0} />
              </Td>
            </>
          )}
        />
      </Panel>

      {showPlan && (
        <PlanningResult 
          data={planData} 
          loading={planLoading} 
          batchState={batchState}
          setBatchState={setBatchState}
          selectedDate={today}
        />
      )}

      {/* Active batches */}
      <Panel accent="post">
        <div className="flex items-center gap-2 mb-3">
          <FiZap className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Active sub-batches</h3>
          <span className="text-xs text-text-light">Processing in progress</span>
        </div>
        <div className="space-y-3">
          {activeSubBatches.length === 0 ? (
            <EmptyState icon={FiZap} message="No active batches — generate a batch plan above" />
          ) : (
            activeSubBatches.map((b) => <BatchCard key={b.id} batch={b} />)
          )}
        </div>
      </Panel>
    </div>
  );
}