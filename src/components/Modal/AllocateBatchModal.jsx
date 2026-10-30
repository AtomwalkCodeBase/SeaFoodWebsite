import React, { useMemo, useState } from "react";
import Button from "../Button";
import Modal from "../Modal";
import { useProduct } from "../../hooks/useProductQueries";


export default function AllocateBatchModal({
    isOpen,
    batch,
    orders = [],
    onClose,
    onConfirm,
    isSaving = false,
}) {
    const totalAvailable = Number(batch.actual_output_mt || 0);
    const totalUnallocated = Number(batch.unallocated_mt || 0);

    // Fetch product list when modal opens
    const {
        data: productList = [],
        isLoading: productsLoading,
    } = useProduct(isOpen);

    const [allocations, setAllocations] = useState({});
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [allocationError, setAllocationError] = useState("");

    // Match product with order product code
    const getOrderProduct = (order) => {
        return productList.find(
            (product) =>
                product.product_code === order.product_code
        );
    };

    // Calculate total allocated MT
    const allocatedSoFar = useMemo(() => {
        return Object.values(allocations).reduce(
            (sum, allocation) =>
                sum + Number(allocation.mt || 0),
            0
        );
    }, [allocations]);

    const remaining = totalUnallocated - allocatedSoFar;

    // Update packet count and calculated MT
const handleChange = (order, value) => {
    const packets = Math.max(
        0,
        Math.floor(Number(value) || 0)
    );

    const product = getOrderProduct(order);

    const mt = calculatePacketMT(
        packets,
        product?.base_unit
    );

    const orderPlanId = getOrderPlanId(order);

    setAllocations((prev) => ({
        ...prev,
        [orderPlanId]: {
            packets,
            mt,
        },
    }));
};

    // Select / deselect orders
const handleSelectOrder = (id, isSelected) => {
    if (isSelected) {
        setSelectedOrders([id]);
    } else {
        setSelectedOrders([]);
        setAllocations((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    }
};

    // Validate allocation
    const handleSubmit = () => {
        const selectedAllocations = Object.entries(allocations)
            .filter(([, allocation]) => allocation.packets > 0);

        if (selectedAllocations.length === 0) {
            setAllocationError(
                "Enter packet count for at least one order."
            );
            return;
        }

        let totalMT = 0;

        for (const [orderId, allocation] of selectedAllocations) {
            const order = orders.find(
                (o) => String(o.id) === String(orderId)
            );

            if (!order) continue;

            const product = getOrderProduct(order);

            if (!product) {
                setAllocationError(
                    `Product not found for order ${order.erp_order_reference}.`
                );
                return;
            }

            if (allocation.mt <= 0) {
                setAllocationError(
                    `Invalid base unit for product ${order.product_code}.`
                );
                return;
            }

            if (
                allocation.mt >
                Number(order.remaining_qty_mt || 0) + 0.0000001
            ) {
                setAllocationError(
                    `Allocation exceeds remaining quantity for order ${order.erp_order_reference}.`
                );
                return;
            }

            totalMT += allocation.mt;
        }

        if (totalMT > totalUnallocated + 0.0000001) {
            setAllocationError(
                `Cannot allocate more than ${totalUnallocated.toFixed(3)} MT. Please reduce the packet count.`
            );
            return;
        }

        onConfirm(allocations);
    };

    return (
        <Modal
            title="Allocate batch output to orders"
            width="max-w-2xl"
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSubmit}
            saveButtonText={`Confirm allocation (${allocatedSoFar.toFixed(3)} MT)`}
            saveDisabled={
                allocatedSoFar <= 0 ||
                remaining < -0.0000001 ||
                isSaving ||
                productsLoading
            }
        >

            {/* Batch summary */}
            <div className="grid grid-cols-3 gap-2">

                <div className="rounded-xl bg-backgroundAlt p-4">
                    <p className="text-xs text-text-light uppercase">
                        Batch output
                    </p>

                    <p className="text-xl font-bold text-success mt-2">
                        {totalAvailable.toFixed(3)} MT
                    </p>
                </div>

                <div className="rounded-xl bg-backgroundAlt p-4">
                    <p className="text-xs text-text-light uppercase">
                        Total Unallocated
                    </p>

                    <p className="text-xl font-bold text-accent mt-2">
                        {totalUnallocated.toFixed(3)} MT
                    </p>
                </div>

                <div className="rounded-xl bg-backgroundAlt p-4">
                    <p className="text-xs text-text-light uppercase">
                        Allocated so far
                    </p>

                    <p className="text-xl font-bold text-secondary mt-2">
                        {allocatedSoFar.toFixed(3)} MT
                    </p>
                </div>

            </div>

            <p className="text-text-light mt-3 mb-2 text-sm font-semibold">
                Select orders and enter the number of packets.
            </p>

            {productsLoading ? (
                <p className="text-sm text-text-light py-4">
                    Loading products...
                </p>
            ) : (
                <div className="space-y-3">

                    {orders.map((o) => {
                        const orderPlanId = getOrderPlanId(o);

                        const allocation = allocations[orderPlanId] || {
    packets: 0,
    mt: 0,
}

                        const isSelected = selectedOrders.includes(orderPlanId);

                        const product = getOrderProduct(o);

                        return (
                            <div
                                key={o.id}
                                className={`rounded-xl border p-4 bg-backgroundAlt mb-3 ${
                                    isSelected
                                        ? "border-primary border-2"
                                        : "border-border"
                                }`}
                            >

                                <div className="flex items-center justify-between gap-4">

                                    {/* Order details */}
                                    <div className="flex items-center gap-4">

                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) =>
    handleSelectOrder(
        orderPlanId,
        e.target.checked
    )
}
                                            className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
                                        />

                                        <div>

                                            <div className="flex items-center gap-2">

                                                <p className="font-semibold text-text">
                                                    {o.erp_order_reference}
                                                </p>

                                                <span className="text-xs px-2 py-1 rounded-full bg-danger/10 text-danger">
                                                    {o.priority_override}
                                                </span>

                                            </div>

                                            <p className="text-sm text-text-light mt-1">
                                                {o.customer_name} · needs{" "}
                                                {o.remaining_qty_mt} MT
                                            </p>

                                            <p className="text-xs text-text-light mt-1">
                                                {o.product_name} ({o.product_code})
                                            </p>

                                            <p className="text-xs text-text-light mt-1">
                                                Base Unit:{" "}
                                                {product?.base_unit || "Product not found"}
                                            </p>

                                        </div>
                                    </div>

                                    {/* Packet input and calculated MT */}
                                    <div className="flex items-center gap-3">

                                        <div>
                                            <label className="block text-xs text-text-light mb-1">
                                                Packets
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="0"
                                                value={
                                                    allocation.packets || ""
                                                }
                                                disabled={selectedOrders.length > 0 && !isSelected}
                                                onChange={(e) =>
    handleChange(o, e.target.value)
}
                                                className={`w-24 bg-background border border-border rounded-lg px-3 py-2 ${
                                                    !isSelected
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-text-light mb-1">
                                                Quantity (MT)
                                            </label>

                                            <input
                                                type="text"
                                                value={allocation.mt.toFixed(3)}
                                                readOnly
                                                disabled={selectedOrders.length > 0 && !isSelected}
                                                className="w-28 bg-backgroundAlt border border-border rounded-lg px-3 py-2 opacity-80"
                                            />
                                        </div>

                                    </div>

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

            {/* Validation error */}
            {allocationError && (
                <div className="rounded-xl bg-danger/10 text-danger px-4 py-3 text-sm mt-3">
                    {allocationError}
                </div>
            )}

            {/* Remaining output */}
            {remaining < -0.0000001 ? (
                <div className="rounded-xl bg-error/10 text-error px-4 py-3 text-sm mt-3">
                    Cannot allocate more than the Total Unallocated (
                    {totalUnallocated.toFixed(3)} MT).
                    Please reduce the allocations.
                </div>
            ) : (
                <div className="rounded-xl bg-info/8 text-info px-4 py-3 text-sm mt-3">
                    {Math.max(0, remaining).toFixed(3)} MT unallocated
                    — will remain in finished goods inventory.
                </div>
            )}

        </Modal>
    );
}

const getOrderPlanId = (order) => order.order_plan_id ?? order.id;

// Convert product base unit into MT per packet
const getPacketQuantityInMT = (baseUnit) => {
    if (!baseUnit) return 0;

    const unit = String(baseUnit)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

    if (unit === "MT") {
        return 1;
    }

    const match = unit.match(/^(\d*\.?\d+)KG$/);

    if (match) {
        const kg = Number(match[1]);

        return kg / 1000;
    }

    return 0;
};

// Calculate total MT from packet count
const calculatePacketMT = (packets, baseUnit) => {
    const packetCount = Number(packets);
    const packetMT = getPacketQuantityInMT(baseUnit);

    if (!Number.isFinite(packetCount) || packetCount < 0) {
        return 0;
    }

    return packetCount * packetMT;
};