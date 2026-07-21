import React from "react";
import Modal from "../Modal";
import DataTable, { Td } from "../DataTable";
import { usePeelingCenters, useProcessPillingList } from "../../hooks/useProductQueries";

const ViewPeelingCenter = ({
    isOpen,
    onClose,
    purchaseData,
}) => {

    const { data: processList = [], isLoading } =
        useProcessPillingList(purchaseData?.id);

    const { data: peelingCenters = [] } =
        usePeelingCenters();

    const columns = [
        "Peeling Center",
        "Peeled Qty (MT)",
        "Output Qty (MT)",
        "Performed By",
        "Completed At",
        "Received At",
        "Created Date",
        "QC File"
    ];

    const getCenter = (id) =>
        peelingCenters.find(center => center.id === id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Peeling Centers"
            width="max-w-6xl"
            maxHeight="max-h-[80vh]"
            showSaveButton={false}
        >

            <DataTable
                columns={columns}
                data={processList}
                isLoading={isLoading}
                emptyMessage="No Peeling Centers Found"
                renderRow={(item) => {

                    const center = getCenter(item.pilling_center);

                    return (
                        <>
                            <Td>
                                {center
                                    ? `${center.name} - ${center.place}`
                                    : "--"}
                            </Td>

                            <Td>{item.pilled_qty_mt}</Td>

                            <Td>{item.output_qty_mt}</Td>

                            <Td>{item.performed_by || "--"}</Td>

                            <Td>
                                {item.completed_at
                                    ? new Date(item.completed_at).toLocaleString()
                                    : "--"}
                            </Td>

                            <Td>
                                {item.received_at
                                    ? new Date(item.received_at).toLocaleString()
                                    : "--"}
                            </Td>

                            <Td>
                                {new Date(item.created_at).toLocaleDateString()}
                            </Td>

                            <Td>
                                {item.qc_file ? (
                                    <a
                                        href={item.qc_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        View
                                    </a>
                                ) : (
                                    "--"
                                )}
                            </Td>
                        </>
                    );
                }}
            />

        </Modal>
    );
};

export default ViewPeelingCenter;