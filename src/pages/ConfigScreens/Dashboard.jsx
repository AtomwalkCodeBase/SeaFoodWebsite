import React, { useMemo, useState } from "react";
import Layout from "../../components/Layout";
import Card from "../../components/Card";
import DataTable, { Td } from "../../components/Datatable";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import PaginationComponent from "../../components/Pagination";
import StatsCard from "../../components/StatsCard";
import Badge from "../../components/Badge";

import { FaEye } from "react-icons/fa";
import {
  IoCubeOutline,
  IoAlertCircleOutline,
  IoCheckboxOutline,
} from "react-icons/io5";
import { FaBoxesStacked, FaCircleHalfStroke } from "react-icons/fa6";

import { useFilter } from "../../hooks/useFilter";
import { usePagination } from "../../hooks/usePagination";
import { useDashboardSummary, useActiveAlerts,} from "../../hooks/useProductQueries";
import { useNavigate } from "react-router-dom";

const SEVERITY_OPTIONS = [
  { label: "All Severity", value: "ALL" },
  { label: "Critical", value: "CRITICAL" },
  { label: "Warning", value: "WARNING" },
  { label: "Info", value: "INFO" },
];

const SEVERITY_VARIANT = {
  CRITICAL: "error",
  WARNING: "warning",
  INFO: "info",
};

const ALERT_COLUMNS = [ "ORDER", "PRODUCT", "ISSUE", "DAYS LEFT", "ACTION NEEDED", "SEVERITY", "RAISED ON", "",];

const parseAlertMessage = (message = "") => {
  const parts = message.split("—").map((s) => s.trim());
  const client = parts[0] || "—";

  const productRaw = parts[1] || "";
  const productMatch = productRaw.match(/^(\S+)\s+(\d+\/\d+)$/);
  const productCode = productMatch ? productMatch[1] : productRaw;
  const productProgress = productMatch ? productMatch[2] : "";

  const timeline = parts[2] || "";
  const daysLeftMatch = timeline.match(/([\d.]+)d left/);
  const needsMatch = timeline.match(/needs ([\d.]+)d/);
  const daysLeft = daysLeftMatch ? parseFloat(daysLeftMatch[1]) : null;
  const daysNeeded = needsMatch ? parseFloat(needsMatch[1]) : null;

  return { client, productCode, productProgress, daysLeft, daysNeeded };
};

const parseOrderRef = (title = "") => {
  const match = title.match(/(SALE-\d{4}-\d+)/i);
  return match ? match[1] : title;
};

const getDaysLeftColor = (days) => {
  if (days === null) return "text-muted";
  if (days <= 1) return "text-error font-semibold";
  if (days <= 3) return "text-warning font-semibold";
  return "text-success";
};


const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [selectedAlert, setSelectedAlert] = useState(null);

  const { data: dashboardData = {}, isLoading } = useDashboardSummary();
  const { data: alerts = [] } = useActiveAlerts();

  const { orders = {}, production = {}, alerts: alertSummary = {} } = dashboardData;

  const filteredAlerts = useFilter({
    data: alerts,
    fields: ["severity", "category", "title", "message"],
    search,
  });

  const finalAlerts = useMemo(
    () =>
      severityFilter === "ALL"
        ? filteredAlerts
        : filteredAlerts.filter((a) => a.severity === severityFilter),
    [filteredAlerts, severityFilter]
  );

  const { currentPage, paginatedData, totalItems, itemsPerPage, handlePageChange } =
    usePagination(finalAlerts, 10);

  return (
    <Layout title="Dashboard">
      <SummaryCards
        orders={orders}
        production={production}
        alertSummary={alertSummary}
      />

      <Card>
        <AlertFilters
          search={search}
          setSearch={setSearch}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
        />

        <DataTable
          columns={ALERT_COLUMNS}
          data={paginatedData}
          loading={isLoading}
          highlightFirstRow={false}
          renderRow={(item) => (
            <AlertTableRow
              item={item}
              onView={(alert) => setSelectedAlert(alert)}
            />
          )}
        />

        <PaginationComponent
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      <AlertDetailModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </Layout>
  );
};

export default Dashboard;

const SummaryCards = ({ orders, production, alertSummary }) => {
  const navigate = useNavigate();
  const cards = [
    {
      label: "Active Orders",
      value: orders.total_active ?? 0,
      color: "primary",
      icon: <IoCubeOutline />,
    },
    {
      label: "Demand (MT)",
      value: orders.total_demand_mt ?? 0,
      color: "success",
      icon: <FaBoxesStacked />,
    },
    {
      label: "At Risk Orders",
      value: orders.at_risk ?? 0,
      color: "error",
      icon: <IoAlertCircleOutline />,
    },
    {
      label: "Active Batches",
      value: production.batches_active ?? 0,
      color: "info",
      icon: <FaCircleHalfStroke />,
      onClick: () => navigate("/current-active"),
    },
    {
      label: "Batch Completed Today",
      value: production.completed_today ?? 0,
      color: "success",
      icon: <IoCheckboxOutline />,
      onClick: () => navigate("/current-active"),
    },
    {
      label: "Critical Alerts",
      value: alertSummary.critical ?? 0,
      color: "error",
      icon: <IoAlertCircleOutline />,
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {cards.map((card) => (
        <StatsCard key={card.label} {...card} />
      ))}
    </div>
  );
};

const AlertFilters = ({ search, setSearch, severityFilter, setSeverityFilter }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 items-end">
    <div className="md:col-span-8">
      <InputField
        label="Search"
        type="text"
        value={search}
        placeholder="Search by order, product, client..."
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
    <div className="md:col-span-4">
      <InputField
        label="Severity"
        type="select"
        value={severityFilter}
        onChange={(e) => setSeverityFilter(e.target.value)}
        options={SEVERITY_OPTIONS}
      />
    </div>
  </div>
);

const AlertTableRow = ({ item, onView }) => {
  const orderRef = parseOrderRef(item.title);
  const { client, productCode, productProgress, daysLeft, daysNeeded } = parseAlertMessage(item.message);

  const actionNeeded =
    daysLeft !== null && daysNeeded !== null
      ? `Needs ${daysNeeded}d of work (${daysNeeded - daysLeft > 0 ? `${(daysNeeded - daysLeft).toFixed(1)}d overdue` : "on track"})`
      : item.message;

  return (
    <>
      <Td>
        <div className="font-semibold text-primary">{orderRef}</div>
        <div className="text-xs text-muted">{client}</div>
      </Td>

      <Td>
        <div className="font-medium">{productCode}</div>
        {productProgress && ( <div className="text-xs text-muted">Qty: {productProgress}</div>)}
      </Td>

      <Td>
        <div className="text-sm">{item.category?.replace(/_/g, " ")}</div>
      </Td>

      <Td>
        {daysLeft !== null ? (
          <span className={getDaysLeftColor(daysLeft)}>{daysLeft}d</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </Td>

      <Td>
        <div className="text-sm max-w-55">{actionNeeded}</div>
      </Td>

      <Td>
        <Badge variant={SEVERITY_VARIANT[item.severity] ?? "info"}>
          {item.severity}
        </Badge>
      </Td>

      <Td>
        {item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "—"}
      </Td>

      <Td>
        <Button iconOnly title="View Details" onClick={() => onView(item)}>
          <FaEye />
        </Button>
      </Td>
    </>
  );
};

const ModalField = ({ label, value, className = "" }) => (
  <div>
    <div className="text-xs text-text-light uppercase tracking-wide mb-1">
      {label}
    </div>
    <div className={`text-sm font-semibold ${className}`}>{value ?? "—"}</div>
  </div>
);

const ModalSection = ({ title, children }) => (
  <div>
    <div className="text-xs font-semibold text-text-light uppercase tracking-widest mb-2 mt-4 pb-1 border-b border-border">
      {title}
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  </div>
);

const AlertDetailModal = ({ alert, isOpen, onClose }) => {
  if (!alert) return null;

  const orderRef = parseOrderRef(alert.title);
  const { client, productCode, productProgress, daysLeft, daysNeeded } = parseAlertMessage(alert.message);
  const overdueBy = daysLeft !== null && daysNeeded !== null ? daysNeeded - daysLeft : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alert Details"
      showSaveButton={false}
      cancelButtonText="Close"
    >
      {/* ── Urgency Banner ── */}
      <div
        className={`rounded-lg px-4 py-3 mb-4 flex items-center justify-between
          ${alert.severity === "CRITICAL"
            ? "bg-error/10 border border-error/30"
            : alert.severity === "WARNING"
            ? "bg-warning/10 border border-warning/30"
            : "bg-info/10 border border-info/30"
          }`}
      >
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">
            Order at Risk
          </div>
          <div className="text-base font-bold text-primary">{orderRef}</div>
          <div className="text-sm text-muted">{client}</div>
        </div>
        <div className="text-right">
          <Badge variant={SEVERITY_VARIANT[alert.severity] ?? "info"}>
            {alert.severity}
          </Badge>
          {daysLeft !== null && (
            <div className={`text-2xl font-bold mt-1 ${getDaysLeftColor(daysLeft)}`}>
              {daysLeft}d left
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* ── Order Info ── */}
        <ModalSection title="Order Info">
          <ModalField label="Order Reference" value={orderRef} />
          <ModalField label="Client" value={client} />
          <ModalField label="Product Code" value={productCode} />
          <ModalField
            label="Qty Progress"
            value={productProgress || "—"}
          />
        </ModalSection>

        {/* ── Timeline & Action ── */}
        <ModalSection title="Timeline & Action Required">
          <ModalField
            label="Days Remaining"
            value={daysLeft !== null ? `${daysLeft}d` : "—"}
            className={getDaysLeftColor(daysLeft)}
          />
          <ModalField
            label="Work Needed"
            value={daysNeeded !== null ? `${daysNeeded}d` : "—"}
          />
          <ModalField
            label="Overdue By"
            value={
              overdueBy !== null
                ? overdueBy > 0
                  ? `${overdueBy.toFixed(1)}d`
                  : "On track"
                : "—"
            }
            className={overdueBy > 0 ? "text-error" : "text-success"}
          />
          <ModalField
            label="Issue Type"
            value={alert.category?.replace(/_/g, " ")}
          />
        </ModalSection>

        {/* ── Status ── */}
        <ModalSection title="Status">
          <ModalField
            label="Resolved"
            value={alert.is_resolved ? "Yes" : "No"}
            className={alert.is_resolved ? "text-success" : "text-error"}
          />
          <ModalField
            label="Raised On"
            value={new Date(alert.created_at).toLocaleString("en-GB")}
          />
        </ModalSection>
      </div>
    </Modal>
  );
};
