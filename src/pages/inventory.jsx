import React from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import StatsCard from "../components/StatsCard";
import Card from "../components/Card";
import DataTable, { Td } from "../components/Datatable";

import { FaBoxes, FaSnowflake, FaExclamationTriangle, FaMoneyBillWave,} from "react-icons/fa";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,} from "recharts";
import { getInventoryProjection, getInventoryStatus } from "../services/productServices";
import { SectionHeader } from "../components/EmptyState";
import { useInventoryCategory } from "../hooks/useProductQueries";
import { formatNumber } from "../utils";

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
`;

const inventoryColumns = [ "GRADE", "SPECIES", "IN STOCK", "COMMITTED", "AVAILABLE", "REQUIRED", "SHORTFALL", "PURCHASE", "EST. COST", "ORDERS",];

const formatValue = (val) =>
  val !== null && val !== undefined ? val : "-";

const Inventory = () => {
    const { data: inventoryCategoryList = [], isLoading: inventoryCategoryLoading } = useInventoryCategory();
  const {
    data: inventoryData = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventoryStatus(),
    select: (res) => {
      const payload = res?.data || res;

      // Map grades with proper field names
      const grades = (payload?.grades || []).map((item) => ({
        grade: item.grade_code || "-",
        species: item.species || "-",

        in_stock: item.in_stock_mt ?? 0,
        committed: item.committed_mt ?? 0,
        available: item.available_mt ?? 0,
        required: item.required_mt ?? 0,

        shortfall: item.shortfall_mt ?? 0,
        purchase_qty: item.purchase_needed_mt ?? 0,

        // Auto calculate cost if backend gives 0
        estimated_cost:
          item.estimated_cost ||
          (item.price_per_mt * item.purchase_needed_mt) ||
          0,

        orders: item.active_orders ?? 0,
      }));

      return {
        grades,
        summary: payload?.summary || {},
      };
    },
    onError: () => toast.error("Failed to load inventory"),
  });

  const safeData = Array.isArray(inventoryData?.grades) ? inventoryData?.grades : [];

  // 🔷 METRICS
  const totalStock = safeData.reduce(
    (sum, item) => sum + Number(item.in_stock),
    0
  );

  // const totalShortfall = safeData.reduce(
  //   (sum, item) => sum + Number(item.shortfall),
  //   0
  // );

  // const totalCost = safeData.reduce(
  //   (sum, item) => sum + Number(item.estimated_cost),
  //   0
  // );

  // 🔷 PROJECTION API (FIXED)
  const { data: projectionData = [] } = useQuery({
    queryKey: ["inventoryProjection"],
    queryFn: () => getInventoryProjection(14),
    select: (res) => {
      const payload = res?.data;

      // console.log("PROJECTION API 👉", payload);

      // adjust based on backend response
      const data =
        payload?.projection ||
        payload?.data ||
        payload?.results ||
        [];

      return data.map((item, index) => ({
        day: `D${item.day ?? index}`,
        stock: item.stock ?? item.stock_mt ?? 0,
      }));
    },
  });

  const metrics = [
    {
      label: "TOTAL IN STOCK",
      value: `${totalStock.toFixed(1)} MT`,
      color: "success",
      icon: <FaBoxes />,
    },
    {
      label: "COLD STORAGE",
      value: `${inventoryData?.summary?.cold_storage_capacity_mt} MT`,
      color: "info",
      icon: <FaSnowflake />,
    },
    {
      label: "GRADES SHORT",
      value: `${inventoryData?.summary?.total_shortfall_grades}`,
      color: "error",
      icon: <FaExclamationTriangle />,
    },
    {
      label: "PROCUREMENT COST",
      value: `${formatNumber(inventoryData?.summary?.total_procurement_cost)}`,
      color: "primary",
      icon: <FaMoneyBillWave />,
    },
  ];

  if (error) {
    return (
      <Layout title="Inventory Status">
        <div className="text-red-500 p-4">
          Failed to load inventory
        </div>
      </Layout>
    );
  }
  
  const getSpeciesName = (speciesId) => {
    const data = inventoryCategoryList?.find((data) => data.id === Number(speciesId));
    return data?.name || 'Unknown Species';
  }

  return (
    <Layout title="Inventory Status">
      {/* 🔷 Stats */}
      <StatsGrid>
        {metrics.map((m, idx) => (
          <StatsCard key={idx} {...m} />
        ))}
      </StatsGrid>

      {/* 🔷 TABLE */}
      <Card style={{ marginTop: "1.5rem" }}>
        <SectionHeader title="Grade-wise Inventory" />

        <DataTable
          columns={inventoryColumns}
          data={safeData}
          isLoading={isLoading}
          emptyMessage="No inventory data"
          renderRow={(item) => (
            <>
              <Td className="text-blue-400 font-medium">
                {item.grade}
              </Td>
              <Td>{getSpeciesName(item.species)}</Td>

              <Td className="text-green-400 font-semibold">
                {formatValue(item.in_stock)}
              </Td>

              <Td className="text-yellow-400 font-semibold">
                {formatValue(item.committed)}
              </Td>

              <Td className="text-cyan-400 font-semibold">
                {formatValue(item.available)}
              </Td>

              <Td>{formatValue(item.required)}</Td>

              <Td
                className={
                  item.shortfall > 0
                    ? "text-red-400 font-semibold"
                    : ""
                }
              >
                {formatValue(item.shortfall)}
              </Td>

              <Td>{formatValue(item.purchase_qty)}</Td>

              <Td>
                {item.estimated_cost !== null &&
                item.estimated_cost !== undefined
                  ? `₹${Number(item.estimated_cost).toLocaleString()}`
                  : "-"}
              </Td>

              <Td>{formatValue(item.orders)}</Td>
            </>
          )}
        />
      </Card>

      {/* 🔷 CHART */}
      <Card style={{ marginTop: "1.5rem" }}>
        <SectionHeader title="14-day stock projection" />

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="day" />
              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="stock"
                stroke="#3b82f6"
                strokeWidth={2}
              />

              <ReferenceLine
                y={50}
                stroke="red"
                strokeDasharray="4 4"
                label="50 MT cap"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Layout>
  );
};

export default Inventory;