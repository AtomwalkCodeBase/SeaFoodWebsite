import React from 'react'
import Layout from '../../components/Layout'
import { useGetEmployeeList, useGetWorkCoverage } from '../../hooks/useProductQueries'
import styled from 'styled-components'
import StatsCard from '../../components/StatsCard'
import { FaUserCheck, FaUsers, FaUserTimes } from 'react-icons/fa'

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

const WorkForceAllocation = () => {
    const {data: employeeList, isLoading: employeeListLoading} = useGetEmployeeList();
    const {data: workForceCoverage, isLoading: workForceCoverageLoading} = useGetWorkCoverage();

    // console.log("employeeList", employeeList.length)

    const STATUS_CARD_DATA = [
       { label: "Total Workers", value: employeeList?.length, color: "primary", icon: <FaUsers /> },
            { label: "Allocated", value: 10, color: "success", icon: <FaUserCheck /> },
            { label: "Unallocated", value: 4, color: "warning", icon: <FaUserTimes /> },

    ]


  return (
    <Layout>
        <StatsGrid>
                {STATUS_CARD_DATA.map((m, idx) => (
                    <StatsCard key={idx} label={m.label} icon={m.icon} value={m.value} color={m.color} />
                ))}
            </StatsGrid>
        
    </Layout>
  )
}

export default WorkForceAllocation