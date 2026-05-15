import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

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

import { AddNewOrder, getCustomerListView, getGrades, GetOrdersByDestinationList, GetOrdersList, getProductList, } from '../services/productServices';

import { ORDERS_CUSTOMER_TIER, ORDERS_PRIORITY_OPTIONS } from '../constants'

import { FaBoxOpen, FaExclamationTriangle, FaIndustry, FaListAlt, FaMoneyBillWave, FaPlus } from 'react-icons/fa'
import { BsBoxSeam, BsBoxSeamFill, BsGraphUpArrow } from 'react-icons/bs'
import { usePagination } from '../hooks/usePagination'
import { Bar, BarChart, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SectionHeader } from '../components/EmptyState';

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

const orderColumns = ['ORDER ID', 'CUSTOMER', 'PRODUCT', 'QTY (MT)', 'MARGIN (MT)','SHIPMENT DATE', 'DAYS LEFT', 'STATUS',  'SCORE', 'PRIORITY',];

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
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: customerList = [], isLoading: customersLoading, error: customersError, } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomerListView(),
    select: (res) => res.data,
    enabled: isModalOpen,
    onError: () => toast.error('Failed to load customer list'),
  });

  const { data: productList = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProductList(),
    select: (res) => res.data,
    enabled: isModalOpen,
    onError: () => toast.error('Failed to load product list'),
  });

  const { data: gradeList = [], isLoading: gradesLoading, error: gradesError } = useQuery({
    queryKey: ['grades'],
    queryFn: () => getGrades(),
    select: (res) => res.data,
    enabled: isModalOpen,
    onError: () => toast.error('Failed to load grades'),
  });

  const { data: orderList = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['orders'],
    queryFn: () => GetOrdersList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load orders'),
  });

  const { data: ordersByDestinationList = [], isLoading: ordersByDestinationLoading, error: ordersByDestinationError } = useQuery({
    queryKey: ['ordersByDestination'],
    queryFn: () => GetOrdersByDestinationList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load orders'),
  });

  const createOrderMutation = useMutation({
    mutationFn: AddNewOrder,
    onSuccess: async () => {
      toast.success('Order added successfully!');
      await queryClient.invalidateQueries({
        queryKey: ['orders']
      });
      handleCloseModal();
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create order';
      toast.error(message);
    },
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) || 0 : value,
    }));
  };

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setForm(EMPTY_FORM);
  };

  const totalDemand = orderList.reduce((sum, order) => sum + parseFloat(order.quantity_mt || 0), 0);

  const aggregateData = () => {
    const map = new Map();
    orderList.forEach(item => {
      const name = item.product_name;
      const qty = parseFloat(item.quantity_mt) || 0;
      map.set(name, (map.get(name) || 0) + qty);
    });

    return Array.from(map.entries())
      .map(([product_name, total_mt]) => ({ product_name, total_mt }))
      .sort((a, b) => b.total_mt - a.total_mt);
  };

  const data = aggregateData();

  const metrics = [
    { label: "ACTIVE ORDERS", value: orderList.length, color: "primary", icon: <BsBoxSeamFill /> },
    { label: "TOTAL DEMAND", value: `${totalDemand.toFixed(2)} MT`, color: "success", icon: <BsGraphUpArrow /> },
    { label: "RM REQUIRED", value: "34.78 MT", color: "warning", icon: <FaIndustry /> },
    { label: "Revenue Pipeline", value: "₹1,97,66,000", color: "info", icon: <FaMoneyBillWave /> },
  ]

  const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(orderList, 10)

  const isInitialLoading = ordersLoading || customersLoading || productsLoading || gradesLoading;

  return (
    <Layout title="Order Management">
      <StatsGrid>
        {metrics.map((m, idx) => (
          <StatsCard key={idx} icon={m.icon} label={m.label} value={m.value} color={m.color} />
        ))}
      </StatsGrid>

      <Card style={{ marginTop: "2rem" }}>
        <div className='flex justify-between items-center mb-4'>
          <span className='text-text text-xl font-bold'>Order Priority Queue</span>
          <Button onClick={() => setIsModalOpen(true)}><FaPlus />Add New Orders</Button>
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
              <Td>{order.quantity_mt}</Td>
              {/* <Td>{order.rmReq.toFixed(2)}</Td> */}
              {/* <Td>{order.total.toFixed(2)}</Td> */}
              <Td>{order.margin_per_mt}</Td>
              <Td>{order.delivery_date}</Td>
              {/* <Td>{calculateDaysLeft(order.delivery_date)}</Td> */}
            {/* <Td className={`${order.days_until_delivery <= 7 ? "text-error" : order.days_until_delivery <= 10 ? 'text-warning' : 'text-success'} font-semibold`}> */}
            <Td className={`text-success font-semibold`}>
              {order.days_until_delivery}d
            </Td>
              <Td>
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
              </Td>
              <Td>
                <Badge variant={getBadgeVariant(order.priority_override) || "primary"}>{order.priority_override || "--"}</Badge>
              </Td>
              <Td>
                <Badge variant={statusToBadgeVariant[order.status] || "primary"}>{order.status || "--"}</Badge>
              </Td>
            </>
          )}
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
          title="Add New Order"
          width="max-w-2xl"   // wider for grid
          maxHeight="max-h-[75vh]"
          showSaveButton={true}
          saveButtonText="Add Order"
          cancelButtonText="Cancel"
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
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <InputField
                  label="Customer Name"
                  name="customer_name"
                  type="select"
                  value={form.customer_name}
                  onChange={handleInputChange}
                  options={customerList.map((c) => ({ value: c.name, label: c.name }))}
                />

                <InputField
                  label="Customer Tier"
                  name="customer_tier"
                  type="select"
                  value={form.customer_tier}
                  onChange={handleInputChange}
                  options={ORDERS_CUSTOMER_TIER.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />

                <InputField
                  label="Product"
                  name="product"
                  type="select"
                  value={form.product}
                  onChange={handleInputChange}
                  options={productList.map(item => ({ id: item.id, value: item.id, label: item.product_name }))}
                />

                <InputField
                  label="Grade"
                  name="grade_config"
                  type="select"
                  value={form.grade_config}
                  onChange={handleInputChange}
                  options={gradeList.map(item => ({ id: item.id, value: item.id, label: `${item.label} (${item.grade_code})` }))}
                />

                <InputField
                  label="Quantity (per MT)"
                  name="quantity_mt"
                  type="number"
                  value={form.quantity_mt}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                />

                <InputField
                  label="Destination Port"
                  name="destination_port"
                  type="text"
                  value={form.destination_port}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                />

                <InputField
                  label="Delivery Date"
                  name="delivery_date"
                  type="date"
                  value={form.delivery_date}
                  onChange={handleInputChange}
                />

                <InputField
                  label="Cold Chain Buffer Days"
                  name="cold_chain_buffer_days"
                  type="number"
                  value={form.cold_chain_buffer_days}
                  onChange={handleInputChange}
                />

                <InputField
                  label="Priority"
                  name="priority_override"
                  type="select"
                  value={form.priority_override}
                  onChange={handleInputChange}
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

      <ConfirmPopup isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleAddOrder} title="Confirm Order Creation" message="Are you sure you want to create this order?" confirmLabel="Yes, Create Order" isLoading={createOrderMutation.isPending} />
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