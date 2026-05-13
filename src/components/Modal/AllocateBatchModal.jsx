import React, { useMemo, useState } from "react";
import Button from "../Button";
import Modal from "../Modal";

export default function AllocateBatchModal({
	isOpen,
  batch,
  orders = [],
  onClose,
  onConfirm,
}) {
  const totalAvailable = Number(batch.actual_output_mt || 0);

  const [allocations, setAllocations] = useState({});

  const allocatedSoFar = useMemo(() => {
    return Object.values(allocations).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
  }, [allocations]);

  const remaining = totalAvailable - allocatedSoFar;

  const handleChange = (id, value) => {
    const num = Number(value || 0);

    setAllocations((prev) => ({
      ...prev,
      [id]: num,
    }));
  };

  return (
	<Modal title="Allocate batch output to orders" width="max-w-xl" isOpen={isOpen} onClose={onClose} onSave={() => onConfirm(allocations)} saveButtonText={` Confirm allocation (${allocatedSoFar.toFixed(3)} MT)`}>
    {/* <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-background border border-border p-5 space-y-5">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text">
              Allocate batch output to orders
            </h2>

            <p className="text-sm text-text-light mt-1">
              {batch.batch_number} · {batch.grade_code}
            </p>
          </div>

          <button onClick={onClose}>✕</button>
        </div> */}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-backgroundAlt p-4">
            <p className="text-xs text-text-light uppercase">
              Batch output available
            </p>

            <p className="text-3xl font-bold text-success mt-2">
              {totalAvailable.toFixed(3)} MT
            </p>
          </div>

          <div className="rounded-xl bg-backgroundAlt p-4">
            <p className="text-xs text-text-light uppercase">
              Allocated so far
            </p>

            <p className="text-3xl font-bold text-secondary mt-2">
              {allocatedSoFar.toFixed(3)} MT
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {orders.map((o) => {
            const value = allocations[o.id] || "";

            return (
              <div
                key={o.id}
                className="rounded-xl border border-border p-4 bg-backgroundAlt"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text">
                        {o.order_number}
                      </p>

                      <span className="text-xs px-2 py-1 rounded-full bg-danger/10 text-danger">
                        {o.priority}
                      </span>
                    </div>

                    <p className="text-sm text-text-light mt-1">
                      {o.customer_name} · needs {o.pending_qty_mt} MT
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={o.pending_qty_mt}
                      step={0.001}
                      value={value}
                      onChange={(e) =>
                        handleChange(o.id, e.target.value)
                      }
                      className="w-36"
                    />

                    <input
                      type="number"
                      step="0.001"
                      value={value}
                      onChange={(e) =>
                        handleChange(o.id, e.target.value)
                      }
                      className="w-24 bg-background border border-border rounded-lg px-3 py-2"
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

        <div className="rounded-xl bg-warning/10 text-warning px-4 py-3 text-sm">
          {remaining.toFixed(3)} MT unallocated — will remain in finished goods inventory
        </div>

        {/* <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            className="flex-1"
            disabled={allocatedSoFar <= 0 || remaining < 0}
            onClick={() => onConfirm(allocations)}
          >
            Confirm allocation ({allocatedSoFar.toFixed(3)} MT)
          </Button>
        </div> */}
      {/* </div>
    </div> */}
	</Modal>
  );
}