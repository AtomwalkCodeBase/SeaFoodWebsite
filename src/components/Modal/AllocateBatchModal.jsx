import React, { useMemo, useState } from "react";
import Button from "../Button";
import Modal from "../Modal";

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

  const [allocations, setAllocations] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);

  const allocatedSoFar = useMemo(() => {
    return Object.values(allocations).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
  }, [allocations]);

  const remaining = totalUnallocated - allocatedSoFar;

  const handleChange = (id, value) => {
    const num = Number(value || 0);

    setAllocations((prev) => ({
      ...prev,
      [id]: num,
    }));
  };

  const handleSelectOrder = (id, isSelected) => {
    if (isSelected) {
      setSelectedOrders((prev) => [...prev, id]);
    } else {
      setSelectedOrders((prev) => prev.filter((orderId) => orderId !== id));
      setAllocations((prev) => {
        const newAllocations = { ...prev };
        delete newAllocations[id];
        return newAllocations;
      });
    }
  };

  return (
    <Modal
      title="Allocate batch output to orders"
      width="max-w-2xl"
      isOpen={isOpen}
      onClose={onClose}
      onSave={() => onConfirm(allocations)}
      saveButtonText={` Confirm allocation (${allocatedSoFar.toFixed(3)} MT)`}
      saveDisabled={allocatedSoFar <= 0 || remaining < 0 || isSaving}
    >
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

      <p className="text-text-light mt-3 mb-1 ml-2 text-sm font-semibold">**Click the checkbox to allocate batch output to orders**</p>

      <div className="space-y-3">
        {orders.map((o) => {
          const value = allocations[o.id] || "";
          const isSelected = selectedOrders.includes(o.id);

          return (
            <div
              key={o.id}
              className={`rounded-xl border p-4 bg-backgroundAlt mb-3 ${isSelected ? "border-primary border-2": "border-border bg-background-alt/40"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={selectedOrders.length > 0 && !isSelected}
                    onChange={(e) => handleSelectOrder(o.id, e.target.checked)}
                    className={`w-5 h-5 rounded border-border accent-primary ${
                      selectedOrders.length > 0
                        ? isSelected
                          ? 'cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}/>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isSelected ? "text-text" : "text-text/50"}`}>
                        {o.erp_order_reference}
                      </p>

                      <span className="text-xs px-2 py-1 rounded-full bg-danger/10 text-danger">
                        {o.priority_override}
                      </span>
                    </div>

                    <p className="text-sm text-text-light mt-1">
                      {o.customer_name} · needs {o.remaining_qty_mt} MT
                    </p>

                    <p className="text-xs text-text-light mt-1">
                      {o.product_name} ({o.product_code})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={o.remaining_qty_mt}
                    value={value}
                    disabled={!isSelected}
                    onChange={(e) =>
                      handleChange(o.id, e.target.value)
                    }
                    className={`w-24 bg-background border border-border rounded-lg px-3 py-2 ${!isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />

                  <span className="text-sm text-text-light">
                    MT
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {remaining < 0 ? (
        <div className="rounded-xl bg-error/10 text-error px-4 py-3 text-sm">
          Cannot allocate more than the Total Unallocated ({totalUnallocated.toFixed(3)} MT). Please reduce the allocations.
        </div>
      ) : (
        <div className="rounded-xl bg-info/8 text-info px-4 py-3 text-sm">
          {remaining.toFixed(3)} MT unallocated — will remain in finished goods inventory
        </div>
      )}
    </Modal>
  );
}