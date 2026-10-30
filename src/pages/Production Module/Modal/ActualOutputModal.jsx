
import React, { useEffect, useState } from "react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";

const splitQCOptions = (value = "") => {
    const result = [];
    let current = "";
    let depth = 0;

    for (let i = 0; i < value.length; i++) {
        const char = value[i];

        if (char === "(") depth++;
        if (char === ")") depth = Math.max(0, depth - 1);

        const isSeparator =
            char === "/" &&
            depth === 0 &&
            i > 0 &&
            i < value.length - 1 &&
            /\s/.test(value[i - 1]) &&
            /\s/.test(value[i + 1]);

        if (isSeparator) {
            if (current.trim()) {
                result.push(current.trim());
            }

            current = "";
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        result.push(current.trim());
    }

    return result;
};

const formatQCLabel = (key) => {
    return key.replace(/_/g, " ");
};

const ActualOutputModal = ({
    batch,
    activity,
    activityName,
    isOpen,
    isSaving,
    onClose,
    onConfirm,
}) => {
    const [actualOutput, setActualOutput] = useState("");
    const [remarks, setRemarks] = useState("");
    const [qcValues, setQCValues] = useState({});

    const qcData = activity?.activity_qc_data || {};

    const isQCActivity = Object.keys(qcData).length > 0;

    // Reset form whenever activity changes or modal opens
    useEffect(() => {
        if (!isOpen) return;

        setActualOutput(
            activity?.actual_output_mt != null
                ? String(activity.actual_output_mt)
                : ""
        );

        setRemarks("");

        const initialQCValues = {};

        Object.keys(qcData).forEach((key) => {
            initialQCValues[key] = "";
        });

        setQCValues(initialQCValues);

    }, [isOpen, activity?.id, activityName]);

    const handleQCChange = (key, value) => {
        setQCValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            actualOutput === "" ||
            !Number.isFinite(Number(actualOutput)) ||
            Number(actualOutput) < 0
        ) {
            return;
        }

        // Validate every QC field
        if (isQCActivity) {
            const missingQC = Object.keys(qcData).some(
                (key) => !String(qcValues[key] ?? "").trim()
            );

            if (missingQC) {
                return;
            }
        }

        onConfirm({
            activity_name: activityName,
            actual_output_mt: Number(actualOutput),
            remarks: remarks.trim(),
            qc_test_required: isQCActivity
                ? qcValues
                : {},
        });
    };

    return (
        <Modal
            title={isQCActivity ? "QC Test & Actual Output" : "Enter Actual Output"}
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

                {/* Dynamic QC Fields */}
                {isQCActivity && (
                    <div className="space-y-4 mb-5">

                        <h3 className="font-semibold text-text">
                            QC Test Parameters
                        </h3>

                        {Object.entries(qcData).map(
                            ([key, value]) => {

                                const options = splitQCOptions(value);

                                const hasOptions =
                                    options.length > 1;

                                return (
                                    <div key={key}>

                                        <label className="block text-sm font-medium text-text mb-1">
                                            {formatQCLabel(key)}
                                            <span className="text-danger ml-1">
                                                *
                                            </span>
                                        </label>

                                        {hasOptions ? (
                                            <select
                                                value={qcValues[key] || ""}
                                                onChange={(e) =>
                                                    handleQCChange(
                                                        key,
                                                        e.target.value
                                                    )
                                                }
                                                required
                                                className="w-full rounded border border-border bg-background px-3 py-2"
                                            >
                                                <option value="">
                                                    Select {formatQCLabel(key)}
                                                </option>

                                                {options.map((option, index) => (
                                                    <option
                                                        key={index}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={qcValues[key] || ""}
                                                onChange={(e) =>
                                                    handleQCChange(
                                                        key,
                                                        e.target.value
                                                    )
                                                }
                                                required
                                                className="w-full rounded border border-border bg-background px-3 py-2"
                                                placeholder={`Enter ${formatQCLabel(key)}`}
                                            />
                                        )}

                                    </div>
                                );
                            }
                        )}
                    </div>
                )}

                {/* Actual Output */}
                <div className="mb-4">

                    <label className="block text-sm font-medium text-text mb-1">
                        Actual Output (MT)
                        <span className="text-danger ml-1">*</span>
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={actualOutput}
                        onChange={(e) =>
                            setActualOutput(e.target.value)
                        }
                        required
                        className="w-full rounded border border-border bg-background px-3 py-2"
                        placeholder="Enter actual output"
                    />
                </div>

                {/* Remarks */}
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
                        {isQCActivity
                            ? "Save QC & Actual Output"
                            : "Save Actual Output"}
                    </Button>

                </div>

            </form>

        </Modal>
    );
};

export default ActualOutputModal;
