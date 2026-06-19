import React, { useState } from 'react'
import { useProcurementPlan, useSpecies } from '../../hooks/useProductQueries'
import DataTable, { Td } from '../../components/Datatable';
import Button from '../../components/Button';
import { FaEye } from 'react-icons/fa';
import Modal from '../../components/Modal';
import {
  FiPackage,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiUser,
  FiTag,
  FiLayers,
  FiBox,
  FiAlertCircle,
  FiChevronRight,
  FiX,
  FiDollarSign,
  FiTruck,
} from "react-icons/fi";
import Badge from '../../components/Badge';
import PaginationComponent from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useFilter } from '../../hooks/useFilter';
import InputField from '../../components/InputField';
import Layout from '../../components/Layout';
import Card from '../../components/Card';

const column = ["ORDER REF.", "CUSTOMER", "PRODUCT", "SPECIES", "QYT(MT)", "IN PROG.(MT)", "DELIVERY DATE", "DAYS LEFT", "PROCUR. URGENCY","SUPP. COUNT", "ACTION"]

const getUrgencyVariant = (urgency) => {
  const variantMap = {
    "OVERDUE": "error",
    "CRITICAL": "error",
    "URGENT": "warning",
    "STANDARD": "info",
    "COVERED": "success"
  };
  
  return variantMap[urgency] || "info";
};

const ProcurementPlanning = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState("")
  const [procurmentUrgencyStatus, setprocurmentUrgencyStatus] = useState("ALL");
  const {data: PlanList, isLoading: PlanLoading} = useProcurementPlan();
    const { data: SpeciesList = [], isLoading: speciesLoading } = useSpecies();

  const planningFiletredData = useFilter({data: PlanList,fields: [
    "order_reference","customer","product_name", "supplier_options[].supplier_name"
  ],search,  extraFilters: {procurement_urgency: procurmentUrgencyStatus,}, })

    const getSpeciesGradeLabel = ( speciesList, speciesConfigId) => {
      const foundSpecies = speciesList.find((species) => species.item_category === speciesConfigId);
      if (!foundSpecies) return "--";

      return `${foundSpecies.scientific_name}`;
  };

  const {currentPage, paginatedData, totalItems, handlePageChange, itemsPerPage } = usePagination(planningFiletredData, 10)
  return (
    <Layout title="Procurement Planning">
      <Card>
    <div className='grid grid-cols-4 items-end gap-3 mb-3'>
      <div className='col-span-2'>
        <InputField
          label=""
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by order ref, customer, product... '
        />
      </div>

      <div className='col-span-1'>
        <InputField
          label="Status"
          type="select"
          value={procurmentUrgencyStatus}
          onChange={(e) => setprocurmentUrgencyStatus(e.target.value)}
          options={[
            { label: "All", value: "ALL" },
            { label: "Covered", value: "COVERED" },
            { label: "Critical", value: "CRITICAL" },
            { label: "Urgent", value: "URGENT" },
            { label: "Standard", value: "STANDARD" },
            { label: "Overdue", value: "OVERDUE" },
          ]}
        />
      </div>
    </div>
      

      <DataTable
      columns={column}
      data={paginatedData}
      highlightFirstRow={true}
      renderRow={(data) => (
        <>
        <Td>{data.order_reference}</Td>
        <Td>{data.customer}</Td>
        <Td>{data.product_name}</Td>
        {/* <Td>{data.species}({data.grade})</Td> */}
        <Td>{`${getSpeciesGradeLabel(SpeciesList, Number(data.species))}(${data.grade})`}</Td>
        <Td>{data.order_qty_mt}</Td>
        <Td>{data.in_progress_mt}</Td>
        <Td>{data.delivery_date}</Td>
        <Td>{data.days_until_delivery}</Td>
        <Td><Badge variant={getUrgencyVariant(data.procurement_urgency)}>{data.procurement_urgency}</Badge></Td>
        {/* <Td>{data.procurement_urgency}</Td> */}
        <Td>{data.supplier_count}</Td>
        <Td><Button iconOnly={true} title="View" onClick={() => {setIsModalOpen(true); setSelectedOrder(data)}}><FaEye /></Button></Td>
        </>
      )}
      
      />
      <PaginationComponent
        totalItems = {totalItems}
  itemsPerPage = {itemsPerPage}
  currentPage = {currentPage}
  onPageChange = {handlePageChange}
      
      />
      </Card>


      <Modal
        isOpen={isModalOpen}
        onClose={() => {setIsModalOpen(false); setSelectedOrder(null)}}
        title={`Order Details — ${selectedOrder?.order_reference}`}
        width="max-w-2xl"
        showSaveButton={false}
        cancelButtonText="Close"
      >
        <OrderDetailContent order={selectedOrder} />
      </Modal>

    </Layout>
  )
}

export default ProcurementPlanning

function fmt(n, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function SectionTitle({ icon: Icon, label, color = "var(--color-primary)" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
      <Icon size={13} style={{ color }} />
      <span style={{
        fontSize: 10, fontWeight: 700, color: "var(--color-text-light)",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </span>
    </div>
  );
}

function InfoRow({ label, value, valueStyle = {} }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <span style={{ fontSize: 12, color: "var(--color-text-light)", opacity: 0.75 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", ...valueStyle }}>{value}</span>
    </div>
  );
}
 
function StatBox({ label, value, sub, colorVar = "var(--color-text)" }) {
  return (
    <div style={{
      background: "var(--color-input-bg)",
      border: "1px solid var(--color-border)",
      borderRadius: 10, padding: "10px 12px", flex: 1,
    }}>
      <div style={{ fontSize: 10, color: "var(--color-text-light)", opacity: 0.6, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: colorVar, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--color-text-light)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
 
function UrgencyBadge({ urgency }) {
  const map = {
    URGENT:   { bg: "var(--color-error)",   text: "#fff",  label: "⚡ Urgent" },
    HIGH:     { bg: "var(--color-warning)", text: "#fff",  label: "🔶 High" },
    NORMAL:   { bg: "var(--color-success)", text: "#fff",  label: "✓ Normal" },
  };
  const c = map[urgency] || map.NORMAL;
  return (
    <span style={{
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      letterSpacing: "0.03em",
    }}>
      {c.label}
    </span>
  );
}
 
/* ── Timeline ─────────────────────────────────────────────── */
function Timeline({ order }) {
  const steps = [
    { label: "Arrive by",         date: order.must_arrive_by,            icon: FiTruck,      days: order.days_until_arrival_needed },
    { label: "Finish pre-grade",  date: order.must_finish_pre_grading,   icon: FiLayers,     days: null },
    { label: "Start post-grade",  date: order.must_start_post_grading,   icon: FiCheckCircle, days: null },
    { label: "Ship by",           date: order.must_ship_by,              icon: FiPackage,    days: null },
    { label: "Delivery",          date: order.delivery_date,             icon: FiCalendar,   days: order.days_until_delivery },
  ];
 
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      {/* vertical line */}
      <div style={{
        position: "absolute", left: 7, top: 8, bottom: 8,
        width: 2, background: "var(--color-border)", borderRadius: 2,
      }} />
 
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < steps.length - 1 ? 12 : 0, position: "relative" }}>
          {/* dot */}
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            background: i === 0 ? "var(--color-primary)" : "var(--color-background-alt)",
            border: `2px solid ${i === 0 ? "var(--color-primary)" : "var(--color-border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, zIndex: 1,
          }}>
            <s.icon size={8} style={{ color: i === 0 ? "#fff" : "var(--color-text-light)" }} />
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--color-text)", fontWeight: i === 0 || i === steps.length - 1 ? 600 : 400 }}>
              {s.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.days !== null && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: "var(--color-primary)",
                  background: "var(--color-primary-light)", borderRadius: 8, padding: "1px 6px",
                }}>
                  {s.days}d
                </span>
              )}
              <span style={{ fontSize: 12, color: "var(--color-text-light)", fontFamily: "monospace" }}>
                {fmtDate(s.date)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
 
/* ── Supplier Card ────────────────────────────────────────── */
function SupplierCard({ s, currency = "INR" }) {
  return (
    <div style={{
      border: "1px solid var(--color-border)",
      borderRadius: 12, overflow: "hidden",
      background: "var(--color-background-alt)",
    }}>
      {/* supplier header */}
      <div style={{
        padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--color-input-bg)", borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiUser size={13} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
              {s.supplier_name || `Supplier #${s.supplier_id}`}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-light)", marginTop: 1 }}>
              ID: {s.supplier_id}
            </div>
          </div>
        </div>
        {s.can_deliver_in_time
          ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-success)", background: "var(--color-success)18", padding: "3px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <FiCheckCircle size={11} /> On Time
            </span>
          : <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-error)", background: "var(--color-error)18", padding: "3px 9px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
              <FiAlertCircle size={11} /> Late Risk
            </span>
        }
      </div>
 
      {/* supplier body */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
          <InfoRow label="Grade yield"     value={`${s.grade_yield_pct}%`} />
          <InfoRow label="Lead time"       value={`${s.lead_time_days} days`} />
          <InfoRow label="Buy qty (unsorted)" value={`${s.unsorted_purchase_mt} MT`} />
          <InfoRow label="PO deadline"     value={fmtDate(s.po_deadline)} valueStyle={{ color: s.po_overdue ? "var(--color-error)" : "var(--color-text)" }} />
        </div>
        <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--color-text-light)", opacity: 0.6, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estimated Cost
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--color-primary)" }}>
              {fmt(s.estimated_cost, currency)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--color-text-light)", opacity: 0.6, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Cost / MT Grade
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
              {fmt(s.cost_per_mt_of_grade, currency)}
            </div>
          </div>
        </div>
        {!s.po_overdue && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-warning)" }}>
            <FiAlertTriangle size={11} />
            <span>PO must be raised in <strong>{s.days_until_po_deadline} day(s)</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
 
/* ── Modal Content ───────────────────────────────────────── */
function OrderDetailContent({ order }) {
  const tl = order.timeline_breakdown;
 
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
 
      {/* ── 1. Order identity ── */}
      <div>
        <SectionTitle icon={FiTag} label="Order Details" />
        <div style={{
          background: "var(--color-background-alt)",
          border: "1px solid var(--color-border)",
          borderRadius: 12, padding: "12px 14px",
        }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
                {order.order_reference}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-light)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <FiUser size={11} />{order.customer}
                <span style={{ opacity: 0.4 }}>·</span>
                <FiMapPin size={11} />{order.destination}
              </div>
            </div>
            <UrgencyBadge urgency={order.procurement_urgency} />
          </div>
 
          <div style={{ height: 1, background: "var(--color-border)", marginBottom: 10 }} />
 
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
            <InfoRow label="Product"      value={order.product_name} />
            <InfoRow label="Product Code" value={order.product_code} valueStyle={{ fontFamily: "monospace", fontSize: 12 }} />
            <InfoRow label="Grade"        value={order.grade} />
            <InfoRow label="Species"      value={order.species} />
          </div>
        </div>
      </div>
 
      {/* ── 2. Stock status ── */}
      <div>
        <SectionTitle icon={FiBox} label="Stock Status" />
        <div style={{ display: "flex", gap: 8 }}>
          <StatBox label="Ordered"    value={`${order.order_qty_mt} MT`}  sub="total order" />
          <StatBox label="Remaining"  value={`${order.remaining_mt} MT`}  sub="unfulfilled" colorVar="var(--color-warning)" />
          <StatBox label="In Stock"   value={`${order.in_stock_mt} MT`}   sub="available now" colorVar={order.in_stock_mt > 0 ? "var(--color-success)" : "var(--color-text-light)"} />
          <StatBox label="Shortfall"  value={`${order.shortfall_mt} MT`}  sub="to procure" colorVar={order.shortfall_mt > 0 ? "var(--color-error)" : "var(--color-success)"} />
        </div>
      </div>
 
      {/* ── 3. Timeline ── */}
      <div>
        <SectionTitle icon={FiClock} label="Processing Timeline" color="var(--color-secondary)" />
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 6, marginBottom: 14,
        }}>
          {[
            { label: "Pre-grading",   value: `${tl.pre_grading_days}d` },
            { label: "Grading",       value: `${tl.grading_session_days}d` },
            { label: "Post-grading",  value: `${tl.post_grading_days}d` },
            { label: "Total process", value: `${tl.total_processing_days}d` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--color-input-bg)", border: "1px solid var(--color-border)",
              borderRadius: 8, padding: "6px 10px",
            }}>
              <span style={{ fontSize: 11, color: "var(--color-text-light)" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)" }}>{value}</span>
            </div>
          ))}
        </div>
        <Timeline order={order} />
      </div>
 
      {/* ── 4. Suppliers ── */}
      <div>
        <SectionTitle icon={FiTruck} label={`Supplier Options (${order.supplier_count})`} color="var(--color-accent)" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {order.supplier_options.map(s => (
            <SupplierCard key={s.supplier_id} s={s} />
          ))}
        </div>
      </div>
 
    </div>
  );
}