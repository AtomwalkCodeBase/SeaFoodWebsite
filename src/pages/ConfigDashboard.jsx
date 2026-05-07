import React, { useState } from "react"
import styled from "styled-components"

import { INIT_SUPPLIERS } from "./data/suppliers"
import Card from "../components/Card"
import Layout from "../components/Layout"
import YieldConfigScreen from "./YieldConfigScreen"
import MachineCapacityScreen from "./MachineCapacityScreen"
import CapacityConfigScreen from "./Capacityconfigscreen "
import SpeciesGradesPanel from "./SpeciesGradesPanel"
import Tabs from "../components/Tabs"

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const TabsBar = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const TabButton = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid ${({ active, theme }) => (active ? theme.colors.primary : theme.colors.border)};
  background: ${({ active, theme }) => (active ? theme.colors.primaryLight : theme.colors.backgroundAlt)};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
`

const KVGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 0.75rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const KVItem = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 0.65rem 0.8rem;
`

const Label = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: capitalize;
`

const Value = styled.div`
  margin-top: 0.2rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
    padding: 0.55rem 0.45rem;
    font-size: 0.84rem;
  }

  th {
    color: ${({ theme }) => theme.colors.textLight};
    font-weight: 600;
  }
`
const SpeciesButton = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid
    ${({ active, theme }) =>
      active ? theme.colors.primary : theme.colors.border};
  background: ${({ active, theme }) =>
    active ? theme.colors.primaryLight : theme.colors.backgroundAlt};
  cursor: pointer;
`
const SpeciesList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const TABS = [
  { key: "config", label: "⚙️ Planning config" },
  { key: "species", label: "🦐 Species & grades" },
  { key: "yield", label: "🔗 Yield chain" },
  { key: "machines", label: "🏭 Machines" },
  { key: "suppliers", label: "🚚 Suppliers" },
]

export default function ConfigDashboard() {
  const [tab, setTab] = useState("config")

  return (
    <Layout title="Production planning configuration">
        <Card>
          <Tabs tabs={TABS} activeTab={tab} setActiveTab={setTab} />
        {tab === "config" && (
          <CapacityConfigScreen />
        )}

        {tab === "species" && (
          <SpeciesGradesPanel />
        )}

        {tab === "yield" && (
          <YieldConfigScreen />
        )}

        {tab === "machines" && (
          <MachineCapacityScreen />
        )}

        {tab === "suppliers" && (
          <Card title="Supplier Data" variant="secondary">
            <SimpleTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Species</th>
                  <th>Lead (days)</th>
                  <th>Price</th>
                  <th>Grade Mix</th>
                </tr>
              </thead>
              <tbody>
                {INIT_SUPPLIERS.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.species}</td>
                    <td>{s.lead}</td>
                    <td>{s.price}</td>
                    <td>{Object.keys(s.grades).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </SimpleTable>
          </Card>
        )}
            </Card>
    </Layout>
  )
}
