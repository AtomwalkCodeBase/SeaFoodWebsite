import React, { useState } from "react";
import Modal from "../Modal";
import InputField from "../InputField";
import { toast } from "react-toastify";
import { useUpdateProcessPilling } from "../../hooks/useProductQueries";

const CompletePeelingModal = ({
    isOpen,
    onClose,
    row,
}) => {
    const [form, setForm] = useState({
        output_qty_mt: row?.output_qty_mt || "",
        completed_at: row?.completed_at || "",
        qc_notes: row?.qc_notes || "",
        qc_file: null,
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const updateMutation = useUpdateProcessPilling(onClose);

    const handleSubmit = () => {
        if (!form.output_qty_mt || Number(form.output_qty_mt) <= 0) {
            return toast.error("Please enter a valid output quantity");
        }

        if (!form.completed_at) {
            return toast.error("Please set the completed date");
        }

        const payload = new FormData();

        payload.append("output_qty_mt", form.output_qty_mt);
        payload.append("completed_at", form.completed_at);
        payload.append("qc_notes", form.qc_notes);
        payload.append("is_completed", true);

        if (form.qc_file) {
            payload.append("qc_file", form.qc_file);
        }

        updateMutation.mutate({ id: row.id, payload });
    };

    if (!row) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSubmit}
            title="Complete Peeling"
            width="max-w-xl"
            maxHeight="max-h-[75vh]"
            showSaveButton={true}
            saveButtonText="Mark Complete"
            cancelButtonText="Cancel"
        >
            <div className="grid grid-cols-2 gap-4">
                <InputField
                    label="Peeled Qty (MT)"
                    type="text"
                    value={row.pilled_qty_mt}
                    disabled
                />

                <InputField
                    label="Output Qty (MT)"
                    name="output_qty_mt"
                    type="number"
                    value={form.output_qty_mt}
                    onChange={handleChange}
                    required
                />

                <InputField
                    label="Completed At"
                    name="completed_at"
                    type="datetime-local"
                    value={form.completed_at}
                    onChange={handleChange}
                    required
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
        </Modal>
    );
};

export default CompletePeelingModal;