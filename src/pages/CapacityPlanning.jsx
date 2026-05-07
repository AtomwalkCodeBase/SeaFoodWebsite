import React, { useState } from 'react'
import Layout from '../components/Layout'
import styled from 'styled-components'
import StatsCard from '../components/StatsCard'
import Card from '../components/Card'
import { GetCapacityPlanning } from '../services/productServices'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { fmt } from '../utils'
import { usePagination } from '../hooks/usePagination'
import DataTable, { Td } from '../components/Datatable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import InputField from '../components/InputField'
import { theme } from '../styles/Theme'
import { Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FaBox } from 'react-icons/fa'
import { FaFilterCircleXmark } from 'react-icons/fa6'
import { TbProgressBolt } from 'react-icons/tb'
import { CiInboxOut } from 'react-icons/ci'
import { useNavigate } from 'react-router-dom'

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

const SectionHeader = ({ icon, title, sub }) => (
    <div className="p-2  border-b border-border">
        <div className="text-base font-bold flex items-center gap-2.5 text-text">
            <span>{icon}</span> {title}
        </div>
        {sub && <div className="text-xs text-textLight mt-1">{sub}</div>}
    </div>
);

const Columns = ['DAY', 'DATE', 'PLANNED', 'UTILIZATION', 'STATUS', 'CUMULATIVE', 'BATCHES'];

const CapacityPlanning = () => {
    const [days, setDays] = useState(7);
    const [appliedDays, setAppliedDays] = useState(7);
    const navigate = useNavigate();

    const { data: planningList = {}, isLoading: planningLoading, error: planningError } = useQuery({
        queryKey: ['capacity-planning', appliedDays],
        queryFn: () => GetCapacityPlanning(appliedDays),
        select: (res) => res.data,
        onError: () => toast.error('Failed to load Plans'),
    });

    const chartData = planningList?.days?.map((d) => ({
        day: `D${d.day}`,
        planned: d.planned_volume_mt,
        capacity: planningList.effective_capacity_mt,
    }));

    const metrics = [
        { label: "Effective capacity", value: planningList.effective_capacity_mt, color: "primary", icon: <FaBox /> },
        { label: "Bottleneck", value: planningList?.bottleneck?.name, color: "success", icon: <FaFilterCircleXmark /> },
        { label: "Avg utilization", value: planningList.avg_utilization_pct, color: "warning", icon: <TbProgressBolt /> },
        { label: `${appliedDays}-day output`, value: planningList?.days?.length ? `${fmt(planningList.days[planningList.days.length - 1].cumulative_output_mt, 1)} MT` : "--", color: "info", icon: <CiInboxOut /> },
    ]
    const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(planningList.days, 10)

    return (
        <Layout title="Production Planning">
            <div className="space-y-5">
            <StatsGrid>
                {metrics.map((m, idx) => (
                    <StatsCard key={idx} label={m.label} icon={m.icon} value={m.value} color={m.color} />
                ))}
            </StatsGrid>
            <Card>
                <div className='flex gap-3 items-center'>
                    <InputField label="Enter Number of Days You want to see" name="no_of_days" type="number" value={days} onChange={(e) => setDays(e.target.value)} />

                    <Button onClick={() => setAppliedDays(days)}> Show </Button>
                </div>

            </Card>
            <Card>
                {/* <SectionHeader icon="📊" title=`${days}-day production plan` /> */}
                <SectionHeader icon="📊" title={`${appliedDays}-day production plan`} />
                <DataTable
                    columns={Columns}
                    data={paginatedData}
                    isLoading={planningLoading}
                    emptyMessage="Production Plan Not Found"
                    renderRow={(data) => (
                        <>
                            <Td>DAY {data.day}</Td>
                            <Td>{data.date}</Td>
                            <Td>{data.planned_volume_mt}</Td>
                            <Td>
                                {data.utilization_pct ?
                                    <>
                                        <ScoreBarWrap>
                                            <ScoreFill
                                                percent={data.utilization_pct}
                                                color={data.utilization_status === "GREEN" ? theme.colors.success : theme.colors.error}
                                            />
                                        </ScoreBarWrap>
                                        <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>{fmt(data.utilization_pct, 0)}%</div>
                                    </> : "--"
                                }
                            </Td>
                            <Td>
                                <Badge variant={data.utilization_status === "GREEN" ? "success" : "error"}>{data.utilization_status || "--"}</Badge>
                            </Td>
                            <Td>{data.cumulative_output_mt}</Td>
                            <Td>{data.batch_count}</Td>
                            {/* <Td><Button onClick={()=> navigate("/production-plan")}>Plan</Button></Td> */}
                        </>
                    )}
                />

            </Card>

            <Card>
                <SectionHeader icon="📈" title="Capacity vs planned" />
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="day" />
                            <YAxis />

                            <Tooltip />
                            <Legend />

                            {/* Planned */}
                            <Bar dataKey="planned" name="Planned (MT)" />

                            {/* Capacity line */}
                            <Line
                                type="monotone"
                                dataKey="capacity"
                                name="Capacity (MT/d)"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </Card>
            </div>

        </Layout>
    )
}

export default CapacityPlanning