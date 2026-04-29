import React, { useState } from "react"
import styled from "styled-components"
import Layout from "../components/Layout"
import StatsCard from "../components/StatsCard"
import Badge from "../components/Badge"
import DataTable, { Td } from "../components/Datatable"
import { FaSnowflake, FaBoxOpen, FaLock, FaCheckCircle } from "react-icons/fa"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Cell } from "recharts"

const sectionCardStyles = `
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`

const PageContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
const ProgressBar = styled.div`
  height: 16px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  margin-top: 0.5rem;
`

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ color }) => color};
  transition: width 0.3s ease;
`
const PageSection = styled.div`
  ${sectionCardStyles}
  padding: 1.25rem;
`
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }
`
const ExpandedBox = styled.div`
  background: #0b1e33;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`
const SupplierCard = styled.div`
  background: #102a44;
  padding: 0.75rem;
  border-radius: 6px;
  color: white;

  h4 {
    margin: 0 0 0.3rem;
  }

  p {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
  }
`
const inventoryColumns = [
  "SPECIES",
  "GRADE",
  "IN STOCK",
  "AVAILABLE",
  "SHORTFALL",
  "PURCHASE",
  "STATUS",
  "ACTION",
]
function Inventory() {

  const [expandedRow, setExpandedRow] = useState(null)

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id)
  }
  // Example values
  const coldStorage = {
    raw: { used: 21, capacity: 50 },
    finished: { used: 0, capacity: 30 },
  }

  const stockSummary = [
    { label: "IN STOCK", value: "21 MT RM", color: "primary", icon: <FaBoxOpen /> },
    { label: "RESERVED", value: "8.8 MT locked", color: "warning", icon: <FaLock /> },
    { label: "AVAILABLE", value: "12.2 MT free", color: "success", icon: <FaCheckCircle /> },
    { label: "BYPRODUCT", value: "0.85 MT shells", color: "error", icon: <FaSnowflake /> },
  ]
  const gradeData = [
    { grade: "23/25ML", stock: 5.2 },
    { grade: "20/25ML", stock: 8.5 },
    { grade: "16/20L", stock: 4.1 },
    { grade: "31/40S", stock: 2.3 },
  ]
  const inventoryData = [
    {
      id: 1,
      species: "Black Tiger",
      grade: "20/25",
      label: "Medium Large",
      inStock: 8,
      reserved: 2.5,
      available: 5.5,
      reqOrders: 12.54,
      shortfall: 7.04,
      purchase: 8.1,
      cost: "₹4.20L",
      supplier: "KeralaFish Exports",
      lead: "3d",
      status: "SHORTAGE",
    },
    {
      id: 2,
      species: "Vannamei",
      grade: "31/40",
      label: "Small",
      inStock: 6,
      reserved: 1.8,
      available: 4.2,
      reqOrders: 5.14,
      shortfall: 0.94,
      purchase: 1.08,
      cost: "₹2.80L",
      supplier: "AndhraSea Co",
      lead: "2d",
      status: "SHORTAGE",
    },
    
  ]
  
  return (
    <Layout title="Inventory & Procurement">
      <PageContent>
        
        {/* Cold Storage Utilization */}
        <PageSection>
        <SectionHeader>
          <h3>Cold Storage Utilization</h3>
        </SectionHeader>
          <div>
            <span>
              RAW MATERIAL STORAGE: {coldStorage.raw.used}/{coldStorage.raw.capacity} MT
            </span>
            <ProgressBar>
              <ProgressFill
                percent={(coldStorage.raw.used / coldStorage.raw.capacity) * 100}
                color="#1890ff"
              />
            </ProgressBar>
            <span>
              FINISHED GOODS STORAGE: {coldStorage.finished.used}/{coldStorage.finished.capacity} MT
            </span>
            <ProgressBar>
              <ProgressFill
                percent={(coldStorage.finished.used / coldStorage.finished.capacity) * 100}
                color="#52c41a"
              />
            </ProgressBar>
          </div>
        </PageSection>
  
        {/* Stock State Summary */}
        <PageSection>
        <SectionHeader>
        <h3>Stock Summary</h3>
        </SectionHeader>
          <StatsGrid>
            {stockSummary.map((m, idx) => (
              <StatsCard
                key={idx}
                icon={m.icon}
                label={m.label}
                value={m.value}
                color={m.color}
              />
            ))}
          </StatsGrid>
        </PageSection>
  
        {/* Stock by Grade */}
        <PageSection>
        <SectionHeader>
          <h3>Stock by Grade</h3>
        </SectionHeader>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock">
                  {gradeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.grade === "16/20L"
                          ? "#ff4d4f"
                          : entry.grade === "20/25ML"
                          ? "#faad14"
                          : entry.grade === "31/40S"
                          ? "#52c41a"
                          : "#1890ff"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PageSection>
        <PageSection>
            <SectionHeader>
              <h3>Raw Material Inventory</h3>
              </SectionHeader>
              <DataTable
                columns={inventoryColumns}
                data={inventoryData}
                expandedRow={expandedRow}
                renderRow={(row) => (
                  <>
                    <Td>{row.species}</Td>
                    <Td>{row.grade}</Td>
                    <Td>{row.inStock} MT</Td>
                    <Td style={{ color: "green" }}>{row.available} MT</Td>
                    <Td style={{ color: "red" }}>{row.shortfall} MT</Td>
                    <Td>{row.purchase} MT</Td>
                    <Td>
                      <Badge variant="error">{row.status}</Badge>
                    </Td>
                    <Td>
                      <button onClick={() => toggleRow(row.id)}>
                        {expandedRow === row.id ? "Hide" : "2 Sup."}
                      </button>
                    </Td>
                  </>
                )}
                renderExpandedRow={() => (
                  <ExpandedBox>
                    <SupplierCard>
                      <h4>Tamil Nadu Marine</h4>
                      <p>Stock: 8 MT | Price: ₹3.90L | Lead: 4d</p>
                      <ProgressBar>
                        <ProgressFill percent={95} color="#faad14" />
                      </ProgressBar>
                    </SupplierCard>

                    <SupplierCard>
                      <h4>KeralaFish Exports</h4>
                      <p>Stock: 15 MT | Price: ₹4.20L | Lead: 3d</p>
                      <ProgressBar>
                        <ProgressFill percent={100} color="#52c41a" />
                      </ProgressBar>
                    </SupplierCard>
                  </ExpandedBox>
                )}
              />
         </PageSection>
      </PageContent>
    </Layout>
  ) 
}
export default Inventory
