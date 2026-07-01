import React, { useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import styled from 'styled-components';
import { theme } from '../../styles/Theme';
import { useAddGRN, useCustomers, useGetBaseUnitList, useGrades, useGRNList, usePOItemList, useProduct, useSpecies } from '../../hooks/useProductQueries';
import StatsCard from '../../components/StatsCard';
import { FiPackage } from 'react-icons/fi';
import { MdFilterAltOff, MdOutlineWaterDrop } from 'react-icons/md';
import { TbFish } from 'react-icons/tb';
import Card from '../../components/Card';
import Tabs from '../../components/Tabs';
import {
  FiCalendar,
  FiClock,
  FiTag,
  FiUser,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiHash,
  FiDollarSign,
  FiShoppingCart,
  FiRepeat,
  FiInfo,
} from "react-icons/fi";
import { useFilter } from '../../hooks/useFilter';
import Button from '../../components/Button';
import { Badge, EmptyState, InfoRow } from '../../components/EmptyState';
import InputField from '../../components/InputField';
import DataTable, { Td } from '@/components/DataTable';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useFormHandler } from '../../hooks/useFormHandler';
import Modal from '../../components/Modal';
import ProcurementPlanning from './ProcurementPlanning';
import ConfirmPopup from '../../components/ConfirmPopup';
import { usePagination } from '../../hooks/usePagination';
import PaginationComponent from '../../components/Pagination';
import { formatNumber, formatToDDMMYYYY } from '../../utils';
import { isToday } from 'date-fns';
import { pushToTally } from '../hello';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
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

 const countByPoType = (arr, po_type) => {
    if (!Array.isArray(arr)) return 0;

    return arr.reduce((count, item) => {
      if (item && item.po_type === po_type) {
        return count + 1;
      }
      return count;
    }, 0);
  }

const EMPTY_FORM = {
  quantity_received: 0,
  invoice_unit_price: 0,
  no_expiry_days: 0,
  remarks: "",
  grn_date: "",
  unit_of_quantity: "",
};

const ProcurementManagerScreen = () => {
  const [isOpenGrnModal, setIsOpenGrnModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("PR");

  const [grnStatus, setGrnStatus] = useState("ALL");
  const [grnSearch, setGrnSearch] = useState("");
  const [PRSearch, setPRSearch] = useState("");
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const { form, handleChange, resetForm  } = useFormHandler(EMPTY_FORM)

  const { data: POItemList = [], isLoading: poItemListLoading  } = usePOItemList();
  const { data: GrnList = [], isLoading: grnIsLoading  } = useGRNList();
  const { data: baseUnitList = [], isLoading: baseUnitLoading  } = useGetBaseUnitList(isOpenGrnModal);

  const baseUnitOption = baseUnitList?.filter((unit) => unit.unit_type === "W").map((data) => {
    return { id: data.id, value: data.id, label: data.name}
  } )

  const tabFilteredData = useFilter({
  data: POItemList,
  fields: [
    "name",
    "grades[].gradeName",
  ],
  search: PRSearch,
  extraFilters: { po_type: activeTab === "PR" ? "R" : "P",},
});

const filteredGrnList = useFilter({
  data: GrnList,
  fields: [
    "grn_reference",
    "supplier_name",
  ],
  search: grnSearch,
  extraFilters: {
    status: grnStatus,
  },
});

    // console.log("selectedPR", selectedPR)


  const handleAddGRN = () => {
    // if (!form.grn_reference?.trim()) {
    //   return toast.error('Please enter GRN reference number');
    // }

    // if (!form.supplier_id) {
    //   return toast.error('Please select supplier');
    // }

    // if (!form.total_received_mt || Number(form.total_received_mt) <= 0) {
    //   return toast.error('Please enter total received quantity');
    // }

    // if (!form.species_config) {
    //   return toast.error('Please select species');
    // }

    // if (!form.erp_batch?.trim()) {
    //   return toast.error('Please enter ERP batch');
    // }

    if (!selectedPR) return toast.error('Please select a Purchase Request');
    if (!selectedPR.po_items[0].po_item.id) return toast.error('Please select an Item to receive');
    if (!form.quantity_received || Number(form.quantity_received) <= 0) return toast.error('Please enter quantity received');
    if (!form.grn_date) return toast.error('Please enter GRN date');

    const payload = {
       po_data: {
       order_id: selectedPR.id,
       item_id: selectedPR.po_items[0].po_item.id,
       call_mode: "ADD",
       quantity_received: Number(form.quantity_received),
       unit_of_quantity: Number(form.unit_of_quantity),
       rejected_quantity: 0,
       shortage_quantity: 0,
       invoice_unit_price: 0,
       shipment_charges: 0,
       other_charges: 0,
       grn_date: formatToDDMMYYYY(form.grn_date),
       remarks: form.remarks || "",
      }

    }

    // const payload = {
    //   grn_reference: form.grn_reference,
    //   supplier_id: Number(form.supplier_id),
    //   total_received_mt: String(form.total_received_mt),
    //   species_config: form.species_config,
    //   erp_batch: form.erp_batch,
    // };

    createGRNMutation.mutate(payload);
    // console.log("payload",payload)
  };

  const handleCloseModal = () => {
    resetForm();
    setIsOpenGrnModal(false);
    setIsConfirmModalOpen(false);
    setSelectedPR(null);
    setSelectedUnit(null);

  }

  const createGRNMutation = useAddGRN(handleCloseModal);

      const STATS = [
      { label: "Total Requests", value: POItemList.length, icon: <FiPackage />, color: "primary", bg: "primaryLight" },
      { label: "Purchase Order Request", value: countByPoType(POItemList, "R"), icon: <MdOutlineWaterDrop />, color: "warning", bg: "warningLight" },
      { label: "Purchase order", value: countByPoType(POItemList, "P"), icon: <TbFish />, color: "success", bg: "successLight" },
    ];

  const TABS = [
    // { key: "PLAN", label: "Procurement Plan" },
    { key: "PR", label: "Purchase Request" },
    { key: "PO", label: "Purchase Order" },
    { key: "GRN", label: "Grading Batch List" },
  ]

  return (
    <Layout title="Procurement Operations">
              {/* <SubtitleSection>
              <div>
                <Subtitle>See all Purchase requests List </Subtitle>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={() => setIsModalOpen(true)}>
                  <FaPlus /> A
                </Button>
              </div>
            </SubtitleSection> */}


            <StatsGrid>
                {STATS.map(({ label, value, icon, color, bg }, i) => (
                  <StatsCard icon={icon} label={label} value={value} color={color} />
                ))}
              </StatsGrid>
<Card>
  <Tabs
    tabs={TABS}
    activeTab={activeTab}
    setActiveTab={setActiveTab}
  />

{activeTab === "GRN" && (
  <div className="">
    <div className='grid grid-cols-4 items-end gap-3 mb-3'>
      <div className='col-span-2'>
        <InputField
          label=""
          type="text"
          value={grnSearch}
          onChange={(e) => setGrnSearch(e.target.value)}
          placeholder='Search GRN Number or Supplier'
        />
      </div>

      <div className='col-span-1'>
        <InputField
          label="Status"
          type="select"
          value={grnStatus}
          onChange={(e) => setGrnStatus(e.target.value)}
          options={[
            { label: "All", value: "ALL" },
            { label: "Completed", value: "COMPLETED" },
            { label: "In Progress", value: "IN_PROGRESS" },
          ]}
        />
      </div>

      {/* <div className='col-span-1 flex justify-end'>
        <Button size='sm' onClick={() => setIsOpenGrnModal(true)}>ADD GRN</Button>
      </div> */}
    </div>

          <GRN_CARDS
            grn={filteredGrnList}
            isLoading={grnIsLoading}
          />
  </div>
)}

{activeTab === "PLAN" && (
  <ProcurementPlanning />
)}

{activeTab !== "GRN" && activeTab !== "PLAN" && (
  <div className="space-y-4">
    {/* {tabFilteredData.length === 0 ? (
      <EmptyState message="No Data Found" />
    ) : (
      tabFilteredData.map((po) => ( */}
        <POCard po={tabFilteredData} isLoading={poItemListLoading} activeTab={activeTab} isOpenGrnModal={(po) => { setSelectedPR(po); setIsOpenGrnModal(true); }} />
      {/* ))
    )} */}
  </div>
)}
</Card>

  <Modal isOpen={isOpenGrnModal} onClose={handleCloseModal} title = "Create GRN" width = "max-w-xl" maxHeight = "max-h-[80vh]" showSaveButton = {true} saveButtonText = "Add GRN" cancelButtonText = "Cancel"
  isConfirmOpen={isConfirmModalOpen}
  setIsConfirmOpen ={setIsConfirmModalOpen}
  >
    <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* <div className="col-span-2">
                <InputField
                  label="GRN Reference Number"
                  name="grn_reference"
                  type="text"
                  value={form.grn_reference}
                  onChange={handleChange}
                  required
                />
              </div> */}

              <div className="col-span-2">
                <InputField
                  label="Selected Purchase Request"
                  type="text"
                  value={selectedPR ? selectedPR.po_ref_number : ""}
                  onChange={() => {}}
                  disabled
                />
              </div>
{/* 
              <div className="col-span-2">
                <InputField
                  label="Select Item"
                  name="item_id"
                  type="select"
                  value={selectedItem ? selectedItem.id : ""}
                  onChange={(e) => {
                    const itemId = e.target.value;
                    const item = (selectedPR?.po_items || []).find((it) => String(it.id) === String(itemId));
                    setSelectedItem(item || null);
                    handleChange({ target: { name: 'item_id', value: itemId } });
                  }}
                  options={(selectedPR?.po_items || []).map((it) => ({ value: it.id, label: it.po_item?.name || it.name }))}
                />
              </div> */}

              <InputField
                label="Quantity Received"
                name="quantity_received"
                type="number"
                value={form.quantity_received}
                onChange={handleChange}
              />

              <InputField
                label="Unit of Quantity"
                name="unit_of_quantity"
                type="select"
                value={form.unit_of_quantity}
                options={baseUnitOption}
                onChange={handleChange}
              />


              <InputField
                label="Expiry days"
                name="no_expiry_days"
                type="number"
                value={form.no_expiry_days}
                onChange={handleChange}
              />

              <InputField
                label="GRN Date"
                name="grn_date"
                type="date"
                value={form.grn_date}
                onChange={handleChange}
              />

               <div className="col-span-2">
              <InputField
                label="Remarks"
                name="remarks"
                type="text"
                value={form.remarks}
                onChange={handleChange}
              />
               </div>

{/* 
              <InputField
                label="Supplier Name"
                name="supplier_id"
                type="select"
                value={form.supplier_id}
                onChange={handleChange}
                options={supplierList.map((c) => ({ value: c.id, label: c.name }))}
              />

              <InputField
                label="Total Received Quantity (MT)"
                name="total_received_mt"
                type="number"
                value={form.total_received_mt}
                onChange={handleChange}
              />

              <InputField
                label="Species"
                name="species_config"
                type="select"
                value={form.species_config}
                onChange={handleChange}
                options={speciesList.map(item => ({ id: item.id, value: item.id, label: `${item.scientific_name}`}))}
              />
              
              <InputField
                label="ERP Batch"
                name="erp_batch"
                type="text"
                value={form.erp_batch}
                onChange={handleChange}
              /> */}
            </div>
        </div>

    </Modal>

    <ConfirmPopup isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleAddGRN} message='Are you sure you want to Add GRN' title='Confirmation'  />


    </Layout>
  )
}

export default ProcurementManagerScreen

const  POCard = ({ po, isLoading, activeTab, isOpenGrnModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const typeConf = TYPE_CONFIG[po.po_type] || TYPE_CONFIG["R"];
  const statusConf = STATUS_CONFIG[po.po_status] || STATUS_CONFIG["P"];
  const TypeIcon = typeConf.icon;
  const purchase_column = [ "" ,"Ref. no", "Supplier", "Item count" ,"Date", "Tax Amt", "Total Amt.",`${activeTab === "PR" ? "Action" : ""}`]

  const [filters, setFilters] = useState({ search: "", fromDate: "", toDate: ""});

  const filteredPoList = useFilter({
      data: po, fields: [ "po_ref_number", "supplier_ref_number", "supplier_name", "po_items[].po_item.name", "po_items[].po_item.item_number"],
    search: filters.search, extraFilters: { dateRange: { field: "po_date", from: filters.fromDate, to: filters.toDate},},
  })

  const {paginatedData, totalItems, itemsPerPage, currentPage, handlePageChange} = usePagination(filteredPoList, 10)

  const shouldHighlightFirstRow = paginatedData.length > 0 && isToday(paginatedData[0].po_date);
 
  return (
    <>
     <div className='grid grid-cols-4 gap-3 items-end mb-4'>
      {/* <div className='col-span-12 md:col-span-4'> */}
        <InputField
          label=""
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value,}))}
          placeholder='Search by order ref, product... '
        />
      {/* </div> */}
      <InputField
          label="From Date"
          type="date"
          value={filters.fromDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              fromDate: e.target.value,
            }))
          }
        />

        <InputField
          label="To Date"
          type="date"
          value={filters.toDate}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              toDate: e.target.value,
            }))
          }
        />

        <Button  onClick={() => setFilters({ search: "", fromDate: "", toDate: ""})}> <MdFilterAltOff />Clear</Button>
      </div>
    <DataTable
    columns={purchase_column}
    data={paginatedData}
    highlightFirstRow={shouldHighlightFirstRow}
    isLoading={isLoading}
    rowAction={(data) => setExpandedRow((prev) => prev === data.id ? null : data.id )}
    renderRow={(data) => (
      <>
      <Td>{expandedRow === data.id ? <IoIosArrowUp /> : <IoIosArrowDown /> }</Td>
      <Td>{data.po_ref_number}</Td>
      <Td>{data.supplier_name}</Td>
      <Td>{data.po_items.length}</Td>
      <Td>{data.po_date}</Td>
      <Td>{data.tax_amount}</Td>
      <Td>{formatNumber(data.total)}</Td>
      <Td>{activeTab === "PR" && <Button disabled={data.po_status === "D"} variant={data.po_status === "D" ? "outline" : "primary"} size='sm' onClick={(e) => {e.stopPropagation(); isOpenGrnModal(data)}}>{ data.po_status !== "D" ? "Create GRN" : "GRN Created"}</Button>}</Td>
      </>
    )}
    expandedRow={expandedRow}
     renderExpandedRow={(data) => (
    <div className="p-3 bg-card rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2">Item Name</th>
            <th className="py-2">Item Number</th>
            <th className="py-2">Quantity</th>
            <th className="py-2">Unit Price</th>
            <th className="py-2">Tax Rate</th>
            <th className="py-2">Tax Amount</th>
            <th className="py-2">Total Price</th>
          </tr>
        </thead>

        <tbody>
          {data.po_items?.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/50"
            >
              <td className="py-2">
                {item.po_item?.name}
              </td>

              <td className="py-2">
                {item.po_item?.item_number}
              </td>

              <td className="py-2">
                {item.quantity}
              </td>

              <td className="py-2">
                {formatNumber(item.unit_price)}
              </td>

              <td className="py-2">
                {item.tax_rate}
              </td>

              <td className="py-2">
                {item.tax_amount}
              </td>

              <td className="py-2 font-semibold">
                {formatNumber(item.total_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
/>

<PaginationComponent totalItems={totalItems} itemsPerPage = {itemsPerPage} currentPage={currentPage} onPageChange={handlePageChange} />
</>
  );
}

const GRN_CARDS = ( {grn, isLoading }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const { data: gradeList = [], isLoading: gradesLoading } = useGrades();
  const { data: SpeciesList = [], isLoading: speciesLoading } = useSpecies();

  const getSpeciesGradeLabel = ( speciesList, gradeList, speciesConfigId) => {
    const foundGrade = gradeList.find((grade) => grade.id === speciesConfigId);
      if (!foundGrade) return "--";

      const foundSpecies = speciesList.find((species) => species.id === foundGrade.species_config);
      if (!foundSpecies) return "--";

      return `${foundSpecies.scientific_name} (${foundGrade.grade_code})`;
  };

  const columns = ["","GRN Reference", "Batch", "Location", "Supplier", "Total Received (MT)", "Status"];

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const gradeColumns = ["Grade Code", "Grade Config", "Quantity (MT)", "Percentage of Total", "Unit Price (MT)", "Line Value"];

  const {paginatedData, totalItems, currentPage, itemsPerPage, handlePageChange} = usePagination(grn, 10)

  return (
    <>
    <DataTable
      columns={columns}
      data={paginatedData}
      highlightFirstRow={false}
      isLoading={isLoading}
      rowAction={(data) => handleRowClick(data.id)}
      renderRow={(data) => (
        <>
        <Td>{expandedRow === data.id ? <IoIosArrowUp /> : <IoIosArrowDown /> }</Td>
          <Td className="font-medium" >{data.grn_reference || "--"}</Td>
          <Td>{data.erp_batch || "--"}</Td>
          <Td>{data.storage_location || "--"}</Td>
          <Td>{data.supplier_name || "Supplier Name not found"}</Td>
          <Td>{data.total_received_mt || "--"} MT</Td>
          <Td>
            {/* <Badge1 variant={data.status === "COMPLETED" ? "success" : "warning"}>{data.status === "COMPLETED" ? "Completed" : "In Progress"}</Badge1> */}
            <Badge label={data.status === "COMPLETED" ? "Completed" : "In Progress"} variant={data.status === "COMPLETED" ? "success" : "info"} />
           {/* {data.status === "COMPLETED" ? "Completed" : "In Progress"} */}
          </Td>
        </>
      )}
      expandedRow={expandedRow}
      renderExpandedRow={(data) => {
        if (data.status !== "COMPLETED") {
          return (
            <Card hoverable={false}>
            <div className="p-4 text-center text-text-light">
              Grading not completed yet
            </div>
            </Card>
          );
        }

        const gradeLines = data.grade_lines || [];
        
        if (gradeLines.length === 0) {
          return (
            <Card hoverable={false}>
            <div className="p-4 text-center text-text-light">
              No grade lines available
            </div>
            </Card>
          );
        }

        return (
          <div className="p-4 bg-card rounded-md">
            <h4 className="text-sm font-semibold mb-3">Grade Lines</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {gradeColumns.map((col, idx) => (
                    <th key={idx} className="text-left p-2 text-text-light font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gradeLines.map((grade, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="p-2">{grade.grade_code || "--"}</td>
                    <td className="p-2">{getSpeciesGradeLabel(SpeciesList, gradeList, grade.grade_config)}</td>
                    <td className="p-2">{grade.quantity_mt || "--"} MT</td>
                    <td className="p-2">{grade.percentage_of_total || "--"}%</td>
                    <td className="p-2">
                      {grade.unit_price_per_mt 
                        // ? `₹${parseFloat(grade.unit_price_per_mt).toLocaleString()}`
                        ? `₹${formatNumber(grade.unit_price_per_mt)}`
                        : "--"}
                    </td>
                    <td className="p-2">
                      {grade.line_value 
                        // ? `₹${parseFloat(grade.line_value).toLocaleString()}`
                        ? `₹${formatNumber(grade.line_value)}`
                        : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }}
      emptyMessage="No GRN Found"
    />
<PaginationComponent totalItems={totalItems} itemsPerPage = {itemsPerPage} currentPage={currentPage} onPageChange={handlePageChange}/>
    </>
  );
};
 
const TYPE_CONFIG = {
  P: {
    label: "Purchase Order",
    icon: FiShoppingCart,
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    headerBg: "bg-primary",
    accentBorder: "border-primary",
  },
  R: {
    label: "Purchase Request",
    icon: FiRepeat,
    badgeBg: "bg-secondary/10",
    badgeText: "text-secondary",
    headerBg: "bg-secondary",
    accentBorder: "border-secondary",
  },
};
 
const STATUS_CONFIG = {
  A: {
    label: "Approved",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  P: {
    label: "Pending",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  R: {
    label: "Rejected",
    bg: "bg-error/10",
    text: "text-error",
    dot: "bg-error",
  },
  D: {
    label: "Draft",
    bg: "bg-info/10",
    text: "text-info",
    dot: "bg-info",
  },
};
 
const INV_TYPE_LABEL = {
  R: "Raw",
  F: "Finished",
  S: "Semi-finished",
};
 
function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
 
function MetaChip({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm text-text-light">
      <Icon size={13} className="shrink-0 opacity-60" />
      <span className="opacity-60">{label}:</span>
      <span className="text-text font-medium">{value}</span>
    </div>
  );
}
 
function ItemRow({ item, currency, isLast }) {
  const inv = INV_TYPE_LABEL[item.po_item.inventory_type] || item.po_item.inventory_type;
  return (
    <div
      className={`py-3.5 ${!isLast ? "border-b border-border/50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text text-sm leading-snug">
              {item.po_item.name}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent-light/30 text-accent font-medium">
              {inv}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <FiHash size={11} className="text-text-light opacity-50" />
            <span className="text-xs text-text-light font-mono">{item.po_item.item_number}</span>
          </div>
          {item.remarks && (
            <div className="mt-1.5 flex items-start gap-1.5">
              <FiInfo size={11} className="text-info mt-0.5 shrink-0" />
              <span className="text-xs text-text-light italic">{item.remarks.trim()}</span>
            </div>
          )}
        </div>
 
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-text">
            {formatCurrency(item.total_price, currency)}
          </p>
          <p className="text-xs text-text-light mt-0.5">
            {parseFloat(item.quantity).toFixed(0)} × {formatCurrency(parseFloat(item.unit_price), currency)}
          </p>
        </div>
      </div>
 
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <div className="bg-background-alt rounded-lg px-3 py-1.5">
          <p className="text-xs text-text-light opacity-60 mb-0.5">Qty</p>
          <p className="text-sm font-semibold text-text">{parseFloat(item.quantity).toFixed(2)}</p>
        </div>
        <div className="bg-background-alt rounded-lg px-3 py-1.5">
          <p className="text-xs text-text-light opacity-60 mb-0.5">Unit Price</p>
          <p className="text-sm font-semibold text-text">{formatCurrency(parseFloat(item.unit_price), currency)}</p>
        </div>
        <div className="bg-background-alt rounded-lg px-3 py-1.5">
          <p className="text-xs text-text-light opacity-60 mb-0.5">Tax</p>
          <p className="text-sm font-semibold text-text">
            {parseFloat(item.tax_rate) === 0 ? "—" : `${parseFloat(item.tax_rate).toFixed(1)}%`}
          </p>
        </div>
      </div>
    </div>
  );
}