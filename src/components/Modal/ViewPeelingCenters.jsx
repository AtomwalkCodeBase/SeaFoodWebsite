import React, { useState } from "react";
import Modal from "../Modal";
import DataTable, { Td } from "../Datatable";
import Button from "../Button";
import Badge from "../Badge";
import CompletePeelingModal from "./CompletePeelingModal";
import MarkReceivedModal from "./Markreceivedmodal ";
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

    const [completingRow, setCompletingRow] = useState(null);
    const [receivingRow, setReceivingRow] = useState(null);
    const showActionColumn = processList.some(item => !item.is_received);
    const columns = [
        "Peeling Center",
        "Peeled Qty (MT)",
        "Output Qty (MT)",
        "Collected By",
        "Created Date",
        "Status",
        "Completed At",
        "Received At",
        "Received By",
        "QC File",
    ];
    if (showActionColumn) {
        columns.push("Action");
    }

    const getCenter = (id) =>
        peelingCenters.find(center => center.id === id);

    const getStatus = (item) => {
        if (item.is_received) {
            return <Badge variant="success">Received</Badge>;
        }

        if (item.is_completed) {
            return <Badge variant="info">Completed</Badge>;
        }
        return <Badge variant="warning">Peeling in progress</Badge>;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Peeling Centers"
                width="max-w-7xl"
                maxHeight="max-h-[90vh]"
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
                                        : "❌"}
                                </Td>

                                <Td>{item.pilled_qty_mt}</Td>

                                <Td>{item.output_qty_mt || "❌"}</Td>

                                <Td>{item.performed_by || "❌"}</Td>
                                <Td>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Td>
                                <Td>{getStatus(item)}</Td>
                                <Td>
                                    {item.completed_at
                                        ? new Date(item.completed_at).toLocaleString()
                                        : "❌"}
                                </Td>
                                <Td>
                                    {item.received_at
                                        ? new Date(item.received_at).toLocaleString()
                                        : "❌"}
                                </Td>
                                <Td> {item.received_by || "❌"} </Td>
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
                                        "❌"
                                    )}
                                </Td>

                                {showActionColumn && (
                                    <Td>
                                        {!item.is_completed ? (
                                            <Button
                                                size="sm"
                                                onClick={() => setCompletingRow(item)}
                                            >
                                                Completed
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => setReceivingRow(item)}
                                            >
                                                Received
                                            </Button>
                                        )}
                                    </Td>
                                )}
                            </>
                        );
                    }}
                />

            </Modal>

            <MarkReceivedModal
                isOpen={!!receivingRow}
                onClose={() => setReceivingRow(null)}
                row={receivingRow}
            />

            <CompletePeelingModal
                isOpen={!!completingRow}
                onClose={() => setCompletingRow(null)}
                row={completingRow}
            />
        </>
    );
};

export default ViewPeelingCenter;