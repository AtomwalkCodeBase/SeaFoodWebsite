import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Layout from "../../../components/Layout";
import Card from "../../../components/Card";
import Badge from "../../../components/Badge";
import { Badge as Badge2 } from "../../../components/EmptyState";
import Button from "../../../components/Button";
import StatsCard from "../../../components/StatsCard";
import AllocateBatchModal from "../../../components/Modal/AllocateBatchModal";
import { SectionHeader, EmptyState } from "../../../components/EmptyState";
import {
  AdvanceBatchActivity,
  AutoAllocateBatch,
  getBatchList,
  getProcessActivityList,
  GetOrdersList,
  ManualAllocateBatch,
} from "../../../services/productServices";
import { BsListOl } from "react-icons/bs";
import { FaClockRotateLeft } from "react-icons/fa6";
import { TbCalendarClock } from "react-icons/tb";
import { LuPackageCheck } from "react-icons/lu";
import { theme } from "../../../styles/Theme";
import { useNavigate } from "react-router-dom";

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const BatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TimelineBar = styled.div`
  height: 8px;
  background: #1f2937;
  border-radius: 9999px;
  overflow: hidden;
`;

const TimelineFill = styled.div`
  height: 100%;
  background: ${(props) => props.color || "#10b981"};
  width: ${(props) => props.width}%;
  transition: width 0.4s ease;
`;

const DEFAULT_STEPS = ["Cleaning", "Cooking", "Glazing", "Packing"];

const BatchScreen = () => {
  const { data: batchList = [], isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => getBatchList(),
    select: (res) => res.data,
    onError: () => toast.error("Failed to load batches"),
  });
  const activeSubBatches = useMemo(
    () =>
      batchList.filter(
        (batch) => batch.batch_type === "SUB_BATCH" && batch.status !== "COMPLETED"
      ),
    [batchList]
  );

  const stats = useMemo(() => {
    return {
      total: activeSubBatches.length,
      inProgress: activeSubBatches.filter((b) => b.status === "IN_PROGRESS").length,
      scheduled: activeSubBatches.filter((b) => b.status === "SCHEDULED").length,
      allocating: activeSubBatches.filter((b) => b.status === "ALLOCATING").length,
      completed: batchList.filter(
        (b) => b.batch_type === "SUB_BATCH" && b.status === "COMPLETED"
      ).length,
    };
  }, [activeSubBatches, batchList]);

  const STATUS_CARD = [
    { label: "TOTAL BATCHES", value: stats.total, icon: <BsListOl />, color: "primary" },
    { label: "IN PROGRESS", value: stats.inProgress ,icon: <FaClockRotateLeft />, color: "secondary" },
    { label: "SCHEDULED", value: stats.scheduled ,icon: <TbCalendarClock /> , color: "accent" },
    { label: "ALLOCATING", value: stats.allocating, icon: <LuPackageCheck />, color: "success" },
    { label: "COMPLETED", value: stats.completed, icon: <LuPackageCheck />, color: "success" },
  ];

  return (
    <div>
      {/* Top Stats */}
      <StatsGrid>
        {STATUS_CARD.map((stat, i) => (
          // <Card key={i} className="text-center">
          //   <p className="text-sm text-text-light mb-1">{stat.label}</p>
          //   <h2 className="text-4xl font-bold" style={{ color: stat.color }}>
          //     {stat.value}
          //   </h2>
          // </Card>
          <StatsCard icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </StatsGrid>

      <Card style={{border: `1px solid ${theme.colors.primaryLight}`}}>
        <SectionHeader title="Batch Timeline" icon="⏱️" />
        <div className="space-y-4 mt-4">
          {isLoading ? (
            <EmptyState message="Loading active batches timeline..." />
          ) : activeSubBatches.length === 0 ? (
            <EmptyState message="No active sub-batches to show in timeline." />
          ) : (
            activeSubBatches.map((batch) => <BatchTimeline key={batch.id} batch={batch} />)
          )}
        </div>
      </Card>

<Card style={{border: `1px solid ${theme.colors.primaryLight}`}}>

      <SectionHeader title="Active Batches" icon="📦" className="mb-3" />
      <BatchGrid>
        {isLoading ? (
          <EmptyState message="Loading active batches..." />
        ) : activeSubBatches.length === 0 ? (
          <EmptyState message="No active batches found." />
        ) : (
          activeSubBatches.map((batch) => <ActiveBatchCard key={batch.id} batch={batch} />)
        )}
      </BatchGrid>
</Card>
    </div>
  );
};

const BatchTimeline = ({ batch }) => {
  const { data: processActivities = [] } = useQuery({
    queryKey: ["processActivities", batch.product],
    queryFn: () => getProcessActivityList({ product_id: batch.product }),
    select: (res) => res.data,
    enabled: !!batch.product,
  });

  const dynamicSteps =
    processActivities?.length > 0
      ? processActivities
          .sort((a, b) => a.sequence - b.sequence)
          .map((x) => x.activity_name)
      : DEFAULT_STEPS;

  const completedSteps =
    batch.activity_logs?.filter((x) => x.status === "COMPLETED")?.map((x) => x.activity_name) ||
    [];
  const totalSteps = dynamicSteps.length || 1;
  const progressPct = Math.min((completedSteps.length / totalSteps) * 100, 100);
  const statusVariant = batch.status === "IN_PROGRESS" ? "warning" : batch.status === "COMPLETED" ? "success" : batch.status === "SCHEDULED" ? "notPlanned" : batch.status === "CANCELLED" ? "error" : "info" ;

  return (
    <div className="flex items-center gap-4">
      <div className="w-56">
        <div className="font-mono font-semibold text-primary">{batch.batch_number}</div>
        <div className="text-xs text-text-light">
          {batch.product_code} {batch.grade_code}
        </div>
      </div>

      <div className="flex-1">
        <TimelineBar>
          <TimelineFill
            width={progressPct}
            color={batch.status === "IN_PROGRESS" ? `${theme.colors.warning}` : batch.status === "COMPLETED" ? `${theme.colors.success}` : batch.status === "SCHEDULED" ? "#666666" : batch.status === "CANCELLED" ? `${theme.colors.error}` : `${theme.colors.info}`}
          />
        </TimelineBar>
        <div className="text-[11px] text-text-light mt-1">
          {completedSteps.length}/{totalSteps} steps completed
        </div>
      </div>

      <Badge variant={statusVariant}>{String(batch.status || "").replace("_", " ")}</Badge>
    </div>
  );
};

const ActiveBatchCard = ({ batch }) => {
  const navigate = useNavigate()
  const qc = useQueryClient();
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const currentActivityName = batch.current_activity_name;
  const [selectedActivityName, setSelectedActivityName] = useState(currentActivityName);

  const { data: processActivities = [] } = useQuery({
    queryKey: ["processActivities", batch.product],
    queryFn: () => getProcessActivityList({ product_id: batch.product }),
    select: (res) => res.data,
    enabled: !!batch.product,
  });

  const { data: orderList = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
  });

  const matchingOrders = useMemo(
    () =>
      orderList.filter(
        (o) =>
          o.grade_code === batch.grade_code &&
          o.product_code === batch.product_code &&
          Number(o.remaining_qty_mt || 0) > 0
      ),
    [orderList, batch.grade_code, batch.product_code]
  );

  const dynamicSteps = useMemo(() => {
    if (processActivities.length > 0) {
      return processActivities.sort((a, b) => a.id - b.id).map((act) => act.activity_name);
    }
    return DEFAULT_STEPS;
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
  const displayInput = selectedLog?.input_weight_mt || batch.input_weight_mt || "0";
  const displayExpected = selectedLog?.expected_output_mt || "0";
  const displayActual = selectedLog?.actual_output_mt || "-";
  const displayWorkerAssigned = selectedLog?.workers_assigned || 0;
  const isLastStep = currentIdx === dynamicSteps.length - 1;
  const canAdvance = batch.status === "SCHEDULED" || (currentIdx >= 0 && batch.status !== "ALLOCATING");
  const nextStepLabel =
    batch.status === "SCHEDULED"
      ? dynamicSteps[0]
      : isLastStep
        ? "Complete Batch"
        : dynamicSteps[currentIdx + 1];

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

  const statusColor = batch.status === "IN_PROGRESS" ? "success" : "warning";
  // console.log(`batch :${batch.batch_number}`, batch)

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
          const isSelected = step === selectedActivityName;

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
          {selectedActivityName}
          {selectedActivityName === currentActivityName && (
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
        {canAdvance && (
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
        {/* {(displayWorkerAssigned === 0 && batch.status !== "ALLOCATING") && ( */}
        {batch.status !== "ALLOCATING" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {navigate('/work-force')}}
          >
            Assign Worker
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
            <Button variant="secondary" size="sm" onClick={() => setIsAllocateModalOpen(true)}>
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

export default BatchScreen;