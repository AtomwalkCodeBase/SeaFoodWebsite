import React, { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import styled from 'styled-components'
import StatsCard from '../components/StatsCard'
import { FaBoxOpen, FaExclamationTriangle, FaIndustry, FaListAlt, FaMoneyBillWave, FaPlus } from 'react-icons/fa'
import { BsBoxSeam, BsBoxSeamFill, BsGraphUpArrow } from 'react-icons/bs'
import Card from '../components/Card'
import { usePagination } from '../hooks/usePagination'
import DataTable, { Td } from '../components/Datatable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import InputField from '../components/InputField'

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
const priorityToBadgeVariant = {
  Critical: "error",
  Urgent: "warning",
  Normal: "info",
}
const statusToBadgeVariant = {
  "In Production": "success",
  Scheduled: "info",
  Confirmed: "primary",
  Dispatched: "secondary",
}

const metrics = [
  { label: "ACTIVE ORDERS", value: 6, color: "primary", icon: <BsBoxSeamFill /> },
  { label: "TOTAL DEMAND", value: "25 MT", color: "success", icon: <BsGraphUpArrow /> },
  { label: "RM REQUIRED", value: "34.78 MT", color: "warning", icon: <FaIndustry /> },
  { label: "Revenue Pipeline", value: "₹1,97,66,000", color: "info", icon: <FaMoneyBillWave /> },
]

const orderColumns = [
  "ORDER ID",
  "CUSTOMER",
  "PRODUCT",
  "QTY (MT)",
  "MARGIN (USD/MT)",
  "SHIPMENT DATE",
  "DAYS LEFT",
  "SCORE",
  "PRIORITY",
  "STATUS",
]
const ordersSeed = [
  {
    invoice_number: "ORD-001",
    customer: "SeaFood Japan KK",
    product_name: "Cooked-P-20/25ML",
    quantity: 4.5,
    rmReq: 7.49,
    total: 9.20,  
    margin: 1.71,    
    invoice_due_date: "25 Apr 2026",
    priority: "Critical",
    daysLeft: "8d",
    score: 92,
    status: "In Production",
  },
  {
    invoice_number: "ORD-002",
    customer: "Gulf Marine LLC",
    product_name: "Glazed-P-31/40S",
    quantity: 3.2,
    rmReq: 5.33,
    total: 7.80,
    margin: 2.47,
    invoice_due_date: "29 Apr 2026",
    priority: "Urgent",
    daysLeft: "12d",
    score: 85,
    status: "Scheduled",
  },
  {
    invoice_number: "ORD-003",
    customer: "marine food pvt ltd",
    product_name: "Cooked-20/25ML",
    quantity: 2.8,
    rmReq: 4.67,
    total: 6.90,
    margin: 2.23,
    invoice_due_date: "30 Apr 2026",
    priority: "Normal",
    daysLeft: "13d",
    score: 78,
    status: "Confirmed",
  },
  {
    invoice_number: "ORD-004",
    customer: "Nordic Ocean Traders",
    product_name: "Cooked-P-16/20L",
    quantity: 5.0,
    rmReq: 8.5,
    total: 10.10,
    margin: 1.60,
    invoice_due_date: "03 May 2026",
    priority: "Urgent",
    daysLeft: "16d",
    score: 88,
    status: "Dispatched",
  },
]

const EMPTY_FORM = {
  erp_order_reference: "",
  erp_project_id: "",
  product: 0,
  grade_config: 0,
  quantity_mt: 0,
  customer_name: "",
  customer_tier: "",
  destination_country: "",
  destination_port: "",
  selling_price_per_mt: 0,
  delivery_date: "",
  cold_chain_buffer_days: 0,
  priority_override: "",
  notes: ""
};

const customerOptions = [
  { id: 1, value: "1", label: "ABC Corporation" },
  { id: 2, value: "2", label: "XYZ Enterprises" },
  { id: 3, value: "3", label: "Global Trading Co" },
  { id: 4, value: "4", label: "Pacific Imports Ltd" },
  { id: 5, value: "5", label: "Atlantic Exports Inc" }
];

const tierOptions = [
  { id: 1, value: "platinum", label: "Platinum" },
  { id: 2, value: "gold", label: "Gold" },
  { id: 3, value: "silver", label: "Silver" },
  { id: 4, value: "bronze", label: "Bronze" },
  { id: 5, value: "standard", label: "Standard" }
];

const productOptions = [
  { id: 1, value: "1", label: "Premium Coffee Beans" },
  { id: 2, value: "2", label: "Organic Green Tea" },
  { id: 3, value: "3", label: "Raw Cocoa Beans" },
  { id: 4, value: "4", label: "Spices Mix" },
  { id: 5, value: "5", label: "Dried Fruits" }
];

const gradeOptions = [
  { id: 1, value: "grade_a", label: "Grade A - Premium" },
  { id: 2, value: "grade_b", label: "Grade B - Standard" },
  { id: 3, value: "grade_c", label: "Grade C - Economy" },
  { id: 4, value: "grade_d", label: "Grade D - Industrial" },
  { id: 5, value: "grade_e", label: "Grade E - Reject" }
];

const priorityOptions = [
  { id: 1, value: "low", label: "Low Priority" },
  { id: 2, value: "normal", label: "Normal Priority" },
  { id: 3, value: "high", label: "High Priority" },
  { id: 4, value: "urgent", label: "Urgent Priority" },
  { id: 5, value: "critical", label: "Critical Priority" }
];

const OrdersScreen = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(ordersSeed, 10)

  const calculateDaysLeft = (dueDate) => {
      const today = new Date()
      const ship = new Date(dueDate)   // parse the invoice_due_date
      const diffTime = ship - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? `${diffDays}d` : "0d"
    }  

      const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : type === "number" ? +value : value }));
  };

  return (
    <Layout title="Order Management">
      <StatsGrid>
            {metrics.map((m, idx) => (
              <StatsCard
                key={idx}
                icon={m.icon}
                label={m.label}
                value={m.value}
                color={m.color}
              />
            ))}
          </StatsGrid>

          <Card style={{marginTop: "2rem"}}>
            <div className='flex justify-between items-center'>
              <h1>Order Priority Queue</h1>
              <Button onClick={() => setIsModalOpen(true)}><FaPlus />Add New Orders</Button>
            </div>
            <DataTable
            columns={orderColumns}
            data={paginatedData}
            renderRow={(order) => (
              <>
                <Td>{order.invoice_number}</Td>
                <Td>{order.customer}</Td>
                <Td>{order.product_name}</Td>
                <Td>{order.quantity.toFixed(2)}</Td>
                {/* <Td>{order.rmReq.toFixed(2)}</Td> */}
                {/* <Td>{order.total.toFixed(2)}</Td> */}
                <Td>{order.margin.toFixed(2)}</Td>
                <Td>{order.invoice_due_date}</Td>
                <Td>{calculateDaysLeft(order.invoice_due_date)}</Td>
                <Td>
                  <ScoreBarWrap>
                    <ScoreFill
                      percent={order.score}
                      color={
                        order.score >= 90
                          ? "#52c41a"
                          : order.score >= 75
                          ? "#faad14"
                          : "#ff4d4f"
                      }
                    />
                  </ScoreBarWrap>
                  <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>{order.score}</div>
                </Td>
                <Td>
                  <Badge variant={priorityToBadgeVariant[order.priority] || "primary"}>{order.priority}</Badge>
                </Td>
                <Td>
                  <Badge variant={statusToBadgeVariant[order.status] || "primary"}>{order.status}</Badge>
                </Td>
              </>
            )}
          />

          </Card>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-4 font-body">
            <div className="flex justify-between items-center mb-3  ">
              <h3 className="text-lg font-bold text-text">Edit Yield Configuration</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textLight hover:text-error text-2xl font-bold leading-none">&times;</button>
            </div>
            <div className="space-y-6">
              <InputField label="Invoice Number" name="erp_order_reference" type="text" value={form.erp_order_reference} onChange={handle}  />
              <InputField label="Customer Name" name="customer_name" type="select" value={form.customer_name} onChange={handle}  // Your existing handle function
                  options={customerOptions.map(item => ({ 
                    id: item.id, 
                    value: item.id, 
                    label: item.name 
                  }))} 
              />
              <InputField label="Customer Name" name="customer_tier" type="select" value={form.customer_tier} onChange={handle}  // Your existing handle function
                  options={tierOptions.map(item => ({ 
                    id: item.id, 
                    value: item.id, 
                    label: item.name 
                  }))} 
              />
              <InputField label="Product Name" name="product" type="select" value={form.product} onChange={handle}  // Your existing handle function
                  options={productOptions.map(item => ({ 
                    id: item.id, 
                    value: item.id, 
                    label: item.name 
                  }))} 
              />
              <InputField label="Grade" name="grade_config" type="select" value={form.grade_config} onChange={handle}  // Your existing handle function
                  options={gradeOptions.map(item => ({ 
                    id: item.id, 
                    value: item.id, 
                    label: item.name 
                  }))} 
              />
              <InputField label="Country" name="destination_country" type="text" value={form.destination_country} onChange={handle}  />
              <InputField label="Destination Port" name="destination_port" type="text" value={form.destination_port} onChange={handle}  />
              <InputField label="selling_price_per_mt" name="selling_price_per_mt" type="number" value={form.selling_price_per_mt} onChange={handle}  />
              <InputField label="Delivery Date" name="delivery_date" type="date" value={form.delivery_date} onChange={handle}  />
              <InputField label="cold_chain_buffer_days" name="cold_chain_buffer_days" type="number" value={form.cold_chain_buffer_days} onChange={handle}  />
              <InputField label="Priority Override" name="priority_override" type="select" value={form.priority_override} onChange={handle}  // Your existing handle function
                  options={priorityOptions.map(item => ({ 
                    id: item.id, 
                    value: item.id, 
                    label: item.name 
                  }))} 
              />
            </div>
            <div className="mt-8 flex justify-end gap-3 mt-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-text font-semibold hover:bg-backgroundAlt transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsConfirmOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-secondary transition-colors shadow-md shadow-primary/30 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


    </Layout>
  )
}

export default OrdersScreen