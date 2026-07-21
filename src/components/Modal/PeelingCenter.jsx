import React, { useState } from "react";
import Modal from "../Modal";
import InputField from "../InputField";
import Button from "../Button";
import { useAddProcessPilling } from "../../hooks/useProductQueries";
import { toast } from "react-toastify";
import { usePeelingCenters, useAddPeelingCenter } from "../../hooks/useProductQueries";

const EMPTY_ROW = {
    pilling_center_id: "",
    pilled_qty_mt: "",
    output_qty_mt: "",
};
const EMPTY_FORM = {
    peelingRows: [EMPTY_ROW],
    performed_by: "",
    completed_at: "",
    received_at: "",
    qc_notes: "",
    qc_file: null,
};
const PeelingCenter = ({
    isOpen,
    onClose,
    purchaseData,
}) => {
    const { data: peelingCenters = [], isLoading } = usePeelingCenters();
    const [form, setForm] = useState(EMPTY_FORM);
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };
    const handleRowChange = (index, e) => {
        const { name, value } = e.target;
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
                    output_qty_mt: "",
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
            row =>
                !row.pilling_center_id ||
                !row.pilled_qty_mt ||
                Number(row.pilled_qty_mt) <= 0 ||
                !row.output_qty_mt ||
                Number(row.output_qty_mt) <= 0
        );

        if (hasInvalidRow) {
            return toast.error("Please complete all rows.");
        }

        try {
            for (const row of form.peelingRows) {
                const payload = new FormData();

                payload.append("po_request", purchaseData.id);
                payload.append("pilling_center", row.pilling_center_id);
                payload.append("pilled_qty_mt", row.pilled_qty_mt);
                payload.append("output_qty_mt", row.output_qty_mt);
                payload.append("performed_by", form.performed_by);
                payload.append("completed_at", form.completed_at);
                payload.append("received_at", form.received_at);
                payload.append("qc_notes", form.qc_notes);

                if (form.qc_file) {
                    payload.append("qc_file", form.qc_file);
                }

                await addPeelingMutation.mutateAsync(payload);
            }

            toast.success("All peeling centers added successfully!");
            handleClose();

        } catch (error) {
            // The hook's onError already handles displaying the error.
        }
        // };
    };
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            onSave={handleSubmit}
            title="Add Peeling Center"
            width="max-w-2xl"
            maxHeight="max-h-[75vh]"
            showSaveButton={true}
            saveButtonText="Save"
            cancelButtonText="Cancel"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="Purchase Request"
                        type="text"
                        value={purchaseData?.po_ref_number || ""}
                        disabled
                    />

                    <div className="col-span-2 space-y-4">
                        {form.peelingRows.map((row, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 space-y-4"
                            >
                                {/* Row Fields */}
                                <div className="grid grid-cols-2 gap-2">
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
                                        label="Peeled Qty (MT)"
                                        name="pilled_qty_mt"
                                        type="number"
                                        value={row.pilled_qty_mt}
                                        onChange={(e) => handleRowChange(index, e)}
                                    />

                                    <InputField
                                        label="Output Qty (MT)"
                                        name="output_qty_mt"
                                        type="number"
                                        value={row.output_qty_mt}
                                        onChange={(e) => handleRowChange(index, e)}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-2">
                                    {form.peelingRows.length > 1 && (
                                        <Button
                                            size="sm"
                                            variant="outlines"
                                            onClick={() => removePeelingRow(index)}
                                        >
                                            Remove
                                        </Button>
                                    )}

                                    {index === form.peelingRows.length - 1 && (
                                        <Button
                                            size="sm"
                                            onClick={addPeelingRow}
                                        >
                                            Add
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <InputField
                        label="Performed By"
                        name="performed_by"
                        type="text"
                        value={form.performed_by}
                        onChange={handleChange}
                    />
                    <InputField
                        label="Completed At"
                        name="completed_at"
                        type="datetime-local"
                        value={form.completed_at}
                        onChange={handleChange}
                    />

                    <InputField
                        label="Received At"
                        name="received_at"
                        type="datetime-local"
                        value={form.received_at}
                        onChange={handleChange}
                    />

                    <div className="col-span-2">
                        <InputField
                            label="QC Notes"
                            name="qc_notes"
                            type="text"
                            value={form.qc_notes}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="col-span-2">
                        <InputField
                            label="QC File"
                            name="qc_file"
                            type="file"
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};
export default PeelingCenter;