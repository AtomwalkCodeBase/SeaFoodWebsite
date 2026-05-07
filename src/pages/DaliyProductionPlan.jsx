import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { SectionHeader } from '../components/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { GetOrdersList, GetPlanningReport,  } from '../services/productServices';
import { toast } from 'react-toastify';
import DataTable, { Td } from '../components/Datatable';
import Badge from '../components/Badge';
import styled from 'styled-components';
import InputField from '../components/InputField';
import Button from '../components/Button';

const ScoreBarWrap = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
  height: 12px;
`;

const ScoreFill = styled.div`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ color }) => color || "#1890ff"};
  transition: width 0.3s ease;
`;

const orderColumns = [
  'ORDER ID', 'CUSTOMER', 'PRODUCT', 'QTY (MT)', 'MARGIN (USD/MT)',
  'SHIPMENT DATE', 'DAYS LEFT', 'SCORE', 'PRIORITY', 'STATUS', 'ACTION'
];

const variantMap = new Map([
  ["critical", "error"],
  ["urgent", "warning"],
  ["normal", "info"],
]);

const DaliyProductionPlan = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [deferredOrders, setDeferredOrders] = useState(new Set());
  const [batchState, setBatchState] = useState([]);

  const { data: orderList = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load orders'),
  });

  const { data: planData, isLoading: planLoading, refetch: fetchPlan } = useQuery({
    queryKey: ['planning-engine', selectedDate],
    queryFn: () => GetPlanningReport(selectedDate),
    enabled: false,
    select: (res) => res.data,
    onError: () => toast.error("Failed to generate plan"),
  });

  // Sync batchState from plan data
  useEffect(() => {
    if (planData?.recommended_batches) {
      const mapped = planData.recommended_batches.map((b, i) => ({
        id: i,
        orderId: b.fulfills_orders?.[0]?.order || `BATCH-${i}`,
        customer: "Nippon Suisan", // Replace with real data when available
        daysLeft: 8,
        product: b.product_code,
        grade: b.grade_code,
        qty: b.input_weight_mt,
        included: true,
        notes: "",
        yieldPct: 78.5,
        margin: 217000,
        orders: b.fulfills_orders || [],
      }));
      setBatchState(mapped);
    }
  }, [planData]);

  const toggleDefer = (orderId) => {
    setDeferredOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  return (
    <Layout title="Daily production plan">
      {/* Outstanding Orders Table */}
      <Card style={{ marginTop: "2rem" }}>
        <SectionHeader 
          title="Outstanding orders" 
          icon="📋" 
          sub='Ranked by priority score. Toggle "Defer" to skip an order today.' 
        />
        <DataTable
          columns={orderColumns}
          data={orderList}
          isLoading={ordersLoading}
          emptyMessage="No orders found"
          renderRow={(order) => (
            <>
              <Td>{order.erp_order_reference}</Td>
              <Td>{order.customer_name}</Td>
              <Td>{order.product_name}</Td>
              <Td>{order.quantity_mt}</Td>
              <Td>{order.margin_per_mt}</Td>
              <Td>{order.delivery_date}</Td>
              <Td>{order.days_until_delivery}</Td>
              <Td>
                {order?.score ? (
                  <>
                    <ScoreBarWrap>
                      <ScoreFill
                        percent={order.score}
                        color={order.score >= 90 ? "#52c41a" : order.score >= 75 ? "#faad14" : "#ff4d4f"}
                      />
                    </ScoreBarWrap>
                    <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>{order.score}</div>
                  </>
                ) : "--"}
              </Td>
              <Td>
                <Badge variant={variantMap.get((order.priority_override || "").toLowerCase()) || "primary"}>
                  {order.priority_override || "--"}
                </Badge>
              </Td>
              <Td>
                <Badge variant="primary">{order.status || "--"}</Badge>
              </Td>
              <Td>
                <Button
                  size="sm"
                  variant={deferredOrders.has(order.id) ? "success" : "danger"}
                  onClick={() => toggleDefer(order.id)}
                >
                  {deferredOrders.has(order.id) ? "Include" : "Defer"}
                </Button>
              </Td>
            </>
          )}
        />
      </Card>

      {/* Planning Date Selector */}
      <Card style={{ marginTop: "1rem" }}>
        <div className="flex gap-3 items-end mt-4">
          <InputField
            label="Select Planning Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded mt-6"
            onClick={async () => {
              if (!selectedDate) return toast.error("Please select a date");
              await fetchPlan();
              setShowPlan(true);
            }}
          >
            Generate Plan
          </button>
        </div>
      </Card>

      {!showPlan ? (
        <Card>
          <div className='flex flex-col justify-center items-center p-7'>
            <h1 className='text-5xl'>🧠</h1>
            <h2 className='text-text'>Ready to plan</h2>
            <p className='text-text-light p-5'>Select a date and click "Generate plan".</p>
          </div>
        </Card>
      ) : (
        <PlanningResult 
          data={planData} 
          loading={planLoading} 
          batchState={batchState}
          setBatchState={setBatchState}
          selectedDate={selectedDate}
        />
      )}
    </Layout>
  );
};

const PlanningResult = ({ data, loading, batchState, setBatchState, selectedDate }) => {
  if (loading) return <Card>Loading plan...</Card>;
  if (!data) return null;

  const totalPlanned = batchState.filter(b => b.included).reduce((sum, b) => sum + Number(b.qty), 0);
  const utilization = data.capacity_available_mt ? (totalPlanned / data.capacity_available_mt) * 100 : 0;

  return (
    <Card>
      <CapacitySummary 
        data={data} 
        totalPlanned={totalPlanned} 
        utilization={utilization}
        batchCount={batchState.filter(b => b.included).length}
      />
      <RecommendedBatches 
        batchState={batchState} 
        setBatchState={setBatchState}
        selectedDate={selectedDate} 
      />
      <Warnings data={data} />
    </Card>
  );
};

const CapacitySummary = ({ data, totalPlanned, utilization, batchCount }) => (
  <div className='flex flex-row gap-3 w-full mb-6'>
    {/* Daily Capacity Usage */}
    <div className='flex-[5]'>
      <Card>
        <div className="flex justify-between items-center mb-2">
          <p className="font-medium">Daily capacity usage</p>
          <div className="text-xl font-bold text-amber-400">{Math.round(utilization)}%</div>
        </div>

        <ScoreBarWrap>
          <ScoreFill percent={utilization} color="#fbbf24" />
        </ScoreBarWrap>

        <div className='flex justify-between text-sm mt-3'>
          <p>Planned: <strong>{totalPlanned.toFixed(1)} MT</strong></p>
          <p>Capacity: <strong>{data.capacity_available_mt} MT</strong></p>
          <p>Est. output: <strong>{(totalPlanned * 0.785).toFixed(1)} MT</strong></p>
        </div>
      </Card>
    </div>

    {/* Batches */}
    <div className='flex-1'>
      <Card className="h-[85%] flex flex-col items-center justify-center">
        <p className="text-sm text-text-light font-semibold">BATCHES</p>
        <h2 className="text-xl font-bold mt-1">{batchCount}</h2>
      </Card>
    </div>

    {/* Orders Covered */}
    <div className='flex-1'>
      <Card className="h-[85%] flex flex-col items-center justify-center">
        <p className="text-sm text-text-light font-semibold">ORDERS COVERED</p>
        <h2 className="text-xl font-bold mt-1">
          {batchCount} / {data.priority_queue?.length || 0}
        </h2>
      </Card>
    </div>
  </div>
);

const RecommendedBatches = ({ batchState, setBatchState, selectedDate }) => {
  const updateBatch = (id, field, value) => {
    setBatchState(prev =>
      prev.map(b => b.id === id ? { ...b, [field]: value } : b)
    );
  };

  const handleApprove = async () => {
    const payload = {
      date: selectedDate,
      batches: batchState.filter(b => b.included).map(b => ({
        product_code: b.product,
        grade_code: b.grade,
        input_weight_mt: b.qty,
        notes: b.notes,
      }))
    };

    try {
    //   await GeneratePlan(payload);
    console.log(payload)
      toast.success("Batches created successfully!");
    } catch (err) {
      toast.error("Failed to create batches");
    }
  };

  return (
    <Card variant="secondary">
      <div className="flex justify-between items-center mb-4">
        <SectionHeader title="Recommended batches" />
        <Button onClick={handleApprove}>
         Approve & create {batchState.filter(b => b.included).length} batches
        </Button>
      </div>

      {batchState.map((b) => (
        <div key={b.id} className="border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Checkbox + Order ID */}
            <div className="flex items-center gap-3 min-w-[180px]">
              <input
                type="checkbox"
                checked={b.included}
                onChange={() => updateBatch(b.id, "included", !b.included)}
                className="w-5 h-5 accent-green-500"
              />
              <div>
                <Badge variant="error">CRITICAL</Badge>
                <p className="font-mono font-bold mt-1">{b.orderId}</p>
              </div>
            </div>

            {/* Customer + Days Left */}
            <div className="min-w-[160px]">
              <p className="text-sm text-text-light">Customer</p>
              <p className="font-medium">{b.customer}</p>
              <p className="text-xs text-amber-400">{b.daysLeft}d left</p>
            </div>

            {/* Product */}
            <div className="min-w-[140px]">
              <p className="text-sm text-text-light">Product</p>
              <p className="font-medium">{b.product} {b.grade}</p>
            </div>

            {/* Quantity Slider + Input */}
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={b.qty}
                  onChange={(e) => updateBatch(b.id, "qty", Number(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <InputField
                  type="number"
                  value={b.qty}
                  onChange={(e) => updateBatch(b.id, "qty", Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm font-medium">MT</span>
              </div>
            </div>

            {/* Yield & Margin */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-light">Yield</p>
                <p className="font-semibold text-emerald-400">{b.yieldPct}%</p>
              </div>
              <div>
                <p className="text-text-light">Margin</p>
                <p className="font-semibold">₹{(b.margin / 1000).toFixed(0)}K</p>
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1 min-w-[200px]">
              <InputField
                placeholder="Add notes..."
                value={b.notes}
                onChange={(e) => updateBatch(b.id, "notes", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
};

const Warnings = ({ data }) => (
  <>
    {data?.alerts?.length > 0 && (
      <Card variant="secondary">
        {data.alerts.map((alert, i) => (
          <div key={i} className="text-yellow-400 flex items-center gap-2">
            ⚠ {alert.title} — {alert.message}
          </div>
        ))}
      </Card>
    )}
  </>
);

export default DaliyProductionPlan;