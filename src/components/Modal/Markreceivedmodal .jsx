import React, { useState } from "react";
import Modal from "../Modal";
import InputField from "../InputField";
import { toast } from "react-toastify";
import { useUpdateProcessPilling } from "../../hooks/useProductQueries";

const MarkReceivedModal = ({
    isOpen,
    onClose,
    row,
}) => {
    const [form, setForm] = useState({
        received_at: "",
        received_by: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const updateMutation = useUpdateProcessPilling(onClose);

    const handleSubmit = () => {
        if (!form.received_at) {
            return toast.error("Please set the received date");
        }

        const payload = new FormData();

        payload.append("is_received", true);
        payload.append("received_at", form.received_at);
        payload.append("received_by", form.received_by);

        updateMutation.mutate({ id: row.id, payload });
    };

    if (!row) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSave={handleSubmit}
            title="Mark as Received"
            width="max-w-md"
            maxHeight="max-h-[75vh]"
            showSaveButton={true}
            saveButtonText="Mark Received"
            cancelButtonText="Cancel"
        >
            <div className="grid grid-cols-1 gap-4">
                <InputField
                    label="Peeled Qty (MT)"
                    type="text"
                    value={row.pilled_qty_mt}
                    disabled
                />

                <InputField
                    label="Received At"
                    name="received_at"
                    type="datetime-local"
                    value={form.received_at}
                    onChange={handleChange}
                    required
                />

                <InputField
                    label="Received By"
                    name="received_by"
                    type="text"
                    value={form.received_by}
                    onChange={handleChange}
                />
            </div>
        </Modal>
    );
};

export default MarkReceivedModal;