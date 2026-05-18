import React, { useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import styled from 'styled-components';
import { theme } from '../../styles/Theme';
import { useAddGRN, useCustomers, useGRNList, usePOItemList, useProduct, useSpecies } from '../../hooks/useProductQueries';
import StatsCard from '../../components/StatsCard';
import { FiPackage } from 'react-icons/fi';
import { MdOutlineWaterDrop } from 'react-icons/md';
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
import DataTable, { Td } from '../../components/Datatable';
import { IoIosArrowDown } from 'react-icons/io';
import { toast } from 'react-toastify';
import { useFormHandler } from '../../hooks/useFormHandler';
import Modal from '../../components/Modal';

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
  grn_reference: "",
  supplier_id: "",
  total_received_mt: 0,
  species_config: "",
  erp_batch: "",
};

const ProcurementManagerScreen = () => {
  const [isOpenGrnModal, setIsOpenGrnModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("PR");

  const [grnStatus, setGrnStatus] = useState("ALL");
  const [grnSearch, setGrnSearch] = useState("");
  const [PRSearch, setPRSearch] = useState("");

  const { form, handleChange, resetForm  } = useFormHandler(EMPTY_FORM)

  const { data: POItemList = [], isLoading: poItemListLoading  } = usePOItemList();
  const { data: GrnList = [], isLoading: grnIsLoading  } = useGRNList();
  const { data: speciesList = [], isLoading: speciesLoading  } = useSpecies();
  const { data: supplierList = [], isLoading: supplierLoading  } = useCustomers();


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

  const handleAddGRN = () => {
    if (!form.grn_reference?.trim()) {
      return toast.error('Please enter GRN reference number');
    }

    if (!form.supplier_id) {
      return toast.error('Please select supplier');
    }

    if (!form.total_received_mt || Number(form.total_received_mt) <= 0) {
      return toast.error('Please enter total received quantity');
    }

    if (!form.species_config) {
      return toast.error('Please select species');
    }

    if (!form.erp_batch?.trim()) {
      return toast.error('Please enter ERP batch');
    }

    const payload = {
      grn_reference: form.grn_reference,
      supplier_id: Number(form.supplier_id),
      total_received_mt: String(form.total_received_mt),
      species_config: form.species_config,
      erp_batch: form.erp_batch,
    };

    createGRNMutation.mutate(payload);
    // console.log("payload",payload)
  };

  const handleCloseModal = () => {
    resetForm();

  }

  const createGRNMutation = useAddGRN(handleCloseModal);

      const STATS = [
      { label: "Total Requests", value: POItemList.length, icon: <FiPackage />, color: "primary", bg: "primaryLight" },
      { label: "Purchase Order Request", value: countByPoType(POItemList, "R"), icon: <MdOutlineWaterDrop />, color: "warning", bg: "warningLight" },
      { label: "Purchase order", value: countByPoType(POItemList, "P"), icon: <TbFish />, color: "success", bg: "successLight" },
    ];

  const TABS = [
    { key: "PR", label: "Purchase Request" },
    { key: "PO", label: "Purchase Order" },
    { key: "GRN", label: "GRN List" },
  ]

  return (
    <Layout title="Purchase Requests">
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

  {activeTab !== "GRN" ? (
    <div className="space-y-4">
      {tabFilteredData.length === 0 ? (
        <EmptyState message="No Data Found" />
      ) : (
        tabFilteredData.map((po) => (
          <POCard key={po.id} po={po} />
        ))
      )}
    </div>
  ) : (
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

        <div className='col-span-1 flex justify-end'>
          <Button size='sm'>ADD GRN</Button>
        </div>
      </div>
      
      {grnIsLoading ? (
        <EmptyState message="Loading..." />
      ) : filteredGrnList.length === 0 ? (
        <EmptyState message="No GRN Found" />
      ) : (
        <div className='space-y-3'>
          {/* {filteredGrnList.map((data) => ( */}
            <GRN_CARDS
              // key={data.id}
              grn={filteredGrnList}
            />
          {/* ))} */}
        </div>
      )}
    </div>
  )}
</Card>

  <Modal isOpen={isOpenGrnModal} onClose={() => setIsOpenGrnModal(false)} onSave = {handleAddGRN} title = "Add New GRN" width = "max-w-xl" maxHeight = "max-h-[80vh]" showSaveButton = {true} saveButtonText = "Add GRN" cancelButtonText = "Cancel"
  isConfirmOpen={isConfirmModalOpen}
  setIsConfirmOpen ={setIsConfirmModalOpen}
  >
    <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  label="GRN Reference Number"
                  name="grn_reference"
                  type="text"
                  value={form.grn_reference}
                  onChange={handleChange}
                  required
                />
              </div>

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
              />
            </div>
        </div>

    </Modal>


    </Layout>
  )
}

export default ProcurementManagerScreen

const  POCard = ({ po }) => {
  const [expanded, setExpanded] = useState(true);
  const typeConf = TYPE_CONFIG[po.po_type] || TYPE_CONFIG["R"];
  const statusConf = STATUS_CONFIG[po.po_status] || STATUS_CONFIG["P"];
  const TypeIcon = typeConf.icon;
  const itemCount = po.po_items.length;
 
  return (
    <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_var(--color-shadow)] overflow-hidden transition-all duration-200">
      {/* Colored top strip */}
      <div className={`h-1 w-full ${typeConf.headerBg}`} />
 
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${typeConf.badgeBg}`}>
              <TypeIcon size={18} className={typeConf.badgeText} />
            </div>
            <div>
              <p className="font-bold text-text text-base leading-tight tracking-tight">
                {po.po_ref_number}
              </p>
              <p className={`text-xs font-medium mt-0.5 ${typeConf.badgeText}`}>
                {typeConf.label}
              </p>
            </div>
          </div>
 
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConf.bg} ${statusConf.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
              {statusConf.label}
            </span>
            <span className="text-xs text-text-light font-mono bg-background-alt px-2 py-0.5 rounded-md">
              {po.po_currency}
            </span>
          </div>
        </div>
 
        {/* Meta row */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          <MetaChip icon={FiUser} label="Supplier" value={po.supplier_name} />
          <MetaChip icon={FiCalendar} label="PO Date" value={po.po_date} />
          <MetaChip icon={FiClock} label="Due" value={po.expected_due_date} />
          <MetaChip icon={FiMapPin} label="Location" value={po.location} />
          <MetaChip icon={FiTag} label="Branch" value={po.branch_id} />
        </div>
      </div>
 
      {/* Divider */}
      <div className="h-px bg-border mx-5" />
 
      {/* Items section */}
      <div className="px-5 pt-3 pb-1">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between group border border-amber-300"
        >
          <div className="flex items-center gap-2 p-2">
            <FiPackage size={14} className="text-text-light opacity-60" />
            <span className="text-xs font-semibold text-text-light uppercase tracking-wider">
              Items
            </span>
            <span className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
              {itemCount}
            </span>
          </div>
          <span className="text-text-light opacity-50 group-hover:opacity-80 transition-opacity">
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        </button>
 
        {expanded && (
          <div className="mt-2">
            {po.po_items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                currency={po.po_currency}
                isLast={idx === po.po_items.length - 1}
              />
            ))}
          </div>
        )}
      </div>
 
      {/* Footer totals */}
      <div className="mx-5 mb-4 mt-2 rounded-xl bg-primary-light border border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-light opacity-60 w-16">Subtotal</span>
              <span className="text-sm text-text font-medium">
                {formatCurrency(po.total - po.tax_amount, po.po_currency)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-light opacity-60 w-16">Tax</span>
              <span className="text-sm text-text font-medium">
                {po.tax_amount === 0 ? "—" : formatCurrency(po.tax_amount, po.po_currency)}
              </span>
            </div>
          </div>
 
          <div className="text-right">
            <p className="text-xs text-text-light opacity-60 mb-0.5">Grand Total</p>
            <p className="text-xl font-extrabold text-primary tracking-tight">
              {formatCurrency(po.total, po.po_currency)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const GRN_CARDS = ( {grn }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const columns = ["","GRN Reference", "ERP Batch", "Location", "Supplier", "Total Received (MT)", "Status"];

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const gradeColumns = ["Grade Code", "Grade Config", "Quantity (MT)", "Percentage of Total", "Unit Price (MT)", "Line Value"];

  return (
    <>
    <DataTable
      columns={columns}
      data={grn}
      renderRow={(data) => (
        <>
        <Td className={`cursor-pointer ${expandedRow === data.id ? "rotate-180" : "rotate-0"}`} onClick={() => handleRowClick(data.id)} ><IoIosArrowDown /></Td>
          <Td className="font-medium" >{data.grn_reference || "--"}</Td>
          <Td>{data.erp_batch || "--"}</Td>
          <Td>{data.storage_location || "--"}</Td>
          <Td>{data.supplier_name || "Supplier Name not found"}</Td>
          <Td>{data.total_received_mt || "--"} MT</Td>
          <Td>
            {/* <Badge1 variant={data.status === "COMPLETED" ? "success" : "warning"}>{data.status === "COMPLETED" ? "Completed" : "In Progress"}</Badge1> */}
           {data.status === "COMPLETED" ? "Completed" : "In Progress"}
          </Td>
        </>
      )}
      expandedRow={expandedRow}
      renderExpandedRow={(data) => {
        if (data.status !== "COMPLETED") {
          return (
            <div className="p-4 text-center text-text-light">
              Grading not completed yet
            </div>
          );
        }

        const gradeLines = data.grade_lines || [];
        
        if (gradeLines.length === 0) {
          return (
            <div className="p-4 text-center text-text-light">
              No grade lines available
            </div>
          );
        }

        return (
          <div className="p-4 bg-card">
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
                    <td className="p-2">{grade.grade_config || "--"}</td>
                    <td className="p-2">{grade.quantity_mt || "--"} MT</td>
                    <td className="p-2">{grade.percentage_of_total || "--"}%</td>
                    <td className="p-2">
                      {grade.unit_price_per_mt 
                        ? `₹${parseFloat(grade.unit_price_per_mt).toLocaleString()}`
                        : "--"}
                    </td>
                    <td className="p-2">
                      {grade.line_value 
                        ? `₹${parseFloat(grade.line_value).toLocaleString()}`
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
      isLoading={false}
    />

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