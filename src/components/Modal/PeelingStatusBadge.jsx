import React from "react";
import Badge from "../Badge";
import { useProcessPillingList } from "../../hooks/useProductQueries";

const STAGES = ["Not started", "Peeling Progress", "Completed / Peeled", "Received"];

const getStage = (processList) => {
    if (!processList || processList.length === 0) {
        return 0;
    }

    const allReceived = processList.every((item) => item.is_received);
    if (allReceived) {
        return 3;
    }

    const allCompleted = processList.every((item) => item.is_completed);
    if (allCompleted) {
        return 2;
    }

    return 1;
};

const getVariant = (stage) => {
    if (stage === 3) return "success";
    if (stage === 0) return "error";
    return "warning";
};

const PeelingStatusBadge = ({ poId }) => {
    const { data: processList = [] } = useProcessPillingList(poId);

    const stage = getStage(processList);

    return (
        <Badge variant={getVariant(stage)}>
            {STAGES[stage]}
        </Badge>
    );
};

export default PeelingStatusBadge;
