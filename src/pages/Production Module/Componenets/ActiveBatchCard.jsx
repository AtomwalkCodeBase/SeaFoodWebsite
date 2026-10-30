import React, { useMemo, useState } from 'react'
import { toast } from 'react-toastify';
import AllocateBatchModal from '../../../components/Modal/AllocateBatchModal';
import Button from '../../../components/Button';
import { AdvanceBatchActivity, AutoAllocateBatch, ManualAllocateBatch, UpdateActualOutput } from '../../../services/productServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOrders, useProcessActivityList } from '../../../hooks/useProductQueries';
import { Badge as Badge2 } from "../../../components/EmptyState";
import ActualOutputModal from '../../../pages/Production Module/Modal/ActualOutputModal';
import ConfirmPopup from '../../../components/ConfirmPopup';
import Modal from '../../../components/Modal';

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
  const [isActualOutputModalOpen, setIsActualOutputModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
const [pendingPayload, setPendingPayload] = useState(null);
const [confirmMessage, setConfirmMessage] = useState("");
const [confirmTitle, setConfirmTitle] = useState("Confirm Activity");
const [isQCConfirmation, setIsQCConfirmation] = useState(false);
const [isQCDetailsOpen, setIsQCDetailsOpen] = useState(false);

  const { data: activitiesData, isLoading: processActivityLoading } = useProcessActivityList(!!batch.product, batch.product);
  const { data: orderList = [], isLoading: ordersLoading } = useOrders();

  const dynamicSteps = getDynamicSteps(activitiesData);

  const matchingOrders = useMemo(() => orderList.filter((o) =>
    o.grade_code === batch.grade_code &&
    o.product_code === batch.product_code &&
    Number(o.remaining_qty_mt || 0) > 0
  ),
    [orderList, batch.grade_code, batch.product_code]
  );


 const currentIdx = dynamicSteps.indexOf(currentActivityName);

  const resolvedSelectedActivityName = selectedActivityName || (batch.status === "SCHEDULED" ? dynamicSteps[0] : currentActivityName || dynamicSteps[0]);

  const selectedLog = batch.activity_logs?.find((log) => log.activity_name === resolvedSelectedActivityName);

  const qcTestDetails = selectedLog?.qc_test_required || {};

const hasQCDetails = Object.keys(qcTestDetails).length > 0;

  const activityQCData = selectedLog?.activity_qc_data || {};

  const isQCActivity = Object.keys(activityQCData).length > 0;

  const displayInput = selectedLog?.input_weight_mt || batch.input_weight_mt || "0";

  const displayExpected = selectedLog?.expected_output_mt || "0";

  const displayActual = selectedLog?.actual_output_mt || "-";

  const displayWorkerAssigned = selectedLog?.workers_assigned || 0;

  const isLastStep = currentIdx === dynamicSteps.length - 1;

  const isCurrentActivitySelected = resolvedSelectedActivityName === currentActivityName;

  const canStartBatch = !hideActionButtons && batch.status === "SCHEDULED";

  const canCompleteActivity =
      !hideActionButtons &&
      batch.status !== "SCHEDULED" &&
      batch.status !== "COMPLETED" &&
      batch.status !== "ALLOCATING" &&
      isCurrentActivitySelected &&
      selectedLog &&
      selectedLog.status !== "COMPLETED";

  const nextStepLabel = isLastStep ? "Complete Batch" : dynamicSteps[currentIdx + 1];

const advanceMutation = useMutation({
    mutationFn: (payload) => {
        if (payload) {
            return AdvanceBatchActivity(batch.id, payload);
        }

        return AdvanceBatchActivity(batch.id);
    },

    onSuccess: () => {
        toast.success("Activity completed successfully");

        setIsConfirmOpen(false);
        setIsActualOutputModalOpen(false);
        setPendingPayload(null);
        setIsQCConfirmation(false);

        qc.invalidateQueries({
            queryKey: ["batches"],
        });

        qc.invalidateQueries({
            queryKey: ["orders"],
        });
    },

    onError: (error) => {
        console.log("Advance activity error:", error);

        toast.error(
            error?.message || "Failed to complete activity"
        );
    },
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

  const actualOutputMutation = useMutation({
    mutationFn: (payload) =>
      AdvanceBatchActivity(batch.id, payload),

    onSuccess: () => {
      toast.success("Actual output saved");

      setIsActualOutputModalOpen(false);

      qc.invalidateQueries({
        queryKey: ["batches"],
      });
    },

    onError: (error) => {
      console.log("Actual output error:", error);

      toast.error(
        error?.message || "Failed to save actual output"
      );
    },
  });

// Start the batch
const handleStartBatch = () => {
    advanceMutation.mutate();
};


// Complete normal activity using expected output
const handleCompleteActivity = () => {
    const payload = {
        activity_name: resolvedSelectedActivityName,
        actual_output_mt: Number(
            selectedLog?.expected_output_mt || 0
        ),
        remarks: "",
        qc_test_required: {},
    };

    setPendingPayload(payload);

    setConfirmTitle("Complete Activity");

    setConfirmMessage(
        `Are you sure you want to complete ${resolvedSelectedActivityName}? The actual output will be recorded using the expected output quantity. If you want to change the output quantity, click on Enter Actual Output instead.`
    );

    setIsQCConfirmation(false);
    setIsConfirmOpen(true);
};


// Submit actual output or QC form
const handleActualOutputSubmit = (payload) => {

    // QC activities require confirmation
    if (isQCActivity) {
        setPendingPayload(payload);

        setConfirmTitle("Confirm QC Results");

        setConfirmMessage(
            `Are you sure you want to save the QC test results and actual output for ${resolvedSelectedActivityName}?`
        );

        setIsQCConfirmation(true);
        setIsConfirmOpen(true);

        return;
    }

    // Normal actual output can be saved directly
    advanceMutation.mutate(payload);
};


// Confirm and execute the pending action
const handleConfirmActivity = () => {
    if (!pendingPayload) return;

    advanceMutation.mutate(pendingPayload);
};

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
                  className={`text-[10px] font-semibold rounded px-1 py-0.5 transition-all ${isDone
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

    {/* Start Batch */}
    {canStartBatch && (
        <Button
            variant="primary"
            size="sm"
            onClick={handleStartBatch}
            loading={advanceMutation.isPending}
            disable={advanceMutation.isPending}
        >
            Start the Batch
        </Button>
    )}


    {/* Complete Activity */}
    {canCompleteActivity && (
        <Button
            variant="primary"
            size="sm"
            onClick={() => {
                if (isQCActivity) {
                    setIsActualOutputModalOpen(true);
                } else {
                    handleCompleteActivity();
                }
            }}
            disable={advanceMutation.isPending}
        >
            Complete {resolvedSelectedActivityName}
        </Button>
    )}


    {/* Enter Actual Output - Only for non-QC activities */}
    {canCompleteActivity && !isQCActivity && (
        <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsActualOutputModalOpen(true)}
        >
            Enter Actual Output
        </Button>
    )}


    {/* Assign Worker */}
    {!hideActionButtons &&
        displayWorkerAssigned === 0 &&
        batch.status !== "SCHEDULED" &&
        batch.status !== "ALLOCATING" &&
        batch.status !== "COMPLETED" &&
        selectedLog?.status !== "COMPLETED" && (
            <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/work-force")}
            >
                Assign Worker
            </Button>
        )}

        {hasQCDetails && (
    <Button
        variant="outline"
        size="sm"
        onClick={() => setIsQCDetailsOpen(true)}
    >
        QC Details
    </Button>
)}


    {/* Allocation buttons */}
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
      {isActualOutputModalOpen && (
    <ActualOutputModal
        batch={batch}
        activity={selectedLog}
        isOpen={isActualOutputModalOpen}
        activityName={resolvedSelectedActivityName}
        isSaving={advanceMutation.isPending}
        onClose={() => setIsActualOutputModalOpen(false)}
        onConfirm={handleActualOutputSubmit}
    />
)}
      {isAllocateModalOpen && (
        <AllocateBatchModal
          batch={batch}
          isOpen={isAllocateModalOpen}
          orders={matchingOrders}
          isSaving={manualAllocateMutation.isPending}
          onClose={() => setIsAllocateModalOpen(false)}
onConfirm={(allocations) => {
    const selected = Object.entries(allocations)
        .find(([, allocation]) => Number(allocation?.packets) > 0);

    if (!selected) {
        toast.warn("Enter packet count.");
        return;
    }

    const [order_plan_id, allocation] = selected;

    const payload = {
        order_plan_id: order_plan_id,
        quantity_mt: Number(allocation.mt),
        allocated_qty: Number(allocation.packets),
    };

    manualAllocateMutation.mutate(payload);
}}
        />
      )}

      <ConfirmPopup
    isOpen={isConfirmOpen}
    title={confirmTitle}
    message={confirmMessage}
    confirmLabel={
        isQCConfirmation
            ? "Save QC Results"
            : "Complete Activity"
    }
    cancelLabel="Cancel"
    isLoading={advanceMutation.isPending}
    onClose={() => {
        if (advanceMutation.isPending) return;

        setIsConfirmOpen(false);
        setPendingPayload(null);
        setIsQCConfirmation(false);
    }}
    onConfirm={handleConfirmActivity}
/>

{isQCDetailsOpen && (
    <Modal
        title={`QC Details - ${selectedLog?.activity_name}`}
        width="max-w-2xl"
        isOpen={isQCDetailsOpen}
        onClose={() => setIsQCDetailsOpen(false)}
        showSaveButton={false}
        cancelButtonText={null}
    >
        <div className="space-y-3">

            <div className="mb-4">
                <p className="text-sm text-text-light">
                    Batch
                </p>

                <p className="font-semibold text-text">
                    {batch.batch_number}
                </p>
            </div>

            <h3 className="font-semibold text-text">
                QC Test Results
            </h3>

            <div className="space-y-3">

                {Object.entries(qcTestDetails).map(
                    ([key, value]) => (
                        <div
                            key={key}
                            className="rounded-lg border border-border bg-backgroundAlt p-3"
                        >
                            <p className="text-xs text-text-light mb-1">
                                {key.replace(/_/g, " ")}
                            </p>

                            <p className="font-medium text-text">
                                {value || "--"}
                            </p>
                        </div>
                    )
                )}

            </div>

            <div className="flex justify-end pt-3">
                <Button
                    variant="outline"
                    onClick={() => setIsQCDetailsOpen(false)}
                >
                    Close
                </Button>
            </div>

        </div>
    </Modal>
)}
    </>
  );
};

export default ActiveBatchCard