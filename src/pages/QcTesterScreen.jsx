import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import styled from 'styled-components';
import { theme } from '../styles/Theme';
import { FiPackage } from 'react-icons/fi';
import StatsCard from '../components/StatsCard';
import { getPoQC } from '../services/productServices';
import { TesterBatchTable } from '../components/ScreenComponents/BatchTable';
import { getEmployeeView } from '../constants';
import { useAuth } from '../context/AuthContext';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 1024px) {
    gap: 0.7rem;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    align-items: stretch;
  }
`;
const FilterRow = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: white;
  min-width: 150px;

  @media (max-width: 768px) {
    width: 45%;
    min-width: unset;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const QcTesterDashboard = () => {
    const EmployeeData = getEmployeeView();
    const [poQcItemList, setPoQcItemList] = useState([]);
    const {profile} = useAuth();
    console.log("profile",profile)

      useEffect(() => {
        FetchPoQcItem()
      }, [])
    
      const FetchPoQcItem = async () => {
        try {
          const response = await getPoQC();
          setPoQcItemList(response.data);
          // console.log(response.data); 
        } catch (error) {
          console.error(error)
        }
      }

    const STATS = [
        { label: "Total Item Today", value: 4, icon: <FiPackage />, color: "primary", bg: "primaryLight" },
        { label: "Assigned", value: 4, icon: <FiPackage />, color: "warning", bg: "warningLight" },
        { label: "Not Assigned", value: 5, icon: <FiPackage />, color: "success", bg: "successLight" },
        { label: "Pending Review", value: 5, icon: <FiPackage />, color: "success", bg: "successLight" },
    ];
    return (
        <Layout title="QC Tester Dashboard">
            <StatsGrid>
                {STATS.map(({ label, value, icon, color, bg }, i) => (
                    <StatsCard icon={icon} label={label} value={value} color={color} />
                ))}
            </StatsGrid>
            <FilterContainer>
                <FilterRow>
                    <FilterSelect>
                        <option>Receiving</option>
                        <option>Pending</option>
                    </FilterSelect>
                    <FilterSelect>
                        <option>Today</option>
                        <option>Yesterday</option>
                    </FilterSelect>
                    <FilterSelect>
                        <option>Pending Review</option>
                        <option>Pending</option>
                    </FilterSelect>
                </FilterRow>
            </FilterContainer>
            {/* <BatchTable data={EmployeeData} role="tester" /> */}
            <TesterBatchTable data={poQcItemList} />
        </Layout>
    )
}

export default QcTesterDashboard