import React, { useState } from "react"
import styled from "styled-components"

import { INIT_SUPPLIERS } from "../data/suppliers"
import Card from "../../components/Card"
import YieldConfigScreen from "./Screens/YieldConfigScreen"
import MachineCapacityScreen from "./Screens/MachineCapacityScreen"
import CapacityConfigScreen from "./Screens/Capacityconfigscreen "
import SpeciesGradesPanel from "./Screens/SpeciesGradesPanel"
import PeelingCenterScreen from "./Screens/PeelingCenterScreen"
import Tabs from "../../components/Tabs"
import Layout from "../../components/Layout"

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

const TABS = [
  { key: "config", label: "⚙️ Capacity" },
  { key: "species", label: "🦐 Species & grades" },
  { key: "yield", label: "🔗 Yield Setup" },
  { key: "machines", label: "🏭 Machines" },
  { key: "peelingCenter", label: "🧺 Peeling Center" },
  // { key: "suppliers", label: "🚚 Suppliers" },
]

export default function ConfigDashboard() {
  const [tab, setTab] = useState("config")

  return (
    <Layout title="System Configuration">
      <SubtitleSection>
        <div>
          <Subtitle>Manage production setup, species, grades, yields, and machines.</Subtitle>
        </div>
      </SubtitleSection>
      <Card hoverable={false} className="mt-3">
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
        {tab === "peelingCenter" && (
          <PeelingCenterScreen />
        )}
        {/* {tab === "suppliers" && (
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
        )} */}
      </Card>
    </Layout>
  )
}
