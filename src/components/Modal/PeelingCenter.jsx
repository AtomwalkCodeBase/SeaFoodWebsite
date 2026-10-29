import React, { useState } from "react";
import Modal from "../Modal";
import InputField from "../InputField";
import Button from "../Button";
import { useAddProcessPilling, useProcessPillingList } from "../../hooks/useProductQueries";
import { toast } from "react-toastify";
import { usePeelingCenters, useAddPeelingCenter } from "../../hooks/useProductQueries";

const EMPTY_ROW = {
    pilling_center_id: "",
    pilled_qty_mt: "",
    performed_by: "",
};

const EMPTY_FORM = {
    peelingRows: [EMPTY_ROW],
};

const PeelingCenter = ({
    isOpen,
    onClose,
    purchaseData,
}) => {
    const { data: peelingCenters = [], isLoading } = usePeelingCenters();
    const { data: existingProcessList = [] } =
        useProcessPillingList(purchaseData?.id);

    const [form, setForm] = useState(EMPTY_FORM);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const totalPRQty = purchaseData?.po_items?.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    ) || 0;

    const alreadyPeeledQty = existingProcessList.reduce(
        (sum, item) => sum + Number(item.pilled_qty_mt || 0),
        0
    );

    const remainingQty = totalPRQty - alreadyPeeledQty;

    const handleRowChange = (index, e) => {
        const { name, value } = e.target;

        if (name === "pilled_qty_mt") {
            const newQty = Number(value || 0);

            const otherRowsQty = form.peelingRows.reduce(
                (sum, row, i) =>
                    i === index
                        ? sum
                        : sum + Number(row.pilled_qty_mt || 0),
                0
            );

            if (otherRowsQty + newQty > remainingQty) {
                toast.error(`Only ${remainingQty} MT quantity is available`);
                return;
            }
        }

        setForm((prev) => ({
            ...prev,
            peelingRows: prev.peelingRows.map((row, i) =>
                i === index
                    ? {
                        ...row,
                        [name]: value,
                    }
                    : row
            ),
        }));
    };

    const addPeelingRow = () => {
        setForm((prev) => ({
            ...prev,
            peelingRows: [
                ...prev.peelingRows,
                {
                    pilling_center_id: "",
                    pilled_qty_mt: "",
                    performed_by: "",
                },
            ],
        }));
    };

    const removePeelingRow = (index) => {
        setForm((prev) => ({
            ...prev,
            peelingRows: prev.peelingRows.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const handleClose = () => {
        setForm(EMPTY_FORM);
        onClose();
    };

    const addPeelingMutation = useAddProcessPilling(handleClose);

    const handleSubmit = async () => {
        if (!purchaseData?.id) {
            return toast.error("Purchase request not selected");
        }

        const hasInvalidRow = form.peelingRows.some(
            (row) =>
                !row.pilling_center_id ||
                !row.pilled_qty_mt ||
                Number(row.pilled_qty_mt) <= 0 ||
                !row.performed_by?.trim()
        );

        if (hasInvalidRow) {
            return toast.error(
                "Please select a center, enter a valid quantity and performed by."
            );
        }

        const newPilledQty = form.peelingRows.reduce(
            (sum, row) => sum + Number(row.pilled_qty_mt || 0),
            0
        );

        if (newPilledQty > remainingQty) {
            return toast.error(
                `Only ${remainingQty} MT quantity is available`
            );
        }

        try {
            for (const row of form.peelingRows) {
                const payload = new FormData();

                payload.append("po_request", purchaseData.id);
                payload.append("pilling_center", row.pilling_center_id);
                payload.append("pilled_qty_mt", row.pilled_qty_mt);
                payload.append("performed_by", row.performed_by);
                // payload.append("is_received", true);

                await addPeelingMutation.mutateAsync(payload);
            }

            toast.success("All peeling centers added successfully!");
            handleClose();

        } catch (error) {
            // The hook's onError already handles displaying the error.
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            onSave={handleSubmit}
            title="Add Peeling Center"
            width="max-w-3xl"
            maxHeight="max-h-[80vh]"
            showSaveButton={remainingQty > 0}
            saveButtonText="Save"
            cancelButtonText="Cancel"
        >
            <div className="space-y-5">
                {/* Top Details */}
                <div className="grid grid-cols-2 gap-4 items-end">
                    <InputField
                        label="Purchase Request"
                        type="text"
                        value={purchaseData?.po_ref_number || ""}
                        disabled
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available Quantity
                        </label>
                        <div className="h-10 px-3 flex items-center rounded-md border bg-gray-50 font-semibold">
                            {remainingQty} MT
                        </div>
                    </div>
                </div>

                {/* Peeling Centers */}
                <div className="space-y-4">
                    {form.peelingRows.map((row, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 p-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Peeling Center {index + 1}
                                </h3>

                                {form.peelingRows.length > 1 && (
                                    <Button
                                        size="sm"
                                        variant="outlines"
                                        onClick={() => removePeelingRow(index)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Peeling Center"
                                    name="pilling_center_id"
                                    type="select"
                                    value={row.pilling_center_id}
                                    onChange={(e) => handleRowChange(index, e)}
                                    options={peelingCenters
                                        .filter((item) => item.is_active)
                                        .map((item) => ({
                                            value: item.id,
                                            label: `${item.name} - ${item.place}`,
                                        }))}
                                />

                                <InputField
                                    label="Peeling Qty (MT)"
                                    name="pilled_qty_mt"
                                    type="number"
                                    value={row.pilled_qty_mt}
                                    onChange={(e) => handleRowChange(index, e)}
                                />

                                <div className="col-span-2">
                                    <InputField
                                        label="Collected BY"
                                        name="performed_by"
                                        type="text"
                                        value={row.performed_by}
                                        onChange={(e) => handleRowChange(index, e)}
                                    />
                                </div>
                            </div>

                            {index === form.peelingRows.length - 1 && (
                                <div className="flex justify-end mt-4">
                                    <Button
                                        size="sm"
                                        onClick={addPeelingRow}
                                    >
                                        + Add Center
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default PeelingCenter;