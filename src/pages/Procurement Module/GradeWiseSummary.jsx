import React, { useMemo, useState } from 'react'
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import DataTable, { Td } from '../../components/Datatable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import PaginationComponent from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useInventoryCategory } from '../../hooks/useProductQueries';
import { getInventoryStatus } from '../../services/productServices';
import { FaEye } from 'react-icons/fa';
import { FiPackage, FiTrendingUp, FiAlertTriangle, FiUser, FiCalendar, FiBox } from 'react-icons/fi';
import StatsCard from "../../components/StatsCard";

const column = ["SPECIES", "GRADE", "REQUIRED (MT)", "IN STOCK (MT)", "COMMITTED (MT)", "AVAILABLE (MT)", "SHORTFALL (MT)", "ORDER COUNT", "URGENCY BREAKDOWN", "ACTION"];

const urgencyOrder = ["OVERDUE", "CRITICAL", "URGENT", "STANDARD", "COVERED"];

// Thresholds (in MT) for SHORTFALL color tiers — tune these to your business scale
const SHORTFALL_THRESHOLDS = {
    low: 10,    // <= this  -> green (small shortfall / mostly covered)
    medium: 50, // <= this  -> yellow (moderate shortfall)
    // above medium -> red (large shortfall, needs urgent procurement)
};

const getShortfallColor = (shortfall) => {
    if (shortfall <= 0) return "var(--color-success)";
    if (shortfall <= SHORTFALL_THRESHOLDS.low) return "var(--color-success)";
    if (shortfall <= SHORTFALL_THRESHOLDS.medium) return "var(--color-warning)";
    return "var(--color-error)";
};

const getShortfallBg = (shortfall) => {
    if (shortfall <= SHORTFALL_THRESHOLDS.low) return "var(--color-success)18";
    if (shortfall <= SHORTFALL_THRESHOLDS.medium) return "var(--color-warning)18";
    return "var(--color-error)18";
};

const getUrgencyVariant = (urgency) => {
    const variantMap = {
        OVERDUE: "error",
        CRITICAL: "error",
        URGENT: "warning",
        STANDARD: "info",
        COVERED: "success",
    };
    return variantMap[urgency] || "info";
};

function ShortfallBadge({ value }) {
    return (
        <span style={{
            display: "inline-block",
            fontWeight: 700,
            fontSize: 13,
            color: getShortfallColor(value),
            background: getShortfallBg(value),
            padding: "3px 10px",
            borderRadius: 8,
        }}>
            {value.toFixed(2)}
        </span>
    );
}

/* ── Orders-in-group Modal Content ───────────────────────── */
function GroupOrdersContent({ group }) {
    if (!group) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
                background: "var(--color-background-alt)", border: "1px solid var(--color-border)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 4,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>
                            {group.species_name} ({group.grade})
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-light)", marginTop: 2 }}>
                            {group.orders.length} order(s) contributing to this grade
                        </div>
                    </div>
                    <ShortfallBadge value={group.shortfall} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px 10px", fontSize: 12 }}>
                    <div>
                        <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>Required: </span>
                        <span style={{ fontWeight: 600 }}>{group.required.toFixed(2)} MT</span>
                    </div>
                    <div>
                        <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>In Stock: </span>
                        <span style={{ fontWeight: 600 }}>{group.in_stock.toFixed(2)} MT</span>
                    </div>
                    <div>
                        <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>Committed: </span>
                        <span style={{ fontWeight: 600 }}>{group.committed.toFixed(2)} MT</span>
                    </div>
                    <div>
                        <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>Available: </span>
                        <span style={{ fontWeight: 600 }}>{group.available.toFixed(2)} MT</span>
                    </div>
                </div>
            </div>

            {group.orders.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--color-text-light)", textAlign: "center", padding: "10px 0" }}>
                    No open orders currently linked to this species/grade.
                </div>
            )}

            {group.orders.map((o) => (
                <div key={o.order_reference} style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 10, padding: "10px 14px",
                    background: "var(--color-background-alt)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                                {o.order_reference}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--color-text-light)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                                <FiUser size={10} />{o.customer}
                            </div>
                        </div>
                        <Badge variant={getUrgencyVariant(o.procurement_urgency)}>{o.procurement_urgency}</Badge>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 10px", fontSize: 12 }}>
                        <div>
                            <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>Qty: </span>
                            <span style={{ fontWeight: 600 }}>{o.order_qty_mt} MT</span>
                        </div>
                        <div>
                            <span style={{ color: "var(--color-text-light)", opacity: 0.7 }}>In Prog: </span>
                            <span style={{ fontWeight: 600 }}>{o.in_progress_mt} MT</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FiCalendar size={10} style={{ color: "var(--color-text-light)" }} />
                            <span style={{ fontWeight: 600 }}>{o.delivery_date}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const GradeWiseSummary = ({ data = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const { data: inventoryCategoryList = [] } = useInventoryCategory();

    const { data: inventoryGrades = [], isLoading: inventoryLoading } = useQuery({
        queryKey: ["inventory"],
        queryFn: () => getInventoryStatus(),
        select: (res) => {
            const payload = res?.data || res;
            return (payload?.grades || []).map((item) => ({
                grade: item.grade_code || "-",
                species: item.species,
                in_stock: item.in_stock_mt ?? 0,
                committed: item.committed_mt ?? 0,
                available: item.available_mt ?? 0,
                required: item.required_mt ?? 0,
                shortfall: item.shortfall_mt ?? 0,
                purchase_qty: item.purchase_needed_mt ?? 0,
                estimated_cost: item.estimated_cost || (item.price_per_mt * item.purchase_needed_mt) || 0,
                orders: item.active_orders ?? 0,
            }));
        },
        onError: () => toast.error("Failed to load inventory"),
    });

    const getSpeciesName = (speciesId) => {
        const found = inventoryCategoryList?.find((s) => s.id === Number(speciesId));
        return found?.name || "Unknown Species";
    };

    // Group procurement orders by species+grade — used only for order-level drill-down (count, urgency, list)
    const orderGroupsMap = useMemo(() => {
        const map = {};
        data.forEach((item) => {
            const key = `${item.species}||${item.grade}`;
            if (!map[key]) {
                map[key] = { order_count: 0, urgency_counts: {}, orders: [] };
            }
            map[key].order_count += 1;
            map[key].orders.push(item);
            const u = item.procurement_urgency || "STANDARD";
            map[key].urgency_counts[u] = (map[key].urgency_counts[u] || 0) + 1;
        });
        return map;
    }, [data]);

    // Inventory API is the source of truth for required/in_stock/committed/available/shortfall
    const grouped = useMemo(() => {
        return inventoryGrades
            .map((inv) => {
                const key = `${inv.species}||${inv.grade}`;
                const orderInfo = orderGroupsMap[key] || { order_count: 0, urgency_counts: {}, orders: [] };
                return {
                    ...inv,
                    species_name: getSpeciesName(inv.species),
                    ...orderInfo,
                };
            })
            .sort((a, b) => b.shortfall - a.shortfall);
    }, [inventoryGrades, orderGroupsMap, inventoryCategoryList]);

    const totals = useMemo(() => {
        return grouped.reduce(
            (acc, g) => {
                acc.required += g.required;
                acc.in_stock += g.in_stock;
                acc.shortfall += g.shortfall;
                acc.order_count += g.order_count;
                return acc;
            },
            { required: 0, in_stock: 0, shortfall: 0, order_count: 0 }
        );
    }, [grouped]);

    const { currentPage, paginatedData, totalItems, handlePageChange, itemsPerPage } = usePagination(grouped, 10);

    return (
        <div>
            {/* Summary stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1rem",
                }}
            >
                <StatsCard
                    icon={<FiPackage />}
                    label="Total Required"
                    value={`${totals.required.toFixed(2)} MT`}
                    color="primary"
                />

                <StatsCard
                    icon={<FiBox />}
                    label="Total In Stock"
                    value={`${totals.in_stock.toFixed(2)} MT`}
                    color="success"
                />

                <StatsCard
                    icon={<FiAlertTriangle />}
                    label="Total Shortfall"
                    value={`${totals.shortfall.toFixed(2)} MT`}
                    color="error"
                />

                <StatsCard
                    icon={<FiTrendingUp />}
                    label="Total Orders"
                    value={totals.order_count}
                    color="warning"
                />
            </div>

            <DataTable
                columns={column}
                data={paginatedData}
                isLoading={inventoryLoading}
                highlightFirstRow={true}
                renderRow={(g) => (
                    <>
                        <Td>{g.species_name}</Td>
                        <Td>{g.grade}</Td>
                        <Td>{g.required.toFixed(2)}</Td>
                        <Td>{g.in_stock.toFixed(2)}</Td>
                        <Td>{g.committed.toFixed(2)}</Td>
                        <Td>{g.available.toFixed(2)}</Td>
                        <Td><ShortfallBadge value={g.shortfall} /></Td>
                        <Td>{g.order_count}</Td>
                        <Td>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {urgencyOrder
                                    .filter((u) => g.urgency_counts[u] > 0)
                                    .map((u) => (
                                        <Badge key={u} variant={getUrgencyVariant(u)}>
                                            {u} ({g.urgency_counts[u]})
                                        </Badge>
                                    ))}
                            </div>
                        </Td>
                        <Td>
                            <Button
                                iconOnly={true}
                                title="View Orders"
                                onClick={() => { setSelectedGroup(g); setIsModalOpen(true); }}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedGroup(null); }}
                title={selectedGroup ? `Orders — ${selectedGroup.species_name} (${selectedGroup.grade})` : "Orders"}
                width="max-w-2xl"
                showSaveButton={false}
                cancelButtonText="Close"
            >
                <GroupOrdersContent group={selectedGroup} />
            </Modal>
        </div>
    );
};

export default GradeWiseSummary;