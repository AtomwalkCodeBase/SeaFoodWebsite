import React, { useMemo, useState } from "react"
import styled from "styled-components"
import Layout from "../../components/Layout"
import Badge from "../../components/Badge"
import StatsCard from "../../components/StatsCard"
import DataTable, { Td } from "../../components/Datatable"
import { FaListAlt, FaBoxOpen, FaIndustry, FaExclamationTriangle } from "react-icons/fa"
import {
  BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,
} from "recharts"
import { Cell } from "recharts"

const PageContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`
const sectionCardStyles = `
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`
const TableHeaderWrap = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;

  h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
    font-size: 1.1rem;
    font-weight: 600;
  }
`
const FilterSelect = styled.select`
  padding: 0.5rem 0.875rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
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

const PageSection = styled.div`
  ${sectionCardStyles}
  padding: 1.25rem;
`
const ChartTitle = styled.h4`
  margin: 0 0 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  { label: "ACTIVE ORDERS", value: 6, color: "primary", icon: <FaListAlt /> },
  { label: "TOTAL DEMAND", value: "25 MT", color: "success", icon: <FaBoxOpen /> },
  { label: "RM REQUIRED", value: "34.78 MT", color: "warning", icon: <FaIndustry /> },
  { label: "ORDERS AT RISK", value: 1, color: "error", icon: <FaExclamationTriangle /> },
]
const orderColumns = [
  "ORDER ID",
  "CUSTOMER",
  "PRODUCT",
  "QTY (MT)",
  "RM REQ. (MT)",
  "SELL PRICE(USD/MT)",
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

function Orders() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortOption, setSortOption] = useState("none")

  const sortedOrders = useMemo(() => {
    let data = [...ordersSeed]
    if (sortOption === "priorityScore") {
      data.sort((a, b) => b.score - a.score) // highest score first
    }
    return data
  }, [sortOption])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedOrders.slice(start, end)
}, [currentPage, itemsPerPage, sortedOrders])

    const priorityChartData = useMemo(() => {
      const baseCounts = { Critical: 0, Urgent: 0, Normal: 0 }

      sortedOrders.forEach((order) => {
        if (baseCounts[order.priority] !== undefined) {
          baseCounts[order.priority] += 1
        }
      })

      return Object.entries(baseCounts).map(([priority, value]) => ({
        priority,
        value,
      }))
    }, [sortedOrders])
    const calculateDaysLeft = (dueDate) => {
      const today = new Date()
      const ship = new Date(dueDate)   // parse the invoice_due_date
      const diffTime = ship - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? `${diffDays}d` : "0d"
    }      

  const statusChartData = useMemo(() => {
    const baseCounts = {
      "In Production": 0,
      Scheduled: 0,
      Confirmed: 0,
      Dispatched: 0,
    }

    sortedOrders.forEach((order) => {
      if (baseCounts[order.status] !== undefined) {
        baseCounts[order.status] += 1
      }
    })
  
    const maxValue = Math.max(...Object.values(baseCounts), 1)
    return Object.entries(baseCounts).map(([status, value]) => ({
      status,
      value,
      percent: (value / maxValue) * 100,
    }))
  }, [sortedOrders])
    
  const handlePageChange = (page, newPageSize) => {
   setCurrentPage(page)
   if (typeof newPageSize === "number" && newPageSize !== itemsPerPage) {
     setItemsPerPage(newPageSize)
   }
 } 

  return (
    <Layout title="Orders">
      <PageContent>
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
        <PageSection>
        <TableHeaderWrap>
            <h3>Orders List</h3>
            <FilterSelect
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="none">No Sort</option>
              <option value="priorityScore">Sort by Priority Score</option>
            </FilterSelect>
          </TableHeaderWrap>
          <DataTable
            columns={orderColumns}
            data={paginatedOrders}
            renderRow={(order) => (
              <>
                <Td>{order.invoice_number}</Td>
                <Td>{order.customer}</Td>
                <Td>{order.product_name}</Td>
                <Td>{order.quantity.toFixed(2)}</Td>
                <Td>{order.rmReq.toFixed(2)}</Td>
                <Td>{order.total.toFixed(2)}</Td>
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

          {/* <Pagination
            totalItems={sortedOrders.length}  
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            showFirstLast
            showPageSize
            showPageStats={false}
          /> */}
        </PageSection>

        <PageSection>
          <ChartTitle>Orders by Priority</ChartTitle>
                    <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                    {priorityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.priority === "Critical"
                            ? "#ff4d4f"
                            : entry.priority === "Urgent"
                            ? "#faad14"
                            : "#1890ff"
                        }
                      />
                    ))}
                  </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PageSection>
      </PageContent>
    </Layout>
  )
}

export default Orders
