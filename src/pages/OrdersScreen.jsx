import React, { useEffect, useMemo, useRef, useState } from 'react'

import Layout from '../components/Layout';
import styled from 'styled-components';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import DataTable, { Td } from '../components/Datatable';
import Badge from '../components/Badge';
import { Badge as Badge2 } from '../components/EmptyState';
import Button from '../components/Button';
import InputField from '../components/InputField';
import ConfirmPopup from '../components/ConfirmPopup';
import OrderFormModal from '../components/Modal/Orderformmodal';

import { FaCheckCircle, FaEye, FaMoneyBillWave, FaPen, FaPlus, FaSyncAlt, FaRobot } from 'react-icons/fa'
import { BsBoxSeamFill, BsGraphUpArrow } from 'react-icons/bs'
import { usePagination } from '../hooks/usePagination'
import { useCreateOrder, useCustomers, useGrades, useOrders, useOrdersByDestination, useProduct, useSpecies, useUpdateOrder, useProcessOrderSchedule, useOrderSchedule, useOrderSchedules } from '../hooks/useProductQueries';
import { buildScheduleDataPayload } from '../services/productServices';
import PaginationComponent from '../components/Pagination';
import { useFormHandler } from '../hooks/useFormHandler';
import { toast } from 'react-toastify';
import OrderDeatilsViewModal from '../components/Modal/OrderDeatilsViewModal';
import { useFilter } from '../hooks/useFilter';
import { MdFilterAltOff } from 'react-icons/md';
import { formatNumber } from '../utils';
import { isToday } from 'date-fns';
import OrdersCharts from './Orders Module/Orderscharts ';
import {
  EMPTY_FORM, buildOrderUpdatePatch, canShowEditForOrder, getBadgeVariant, getSpeciesGradeLabel, orderColumns, orderStatus, orderToForm, resolveOrderRecordId,
} from './Orders Module/Orderhelpers';
// getMarginByBaseUnit , convertQuantityToMT,toMt
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`
const SubtitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
`;

const OrdersScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState(null);
  const editBaselineRef = useRef(null);
  // Snapshot of the form taken right before order-create is fired, so the
  // schedule call below always sees the values the user actually submitted —
  // even if handleCloseModal's resetForm() runs before onSuccess fires.
  const pendingScheduleFormRef = useRef(null);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const isEditMode = editingOrderId != null;

  const [filters, setFilters] = useState({ search: "", priority: "ALL", status: "ALL", product: "ALL", grade: "ALL" });

  const { data: customerList = [] } = useCustomers({ is_supplier: "N" }, isModalOpen);
  const { data: productList = [] } = useProduct();
  const { data: gradeList = [] } = useGrades();
  const { data: SpeciesList = [] } = useSpecies();
  const { data: orderList = [], isLoading: ordersLoading } = useOrders();
  const orderScheduleQueries = useOrderSchedules(orderList);
  const { data: ordersByDestinationList = [] } = useOrdersByDestination();
  const { form, setForm, handleChange, resetForm } = useFormHandler(EMPTY_FORM);

  const processOrderScheduleMutation = useProcessOrderSchedule();
  const {
    data: orderSchedule,
    isLoading: orderScheduleLoading,
  } = useOrderSchedule(editingOrderNumber, !!editingOrderNumber);

  const handleOrderCreated = (orderData) => {
    setFilters(prev => ({
      ...prev,
      search: orderData.customer_name,
    }));

    const recurringForm = pendingScheduleFormRef.current;
    pendingScheduleFormRef.current = null;

    if (recurringForm) {
      processOrderScheduleMutation.mutate(
        buildScheduleDataPayload(recurringForm, {
          callMode: 'ADD',
          orderNumber: orderData.erp_order_reference || recurringForm.erp_order_reference,
        }),
        {
          onSuccess: () => toast.success("Recurring schedule set up for this order."),
        }
      );
    }
  };
  const recurringOrders = useMemo(() => {
    const map = {};

    orderList.forEach((order, index) => {
      const schedules = orderScheduleQueries[index]?.data;

      if (!Array.isArray(schedules)) return;

      const activeSchedule = schedules.find(
        (schedule) =>
          schedule.status === "A" &&
          schedule.auto_generate === true &&
          schedule.code === order.erp_order_reference
      );

      if (activeSchedule) {
        map[order.erp_order_reference] = activeSchedule;
      }
    });

    return map;
  }, [orderList, orderScheduleQueries]);

  const handleCustomerNameChange = (e) => {
    const customerId = Number(e.target.value);
    const customer = customerList.find(c => c.id === customerId);

    setForm(prev => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.name || "",
      destination_country: customer?.country || "",
    }));
  };

  const handleRecurringToggle = (e) => {
    const checked = e.target.checked;
    setForm(prev => ({
      ...prev,
      is_recurring: checked,
      recurring_frequency: checked ? (prev.recurring_frequency || "MONTHLY") : prev.recurring_frequency,
      recurring_end_date: checked ? prev.recurring_end_date : "",
      recurring_next_run_date: checked ? prev.recurring_next_run_date : "", // NEW
    }));
  };

  const handleAddOrder = () => {
    const { customer_id, recurring_schedule_id, ...rest } = form;

    const baseUnit = selectedProductBaseUnit?.toUpperCase();

    const quantity = Number(form.quantity_mt || 0);
    const sellingPrice = Number(form.selling_price_per_mt || 0);

    const payload = {
      ...rest,
      customer_name:
        customerList.find(c => c.id === Number(customer_id))?.name || "",

      // Send quantity in the product's base unit
      quantity_mt: Number(form.quantity_mt || 0),

      // NEW: Send converted quantity in Metric Tonnes
      // quantity_in_mt: Number(
      //   convertQuantityToMT(
      //     form.quantity_mt,
      //     selectedProductBaseUnit,
      //     // selectedProductWeightKg
      //   ) || 0
      // ),
      // Send price in the product's base unit
      selling_price_per_mt: Number(form.selling_price_per_mt || 0),

      cold_chain_buffer_days: Number(form.cold_chain_buffer_days || 0),
      product: Number(form.product),
      is_recurring: Boolean(form.is_recurring),
    };


    delete payload.customer_id;

    pendingScheduleFormRef.current = form.is_recurring ? form : null;
    createOrderMutation.mutate(payload);
  };

  const handleUpdateOrder = async () => {
    if (editingOrderId == null) return;

    const baseline = editBaselineRef.current;
    const patch = buildOrderUpdatePatch(form, baseline);

    if (patch.quantity_mt !== undefined) {
      patch.quantity_mt = Number(form.quantity_mt || 0);
    }

    if (patch.selling_price_per_mt !== undefined) {
      patch.selling_price_per_mt =
        Number(form.selling_price_per_mt || 0);
    }

    const wasRecurring = Boolean(baseline?.is_recurring);
    const isRecurringNow = Boolean(form.is_recurring);
    const scheduleId = baseline?.recurring_schedule_id;

    const hasRecurringChange =
      (!wasRecurring && isRecurringNow) ||
      (wasRecurring && !isRecurringNow) ||
      (
        wasRecurring &&
        isRecurringNow &&
        scheduleId &&
        (
          form.recurring_schedule_name !== baseline.recurring_schedule_name ||
          form.recurring_frequency !== baseline.recurring_frequency ||
          form.recurring_end_date !== baseline.recurring_end_date ||
          form.recurring_next_run_date !== baseline.recurring_next_run_date
        )
      );

    try {
      // -----------------------------
      // RECURRING SCHEDULE UPDATE
      // -----------------------------

      if (!wasRecurring && isRecurringNow) {
        const schedulePayload = buildScheduleDataPayload(form, {
          callMode: 'ADD',
          orderNumber: form.erp_order_reference,
        });

        await processOrderScheduleMutation.mutateAsync(schedulePayload);

      } else if (wasRecurring && !isRecurringNow && scheduleId) {
        const schedulePayload = buildScheduleDataPayload(form, {
          callMode: 'CANCEL',
          scheduleId,
        });

        await processOrderScheduleMutation.mutateAsync(schedulePayload);

      } else if (wasRecurring && isRecurringNow && scheduleId && hasRecurringChange) {
        const schedulePayload = buildScheduleDataPayload(form, {
          callMode: 'UPDATE',
          scheduleId,
          orderNumber: form.erp_order_reference,
        });

        await processOrderScheduleMutation.mutateAsync(schedulePayload);
      }

      // -----------------------------
      // NORMAL ORDER UPDATE
      // -----------------------------

      if (Object.keys(patch).length > 0) {
        await updateOrderMutation.mutateAsync({
          id: editingOrderId,
          data: patch,
        });
      }

      // Nothing changed at all
      if (Object.keys(patch).length === 0 && !hasRecurringChange) {
        toast.info("No changes to save.");
        setIsConfirmOpen(false);
        return;
      }

      // -----------------------------
      // SUCCESS
      // -----------------------------

      toast.success("Order updated successfully.");

      setIsConfirmOpen(false);
      handleCloseModal();

    } catch (error) {
      console.error("Failed to update order:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to save changes.";

      toast.error(message);
    }
  };

  const handleConfirmSave = () => {
    if (editingOrderId != null) {
      handleUpdateOrder();
    } else {
      handleAddOrder();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    editBaselineRef.current = null;
    setEditingOrderNumber(null);
    resetForm();
    setEditingOrderId(null);
  };

  const createOrderMutation = useCreateOrder(handleCloseModal, handleOrderCreated);
  const updateOrderMutation = useUpdateOrder(handleCloseModal);

  const openAddOrderModal = () => {
    editBaselineRef.current = null;
    setEditingOrderId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditOrderModal = (order) => {
    const initial = orderToForm(order);
    const unit = productList.find(p => p.id === Number(initial.product))?.base_unit || "MT";
    initial.quantity_mt = order.quantity_mt ?? "";
    editBaselineRef.current = { ...initial };

    setEditingOrderId(resolveOrderRecordId(order) ?? null);
    setEditingOrderNumber(order.erp_order_reference);

    setForm(initial);
    setIsModalOpen(true);
  };

  const totalDemand = orderList.reduce((sum, order) => {
    const productId = Number(order.product?.id ?? order.product);

    const baseUnit =
      productList.find((product) => Number(product.id) === productId)
        ?.base_unit || "MT";

    // return sum + toMt(order.quantity_mt, baseUnit);
    return sum + Number(order.quantity_mt || 0);
  }, 0);
  const totalRevenue = orderList.reduce((sum, order) => {
    const qty = Number(order.quantity_mt || 0);
    const price = Number(order.selling_price_per_mt || 0);

    return sum + qty * price;
  }, 0);
  const revenueDisplay = `₹${formatNumber(totalRevenue.toFixed(2))}`;

  const gradesOptions = gradeList.map((gradeItem) => {
    const foundSpecies = SpeciesList.find((species) => species.id === gradeItem.species_config);
    return foundSpecies ? { id: gradeItem.id, value: gradeItem.id, label: `${foundSpecies.scientific_name} (${gradeItem.grade_code})`, } : null;
  }).filter(Boolean);

  const selectedProductBaseUnit = productList.find((product) => product.id === Number(form.product))?.base_unit || "MT";

  const updatedOrderList = orderList?.map((item) => {
    let order_status = "NOT_STARTED";

    if (item.fulfillment_pct >= 100 || item.remaining_qty_mt === 0) {
      order_status = "COMPLETED";
    }
    else if (item.fulfilled_qty_mt > 0 && item.remaining_qty_mt > 0) {
      order_status = "PARTIAL";
    }

    return {
      ...item,
      order_status,
    };
  });
  const completedOrders = updatedOrderList.filter((order) => order.order_status === "COMPLETED")

  const metrics = [
    { label: "ACTIVE ORDERS", value: orderList.length, color: "primary", icon: <BsBoxSeamFill /> },
    { label: "TOTAL DEMAND", value: `${totalDemand.toFixed(2)} MT`, color: "warning", icon: <BsGraphUpArrow /> },
    { label: "ORDER COMPLETED", value: completedOrders.length, color: "info", icon: <FaCheckCircle /> },
    { label: "REVENUE PIPELINE", value: revenueDisplay, color: "success", icon: <FaMoneyBillWave /> },
  ]
  const sortedOrders = useMemo(() => {
    return [...updatedOrderList].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [updatedOrderList]);
  const orderFilteredData = useFilter({
    data: sortedOrders, fields: ["erp_order_reference", "customer_name", "product_name", "destination_country"],
    search: filters.search,
    extraFilters: {
      priority_override: filters.priority,
      product: filters.product === "ALL" ? "ALL" : filters.product,
      grade_config: filters.grade === "ALL" ? "ALL" : filters.grade,
      order_status: filters.status,
    },
  });
  useEffect(() => {
    if (!editingOrderNumber || !Array.isArray(orderSchedule)) {
      return;
    }

    const schedule = orderSchedule.find(
      (item) => item.status === "A" && item.auto_generate === true
    );

    if (!schedule) {
      return;
    }

    const frequencyMap = {
      M: "MONTHLY",
      Q: "QUARTERLY",
      H: "HALF_YEARLY",
      Y: "YEARLY",
    };

    const toInputDate = (date) => {
      if (!date) return "";

      const [day, month, year] = date.split("-");
      return `${year}-${month}-${day}`;
    };

    const updatedScheduleFields = {
      is_recurring: schedule.auto_generate ?? false,

      // Schedule identifier required for updates
      recurring_schedule_id: schedule.id,

      recurring_schedule_name: schedule.name || "",

      // F = Fixed, V = Variable
      recurring_amount_type: schedule.amount_type || "F",

      // Convert API frequency codes to UI values
      recurring_frequency:
        frequencyMap[schedule.frequency] || "MONTHLY",

      // Schedule dates
      recurring_start_date: toInputDate(schedule.start_date),
      recurring_end_date: toInputDate(schedule.end_date),
      recurring_next_run_date: toInputDate(schedule.next_run_date),

      // Optional fields from the GET response
      recurring_amount: schedule.amount ?? "",
      branch_id: schedule.branch_id ?? "",
      recurring_status: schedule.status ?? "A",
      recurring_last_run_date: toInputDate(schedule.last_run_date),
      recurring_code: schedule.code ?? "",
    };

    setForm((prev) => ({
      ...prev,
      ...updatedScheduleFields,
    }));

    // Preserve schedule fields for the update handler
    editBaselineRef.current = {
      ...(editBaselineRef.current || {}),
      ...updatedScheduleFields,
    };
  }, [editingOrderNumber, orderSchedule]);
  const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(orderFilteredData, 10)

  const shouldHighlightFirstRow = paginatedData.length > 0 && isToday(paginatedData[0].created_at);

  return (
    <Layout title="Order Management">
      <SubtitleSection>
        <div>
          <Subtitle>Manage customer orders, shipment schedules, margins, and priorities.</Subtitle>
        </div>
        <div>
          <Button onClick={openAddOrderModal}><FaPlus />Add New Orders</Button>
        </div>
      </SubtitleSection>

      <StatsGrid>
        {metrics.map((m, idx) => (
          <StatsCard key={idx} icon={m.icon} label={m.label} value={m.value} color={m.color} />
        ))}
      </StatsGrid>

      <Card style={{ marginTop: "1.5rem" }} title="Order List" headerAction={<Button onClick={() => setFilters({ search: "", priority: "ALL", product: "ALL", grade: "ALL", status: "ALL" })}> <MdFilterAltOff />Clear</Button>}>
        <div className='grid grid-cols-6 gap-3 items-end mb-4'>
          <div className='col-span-2 md:col-span-2'>
            <InputField
              label=""
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, }))}
              placeholder='Search by order ref, customer, product... '
            />
          </div>

          <div className='col-span-1'>
            <InputField
              label="Priority"
              type="select"
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              options={[
                { label: "All", value: "ALL" },
                { label: "Critical", value: "CRITICAL" },
                { label: "Urgent", value: "URGENT" },
                { label: "Standard", value: "STANDARD" },
                { label: "Overdue", value: "OVERDUE" },
              ]}
            />
          </div>
          <div className='col-span-1'>
            <InputField
              label="Order Status"
              type="select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { label: "All", value: "ALL" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Partial Complete", value: "PARTIAL" },
                { label: "Not Started", value: "NOT_STARTED" },
              ]}
            />
          </div>

          <div className='col-span-1'>
            <InputField
              label="Product"
              type="select"
              value={filters.product}
              onChange={(e) => setFilters((prev) => ({ ...prev, product: e.target.value }))}
              options={[{ label: "All", value: "ALL" }, ...productList.map(item => ({ id: item.id, value: item.id, label: item.product_name }))]}
            />
          </div>
          <div className='col-span-1'>
            <InputField
              label="Grade"
              type="select"
              value={filters.grade}
              onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value, }))}
              options={[{ label: "All", value: "ALL" }, ...gradesOptions]}
            />
          </div>
        </div>
        <DataTable
          columns={orderColumns}
          data={paginatedData}
          highlightFirstRow={shouldHighlightFirstRow}
          isLoading={ordersLoading}
          emptyMessage="No orders found"
          renderRow={(order, index) => {
            const order_status = orderStatus(order.order_status)
            const shouldHighlightFirstRow = order && isToday(order.created_at);
            return (
              <>
                <Td>{order.customer_name}
                  {(index === 0 && shouldHighlightFirstRow) && (
                    <span
                      style={{
                        marginLeft: "6px",
                        padding: "2px 6px",
                        background: "#3B82F6",
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "10px"
                      }}
                    >
                      NEW
                    </span>
                  )}
                  {order.is_system_generated ? (
                    <span
                      title="Auto-generated order"
                      style={{
                        marginLeft: 6,
                        display: "inline-flex",
                        verticalAlign: "middle"
                      }}
                    >
                      <FaRobot size={12} color="#8B5CF6" />
                    </span>
                  ) : recurringOrders[order.erp_order_reference] ? (
                    <span
                      title={`Recurring order${recurringOrders[order.erp_order_reference]?.frequency
                        ? ` (${recurringOrders[order.erp_order_reference].frequency})`
                        : ""
                        }`}
                      style={{
                        marginLeft: 6,
                        display: "inline-flex",
                        verticalAlign: "middle"
                      }}
                    >
                      <FaSyncAlt size={11} color="#3B82F6" />
                    </span>
                  ) : null}
                  <br />
                  <Badge2 label={order.erp_order_reference} variant='grn' /></Td>
                <Td>{order.product_name}</Td>
                <Td>{getSpeciesGradeLabel(SpeciesList, gradeList, order.grade_config)}</Td>
                <Td>
                  {Number(order.quantity_mt || 0).toLocaleString()}{" "}
                  ({productList.find(
                    (product) => Number(product.id) === Number(order.product?.id ?? order.product)
                  )?.base_unit || "MT"})
                </Td>
                <Td>
                  {formatNumber(
                    order.margin_per_mt,
                    productList.find(
                      p => Number(p.id) === Number(order.product?.id ?? order.product)
                    )?.base_unit
                  )}
                </Td>
                <Td>{order.delivery_date}</Td>
                <Td><Badge variant={order_status.variant}>{order_status.label}</Badge></Td>
                <Td className={`${order.days_until_delivery <= 7 ? "text-error" : order.days_until_delivery <= 10 ? 'text-warning' : 'text-success'} font-semibold`}>
                  {order.days_until_delivery}d
                </Td>
                <Td>
                  <Badge variant={getBadgeVariant(order.priority_override) || "primary"}>{order.priority_override || "--"}</Badge>
                </Td>
                <Td>
                  <div className='flex gap-3'>
                    <Button size='sm' iconOnly={true} title="View" variant='outline' onClick={() => { setSelectedOrder(order); setShowOrderDetails(true) }}><FaEye /></Button>

                    {canShowEditForOrder(order) && (
                      <Button type="button" iconOnly={true} size="sm" variant="secondary" title="Edit" onClick={() => openEditOrderModal(order)}>
                        <FaPen />
                      </Button>
                    )}
                  </div>
                </Td>
              </>
            )
          }}
        />
        <PaginationComponent
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          showPageSize={true}
        />

        {showOrderDetails && <OrderDeatilsViewModal isOpen={showOrderDetails} onClose={() => { setShowOrderDetails(false); setSelectedOrder(null) }} order={selectedOrder} />}

      </Card>

      <OrdersCharts
        orderList={orderList}
        productList={productList}
        ordersByDestinationList={ordersByDestinationList}
      />

      <OrderFormModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        form={form}
        handleChange={handleChange}
        handleCustomerNameChange={handleCustomerNameChange}
        handleRecurringToggle={handleRecurringToggle}
        onClose={handleCloseModal}
        onSave={() => setIsConfirmOpen(true)}
        customerList={customerList}
        productList={productList}
        gradesOptions={gradesOptions}
        selectedProductBaseUnit={selectedProductBaseUnit}
      // selectedProductWeightKg={selectedProductWeightKg}
      // convertQuantityToMT={convertQuantityToMT}
      />

      <ConfirmPopup
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={isEditMode ? "Confirm Order Update" : "Confirm Order Creation"}
        message={
          isEditMode
            ? "Are you sure you want to save changes to this order?"
            : (form.is_recurring
              ? "Are you sure you want to create this recurring order? Future orders will be generated automatically."
              : "Are you sure you want to create this order?")
        }
        confirmLabel={isEditMode ? "Yes, Save Changes" : "Yes, Create Order"}
        isLoading={createOrderMutation.isPending || updateOrderMutation.isPending}
      />
    </Layout>
  )
}

export default OrdersScreen