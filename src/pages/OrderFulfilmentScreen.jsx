import { useMemo, useState } from "react";
import {
  FiPackage, FiTruck, FiMapPin, FiCalendar, FiEye,
  FiCheckCircle, FiAlertTriangle, FiClock, FiBox,
} from "react-icons/fi";
import Modal from "../components/Modal";
import Layout from "../components/Layout";
import StatsCard from "../components/StatsCard";
import { FaBoxesStacked, FaCircleHalfStroke, FaEye } from "react-icons/fa6";
import { IoMdCheckboxOutline } from "react-icons/io";
import { IoAlertCircleOutline, IoCheckboxOutline, IoCubeOutline, IoPartlySunnyOutline } from "react-icons/io5";
import Card from "../components/Card";
import { useFilter } from "../hooks/useFilter";
import { useGetOrderFulfillment, useGrades, useOrders, useSpecies } from "../hooks/useProductQueries";
import { usePagination } from "../hooks/usePagination";
import DataTable, { Td } from "../components/Datatable";
import { Badge as Badge2 } from "../components/EmptyState";
import Badge from "../components/Badge";
import InputField from "../components/InputField";
import PaginationComponent from "../components/Pagination";
import Button from "../components/Button";
import { MdFilterAltOff } from "react-icons/md";

const fmt = {
  currency: (v) =>new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v),
  date: (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  mt: (v) => `${parseFloat(v || 0).toFixed(2)} MT`,
};


const daysStyle = (d) => d === null ? "text-textLight" : d < 0 ? "text-error font-semibold" : d <= 3 ? "text-warning font-semibold" : "text-success";

const orderStatus = (order_status) => {
    if (!order_status) return { label: "Not assigned", variant: "error" };

  const statusMap = {
    PARTIAL : {label: "Partial", variant: "info"},
    COMPLETED : {label: "Completed", variant: "success"},
    NOT_STARTED : {label: "Not Started", variant: "error"},
    }

  return statusMap[order_status] || { label: "Unknown", variant: "warning" }
}

  const getSpeciesGradeLabel = ( speciesList, gradeList, speciesConfigId) => {
    const foundGrade = gradeList.find((grade) => grade.id === speciesConfigId);
      if (!foundGrade) return "--";

      const foundSpecies = speciesList.find((species) => species.id === foundGrade.species_config);
      if (!foundSpecies) return "--";

      return `${foundSpecies.scientific_name} (${foundGrade.grade_code})`;
  };

  const variantMap = new Map([
  ["critical", "error"],
  ["urgent", "warning"],
  ["normal", "info"],
]);

function getBadgeVariant(status) {
  return variantMap.get(status.toLowerCase());
}

const ORDER_COLUMN = ["ORDER Ref./CUSTOMER", "PRODUCT(CODE)", "GRADE", "QTY", "FULFILLMENT STATUS", "DAYS LEFT", "PRIORITY", "ACTIONS"]

const OrderFulfillmentScreen = () => {
const [filters, setFilters] = useState({ search: "", priority: "ALL", status: "ALL", product: "ALL", grade: "ALL"});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { data: orderList = [], isLoading: ordersLoading } = useOrders();
  const { data: gradeList = [], isLoading: gradesLoading } = useGrades();
  const { data: SpeciesList = [], isLoading: speciesLoading } = useSpecies();
  const {
    data: fulfillmentApiData,
    isLoading: fulfillmentLoading,
  } = useGetOrderFulfillment(modalOpen && Boolean(selectedOrderId), selectedOrderId);

  const fulfillmentData = useMemo(() => {
    if (!fulfillmentApiData && !selectedOrder) return null;

    const order = fulfillmentApiData?.order ?? selectedOrder;
    return {
      order,
      fulfilled_mt: fulfillmentApiData?.fulfilled_mt ?? order?.fulfilled_qty_mt,
      remaining_mt: fulfillmentApiData?.remaining_mt ?? order?.remaining_qty_mt,
      fulfillment_pct: fulfillmentApiData?.fulfillment_pct ?? order?.fulfillment_pct,
      allocations: fulfillmentApiData?.allocations ?? [],
    };
  }, [fulfillmentApiData, selectedOrder]);

  const handleViewFulfillment = (order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order.id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    setSelectedOrderId(null);
  };

    const updatedOrderList = orderList?.map((item) => {
    let order_status = "NOT_STARTED";
  
    if (item.fulfillment_pct >= 100 || item.remaining_qty_mt === 0) {
      order_status = "COMPLETED";
    } 
    else if (item.fulfilled_qty_mt > 0 && item.remaining_qty_mt > 0) {
      order_status = "PARTIAL";
    }
  
    return {
      ...item,
      order_status,
    };
  });
  
    const orderFilteredData = useFilter({
      data: updatedOrderList, fields: [ "erp_order_reference", "customer_name", "product_name", "destination_country"],
      search: filters.search, extraFilters: { priority_override: filters.priority, product: Number(filters.product), grade_config: filters.grade, order_status: filters.status},
    });
    
    const { paginatedData, currentPage, itemsPerPage, totalItems, handlePageChange, } = usePagination(orderFilteredData, 10)
  
  return (
    <Layout title="Order Fulfillment">

      <SummaryStrip orders={orderList} />

      <Card>
<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 items-end">
  {/* Search - spans 6 columns on desktop */}
  <div className="sm:col-span-6">
    <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
    <InputField
      type="text"
      value={filters.search}
      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
      placeholder='Order ref, customer, product...'
      className="w-full"
    />
  </div>

  {/* Status filter - spans 3 columns */}
  <div className="sm:col-span-3">
    <label className="block text-xs font-medium text-gray-600 mb-1">Order Status</label>
    <InputField
      type="select"
      value={filters.status}
      onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
      options={[
        { label: "All", value: "ALL" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Partial Complete", value: "PARTIAL" },
        { label: "Not Started", value: "NOT_STARTED" },
      ]}
      className="w-full"
    />
  </div>

  {/* Clear button - spans 2 columns */}
  <div className="sm:col-span-2">
    <Button className="w-full sm:w-auto" onClick={() => setFilters({ search: "", priority: "ALL", product: "ALL", grade: "ALL", status: "ALL" })}>
      <MdFilterAltOff className="mr-1" /> Clear
    </Button>
  </div>
</div>

             <DataTable 
        columns={ORDER_COLUMN}
        data={paginatedData}
        isLoading={ordersLoading}
        emptyMessage="No orders found"
        renderRow={(order) => {
            const order_status = orderStatus(order.order_status)
            return(
            <>
              <Td>{order.customer_name}<br/><Badge2 label={order.erp_order_reference} variant='grn' /></Td>
              <Td>{order.product_name}</Td>
              <Td>{getSpeciesGradeLabel(SpeciesList, gradeList, order.grade_config)}</Td>
              <Td>{order.quantity_mt}</Td>
              <Td><Badge variant={order_status.variant}>{order_status.label}</Badge></Td>
            <Td className={`${order.days_until_delivery <= 7 ? "text-error" : order.days_until_delivery <= 10 ? 'text-warning' : 'text-success'} font-semibold`}>
              {order.days_until_delivery}d
            </Td>
              <Td>
                <Badge variant={getBadgeVariant(order.priority_override) || "primary"}>{order.priority_override || "--"}</Badge>
              </Td>
              <Td>
                <Button onClick={() => handleViewFulfillment(order)} iconOnly={true} title="View Fulfillment"><FaEye /></Button>
              </Td>
            </>
          )}}
      
      />

      <PaginationComponent
          totalItems = {totalItems}
          itemsPerPage = {itemsPerPage}
          currentPage = {currentPage}
          onPageChange ={handlePageChange}
          showPageSize = {true}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={`Fulfillment - ${selectedOrder?.customer_name || ""} (${selectedOrder?.erp_order_reference || ""})`}
        width="max-w-2xl"
        showSaveButton={false}
        cancelButtonText="Close"
      >
        <FulfillmentModalContent data={fulfillmentData} loading={fulfillmentLoading} />
      </Modal>
    </Layout>
  );
};

export default OrderFulfillmentScreen;


const SummaryStrip = ({ orders }) => {
  const total     = orders.length;
  const fulfilled = orders.filter((o) => parseFloat(o.fulfillment_pct) >= 100).length;
  const overdue   = orders.filter((o) => o.days_until_delivery < 0).length;
  const partial   = orders.filter((o) => parseFloat(o.fulfillment_pct) > 0 && parseFloat(o.fulfillment_pct) < 100).length;

  const pills = [
{ label: "Total Orders", value: total, color: "primary", icon: <IoCubeOutline /> },
{ label: "Fulfilled",    value: fulfilled, color: "success", icon: <IoCheckboxOutline /> },
{ label: "Partial",      value: partial, color: "info", icon:  <FaCircleHalfStroke />  },
{ label: "Overdue",      value: overdue, color: "error", icon: <IoAlertCircleOutline /> },
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-5">
      {pills.map((p) => (
        <StatsCard label={p.label} value={p.value} color={p.color} icon={p.icon}/>
      ))}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, valueClass = "text-text" }) => (
  <div className="flex items-start gap-2">
    <Icon size={13} className="text-textLight mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-textLight">{label}</p>
      <p className={`text-xs font-semibold truncate ${valueClass}`}>{value}</p>
    </div>
  </div>
);

const ProgressBar = ({ pct, colorClass = "bg-primary" }) => (
  <div className="w-full h-2 bg-background-alt rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

const StatPill = ({ label, value, valueClass }) => (
  <div className="bg-backgroundAlt rounded-lg px-3 py-2 text-center">
    <p className="text-xs text-textLight">{label}</p>
    <p className={`text-sm font-bold mt-0.5 ${valueClass || "text-text"}`}>{value}</p>
  </div>
);

const AllocationRow = ({ alloc, index }) => (
  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-backgroundAlt transition-colors">
    {/* index */}
    <span className="text-xs text-textLight w-5 text-center">{index + 1}</span>

    {/* batch + date */}
    <div className="min-w-0">
      <p className="text-xs font-semibold text-primary truncate">{alloc.batch_number}</p>
      <p className="text-xs text-textLight">{fmt.date(alloc.allocated_at)}</p>
    </div>

    {/* qty */}
    <span className="text-sm font-bold text-text whitespace-nowrap">{fmt.mt(alloc.allocated_qty_mt)}</span>

    {/* dispatch status */}
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
      alloc.dispatched
        ? "bg-green-100 text-success border-green-200"
        : "bg-backgroundAlt text-textLight border-border"
    }`}>
      {alloc.dispatched ? "Dispatched" : "Pending"}
    </span>
  </div>
);

const FulfillmentModalContent = ({ data, loading = false }) => {
  if (loading) return <p className="text-center text-textLight py-8 text-sm">Loading…</p>;
  if (!data) return <p className="text-center text-textLight py-8 text-sm">No fulfillment data found.</p>;

  const { order, fulfilled_mt, remaining_mt, fulfillment_pct, allocations } = data;
  const pct      = parseFloat(fulfillment_pct || 0);
  const barColor = pct >= 100 ? "bg-success" : pct > 0 ? "bg-primary" : "bg-backgroundAlt";
  const ps = order.priority_override.toLowerCase();

  return (
    <div className="space-y-4">
      {/* order summary */}
      <div className="bg-accentLight border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-primary">{order.erp_order_reference}</span>
          <Badge2 label={order.priority_override} variant={ps} />
        </div>

        <div>
          <p className="text-base font-semibold text-text">{order.product_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-primaryLight text-primary font-semibold px-2 py-0.5 rounded-full">
              {order.product_code}
            </span>
            <span className="text-xs bg-backgroundAlt text-textLight font-semibold px-2 py-0.5 rounded-full">
              {order.grade_code}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          <InfoRow icon={FiPackage}  label="Total Qty"   value={fmt.mt(order.quantity_mt)} />
          <InfoRow icon={FiCalendar} label="Delivery"    value={fmt.date(order.delivery_date)} />
          <InfoRow icon={FiMapPin}   label="Destination" value={`${order.destination_port}, ${order.destination_country}`} />
          <InfoRow
            icon={FiClock}
            label="Days left"
            value={order.days_until_delivery < 0 ? `${Math.abs(order.days_until_delivery)}d overdue` : `${order.days_until_delivery}d left`}
            valueClass={daysStyle(order.days_until_delivery)}
          />
        </div>
      </div>

      {/* fulfillment stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <StatPill label="Fulfilled" value={fmt.mt(fulfilled_mt)} valueClass="text-success" />
        <StatPill label="Remaining" value={fmt.mt(remaining_mt)} valueClass={remaining_mt > 0 ? "text-error" : "text-textLight"} />
        <StatPill label="Progress"  value={`${pct.toFixed(0)}%`} valueClass={pct >= 100 ? "text-success" : "text-primary"} />
      </div>

      {/* progress bar */}
      <div className="py-2">
        <ProgressBar pct={pct} colorClass={barColor} />
        <p className="text-xs text-textLight mt-1 text-right">{pct.toFixed(1)}% complete</p>
      </div>

      {/* allocations table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-backgroundAlt">
          <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <FiBox size={13} className="text-primary" /> Batch Allocations
          </span>
          <span className="text-xs text-textLight">{allocations?.length || 0} batches</span>
        </div>

        {allocations?.length > 0 ? (
          allocations.map((alloc, i) => <AllocationRow key={alloc.id} alloc={alloc} index={i} />)
        ) : (
          <p className="text-center text-textLight text-sm py-6">No allocations yet</p>
        )}
      </div>
    </div>
  );
};