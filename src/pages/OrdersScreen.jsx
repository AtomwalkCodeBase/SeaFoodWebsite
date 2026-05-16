import React, { useRef, useState } from 'react'

import Layout from '../components/Layout';
import styled from 'styled-components';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import DataTable, { Td } from '../components/Datatable';
import Badge from '../components/Badge';
import Button from '../components/Button';
import InputField from '../components/InputField';
import Modal from '../components/Modal';
import ConfirmPopup from '../components/ConfirmPopup';

import { ORDERS_CUSTOMER_TIER, ORDERS_PRIORITY_OPTIONS } from '../constants'

import { FaIndustry, FaMoneyBillWave, FaPen, FaPlus } from 'react-icons/fa'
import { BsBoxSeam, BsBoxSeamFill, BsGraphUpArrow } from 'react-icons/bs'
import { usePagination } from '../hooks/usePagination'
import { Bar, BarChart, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SectionHeader } from '../components/EmptyState';
import { useCreateOrder, useCustomers, useGrades, useOrders, useOrdersByDestination, useProduct, useSpecies, useUpdateOrder } from '../hooks/useProductQueries';
import PaginationComponent from '../components/Pagination';
import { useFormHandler } from '../hooks/useFormHandler';
import { toast } from 'react-toastify';

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
const ScoreBarWrap = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
  height: 12px;
`
const ScoreFill = styled.div`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ color }) => color || "#1890ff"};
  transition: width 0.3s ease;
`
const variantMap = new Map([
  ["critical", "error"],
  ["urgent", "warning"],
  ["normal", "info"],
]);

function getBadgeVariant(status) {
  return variantMap.get(status.toLowerCase());
}

const statusToBadgeVariant = {
  "In Production": "success",
  Scheduled: "info",
  Confirmed: "primary",
  Dispatched: "secondary",
}

const orderColumns = ["ORDER ID", "CUSTOMER", "PRODUCT", "GRADE", "QTY (MT)", "SHIPMENT DATE", "DAYS LEFT", "PRIORITY", "ACTIONS"];

const MIN_DAYS_FOR_ORDER_EDIT = 10;

function normalizeDeliveryDateForInput(value) {
  if (value == null || value === "") return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** Map API order row into modal form fields */
function orderToForm(order) {
  return {
    erp_order_reference: order.erp_order_reference ?? "",
    erp_project_id: order.erp_project_id ?? "",
    product: Number(order.product?.id ?? order.product) || 0,
    grade_config: Number(order.grade_config) || 0,
    quantity_mt: order.quantity_mt ?? "",
    customer_name: order.customer_name ?? "",
    customer_tier: order.customer_tier ?? "",
    destination_country: order.destination_country ?? "",
    destination_port: order.destination_port ?? "",
    selling_price_per_mt: order.selling_price_per_mt ?? "",
    delivery_date: normalizeDeliveryDateForInput(order.delivery_date),
    cold_chain_buffer_days: order.cold_chain_buffer_days ?? "",
    priority_override: order.priority_override ?? "",
    notes: order.notes ?? "",
  };
}

function isOrderFormValid(form) {
  const refOk = String(form.erp_order_reference ?? "").trim() !== "";
  const customerOk = String(form.customer_name ?? "").trim() !== "";
  const tierOk = String(form.customer_tier ?? "").trim() !== "";
  const productOk = Number(form.product) > 0;
  const gradeOk = Number(form.grade_config) > 0;
  const qtyRaw = form.quantity_mt;
  const qtyOk = qtyRaw !== "" && qtyRaw != null && !Number.isNaN(Number(qtyRaw)) && Number(qtyRaw) > 0;
  const countryOk = String(form.destination_country ?? "").trim() !== "";
  const priceRaw = form.selling_price_per_mt;
  const priceOk = priceRaw !== "" && priceRaw != null && !Number.isNaN(Number(priceRaw)) && Number(priceRaw) >= 0;
  const dateOk = String(form.delivery_date ?? "").trim() !== "";
  return refOk && customerOk && tierOk && productOk && gradeOk && qtyOk && countryOk && priceOk && dateOk;
}

function resolveOrderRecordId(order) {
  return order?.id ?? order?.pk ?? order?.order_id;
}

/** Fields allowed on PATCH; erp_order_reference / customer_name excluded (read-only in edit UI). */
const ORDER_UPDATE_PATCH_KEYS = [
  "erp_project_id",
  "product",
  "grade_config",
  "quantity_mt",
  "customer_tier",
  "destination_country",
  "destination_port",
  "selling_price_per_mt",
  "delivery_date",
  "cold_chain_buffer_days",
  "priority_override",
  "notes",
];

function normalizeForOrderPatchCompare(key, value) {
  if (key === "delivery_date") return normalizeDeliveryDateForInput(value);
  if (
    key === "product" ||
    key === "grade_config" ||
    key === "quantity_mt" ||
    key === "selling_price_per_mt" ||
    key === "cold_chain_buffer_days"
  ) {
    const n = Number(value === "" || value == null ? 0 : value);
    return Number.isNaN(n) ? 0 : n;
  }
  return String(value ?? "").trim();
}

function serializeOrderPatchField(key, form) {
  switch (key) {
    case "erp_project_id":
      return form.erp_project_id || undefined;
    case "product":
    case "grade_config":
      return Number(form[key]);
    case "quantity_mt":
    case "selling_price_per_mt":
    case "cold_chain_buffer_days":
      return Number(form[key] || 0);
    case "delivery_date": {
      const d = normalizeDeliveryDateForInput(form.delivery_date);
      return d || undefined;
    }
    default:
      return form[key] ?? "";
  }
}

/** Partial body for PATCH: only keys that differ from the snapshot taken when edit opened. */
function buildOrderUpdatePatch(form, baseline) {
  if (!baseline) return {};
  const patch = {};
  for (const key of ORDER_UPDATE_PATCH_KEYS) {
    if (
      normalizeForOrderPatchCompare(key, form[key]) !==
      normalizeForOrderPatchCompare(key, baseline[key])
    ) {
      patch[key] = serializeOrderPatchField(key, form);
    }
  }
  return patch;
}

const DEMAND_BY_DESTINATION_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const DEMAND_BY_PRODUCT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff6b6b', '#4ecdc4', '#45b7d1'];

const EMPTY_FORM = {
  erp_order_reference: "",
  erp_project_id: "",
  product: 0,
  grade_config: 0,
  quantity_mt: "",
  customer_name: "",
  customer_tier: "",
  destination_country: "",
  destination_port: "",
  selling_price_per_mt: "",
  delivery_date: "",
  cold_chain_buffer_days: "",
  priority_override: "",
  notes: ""
};

const OrdersScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const editBaselineRef = useRef(null);

  const isEditMode = editingOrderId != null;

  const { data: customerList = [], isLoading: customersLoading } = useCustomers(isModalOpen);
  const { data: productList = [], isLoading: productsLoading } = useProduct(isModalOpen);
  const { data: gradeList = [], isLoading: gradesLoading } = useGrades();
  const { data: SpeciesList = [], isLoading: speciesLoading } = useSpecies();
  const { data: orderList = [], isLoading: ordersLoading } = useOrders();
  const { data: ordersByDestinationList = [], isLoading: ordersByDestinationLoading } = useOrdersByDestination();

  // const handleInputChange = (e) => {
  //   const { name, value, type } = e.target;
  //   if (
  //     isEditMode &&
  //     (name === "erp_order_reference" || name === "customer_name")
  //   ) {
  //     return;
  //   }
  //   setForm((prev) => ({
  //     ...prev,
  //     [name]: type === 'number' ? Number(value) || 0 : value,
  //   }));
  // };

  const  { form, setForm, handleChange, resetForm }  = useFormHandler(EMPTY_FORM);

  const handleAddOrder = () => {
    // console.log(form)
    const payload = {
      ...form,

      quantity_mt: Number(form.quantity_mt || 0),
      selling_price_per_mt: Number(form.selling_price_per_mt || 0),
      cold_chain_buffer_days: Number(form.cold_chain_buffer_days || 0),

      product: Number(form.product),
    };

    // console.log("Creating Order Payload:", payload);

    createOrderMutation.mutate(payload);
  };

  const handleUpdateOrder = () => {
    if (editingOrderId == null) return;
    const baseline = editBaselineRef.current;
    const patch = buildOrderUpdatePatch(form, baseline);

    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save.");
      setIsConfirmOpen(false);
      return;
    }

    updateOrderMutation.mutate({ id: editingOrderId, data: patch });
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
    resetForm();
    setEditingOrderId(null);
  };

  const createOrderMutation = useCreateOrder(handleCloseModal);
  const updateOrderMutation = useUpdateOrder(handleCloseModal);

  const openAddOrderModal = () => {
    editBaselineRef.current = null;
    setEditingOrderId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditOrderModal = (order) => {
    const initial = orderToForm(order);
    editBaselineRef.current = { ...initial };
    setEditingOrderId(resolveOrderRecordId(order) ?? null);
    setForm(initial);
    setIsModalOpen(true);
  };

  const saveDisabled = !isOrderFormValid(form);

  const totalDemand = orderList.reduce((sum, order) => sum + parseFloat(order.quantity_mt || 0), 0);

  const aggregateData = () => {
    const map = new Map();
    orderList.forEach(item => {
      const name = item.product_name;
      const qty = parseFloat(item.quantity_mt) || 0;
      map.set(name, (map.get(name) || 0) + qty);
    });

    return Array.from(map.entries()).map(([product_name, total_mt]) => ({ product_name, total_mt })).sort((a, b) => b.total_mt - a.total_mt);
  };

  const data = aggregateData();

  const gradesOptions = gradeList.map((gradeItem) => {
    const foundSpecies = SpeciesList.find((species) => species.id === gradeItem.species_config);
    return foundSpecies ? { id: foundSpecies.id, value: foundSpecies.id, label: `${foundSpecies.scientific_name} (${gradeItem.grade_code})`,} : null;
  }).filter(Boolean);

  const getSpeciesGradeLabel = ( speciesList, gradeList, speciesConfigId) => {
    const foundGrade = gradeList.find((grade) => grade.id === speciesConfigId);
      if (!foundGrade) return "--";

      const foundSpecies = speciesList.find((species) => species.id === foundGrade.species_config);
      if (!foundSpecies) return "--";

      return `${foundSpecies.scientific_name} (${foundGrade.grade_code})`;
  };

  const metrics = [
    { label: "ACTIVE ORDERS", value: orderList.length, color: "primary", icon: <BsBoxSeamFill /> },
    { label: "TOTAL DEMAND", value: `${totalDemand.toFixed(2)} MT`, color: "success", icon: <BsGraphUpArrow /> },
    { label: "RM REQUIRED", value: "34.78 MT", color: "warning", icon: <FaIndustry /> },
    { label: "Revenue Pipeline", value: "₹1,97,66,000", color: "info", icon: <FaMoneyBillWave /> },
  ]

  const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(orderList, 10)

  const canShowEditForOrder = (order) =>
    Number(order?.days_until_delivery) >= MIN_DAYS_FOR_ORDER_EDIT;

  return (
    <Layout title="Order Management">
      <StatsGrid>
        {metrics.map((m, idx) => (
          <StatsCard key={idx} icon={m.icon} label={m.label} value={m.value} color={m.color} />
        ))}
      </StatsGrid>

      <Card style={{ marginTop: "1.5rem" }}>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-text text-xl font-bold'>Order List</span>
          <Button size='sm' onClick={openAddOrderModal}><FaPlus />Add New Orders</Button>
        </div>
        <DataTable
          columns={orderColumns}
          data={paginatedData}
          isLoading={ordersLoading}
          emptyMessage="No orders found"
          renderRow={(order) => (
            <>
              <Td>{order.erp_order_reference}</Td>
              <Td>{order.customer_name}</Td>
              <Td>{order.product_name}</Td>
              <Td>{getSpeciesGradeLabel(SpeciesList, gradeList, order.grade_config)}</Td>
              <Td>{order.quantity_mt}</Td>
              <Td>{order.delivery_date}</Td>
              {/* <Td>{order.days_until_delivery}d</Td> */}
              {/* <Td>{calculateDaysLeft(order.delivery_date)}</Td> */}
            {/* <Td className={`${order.days_until_delivery <= 7 ? "text-error" : order.days_until_delivery <= 10 ? 'text-warning' : 'text-success'} font-semibold`}> */}
            <Td className={`text-success font-semibold`}>
              {order.days_until_delivery}d
            </Td>
              {/* <Td>
                {order?.score ?
                  <>
                    <ScoreBarWrap>
                      <ScoreFill
                        percent={order.score}
                        color={order.score >= 90 ? "#52c41a" : order.score >= 75 ? "#faad14" : "#ff4d4f"}
                      />
                    </ScoreBarWrap>
                    <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>{order.score}</div>
                  </> : "--"
                }
              </Td> */}
              <Td>
                <Badge variant={getBadgeVariant(order.priority_override) || "primary"}>{order.priority_override || "--"}</Badge>
              </Td>
              <Td>
                {canShowEditForOrder(order) ? (
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEditOrderModal(order)}>
                    <FaPen /> Edit
                  </Button>
                ) : (
                  <span className="text-text-light text-xs">—</span>
                )}
              </Td>
              {/* <Td>
                <Badge variant={statusToBadgeVariant[order.status] || "primary"}>{order.status || "--"}</Badge>
              </Td> */}
            </>
          )}
        />
        <PaginationComponent
          totalItems = {totalItems}
          itemsPerPage = {itemsPerPage}
          currentPage = {currentPage}
          onPageChange ={handlePageChange}
          showPageSize = {true}
        />

      </Card>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <Card>
    <SectionHeader title="Demand by destination" icon="🌍" />
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={ordersByDestinationList}
          dataKey="total_mt"
          nameKey="destination_country"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => `${entry.destination_country}: ${entry.total_mt} MT`}
          fontSize={11}
        >
          {ordersByDestinationList.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={DEMAND_BY_DESTINATION_COLORS[index % DEMAND_BY_DESTINATION_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value} MT`} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  </Card>

  <Card>
    <SectionHeader title="Demand by product" icon="📦" />
    <ResponsiveContainer width="100%" height={280}>
      <BarChart layout="vertical" data={data}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="product_name" width={90} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => [`${value} MT`, 'Total in mt']} />
        <Bar dataKey="total_mt" barSize={20}>
          <LabelList 
            dataKey="total_mt" 
            position="right" 
            formatter={(value) => `${value} MT`} 
            style={{ fill: '#333', fontSize: 10, fontWeight: 'bold' }}
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={DEMAND_BY_PRODUCT_COLORS[index % DEMAND_BY_PRODUCT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </Card>
</div>
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={() => setIsConfirmOpen(true)}
          title={isEditMode ? "Edit Order" : "Add New Order"}
          width="max-w-2xl"
          maxHeight="max-h-[75vh]"
          showSaveButton={true}
          saveButtonText={isEditMode ? "Edit" : "Add Order"}
          cancelButtonText="Cancel"
          // saveDisabled={saveDisabled}
        >
          <div className="space-y-6">
            <Section title="Order Details">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <InputField
                    label="Invoice Number"
                    name="erp_order_reference"
                    type="text"
                    value={form.erp_order_reference}
                    onChange={handleChange}
                    required={true}
                    disabled={isEditMode}
                  />
                </div>

                <InputField
                  label="Customer Name"
                  name="customer_name"
                  type="select"
                  value={form.customer_name}
                  onChange={handleChange}
                  options={customerList.map((c) => ({ value: c.name, label: c.name }))}
                  required={true}
                  disabled={isEditMode}
                />

                <InputField
                  label="Customer Tier"
                  name="customer_tier"
                  type="select"
                  value={form.customer_tier}
                  onChange={handleChange}
                  options={ORDERS_CUSTOMER_TIER.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  required ={true}
                />

                <InputField
                  label="Product"
                  name="product"
                  type="select"
                  value={form.product}
                  onChange={handleChange}
                  options={productList.map(item => ({ id: item.id, value: item.id, label: item.product_name }))}
                  required={true}
                />

                <InputField
                  label="Grade"
                  name="grade_config"
                  type="select"
                  value={form.grade_config}
                  onChange={handleChange}
                  options={gradesOptions}
                  required={true}
                />

                <InputField
                  label="Quantity (per MT)"
                  name="quantity_mt"
                  type="number"
                  value={form.quantity_mt}
                  onChange={handleChange}
                  required={true}
                />
              </div>
            </Section>

            <Section title="Destination">
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Country"
                  name="destination_country"
                  type="text"
                  value={form.destination_country}
                  onChange={handleChange}
                  required={true}
                />

                <InputField
                  label="Destination Port"
                  name="destination_port"
                  type="text"
                  value={form.destination_port}
                  onChange={handleChange}
                />
              </div>
            </Section>

            <Section title="Pricing & Schedule">
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Selling Price (per MT)"
                  name="selling_price_per_mt"
                  type="number"
                  value={form.selling_price_per_mt}
                  onChange={handleChange}
                  required={true}
                />

                <InputField
                  label="Delivery Date"
                  name="delivery_date"
                  type="date"
                  value={form.delivery_date}
                  onChange={handleChange}
                  required={true}
                />

                <InputField
                  label="Cold Chain Buffer Days"
                  name="cold_chain_buffer_days"
                  type="number"
                  value={form.cold_chain_buffer_days}
                  onChange={handleChange}
                />

                <InputField
                  label="Priority"
                  name="priority_override"
                  type="select"
                  value={form.priority_override}
                  onChange={handleChange}
                  options={ORDERS_PRIORITY_OPTIONS.map(item => ({
                    id: item.id,
                    value: item.label,
                    label: item.label
                  }))}
                />
              </div>
            </Section>

          </div>
        </Modal>
      )}

      <ConfirmPopup
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={isEditMode ? "Confirm Order Update" : "Confirm Order Creation"}
        message={
          isEditMode
            ? "Are you sure you want to save changes to this order?"
            : "Are you sure you want to create this order?"
        }
        confirmLabel={isEditMode ? "Yes, Save Changes" : "Yes, Create Order"}
        isLoading={createOrderMutation.isPending || updateOrderMutation.isPending}
      />
    </Layout>
  )
}

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-md font-bold text-primary mb-3 uppercase tracking-wide">{title}</h3>
    <hr className="border-border mb-4" />
    {children}
  </div>
);

export default OrdersScreen