import React, { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import DataTable, { Td } from '../../components/Datatable'
import { useGenerateBatchPlan, useGetRecommendedBatch, useInventoryCategory, useInventoryStatus, useOrdersByPriority } from '../../hooks/useProductQueries'
import { useFilter } from '../../hooks/useFilter'
import { usePagination } from '../../hooks/usePagination'
import Badge from '../../components/Badge'
import {Badge as Badge2} from '../../components/EmptyState'
import PaginationComponent from '../../components/Pagination'
import { FiAlertTriangle } from 'react-icons/fi'
import Tabs from '../../components/Tabs'
import RecommendedBatch from './Componenets/RecommenedBatch'
import Button from '../../components/Button'
import styled from 'styled-components'
import { FaPlus } from 'react-icons/fa'
import BatchScreen from '../BatchScreen'

const SubtitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
`;

const INVENTORY_COLUMN = ["GRADE", "AVAILABLE (MT)", "REQUIRED (MT)", "SHORTFALL (MT)", "COMMITTED (MT)"]
const orderColumns = [ 'ORDER ID', 'CUSTOMER', 'PRODUCT', 'Grade', 'Required', 'DAYS LEFT', 'Stock', 'PRIORITY', 'Score'];

const variantMap = new Map([
  ["critical", "error"],
  ["urgent", "warning"],
  ["normal", "info"],
]);

const TABS = [
    {key: "plan", label: "Planning"},
    {key: "batch", label: "Active Batches"}
]

const getIncludedSelections = (batchState = [], recommendedList = []) =>
  batchState
    .map((state, i) => ({ state, batch: recommendedList[i] }))
    .filter(({ state, batch }) => state?.included && batch);

const getBatchOverrides = (includedSelections = []) =>
  includedSelections.flatMap(({ state, batch }) => {
    const defaultQty = Number(batch?.input_weight_mt ?? 0);
    const qty = Number(state?.qty ?? 0);
    const qtyChanged = qty !== defaultQty;
    const notes = (state?.notes || "").trim();

    // Send override only when manager changed qty/notes for this batch.
    if (!qtyChanged && !notes) return [];

    const orders =
      batch?.fulfills_orders?.map((o) => o.order).filter(Boolean) || [];

    return orders.map((orderReference) => ({
      order_reference: orderReference,
      input_weight_mt: qty,
      ...(notes ? { notes } : {}),
    }));
  });


const PostGradingScreen = () => {
    const [ activeTab, setActiveTab ] = useState("plan");
    const [planEnabled,    setPlanEnabled]    = useState(false);
    const [selectedDate,   setSelectedDate]   = useState(() => new Date().toISOString().split("T")[0]);
    const [deferredOrders, setDeferredOrders] = useState(new Set());
    const [batchState,     setBatchState]     = useState([]);


    const { data: inventoryCategoryList = [], isLoading: inventoryCategoryLoading } = useInventoryCategory();
    const { data: inventoryStatusList = [], isLoading: inventoryStatusLoading, } = useInventoryStatus();
      const { data: orderList = [], isLoading: ordersLoading } = useOrdersByPriority();
      const {
        data: recommendedBatches = {},
        isLoading: recommendedBatchesLoading,
        refetch: refetchRecommendedBatches,
      } = useGetRecommendedBatch(planEnabled, {
        date: selectedDate,
        exclude: Array.from(deferredOrders).join(","),
      });

      const { mutate: approvePlan, isLoading: approving } = useGenerateBatchPlan();

      useEffect(() => {
        if (recommendedBatches?.recommended_batches) {
          setBatchState(
            recommendedBatches.recommended_batches.map((b) => ({
              included: true,
              qty: Number(b.input_weight_mt ?? 0),
              notes: "",
              orders: b.fulfills_orders?.map((o) => o.order) || [],
            }))
          );
        } else {
          setBatchState([]);
        }
      }, [recommendedBatches]);

const handleDefer = useCallback((orderId) => {
      setDeferredOrders((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(orderId)) {
          newSet.delete(orderId);
        } else {
          newSet.add(orderId);
        }
        return newSet;
      });
    }, []);

const handleGeneratePlan = useCallback(() => {
  const recommendedList = recommendedBatches?.recommended_batches || [];
  const includedSelections = getIncludedSelections(batchState, recommendedList);
  const overrides = getBatchOverrides(includedSelections);

  setPlanEnabled(true);

  // If user has already generated once and changed recommended batches,
  // regenerate using POST /planning/engine/generate with batch_overrides.
  if (planEnabled && overrides.length > 0) {
    approvePlan({
      date: selectedDate,
      batch_overrides: overrides,
    });
    return;
  }

  // Always hit recommendation API when Generate Plan is clicked again.
  if (planEnabled) {
    refetchRecommendedBatches();
  }
}, [
  batchState,
  recommendedBatches,
  planEnabled,
  selectedDate,
  approvePlan,
  refetchRecommendedBatches,
]);

useEffect(() => {
  if (planEnabled) {
    refetchRecommendedBatches();
  }
}, [planEnabled, selectedDate, deferredOrders, refetchRecommendedBatches]);

const handleApprove = useCallback(() => {
  const recommendedList = recommendedBatches?.recommended_batches || [];
  const includedSelections = getIncludedSelections(batchState, recommendedList);
  const overrides = getBatchOverrides(includedSelections);

  const hasDeselections = batchState.some((b) => !b.included);
  const hasDeferrals = deferredOrders.size > 0;
  const hasManualQtyOrNotes = overrides.length > 0;

  // Mode 3: manager-controlled payload
  if (hasDeselections || hasManualQtyOrNotes) {
    approvePlan({ date: selectedDate, batch_overrides: overrides });
    return;
  }

  // Mode 2: auto plan with deferrals
  if (hasDeferrals) {
    approvePlan({
      date: selectedDate,
      exclude_orders: Array.from(deferredOrders),
    });
    return;
  }

  // Mode 1: fully automatic
  approvePlan({ date: selectedDate });
}, [batchState, recommendedBatches, selectedDate, approvePlan, deferredOrders]);

      const gradedStockData = (inventoryStatusList?.grades || []).map(
    (item) => {
      const matchedSpecies = inventoryCategoryList?.find(
        (cat) => String(cat.id) === String(item.species)
      );

      return {
        grade: item.grade_code,
        species: matchedSpecies?.name || "Unknown",
        quantityMt: item.available_mt,
        requiredMt: item.required_mt,
        shortfallMt: item.shortfall_mt,
        committedMt: item.committed_mt,
      };
    }
  );

  const filteredOrderList = useFilter({
    data: orderList,
    fields: [
      "",
      "supplier_name",
    ],
    extraFilters: {},
  });

  const {currentPage, paginatedData, totalItems, handlePageChange} = usePagination(filteredOrderList, 10)

  return (
    <Layout title="Batch Planning">
        <SubtitleSection>
        <div>
          <Subtitle>Generate batches, monitor production activity, and track utilization.</Subtitle>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-border bg-inputBg px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <Button onClick={handleGeneratePlan}>
            <FaPlus /> Generate Plan
          </Button>
        </div>
      </SubtitleSection>

      <Card hoverable={false}>
        <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
{activeTab === "plan" ?
<>
        <Card title="Garde wise Inventory">
            <DataTable columns={INVENTORY_COLUMN}
            data={gradedStockData}
            renderRow={(data) => (
                <>
                <Td>
                    <Badge2 label={`${data.species} (${data.grade})`} variant='species' /></Td>
                <Td>{data.quantityMt}</Td>
                <Td>{data.requiredMt}</Td>
                <Td>{data.shortfallMt}</Td>
                <Td>{data.committedMt}</Td>
                </>
            )}
            />

        </Card>

        <Card title="pending Orders">
            <DataTable
          columns={orderColumns}
          data={paginatedData}
          isLoading={ordersLoading}
          emptyMessage="No orders found"
          renderRow={(item) => {
              const order = item.order;

            return(
            <>
              <Td><Badge2 label={order.erp_order_reference} variant="grn" /></Td>
              <Td>{order.customer_name}</Td>
              <Td>{order.product_name}</Td>
              <Td>{order.grade_code}</Td>
              <Td>{order.remaining_qty_mt} MT</Td>
              <Td>{order.days_until_delivery}d</Td>
              <Td><StockAvailability availableMt={item.stock_available_mt} /></Td>
              <Td><Badge variant={variantMap.get((item.label || "").toLowerCase()) || "primary"}>
                  {item.label || "--"}
                </Badge></Td>
              <Td>
                 <ScoreBar score={item.total || 0} />
              </Td>
              <Td>
                  {recommendedBatches && <Button size='sm' variant={deferredOrders.has(order.erp_order_reference) ? 'outline' : "primary" } onClick={() => handleDefer(order.erp_order_reference)}>
                    {deferredOrders.has(order.erp_order_reference) ? "Deferred" : "Defer"}
                    
                    </Button>}
                </Td>
            </>
          )}}
        />

        <PaginationComponent totalItems={totalItems} onPageChange={handlePageChange} currentPage={currentPage} />
        </Card>

        {(recommendedBatches || recommendedBatchesLoading) && (
        <RecommendedBatch
          data={recommendedBatches || {}}
          loading={recommendedBatchesLoading || approving}
          batchState={batchState}
          setBatchState={setBatchState}
          onApprove={handleApprove}
          onDefer={handleDefer}
          selectedDate={selectedDate}
        />
      )}
      </>
    : <BatchScreen />
    
    }
    </Card>

    </Layout>
  )
}

export default PostGradingScreen

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

function StockAvailability({ availableMt }) {
  if (availableMt === 0)
    return <span className="text-xs text-error font-semibold flex items-center gap-1"><FiAlertTriangle size={10} /> No stock</span>;
  return <span className="text-xs text-success font-semibold">✓ {availableMt} MT</span>;
}

function DeferButton({ orderId, deferred, onDefer }) {
  return (
    <button
      onClick={() => onDefer(orderId)}
      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
        deferred
          ? "bg-backgroundAlt text-textLight border-border"
          : "bg-card text-textLight border-border hover:border-primary hover:text-primary"
      }`}
    >
      {deferred ? "Deferred" : "Defer"}
    </button>
  );
}