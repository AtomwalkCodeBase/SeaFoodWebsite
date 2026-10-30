import React, { useState } from "react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const ActualOutputModal = ({
    batch,
    activity,
    activityName,
    isOpen,
    isSaving,
    onClose,
    onConfirm,
}) => {
    const [actualOutput, setActualOutput] = useState(
        activity?.actual_output_mt || ""
    );

    const [remarks, setRemarks] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!actualOutput || Number(actualOutput) < 0) {
            return;
        }

        onConfirm({
            activity_name: activityName,
            actual_output_mt: Number(actualOutput),
            remarks: remarks.trim(),
        });
    };

    return (
        <Modal
            title="Enter Actual Output"
            width="max-w-2xl"
            isOpen={isOpen}
            onClose={onClose}
            showSaveButton={false}
            cancelButtonText={null}
        >
            <div className="space-y-3 mb-5">
                <div>
                    <span className="text-sm text-text-light">
                        Batch
                    </span>
                    <p className="font-medium text-text">
                        {batch.batch_number}
                    </p>
                </div>

                <div>
                    <span className="text-sm text-text-light">
                        Activity
                    </span>
                    <p className="font-medium text-text">
                        {activityName}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-sm text-text-light">
                            Input
                        </span>
                        <p className="font-medium text-text">
                            {activity?.input_weight_mt ?? "--"} MT
                        </p>
                    </div>

                    <div>
                        <span className="text-sm text-text-light">
                            Expected Output
                        </span>
                        <p className="font-medium text-text">
                            {activity?.expected_output_mt ?? "--"} MT
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-text mb-1">
                        Actual Output (MT)
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={actualOutput}
                        onChange={(e) => setActualOutput(e.target.value)}
                        className="w-full rounded border border-border bg-background px-3 py-2"
                        placeholder="Enter actual output"
                        autoFocus
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-sm font-medium text-text mb-1">
                        Remarks
                    </label>

                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full rounded border border-border bg-background px-3 py-2"
                        rows={3}
                        placeholder="Optional remarks"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        variant="secondary"
                        loading={isSaving}
                        disable={isSaving}
                    >
                        Save Actual Output
                    </Button>
                </div>
            </form>

        </Modal>
    );
};

export default ActualOutputModal;
