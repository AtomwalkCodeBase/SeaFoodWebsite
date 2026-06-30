import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify';
import AllocateBatchModal from '../../../components/Modal/AllocateBatchModal';
import Button from '../../../components/Button';
import { AdvanceBatchActivity, AutoAllocateBatch, ManualAllocateBatch } from '../../../services/productServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOrders, useProcessActivityList } from '../../../hooks/useProductQueries';
import { Badge as Badge2 } from "../../../components/EmptyState";

const getDynamicSteps = (processActivities = []) => {
  if (processActivities?.length > 0) {
    return processActivities
      .sort((a, b) => (a.sequence ?? a.id ?? 0) - (b.sequence ?? b.id ?? 0))
      .map((x) => x.activity_name)
      .filter(Boolean);
  }
  return [];
};

const ActiveBatchCard = ({ batch, hideActionButtons }) => {
  const navigate = useNavigate()
  const qc = useQueryClient();
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const currentActivityName = batch.current_activity_name;
  const [selectedActivityName, setSelectedActivityName] = useState(() => currentActivityName || "");
  
  const {data: activitiesData , isLoading: processActivityLoading} = useProcessActivityList(!!batch.product, batch.product);
  const { data: orderList = [], isLoading: ordersLoading } = useOrders();


  const dynamicSteps = getDynamicSteps(activitiesData);

  const matchingOrders = useMemo(() =>  orderList.filter((o) =>
          o.grade_code === batch.grade_code &&
          o.product_code === batch.product_code &&
          Number(o.remaining_qty_mt || 0) > 0
      ),
    [orderList, batch.grade_code, batch.product_code]
  );


  const resolvedSelectedActivityName = selectedActivityName || (batch.status === "SCHEDULED" ? dynamicSteps[0] : currentActivityName || dynamicSteps[0]);

  const currentIdx = dynamicSteps.indexOf(currentActivityName);
  const selectedLog = batch.activity_logs?.find((log) => log.activity_name === resolvedSelectedActivityName);

  const displayInput = selectedLog?.input_weight_mt || batch.input_weight_mt || "0";
  const displayExpected = selectedLog?.expected_output_mt || "0";
  const displayActual = selectedLog?.actual_output_mt || "-";
  const displayWorkerAssigned = selectedLog?.workers_assigned || 0;

  const isLastStep = currentIdx === dynamicSteps.length - 1;
  const canAdvance = batch.status === "SCHEDULED" || (currentIdx >= 0 && batch.status !== "ALLOCATING");
  const nextStepLabel = batch.status === "SCHEDULED" ? dynamicSteps[0] : isLastStep ? "Complete Batch" : dynamicSteps[currentIdx + 1];

  const advanceMutation = useMutation({
    mutationFn: () => AdvanceBatchActivity(batch.id),
    onSuccess: () => {
      toast.success(
        batch.status === "SCHEDULED" ? `Started ${dynamicSteps[0]}` : `Advance to ${nextStepLabel}`
      );
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (error) => toast.error(error?.message || "Failed to advance batch activity"),
  });

  const autoAllocateMutation = useMutation({
    mutationFn: () => AutoAllocateBatch(batch.id),
    onSuccess: () => {
      toast.success("Auto allocation completed");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const manualAllocateMutation = useMutation({
    mutationFn: (payload) => ManualAllocateBatch(batch.id, payload),
    onSuccess: () => {
      toast.success("Allocation completed");
      setIsAllocateModalOpen(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  return (
    <>
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge2 label={batch.batch_number} variant="grn" />
        <Badge2 label={batch.species} variant="species" />
        <span className="text-xs text-text-light">
          Input: <strong className="text-text">{batch.input_weight_mt || "--"} MT</strong>,{"    "}
          Expected Output: <strong className="text-secondary">{batch.expected_output_mt || "--"} MT</strong>,{"    "}
          Actual Output:{" "}
          <strong className="text-secondary">{batch.actual_output_mt || "Not finished yet"} MT</strong>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge2 label={`${batch.product_name} (${batch.product_code})`} variant="pd" />
      </div>

      <div className="flex gap-2">
        {dynamicSteps?.filter(Boolean).map((step) => {
          const isDone = batch.activity_logs?.some(
            (log) => log.activity_name === step && log.status === "COMPLETED"
          );
          const isActive = step === currentActivityName;
          const isSelected = step === resolvedSelectedActivityName;

          return (
            <div
              key={step}
              className="flex-1 text-center cursor-pointer"
              onClick={() => setSelectedActivityName(step)}
            >
              <div
                className={`text-[10px] font-semibold rounded px-1 py-0.5 transition-all ${
                  isDone
                    ? "bg-success/15 text-success"
                    : isActive
                      ? "bg-secondary/20 text-secondary font-medium"
                      : "bg-backgroundAlt text-text-light"
                } ${isSelected ? "ring-2 ring-offset-2 ring-secondary" : ""}`}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-backgroundAlt rounded-lg p-3 text-sm">
        <p className="font-semibold text-text mb-2">
          {resolvedSelectedActivityName}
          {resolvedSelectedActivityName === currentActivityName && (
            <span className="ml-2 text-secondary text-xs">(In Progress)</span>
          )}
        </p>

        <div className="grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-text-light">Input</span>
            <br />
            <strong className="text-text">{displayInput} MT</strong>
          </div>
          <div>
            <span className="text-text-light">Expected Output</span>
            <br />
            <strong className="text-text">{displayExpected} MT</strong>
          </div>
          <div>
            <span className="text-text-light">Actual Output</span>
            <br />
            <strong className={`${displayActual === "-" ? "text-text-light" : "text-secondary"}`}>
              {displayActual} MT
            </strong>
          </div>
          <div>
            <span className="text-text-light">Worker Assigned</span>
            <br />
            <strong className="text-text">{displayWorkerAssigned}</strong>
          </div>
        </div>
      </div>
    
      <div className="flex gap-2 flex-wrap">
  {!hideActionButtons && canAdvance && (
    <Button
      variant="primary"
      size="sm"
      onClick={() => advanceMutation.mutate()}
      loading={advanceMutation.isPending}
      disable={advanceMutation.isPending}
    >
      Advance → {nextStepLabel}
    </Button>
  )}

  {!hideActionButtons && displayWorkerAssigned === 0 && batch.status !== "ALLOCATING" && selectedLog?.status !== "COMPLETED" && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate("/work-force")}
    >
      Assign Worker
    </Button>
  )}

  {batch.status === "ALLOCATING" && (
    <>
      {!hideActionButtons && (
        <Button
          variant="success"
          size="sm"
          onClick={() => autoAllocateMutation.mutate()}
          loading={autoAllocateMutation.isPending}
        >
          Auto-allocate to order
        </Button>
      )}

      {!hideActionButtons && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAllocateModalOpen(true)}
        >
          Manual allocate
        </Button>
      )}
    </>
  )}
</div>
    </div>

    {isAllocateModalOpen && (
      <AllocateBatchModal
        batch={batch}
        isOpen={isAllocateModalOpen}
        orders={matchingOrders}
        isSaving={manualAllocateMutation.isPending}
        onClose={() => setIsAllocateModalOpen(false)}
        onConfirm={(allocations) => {
          const items = Object.entries(allocations)
            .filter(([, quantity]) => Number(quantity) > 0)
            .map(([order_plan_id, quantity_mt]) => ({
              order_plan_id,
              quantity_mt: Number(quantity_mt || 0),
            }));

          if (items.length === 0) {
            toast.warn("Enter quantity for at least one order before confirming.");
            return;
          }

          items.forEach((item) => manualAllocateMutation.mutate(item));
        }}
      />
    )}
    </>
  );
};

export default ActiveBatchCard