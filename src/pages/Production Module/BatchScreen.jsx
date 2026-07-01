import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import { Badge as Badge2 } from "../../components/EmptyState";
import Button from "../../components/Button";
import StatsCard from "../../components/StatsCard";
import AllocateBatchModal from "../../components/Modal/AllocateBatchModal";
import { SectionHeader, EmptyState } from "../../components/EmptyState";
import {
  AdvanceBatchActivity,
  AutoAllocateBatch,
  getBatchList,
  GetOrdersList,
  ManualAllocateBatch,
} from "../../services/productServices";
import { BsListOl } from "react-icons/bs";
import { FaClockRotateLeft } from "react-icons/fa6";
import { TbCalendarClock } from "react-icons/tb";
import { LuPackageCheck } from "react-icons/lu";
import { theme } from "../../styles/Theme";
import { useFilter } from "../../hooks/useFilter";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { QUERY_KEYS } from "../../constants";
import InputField from "../../components/InputField";
import ActiveBatchCard from "./Componenets/ActiveBatchCard";
import BatchTimeline from "./Componenets/BatchTimeline";

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

const BatchScreen = ({ hideActionButtons = false }) => {
  const { data: batchList = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.BATCHES],
    queryFn: () => getBatchList(),
    select: (res) => res.data.filter((data) => data.batch_number !== "BAT-20260629-001" && data.batch_number !== "BAT-20260629-002"),
    onError: () => toast.error("Failed to load batches"),
  });

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("TODAY");
  const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });

  // const activeSubBatches = useMemo(
  //   () => batchList.filter((batch) => batch.status !== "COMPLETED"),
  //   [batchList],
  // );

  const dateFilter = useMemo(() => {
    if (datePreset === "ALL") {
      return {};
    }

    if (datePreset === "CUSTOM") {
      return {
        dateRange: {
          field: "created_at",
          from: customDateRange.from || undefined,
          to: customDateRange.to || undefined,
        },
      };
    }

    const baseDate = startOfDay(new Date());

    let targetDate = baseDate;
    if (datePreset === "YESTERDAY") {
      targetDate = subDays(baseDate, 1);

    } else if (datePreset === "TOMORROW") {
      targetDate = addDays(baseDate, 1);
    }

    // console.log("targetDate", targetDate)
    
    const value = format(targetDate, "yyyy-MM-dd");
    console.log("value", value)
    return {
      dateRange: {
        field: "scheduled_date",
        from: value,
        to: value,
      },
    };
  }, [customDateRange.from, customDateRange.to, datePreset]);

  const filteredActiveSubBatches = useFilter({
    data: batchList,
    fields: [ "batch_number", "product_code", "grade_code", "product_name", "species", "status"],
    extraFilters: {
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(Object.keys(dateFilter).length ? dateFilter : {}),
    },
  });

  const dateFilteredBatches = useFilter({
    data: batchList,
    fields: [],
    extraFilters: Object.keys(dateFilter).length ? dateFilter : {},
  });

  const stats = useMemo(() => {
    return {
      total: dateFilteredBatches.length,
      inProgress: dateFilteredBatches.filter( (b) => b.status === "IN_PROGRESS").length,
      scheduled: dateFilteredBatches.filter( (b) => b.status === "SCHEDULED").length,
      allocating: dateFilteredBatches.filter( (b) => b.status === "ALLOCATING").length,
      completed: dateFilteredBatches.filter((b) => b.status === "COMPLETED").length,
    };
  }, [dateFilteredBatches]);

  const STATUS_CARD = [
    { 
      label: "TOTAL BATCHES", 
      value: stats.total, 
      icon: <BsListOl />, 
      color: "primary", 
      filter: "ALL" 
    },
    { 
      label: "IN PROGRESS", 
      value: stats.inProgress, 
      icon: <FaClockRotateLeft />, 
      color: "warning", 
      filter: "IN_PROGRESS" 
    },
    { 
      label: "SCHEDULED", 
      value: stats.scheduled, 
      icon: <TbCalendarClock />, 
      color: "error", 
      filter: "SCHEDULED" 
    },
    { 
      label: "ALLOCATING", 
      value: stats.allocating, 
      icon: <LuPackageCheck />, 
      color: "allocatingBlue", 
      filter: "ALLOCATING" 
    },
    { 
      label: "COMPLETED", 
      value: stats.completed, 
      icon: <LuPackageCheck />, 
      color: "success", 
      filter: "COMPLETED" 
    },
  ];

  const clearFilters = () => {
    setStatusFilter("ALL");
    setDatePreset("TODAY");
    setCustomDateRange({ from: "", to: "" });
  };

    const handleStatClick = (filter) => {
    if (filter === "ALL") {
      setStatusFilter("ALL");
    } else {
      setStatusFilter(filter);
    }
  };

  const DATE_OPTIONS = [
    { value: "ALL", label: "All dates" },
    { value: "TODAY", label: "Today" },
    { value: "YESTERDAY", label: "Yesterday" },
    { value: "TOMORROW", label: "Tomorrow" },
    { value: "CUSTOM", label: "Custom range" },
  ];
  const STATUS_OPTIONS = [
    { value: "ALL", label: "All statuses" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ALLOCATING", label: "Order Allocated" },
    { value: "NOT_ALLOCATED", label: "Worker Not Assigned" },
    { value: "SCHEDULED", label: "Scheduled" },
    // { value: "GRADING", label: "Not Started" },
  ];

  console.log("datePreset", datePreset)

  return (
    <div>
      <StatsGrid>
        {STATUS_CARD.map((stat) => (
          <StatsCard
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            onClick={() => handleStatClick(stat.filter)}
          />
        ))}
      </StatsGrid>

      <Card style={{ border: `1px solid ${theme.colors.primaryLight}` }}>
        <SectionHeader title="Batch Timeline" icon="⏱️" />
        <div className="space-y-4 mt-4">
          {isLoading ? (
            <EmptyState message="Loading active batches timeline..." />
          ) : filteredActiveSubBatches.length === 0 ? (
            <EmptyState message="No active batches to show in timeline for the selected filters." />
          ) : (
            filteredActiveSubBatches.map((batch) => (
              <BatchTimeline key={batch.id} batch={batch} />
            ))
          )}
        </div>
      </Card>

      <Card style={{ border: `1px solid ${theme.colors.primaryLight}` }}>
        <SectionHeader title="Active Batches" icon="📦" className="mb-3" />
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <InputField
            label="Date"
            name="datePreset"
            type="select"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            options={DATE_OPTIONS}
            className="min-w-42.5"
          />

          {datePreset === "CUSTOM" && (
            <>
              <InputField
                label="From"
                name="fromDate"
                type="date"
                value={customDateRange.from}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    from: e.target.value,
                  }))
                }
                className="min-w-37.5"
              />
              <InputField
                label="To"
                name="toDate"
                type="date"
                value={customDateRange.to}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    to: e.target.value,
                  }))
                }
                className="min-w-37.5"
              />
            </>
          )}

          <InputField
            label="Status"
            name="statusFilter"
            type="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            className="min-w-45"
          />

          {(statusFilter !== "ALL" ||
            datePreset !== "ALL" ||
            customDateRange.from ||
            customDateRange.to) && (
            <Button type="button" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
          {isLoading ? (
            <EmptyState message="Loading active batches..." />
          ) : filteredActiveSubBatches.length === 0 ? (
            <EmptyState message="No active batches found for the selected filters." />
          ) : (
            <BatchGrid>
           {filteredActiveSubBatches.map((batch) => (
              <ActiveBatchCard
                key={batch.id}
                batch={batch}
                hideActionButtons={hideActionButtons}
              />
            ))}
        </BatchGrid>
          )}
      </Card>
    </div>
  );
};

export default BatchScreen;
