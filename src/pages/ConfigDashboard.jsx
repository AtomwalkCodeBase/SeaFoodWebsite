import React, { useMemo, useState } from "react"
import styled from "styled-components"


import { INIT_PLANNING_CONFIG } from "./data/planningConfig"
import { INIT_SPECIES } from "./data/species"
import { INIT_GRADES } from "./data/grades"
import { INIT_YIELD_STEPS } from "./data/yieldSteps"
import { INIT_MACHINES } from "./data/machines"
import { INIT_SUPPLIERS } from "./data/suppliers"
import Card from "../components/Card"
import Layout from "../components/Layout"
import YieldConfigScreen from "./YieldConfigScreen"
import MachineCapacityScreen from "./MachineCapacityScreen"
import CapacityConfigScreen from "./Capacityconfigscreen "

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

const TABS = [
  { id: "config", label: "Planning config" },
  { id: "species", label: "Species & grades" },
  { id: "yield", label: "Yield chain" },
  { id: "machines", label: "Machines" },
  { id: "suppliers", label: "Suppliers" },
]

function formatLabel(key) {
  return key.replaceAll("_", " ")
}

export default function ConfigDashboard() {
  const [tab, setTab] = useState("config")

  const globalRows = useMemo(() => Object.entries(INIT_PLANNING_CONFIG), [])

  return (
    <Layout title="Global Settings">
      <PageContent>
        <Card
          title="Production Planning Configuration"
          variant="primary"
          // footer="Using previous model UI and data-source-only rendering"
        >
          <TabsBar>
            {TABS.map((t) => (
              <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </TabButton>
            ))}
          </TabsBar>
        </Card>

        {tab === "config" && (
          // <Card title="Global Parameters" variant="primary">
          //   <KVGrid>
          //     {globalRows.map(([key, value]) => (
          //       <KVItem key={key}>
          //         <Label>{formatLabel(key)}</Label>
          //         <Value>{String(value)}</Value>
          //       </KVItem>
          //     ))}
          //   </KVGrid>
          // </Card>
          <CapacityConfigScreen />
        )}

        {tab === "species" && (
          <Card title="Species & Grade Data" variant="secondary">
            <SimpleTable>
              <thead>
                <tr>
                  <th>Species</th>
                  <th>Alias</th>
                  <th>Base Price</th>
                  <th>Processing Cost</th>
                  <th>Grades</th>
                </tr>
              </thead>
              <tbody>
                {INIT_SPECIES.map((sp) => {
                  const count = INIT_GRADES.filter((g) => g.species === sp.id).length
                  return (
                    <tr key={sp.id}>
                      <td>{sp.name}</td>
                      <td>{sp.category_alias}</td>
                      <td>{sp.base_price}</td>
                      <td>{sp.processing_cost}</td>
                      <td>{count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </SimpleTable>
          </Card>
        )}

        {tab === "yield" && (
          // <Card title="Yield Step Data" variant="accent">
          //   <SimpleTable>
          //     <thead>
          //       <tr>
          //         <th>Sequence</th>
          //         <th>Step</th>
          //         <th>Yield %</th>
          //         <th>Parent</th>
          //         <th>Efficiency</th>
          //       </tr>
          //     </thead>
          //     <tbody>
          //       {INIT_YIELD_STEPS.map((s) => (
          //         <tr key={s.id}>
          //           <td>{s.sequence}</td>
          //           <td>{s.name}</td>
          //           <td>{(s.yield_pct * 100).toFixed(1)}%</td>
          //           <td>{s.parent ? "Yes" : "No"}</td>
          //           <td>{s.efficiency}</td>
          //         </tr>
          //       ))}
          //     </tbody>
          //   </SimpleTable>
          // </Card>
          <YieldConfigScreen />
        )}

        {tab === "machines" && (
          // <Card title="Machine Data" variant="primary">
          //   <SimpleTable>
          //     <thead>
          //       <tr>
          //         <th>Name</th>
          //         <th>Activity</th>
          //         <th>Capacity</th>
          //         <th>Count</th>
          //         <th>Downtime</th>
          //       </tr>
          //     </thead>
          //     <tbody>
          //       {INIT_MACHINES.map((m) => (
          //         <tr key={m.id}>
          //           <td>{m.name}</td>
          //           <td>{m.activity}</td>
          //           <td>{m.capacity}</td>
          //           <td>{m.count}</td>
          //           <td>{(m.downtime * 100).toFixed(1)}%</td>
          //         </tr>
          //       ))}
          //     </tbody>
          //   </SimpleTable>
          // </Card>
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
      </PageContent>
    </Layout>
  )
}
