import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiBox, FiList, FiZap, FiTruck, FiCheckCircle, FiAlertTriangle,
} from 'react-icons/fi';
import { AutoAllocateBatch, CreateParentBatch, GetPlanningReport } from '../services/productServices';
import { ActionButton, Badge, EmptyState, MetricCard, Panel, StepFlow } from '../components/EmptyState';

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
  const color = score >= 75 ? 'bg-error' : score >= 60 ? 'bg-warning' : 'bg-textLight';
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
      <Badge label={order.id} variant="grn" />
      <span className="text-sm font-medium text-text min-w-[100px]">{order.buyer}</span>
      <Badge label={order.process} variant={PROCESS_BADGE[order.process] ?? 'default'} />
      <span className="text-xs text-textLight">{order.grade}</span>
      <span className="text-xs text-text font-medium">{order.requiredMt} MT</span>
      <span className="text-xs text-textLight">{order.ageDays}d</span>
      <StockAvailability availableMt={order.availableMt} />
      <Badge label={order.priority} variant={PRIORITY_BADGE[order.priority]} />
      <div className="ml-auto">
        <ScoreBar score={order.score} />
      </div>
    </div>
  );
}

// ── Batch Step Progress ────────────────────────────────────────────────────────
const PROCESS_STEPS = ['Cleaning', 'Cooking', 'Glazing', 'Packing'];

function BatchCard({ batch }) {
  const qc = useQueryClient();
  const currentIdx = PROCESS_STEPS.indexOf(batch.currentStep);

  const advanceMutation = useMutation({
    mutationFn: () =>  CreateParentBatch({ grn_reference: batch.id, batch_type: 'PARENT' }),
    onSuccess: () => qc.invalidateQueries(['postBatches']),
  });

  const allocateMutation = useMutation({
    // mutationFn: () => apiFetch(API.batchAutoAllocate(batch.id), { method: 'POST' }),
    mutationFn: () =>  AutoAllocateBatch({ grn_reference: batch.id}),
    onSuccess: () => qc.invalidateQueries(['orders']),
  });

  const nextStep = PROCESS_STEPS[currentIdx + 1];

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={batch.id} variant="grn" />
        <span className="text-xs text-textLight">→ {batch.orderId}</span>
        <Badge label={batch.species} variant="species" />
        <span className="text-xs text-textLight">
          Input: <strong className="text-text">{batch.inputMt} MT</strong>
          {' '}Output: <strong className="text-secondary">{batch.outputMt} MT</strong>
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {PROCESS_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step} className="flex-1 text-center">
              <div className={`text-[10px] font-semibold rounded px-1 py-0.5 ${
                done ? 'bg-success/15 text-success' :
                active ? 'bg-secondary/20 text-secondary' :
                'bg-backgroundAlt text-textLight'
              }`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {nextStep && (
          <ActionButton variant="primary" size="sm" onClick={() => advanceMutation.mutate()} loading={advanceMutation.isPending}>
            Advance → {nextStep}
          </ActionButton>
        )}
        {currentIdx === PROCESS_STEPS.length - 1 && (
          <ActionButton variant="success" size="sm" onClick={() => allocateMutation.mutate()} loading={allocateMutation.isPending}>
            Auto-allocate to order
          </ActionButton>
        )}
      </div>
    </div>
  );
}

// ── Graded Stock Summary ───────────────────────────────────────────────────────
function GradedStockPanel({ onGenerate }) {
  const mutation = useMutation({
    mutationFn: () =>  GetPlanningReport({  date: new Date().toISOString().slice(0, 10) }),
    //   apiFetch(API.engineGenerate, {
    //     method: 'POST',
    //     body: JSON.stringify({ date: new Date().toISOString().slice(0, 10) }),
    //   }),
    onSuccess: onGenerate,
  });

  return (
    <Panel accent="post">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiBox className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Graded stock available</h3>
          <span className="text-xs text-textLight">From ERP ItemBatch – ready for post-grading</span>
        </div>
        <ActionButton variant="primary" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Generate batch plan
        </ActionButton>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MOCK_GRADED_STOCK.map((s) => (
          <MetricCard
            key={`${s.grade}-${s.species}`}
            label={`${s.grade} ${s.species}`}
            value={s.quantityMt}
            unit="MT"
            color="text-secondary"
          />
        ))}
      </div>
    </Panel>
  );
}

// ── Phase 2 Root ───────────────────────────────────────────────────────────────
export function PostGradingPhase() {
  const qc = useQueryClient();

  const STEPS = [
    { label: 'Graded stock', icon: FiBox },
    { label: 'Batch plan', icon: FiZap },
    { label: 'Processing', icon: FiList },
    { label: 'Orders fulfilled', icon: FiTruck },
  ];

  return (
    <div className="space-y-5">
      {/* Flow indicator */}
      <Panel>
        <StepFlow steps={STEPS} current={1} />
      </Panel>

      {/* Stock & batch generation */}
      <GradedStockPanel onGenerate={() => qc.invalidateQueries(['postBatches'])} />

      {/* Orders queue */}
      <Panel accent="post">
        <div className="flex items-center gap-2 mb-3">
          <FiList className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Outstanding orders</h3>
          <span className="text-xs text-textLight">Priority ranked by engine score</span>
        </div>

        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-textLight border-b border-border mb-1">
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
        </div>
      </Panel>

      {/* Active batches */}
      <Panel accent="post">
        <div className="flex items-center gap-2 mb-3">
          <FiZap className="text-secondary" size={16} />
          <h3 className="font-semibold text-text">Active sub-batches</h3>
          <span className="text-xs text-textLight">Processing in progress</span>
        </div>
        <div className="space-y-3">
          {MOCK_BATCHES.length === 0 ? (
            <EmptyState icon={FiZap} message="No active batches — generate a batch plan above" />
          ) : (
            MOCK_BATCHES.map((b) => <BatchCard key={b.id} batch={b} />)
          )}
        </div>
      </Panel>
    </div>
  );
}