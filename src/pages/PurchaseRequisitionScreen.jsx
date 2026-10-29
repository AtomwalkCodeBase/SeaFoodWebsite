import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getPoItem } from '../services/productServices';
import { usePagination } from '../hooks/usePagination';
import PurchaseOrderModal from '../components/Modal/PurchaseOrderModal';
import PeelingCenter from '../components/Modal/PeelingCenter';
import ViewPeelingCenter from '../components/Modal/ViewPeelingCenters';
import PRProgressCard from '../components/Modal/PRProgressCard';
import PeelingStatusBadge from '../components/Modal/PeelingStatusBadge';
import styled from 'styled-components';
import { theme } from '../styles/Theme';
import { FiFilter, FiPackage, FiSearch } from 'react-icons/fi';
import { MdOutlineWaterDrop } from 'react-icons/md';
import { TbFish } from 'react-icons/tb';
import Button from '../components/Button';
import { FaEye, FaPlus } from 'react-icons/fa';
import StatsCard from '../components/StatsCard';
import PaginationComponent from '../components/Pagination';
import DataTable, { Td } from '../components/Datatable';
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { formatNumber } from "../utils";
import Badge from "../components/Badge";
import Card from '../components/Card';

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing["3xl"]};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) { 
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing["2xl"]}; 
  }
`;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;
const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`;
const statusMap = {
  A: "Approved",
  P: "Pending",
  R: "Rejected",
  D: "Draft",
};
const SearchIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm}; top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 15px;
  display: flex;
`;
const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing["2xl"]};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.83rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus { 
    border-color: ${({ theme }) => theme.colors.primary}; 
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight}; 
  }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const FilterSelect = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
const Select = styled.select`
  appearance: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing["2xl"]} ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.83rem;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const CountBadge = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.72rem;
  font-weight: 700;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const ActionsCell = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const ProgressSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ProgressSectionTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
`;

const PurchaseRequisitionScreen = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const [poItemList, setPoItemList] = useState([]);

  const [selectedPurchaseData, setSelectedPurchaseData] = useState(null);
  const [isAddPeelingOpen, setIsAddPeelingOpen] = useState(false);
  const [isViewPeelingOpen, setIsViewPeelingOpen] = useState(false);

  function countByPoType(arr, po_type) {
    if (!Array.isArray(arr)) return 0;

    return arr.reduce((count, item) => {
      if (item && item.po_type === po_type) {
        return count + 1;
      }
      return count;
    }, 0);
  }

  const STATS = [
    { label: "Total Requests", value: poItemList.length, icon: <FiPackage />, color: "primary", bg: "primaryLight" },
    { label: "Purchase Order Request", value: countByPoType(poItemList, "R"), icon: <MdOutlineWaterDrop />, color: "warning", bg: "warningLight" },
    { label: "Purchase order", value: countByPoType(poItemList, "P"), icon: <TbFish />, color: "success", bg: "successLight" },
  ];

  useEffect(() => {
    FetchPoItem()
  }, [])

  const FetchPoItem = async () => {
    try {
      const response = await getPoItem();
      const filteredPRList = response?.data?.filter((data) => data.po_type === "R") || [];
      setPoItemList(filteredPRList);
    } catch (error) {
      console.error(error)
    }
  }

  const filtered = poItemList.filter((po) => {
    const poStatusLabel = statusMap[po.po_status] || "Pending";
    const matchStatus = filter === "All" || poStatusLabel === filter;

    const q = search.toLowerCase();

    if (!q) {
      return matchStatus;
    }

    const matchSearch = [
      po.po_ref_number,
      po.supplier_name,
      po.supplier_ref_number,
      po.location,
      po.branch_id,
      po.payment_terms,
      ...(po.po_items?.flatMap((item) => [
        item.po_item?.name,
        item.po_item?.item_number,
        item.remarks,
      ]) || []),
    ].some((field) =>
      field && field.toString().toLowerCase().includes(q)
    );

    return matchStatus && matchSearch;
  });

  const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(filtered, 10);

  const openAddPeeling = (e, data) => {
    e.stopPropagation();
    setSelectedPurchaseData(data);
    setIsAddPeelingOpen(true);
  };

  const openViewPeeling = (e, data) => {
    e.stopPropagation();
    setSelectedPurchaseData(data);
    setIsViewPeelingOpen(true);
  };

  return (
    <Layout title="Purchase Request Screen">
      <SubtitleSection>
        <div>
          <Subtitle>See all Purchase requests List </Subtitle>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => setIsModalOpen(true)}>
            <FaPlus /> New Request
          </Button>
        </div>
      </SubtitleSection>
      <Page>
        <StatsGrid>
          {STATS.map(({ label, value, icon, color, bg }, i) => (
            <StatsCard icon={icon} label={label} value={value} color={color} />
          ))}
        </StatsGrid>

        <Toolbar>
          <SearchWrap>
            <SearchIcon><FiSearch /></SearchIcon>
            <SearchInput
              placeholder="Search by product, supplier or PR ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchWrap>

          <FilterSelect>
            <FiFilter style={{ position: "absolute", left: 10, pointerEvents: "none", fontSize: 13 }} />
            <Select
              style={{ paddingLeft: 28 }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InReview">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>
          </FilterSelect>

          <CountBadge>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</CountBadge>
        </Toolbar>

        <Card title="PR List">

          <DataTable
            columns={[
              "",
              "PR Reference",
              "Supplier",
              "Items",
              "Date",
              "Quantity",
              "Total Amount",
              "Peeling Status",
              "Actions"
            ]}
            data={paginatedData}
            isLoading={false}
            emptyMessage="No Purchase Requests Found"
            rowAction={(data) =>
              setExpandedRow(prev =>
                prev === data.id ? null : data.id
              )
            }
            renderRow={(data) => (
              <>
                <Td>
                  {expandedRow === data.id
                    ? <IoIosArrowUp />
                    : <IoIosArrowDown />
                  }
                </Td>

                <Td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{data.po_ref_number}</span>
                    <small style={{ color: "#6b7280" }}>
                      {data.po_items?.[0]?.po_item?.name || "--"}
                      {data.po_items?.length > 1 &&
                        ` +${data.po_items.length - 1} more`}
                    </small>
                  </div>
                </Td>

                <Td>
                  {data.supplier_name || "--"}
                </Td>

                <Td>{data.po_items?.length || 0} </Td>

                <Td>{data.po_date}</Td>

                <Td>{data.po_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</Td>

                <Td> ₹{formatNumber(data.total)} </Td>

                <Td>
                  <PeelingStatusBadge poId={data.id} />
                </Td>

                <Td>
                  <ActionsCell>
                    {data.po_status !== "D" && (
                      <Button size="sm" onClick={(e) => openAddPeeling(e, data)} >
                        Add Peeling
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => openViewPeeling(e, data)}
                    ><FaEye />

                      View Peeling
                    </Button>
                  </ActionsCell>
                </Td>
              </>
            )}

            expandedRow={expandedRow}

            renderExpandedRow={(data) => (
              <div className="p-4 bg-card rounded-md">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="p-2"> Item Name </th>

                      <th className="p-2"> Item Number </th>

                      <th className="p-2">Quantity </th>

                      <th className="p-2"> Unit Price </th>

                      <th className="p-2"> Tax </th>

                      <th className="p-2"> Total </th>
                    </tr>
                  </thead>


                  <tbody>

                    {
                      data.po_items?.map(item => (
                        <tr
                          key={item.id}
                          className="border-b border-border/50"
                        >

                          <td className="p-2">
                            {item.po_item?.name}
                          </td>

                          <td className="p-2">
                            {item.po_item?.item_number}
                          </td>


                          <td className="p-2">
                            {item.quantity}
                          </td>


                          <td className="p-2">
                            ₹{formatNumber(item.unit_price)}
                          </td>


                          <td className="p-2">
                            ₹{formatNumber(item.tax_amount || 0)}
                            <br />
                            <small>{item.tax_rate}%</small>
                          </td>


                          <td className="p-2 font-semibold">
                            ₹{formatNumber(item.total_price)}
                          </td>

                        </tr>
                      ))
                    }

                  </tbody>

                </table>

              </div>
            )}
          />

          <PaginationComponent
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            siblingCount={2}
          />

        </Card>

        {poItemList.some((pr) => pr.po_status === "A") && (
          <ProgressSection>
            <ProgressSectionTitle>
              Peeling Progress — Approved Requests
            </ProgressSectionTitle>

            {poItemList
              .filter((pr) => pr.po_status === "A")
              .map((pr) => (
                <PRProgressCard key={pr.id} purchaseData={pr} />
              ))
            }
          </ProgressSection>
        )}

        {isModalOpen && <PurchaseOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          screen="purchase_request"
          addMultipleItem={true}
          refreshData={FetchPoItem}
        />}

        {isAddPeelingOpen && <PeelingCenter
          isOpen={isAddPeelingOpen}
          onClose={() => setIsAddPeelingOpen(false)}
          purchaseData={selectedPurchaseData}
        />}

        {isViewPeelingOpen && <ViewPeelingCenter
          isOpen={isViewPeelingOpen}
          onClose={() => setIsViewPeelingOpen(false)}
          purchaseData={selectedPurchaseData}
        />}
      </Page>

    </Layout>
  )
}

export default PurchaseRequisitionScreen