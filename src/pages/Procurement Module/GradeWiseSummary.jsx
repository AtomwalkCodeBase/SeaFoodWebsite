import React, { useMemo, useState } from 'react'
import DataTable, { Td } from '../../components/DataTable';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import PaginationComponent from '../../components/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { FaEye } from 'react-icons/fa';
import { FiLayers, FiPackage, FiTrendingUp, FiAlertTriangle, FiUser, FiMapPin, FiCalendar } from 'react-icons/fi';

const column = ["SPECIES", "GRADE", "TOTAL REQUIRED (MT)", "IN PROGRESS (MT)", "REMAINING (MT)", "ORDER COUNT", "URGENCY BREAKDOWN", "ACTION"];

const urgencyOrder = ["OVERDUE", "CRITICAL", "URGENT", "STANDARD", "COVERED"];

// Thresholds (in MT) for REMAINING quantity color tiers — tune these to your business scale
const REMAINING_THRESHOLDS = {
    low: 10,   // <= this  -> green (low remaining, mostly covered)
    medium: 50, // <= this -> yellow (moderate remaining)
    // above medium -> red (high remaining, needs urgent procurement)
};

const getRemainingColor = (remaining) => {
    if (remaining <= 0) return "var(--color-success)";
    if (remaining <= REMAINING_THRESHOLDS.low) return "var(--color-success)";
    if (remaining <= REMAINING_THRESHOLDS.medium) return "var(--color-warning)";
    return "var(--color-error)";
};

const getRemainingBg = (remaining) => {
    if (remaining <= REMAINING_THRESHOLDS.low) return "var(--color-success)18";
    if (remaining <= REMAINING_THRESHOLDS.medium) return "var(--color-warning)18";
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

function getSpeciesGradeLabel(speciesList, speciesConfigId) {
    const foundSpecies = speciesList.find((species) => species.item_category === speciesConfigId);
    if (!foundSpecies) return "--";
    return `${foundSpecies.scientific_name}`;
}

function SummaryStat({ icon: Icon, label, value, colorVar = "var(--color-primary)" }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--color-background-alt)",
            border: "1px solid var(--color-border)",
            borderRadius: 10, padding: "10px 14px", flex: 1,
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--color-primary-light)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Icon size={15} style={{ color: colorVar }} />
            </div>
            <div>
                <div style={{ fontSize: 10, color: "var(--color-text-light)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", lineHeight: 1.2 }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function RemainingBadge({ value }) {
    return (
        <span style={{
            display: "inline-block",
            fontWeight: 700,
            fontSize: 13,
            color: getRemainingColor(value),
            background: getRemainingBg(value),
            padding: "3px 10px",
            borderRadius: 8,
        }}>
            {value.toFixed(2)}
        </span>
    );
}

/* ── Orders-in-group Modal Content ───────────────────────── */
function GroupOrdersContent({ group, speciesList }) {
    if (!group) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "var(--color-background-alt)", border: "1px solid var(--color-border)",
                borderRadius: 10, padding: "10px 14px", marginBottom: 4,
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text)" }}>
                        {getSpeciesGradeLabel(speciesList, Number(group.species))} ({group.grade})
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-light)", marginTop: 2 }}>
                        {group.order_count} order(s) contributing to this grade
                    </div>
                </div>
                <RemainingBadge value={group.remaining} />
            </div>

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

const GradeWiseSummary = ({ data = [], speciesList = [] }) => {
    const [urgencyFilter, setUrgencyFilter] = useState("ALL");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const grouped = useMemo(() => {
        const map = {};

        data.forEach((item) => {
            const key = `${item.species}||${item.grade}`;
            if (!map[key]) {
                map[key] = {
                    species: item.species,
                    grade: item.grade,
                    total_qty: 0,
                    in_progress: 0,
                    order_count: 0,
                    urgency_counts: {},
                    orders: [],
                };
            }
            map[key].total_qty += Number(item.order_qty_mt) || 0;
            map[key].in_progress += Number(item.in_progress_mt) || 0;
            map[key].order_count += 1;
            map[key].orders.push(item);

            const u = item.procurement_urgency || "STANDARD";
            map[key].urgency_counts[u] = (map[key].urgency_counts[u] || 0) + 1;
        });

        return Object.values(map)
            .map((g) => ({
                ...g,
                remaining: g.total_qty - g.in_progress,
            }))
            .sort((a, b) => b.remaining - a.remaining);
    }, [data]);

    const filteredGrouped = useMemo(() => {
        if (urgencyFilter === "ALL") return grouped;
        return grouped.filter((g) => g.urgency_counts[urgencyFilter] > 0);
    }, [grouped, urgencyFilter]);

    const totals = useMemo(() => {
        return grouped.reduce(
            (acc, g) => {
                acc.total_qty += g.total_qty;
                acc.remaining += g.remaining;
                acc.order_count += g.order_count;
                return acc;
            },
            { total_qty: 0, remaining: 0, order_count: 0 }
        );
    }, [grouped]);

    const { currentPage, paginatedData, totalItems, handlePageChange, itemsPerPage } = usePagination(filteredGrouped, 10);

    return (
        <div>
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 mb-3">
                <SummaryStat icon={FiLayers} label="Species/Grade Combos" value={grouped.length} />
                <SummaryStat icon={FiPackage} label="Total Required" value={`${totals.total_qty.toFixed(2)} MT`} />
                <SummaryStat icon={FiTrendingUp} label="Remaining to Procure" value={`${totals.remaining.toFixed(2)} MT`} colorVar="var(--color-warning)" />
                <SummaryStat icon={FiAlertTriangle} label="Total Orders" value={totals.order_count} />
            </div>

            {/* Urgency quick filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
                {["ALL", ...urgencyOrder].map((u) => (
                    <button
                        key={u}
                        onClick={() => setUrgencyFilter(u)}
                        style={{
                            fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                            border: `1px solid ${urgencyFilter === u ? "var(--color-primary)" : "var(--color-border)"}`,
                            background: urgencyFilter === u ? "var(--color-primary-light)" : "transparent",
                            color: urgencyFilter === u ? "var(--color-primary)" : "var(--color-text-light)",
                            cursor: "pointer",
                        }}
                    >
                        {u === "ALL" ? "All" : u.charAt(0) + u.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            <DataTable
                columns={column}
                data={paginatedData}
                highlightFirstRow={true}
                renderRow={(g) => (
                    <>
                        <Td>{getSpeciesGradeLabel(speciesList, Number(g.species))}</Td>
                        <Td>{g.grade}</Td>
                        <Td>{g.total_qty.toFixed(2)}</Td>
                        <Td>{g.in_progress.toFixed(2)}</Td>
                        <Td><RemainingBadge value={g.remaining} /></Td>
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
                title={
                    selectedGroup
                        ? `Orders — ${getSpeciesGradeLabel(speciesList, Number(selectedGroup.species))} (${selectedGroup.grade})`
                        : "Orders"
                }
                width="max-w-2xl"
                showSaveButton={false}
                cancelButtonText="Close"
            >
                <GroupOrdersContent group={selectedGroup} speciesList={speciesList} />
            </Modal>
        </div>
    );
};

export default GradeWiseSummary;