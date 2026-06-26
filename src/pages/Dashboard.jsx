import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import DataTable, { Td } from "../components/Datatable";
import InputField from "../components/InputField";
import Button from "../components/Button";
import Modal from "../components/Modal";
import PaginationComponent from "../components/Pagination";
import StatsCard from "../components/StatsCard";
import Badge from "../components/Badge";

import { FaEye } from "react-icons/fa";
import {
  IoCubeOutline,
  IoAlertCircleOutline,
  IoCheckboxOutline,
} from "react-icons/io5";
import { FaBoxesStacked, FaCircleHalfStroke } from "react-icons/fa6";

import { useFilter } from "../hooks/useFilter";
import { usePagination } from "../hooks/usePagination";
import { useDashboardSummary, useActiveAlerts } from "../hooks/useProductQueries";

const ALERT_COLUMNS = [
  "SEVERITY",
  "CATEGORY",
  "TITLE",
  "MESSAGE",
  "CREATED",
  "ACTION",
];

const Dashboard = () => {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: dashboardData = {}, isLoading } = useDashboardSummary();

  const { data: alerts = [] } = useActiveAlerts();

  const orders = dashboardData.orders || {};
  const production = dashboardData.production || {};
  const alertSummary = dashboardData.alerts || {};

  const filteredAlerts = useFilter({
    data: alerts,
    fields: ["severity", "category", "title", "message"],
    search,
  });

  const finalAlerts = useMemo(() => {
    if (severityFilter === "ALL") return filteredAlerts;

    return filteredAlerts.filter(
      (item) => item.severity === severityFilter
    );
  }, [filteredAlerts, severityFilter]);

  const {
    currentPage,
    paginatedData,
    totalItems,
    itemsPerPage,
    handlePageChange,
  } = usePagination(finalAlerts, 10);

  const summaryCards = [
    {
      label: "Active Orders",
      value: orders.total_active || 0,
      color: "primary",
      icon: <IoCubeOutline />,
    },
    {
      label: "Demand (MT)",
      value: orders.total_demand_mt || 0,
      color: "success",
      icon: <FaBoxesStacked />,
    },
    {
      label: "At Risk Orders",
      value: orders.at_risk || 0,
      color: "error",
      icon: <IoAlertCircleOutline />,
    },
    {
      label: "Active Batches",
      value: production.batches_active || 0,
      color: "info",
      icon: <FaCircleHalfStroke />,
    },
    {
      label: "Completed Today",
      value: production.completed_today || 0,
      color: "success",
      icon: <IoCheckboxOutline />,
    },
    {
      label: "Critical Alerts",
      value: alertSummary.critical || 0,
      color: "error",
      icon: <IoAlertCircleOutline />,
    },
  ];

  return (
    <Layout title="Dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {summaryCards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            color={card.color}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Alerts Section */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 items-end">
          <div className="md:col-span-8">
            <InputField
              label="Search"
              type="text"
              value={search}
              placeholder="Search alerts..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <InputField
              label="Severity"
              type="select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              options={[
                { label: "All", value: "ALL" },
                { label: "Critical", value: "CRITICAL" },
                { label: "Warning", value: "WARNING" },
                { label: "Info", value: "INFO" },
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={ALERT_COLUMNS}
          data={paginatedData}
          loading={isLoading}
          highlightFirstRow={false}
          renderRow={(item) => (
            <>
              <Td>
                <Badge
                  variant={
                    item.severity === "CRITICAL"
                      ? "error"
                      : item.severity === "WARNING"
                      ? "warning"
                      : "info"
                  }
                >
                  {item.severity}
                </Badge>
              </Td>

              <Td>{item.category}</Td>

              <Td>{item.title}</Td>

              <Td>
                <div className="max-w-[300px] truncate">
                  {item.message}
                </div>
              </Td>

              <Td>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-GB")
                  : "--"}
              </Td>

              <Td>
                <Button
                  iconOnly
                  title="View"
                  onClick={() => {
                    setSelectedAlert(item);
                    setIsModalOpen(true);
                  }}
                >
                  <FaEye />
                </Button>
              </Td>
            </>
          )}
        />

        <PaginationComponent
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* Alert Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedAlert(null);
          setIsModalOpen(false);
        }}
        title="Alert Details"
        showSaveButton={false}
        cancelButtonText="Close"
      >
        {selectedAlert && (
          <div className="space-y-3">
            <div>
              <strong>Severity:</strong>{" "}
              {selectedAlert.severity}
            </div>

            <div>
              <strong>Category:</strong>{" "}
              {selectedAlert.category}
            </div>

            <div>
              <strong>Title:</strong>{" "}
              {selectedAlert.title}
            </div>

            <div>
              <strong>Message:</strong>
              <div className="mt-1">
                {selectedAlert.message}
              </div>
            </div>

            <div>
              <strong>Resolved:</strong>{" "}
              {selectedAlert.is_resolved ? "Yes" : "No"}
            </div>

            <div>
              <strong>Created At:</strong>{" "}
              {new Date(
                selectedAlert.created_at
              ).toLocaleString("en-GB")}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Dashboard;