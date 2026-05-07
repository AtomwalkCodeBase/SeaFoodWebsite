import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage, FiActivity, FiSliders, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
// import {
//   Badge, Panel, ActionButton, InfoRow, LoadingSpinner, EmptyState,
//   SectionHeader, StepFlow, MetricCard,
// } from './ui';
import { ActionButton, Badge, EmptyState, InfoRow, MetricCard, Panel, StepFlow } from '../components/EmptyState';
import { AdvanceBatchActivity, CreateParentBatch, RecordGrades } from '../services/productServices';

// ── Mock data (replace with real API) ─────────────────────────────────────────
const MOCK_GRNS = [
  {
    id: 'GRN-2026-0041', species: 'Black Tiger', supplier: 'KeralaFish Exports',
    received: '2026-05-03', erpBatch: 'BAT-INW-041', location: 'Cold Store A',
    quantityMt: 12,
    expectedGrades: ['20/25 (35%)', '16/20 (26%)', '26/30 (26%)', '31/40 (8%)'],
  },
  {
    id: 'GRN-2026-0042', species: 'Vannamei', supplier: 'Coastal Marine',
    received: '2026-05-04', erpBatch: 'BAT-INW-042', location: 'Cold Store B',
    quantityMt: 8,
    expectedGrades: ['26/30 (33%)', '31/40 (35%)', '41/50 (10%)'],
  },
];

const MOCK_PARENT_BATCHES = [
  {
    id: 'BAT-P-20260504-001', species: 'Black Tiger', quantityMt: 10,
    activity: 'Cleaning', expectedCleaned: 9.2,
  },
];

const MOCK_GRADING_SESSIONS = [
  {
    id: 'GS-001', batchId: 'BAT-P-20260503-001', species: 'Black Tiger',
    cleanedMt: 9.2, status: 'READY',
    gradeSlots: [
      { code: '8/12' }, { code: '13/15' }, { code: '16/20' }, { code: '20/25' },
      { code: '26/30' }, { code: '31/40' }, { code: '41/50' }, { label: 'Waste' },
    ],
  },
];

// ── GRN Card ──────────────────────────────────────────────────────────────────
function GrnCard({ grn, onCreateBatch }) {
  const mutation = useMutation({
   mutationFn: () => CreateParentBatch({ grn_reference: grn.id, batch_type: 'PARENT' }),
    onSuccess: onCreateBatch,
  });

  const speciesVariant = grn.species.toLowerCase().includes('tiger') ? 'species' : 'info';

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={grn.id} variant="grn" />
        <Badge label={grn.species} variant={speciesVariant} />
        <span className="text-xs text-textLight">{grn.supplier}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-lg font-bold text-text">{grn.quantityMt} MT</span>
          <ActionButton
            variant="primary"
            size="sm"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            Create parent batch
          </ActionButton>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 pl-1">
        <InfoRow label="Received" value={grn.received} />
        <InfoRow label="ERP Batch" value={grn.erpBatch} />
        <InfoRow label="Location" value={grn.location} />
      </div>
      <div className="flex flex-wrap gap-1.5 pl-1">
        <span className="text-xs text-textLight">Expected grades:</span>
        {grn.expectedGrades.map((g) => (
          <span key={g} className="text-xs bg-accentLight text-primary px-1.5 py-0.5 rounded">{g}</span>
        ))}
      </div>
      <p className="text-[10px] text-textLight/60 font-mono pl-1">
        POST /api/planning/batches/ — creates PARENT batch with pre-grading activities
      </p>
    </div>
  );
}

// ── Parent Batch In-Progress Card ─────────────────────────────────────────────
function ParentBatchCard({ batch, onAdvance }) {
  const mutation = useMutation({
    mutationFn: () => AdvanceBatchActivity(batch.id),
    onSuccess: onAdvance,
  });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3">
      <Badge label={batch.id} variant="grn" />
      <Badge label={batch.species} variant="species" />
      <span className="font-bold text-text">{batch.quantityMt} MT</span>
      <Badge label={batch.activity} variant="cleaning" />
      <span className="text-xs text-textLight">Expected cleaned: {batch.expectedCleaned} MT</span>
      <div className="ml-auto flex items-center gap-2">
        <ActionButton variant="secondary" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Advance activity
        </ActionButton>
        <span className="text-[10px] text-textLight/50 font-mono hidden sm:block">
          POST /batches/&#123;id&#125;/advance-activity/
        </span>
      </div>
    </div>
  );
}

// ── Grade Input Row ────────────────────────────────────────────────────────────
function GradeInputRow({ grades, values, onChange }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-1">
        {grades.map((g, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={`text-xs font-medium ${g.label === 'Waste' ? 'text-error' : 'text-textLight'}`}>
              {g.code ?? g.label}
            </span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={values[i] ?? ''}
              onChange={(e) => onChange(i, e.target.value)}
              className="w-16 text-center text-xs border border-border rounded-md py-1 bg-inputBg text-text focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="0.0"
            />
            <span className="text-[10px] text-textLight">MT</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Grading Session Card ───────────────────────────────────────────────────────
function GradingSessionCard({ session, onConfirm }) {
  const [gradeValues, setGradeValues] = useState(session.gradeSlots.map(() => ''));
  const qc = useQueryClient();

  const recordMutation = useMutation({
    mutationFn: () => RecordGrades(session.id, {
  grades: session.gradeSlots.map((g, i) => ({
    grade_code: g.code ?? 'WASTE',
    quantity_mt: parseFloat(gradeValues[i] || 0),
  })),
}),
  });

  const subBatchMutation = useMutation({
    mutationFn: () =>
      apiFetch(API.batchCreateSubBatches(session.batchId), {
        method: 'POST',
        body: JSON.stringify({ grade_quantities: Object.fromEntries(session.gradeSlots.map((g, i) => [g.code ?? 'WASTE', parseFloat(gradeValues[i] || 0)])) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries(['inventory']);
      onConfirm?.();
    },
  });

  const handleChange = (i, val) => {
    setGradeValues((prev) => { const n = [...prev]; n[i] = val; return n; });
  };

  return (
    <div className="rounded-xl border-2 border-secondary/30 bg-phasePost/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={session.batchId} variant="grn" />
        <Badge label={session.species} variant="species" />
        <span className="text-sm font-bold text-text">{session.cleanedMt} MT cleaned</span>
        <ActionButton
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => recordMutation.mutate()}
          loading={recordMutation.isPending}
        >
          Record grades
        </ActionButton>
      </div>
      <p className="text-xs text-textLight">Enter grade-wise weight from QC sorting:</p>
      <GradeInputRow grades={session.gradeSlots} values={gradeValues} onChange={handleChange} />
      <p className="text-[10px] text-textLight/50 font-mono">
        POST /grading-sessions/&#123;id&#125;/record-grades/ — creates sub-batches + updates inventory
      </p>
      <div className="flex justify-end">
        <ActionButton
          variant="primary"
          size="sm"
          onClick={() => subBatchMutation.mutate()}
          loading={subBatchMutation.isPending}
        >
          Confirm grades &amp; create sub-batches
        </ActionButton>
      </div>
    </div>
  );
}

// ── Phase 1 Root ───────────────────────────────────────────────────────────────
export function PreGradingPhase() {
  const qc = useQueryClient();

  // Use mock data – swap for real useQuery calls in production
  const grns = MOCK_GRNS;
  const parentBatches = MOCK_PARENT_BATCHES;
  const gradingSessions = MOCK_GRADING_SESSIONS;

  const STEPS = [
    { label: 'GRN received', icon: FiPackage },
    { label: 'Pre-grading', icon: FiActivity },
    { label: 'Grade sorting', icon: FiSliders },
    { label: 'Graded stock', icon: FiCheckCircle },
  ];

  return (
    <div className="space-y-5">
      {/* Flow indicator */}
      <Panel>
        <StepFlow steps={STEPS} current={1} />
      </Panel>

      {/* Section 1 – Ungraded raw material */}
      <Panel accent="pre">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text flex items-center gap-2">
              <FiPackage className="text-primary" size={16} />
              Ungraded raw material
            </h3>
            <p className="text-xs text-textLight mt-0.5">
              Received via GRN; needs pre-grading activities (cleaning) then grade sorting
            </p>
          </div>
          <Badge label={`${grns.length} pending GRNs`} variant="info" />
        </div>
        <div className="space-y-3">
          {grns.length === 0 ? (
            <EmptyState icon={FiPackage} message="No pending GRNs" />
          ) : (
            grns.map((grn) => (
              <GrnCard key={grn.id} grn={grn} onCreateBatch={() => qc.invalidateQueries(['parentBatches'])} />
            ))
          )}
        </div>
      </Panel>

      {/* Section 2 – Parent batches in progress */}
      <Panel accent="pre">
        <div className="flex items-center gap-2 mb-3">
          <FiActivity className="text-primary" size={16} />
          <h3 className="font-semibold text-text">Parent batches in progress</h3>
          <span className="text-xs text-textLight">Pre-grading activities running</span>
        </div>
        <div className="space-y-2">
          {parentBatches.length === 0 ? (
            <EmptyState icon={FiActivity} message="No batches in progress" />
          ) : (
            parentBatches.map((b) => (
              <ParentBatchCard key={b.id} batch={b} onAdvance={() => qc.invalidateQueries(['parentBatches'])} />
            ))
          )}
        </div>
      </Panel>

      {/* Section 3 – Ready for grading */}
      <Panel accent="pre">
        <div className="flex items-center gap-2 mb-3">
          <FiSliders className="text-primary" size={16} />
          <h3 className="font-semibold text-text">Ready for grading</h3>
          <span className="text-xs text-textLight">Pre-grading done; QC sorts into grades</span>
        </div>
        <div className="space-y-3">
          {gradingSessions.length === 0 ? (
            <EmptyState icon={FiSliders} message="No sessions ready for grading" />
          ) : (
            gradingSessions.map((s) => (
              <GradingSessionCard key={s.id} session={s} onConfirm={() => qc.invalidateQueries(['inventory'])} />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}