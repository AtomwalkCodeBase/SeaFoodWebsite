import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components';
import { FaPlus, FaRegCalendarAlt } from 'react-icons/fa';
import { IoCalendarNumberOutline } from 'react-icons/io5';
import PurchaseOrderModal from '../../../components/Modal/PurchaseOrderModal';
import Card from '../../../components/Card';
import { POCardItem } from '../../../components/ScreenComponents/POCardItem';
import { EmptyState } from '../../../components/EmptyState';
import Button from '../../../components/Button';
import Layout from '../../../components/Layout';

const Paragraphdata = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
`;

const DateRangeText = styled.p`
font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.textLight};
`;

const RequestDeskHeader = styled.div`
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

const TabContainer = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.5rem;
  overflow-x: auto;
`

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${(props) => (props.active ? props.theme.colors.primary : "transparent")};
  color: ${(props) => (props.active ? props.theme.colors.primary : props.theme.colors.text)};
  font-weight: ${(props) => (props.active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`
const TableContainer = styled.div`
  overflow-x: auto;
`
const ClaimItemRow = styled.tr`
  background-color: ${({ theme }) => theme.colors.background}22;
`
const NoLogsMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing?.md || '1rem'};
  color: ${({ theme }) => theme.colors?.textLight || '#999'};
  background: ${({ theme }) => theme.colors?.card || '#fff'};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const PONumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const CardBody = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const ItemDetails = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ItemDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ItemLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
`;

const ItemValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const FinancialSummary = styled.div`
  background: ${({ theme }) => theme.colors.primaryLight};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FinancialItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FinancialLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
`;

const FinancialValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;
const CardLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const parseApiDate = (dateStr) => {
  if (!dateStr) return null;

  const [day, mon, year] = dateStr.split("-");
  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  return new Date(year, months[mon], day);
};

// const getWeekRange = (date) => {
//   const start = new Date(date);
//   const end = new Date(date);

//   const day = start.getDay(); // 0-6

//   start.setDate(start.getDate() - day + 1); // Monday
//   end.setDate(start.getDate() + 6); // Sunday

//   start.setHours(0,0,0,0);
//   end.setHours(23,59,59,999);

//   return { start, end };
// };

const getCurrentWeekLabel = () => {
  const { start, end } = getWeekRange(new Date());

  return `${start.getDate()} ${start.toLocaleString("default", { month: "short" })} 
  - 
  ${end.getDate()} ${end.toLocaleString("default", { month: "short" })}`;
};

const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();

  start.setDate(start.getDate() - day + 1); // Monday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};


const SupplierDashboard = () => {
  const custId = localStorage.getItem("custId");
  const [activeTab, setActiveTab] = useState("purchase_service")
  const [activePeriod, setActivePeriod] = useState("week")
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [getServiceList, setGetServiceList] = useState([]);

  const getPeriodLabel = () => {

    if (activePeriod === "week") {

      const { start, end } = getWeekRange(currentDate);

      return `${start.getDate()} ${start.toLocaleString("default", { month: "short" })}
     - 
     ${end.getDate()} ${end.toLocaleString("default", { month: "short" })}`;
    }

    return currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
  };

  const FilterData = useMemo(() => {

    const supplierData = getServiceList.filter(
      (data) => Number(data.supplier_id) === Number(custId)
    );

    const poType = activeTab === "purchase_request" ? "R" : "S";

    const tabFiltered = supplierData.filter(
      (data) => data.po_type === poType
    );

    if (activePeriod === "week") {

      const { start, end } = getWeekRange(currentDate);

      return tabFiltered.filter((item) => {
        const poDate = parseApiDate(item.po_date);
        return poDate >= start && poDate <= end;
      });
    }

    if (activePeriod === "month") {

      return tabFiltered.filter((item) => {
        const poDate = parseApiDate(item.po_date);

        return (
          poDate &&
          poDate.getMonth() === currentDate.getMonth() &&
          poDate.getFullYear() === currentDate.getFullYear()
        );
      });
    }

    return tabFiltered;

  }, [getServiceList, activeTab, activePeriod, currentDate]);


  const handleNext = () => {

    const newDate = new Date(currentDate);

    if (activePeriod === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setCurrentDate(newDate);
  };

  const handlePrevious = () => {

    const newDate = new Date(currentDate);

    if (activePeriod === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    setCurrentDate(newDate);
  };

  useEffect(() => {
    FetchPoItem()
  }, [])

  const FetchPoItem = async () => {
    try {
      const response = await getPoItem();
      setGetServiceList(response.data);
      // console.log(response.data); 
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Layout title="Vender Dashboard">
      <RequestDeskHeader>
        <div>
          <Paragraphdata>See all Purchase requests List </Paragraphdata>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <FaPlus />Add New {activeTab === "purchase_request" ? 'Request' : 'Service'}
        </Button>
      </RequestDeskHeader>

      <Card hoverable={false}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>

          <Button onClick={handlePrevious}>
            Prev
          </Button>

          <DateRangeText style={{ fontWeight: 600 }}>
            {getPeriodLabel()}
          </DateRangeText>

          <Button onClick={handleNext}>
            Next
          </Button>
        </div>

        <TabContainer style={{ marginTop: "10px" }}>
          <div >
            {/* <Tab active={activeTab === "purchase_request"} onClick={() => setActiveTab("purchase_request")}>
              Purchase Request
            </Tab> */}
            <Tab active={activeTab === "purchase_service"} onClick={() => setActiveTab("purchase_service")}>
              Purchase services
            </Tab>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button variant={activePeriod === "week" ? "primary" : "ghost"} onClick={() => setActivePeriod("week")} >
                 Weekly
              </Button>

              <Button variant={activePeriod === "month" ? "primary" : "ghost"} onClick={() => setActivePeriod("month")}>
                Monthly
              </Button>
            </div>
          </div>

        </TabContainer>

        {activeTab === "purchase_request" ? (
          <>
            {FilterData.length > 0 ? (
              FilterData.map((item) => (
                <POCardItem key={item.id} po={item} supplier_screen={true} />
              ))
            ) : (
                <>
                <EmptyState message="No purchase requests found for the selected filters"  />
                </>
            )}
          </>
        ) :
          <>
            {FilterData.length === 0 ? (
                <>
                <EmptyState message = {`No ${activeTab === "purchase_request" ? "request" : "service"} found for the selected filters`} />
                </>
            ) : (
              FilterData.map((item) => (
                <POCardItem key={item.id} po={item} supplier_screen={true} />
              ))
            )}
          </>
        }
      </Card>

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier_id={custId}
        screen={activeTab}
        addMultipleItem={activeTab === "purchase_request" ? true : false}
      //   onSubmit={}
      />
    </Layout>
  )
}

export default SupplierDashboard;

export const POCard = ({ data }) => {
  const poItem = data?.po_items?.[0];

  return (
    <Card>
      <CardHeader>
        <PONumber>{data.po_ref_number}</PONumber>
        <Badge variant="success">Approve</Badge>
      </CardHeader>

      <CardBody>
        <InfoGroup>
          <InfoLabel>PO Date</InfoLabel>
          <InfoValue>{data.po_date}</InfoValue>
        </InfoGroup>

        <InfoGroup>
          <InfoLabel>Expected Due Date</InfoLabel>
          <InfoValue>{data.expected_due_date}</InfoValue>
        </InfoGroup>
      </CardBody>

      <ItemDetails>
        <ItemDetailRow>
          <ItemLabel>Item Name</ItemLabel>
          <ItemValue>{poItem?.po_item?.name}</ItemValue>
        </ItemDetailRow>
        <ItemDetailRow>
          <ItemLabel>Quantity</ItemLabel>
          <ItemValue>{poItem?.quantity}</ItemValue>
        </ItemDetailRow>
        <ItemDetailRow>
          <ItemLabel>Unit Price</ItemLabel>
          <ItemValue>₹{poItem?.unit_price}</ItemValue>
        </ItemDetailRow>
      </ItemDetails>

      <FinancialSummary>
        <FinancialItem>
          <FinancialLabel>Total (INR)</FinancialLabel>
          <FinancialValue>₹{data.total}</FinancialValue>
        </FinancialItem>

        <FinancialItem>
          <FinancialLabel>Tax Rate</FinancialLabel>
          <FinancialValue>{poItem?.tax_rate}%</FinancialValue>
        </FinancialItem>

        <FinancialItem>
          <FinancialLabel>TDS</FinancialLabel>
          <FinancialValue>18%</FinancialValue>
        </FinancialItem>

        <FinancialItem>
          <FinancialLabel>TDS Amount</FinancialLabel>
          <FinancialValue>₹{data.tax_amount}</FinancialValue>
        </FinancialItem>
      </FinancialSummary>
    </Card>
  );
};