import React from "react";
import styled from "styled-components";
import Badge from "../Badge";
import { useProcessPillingList } from "../../hooks/useProductQueries";

const STAGES = ["Not started", "Peeling Progress", "Completed / Peeled", "Received"];

const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RefNumber = styled.strong`
  color: ${({ theme }) => theme.colors.text};
`;

const SupplierName = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const StepperWrap = styled.div`
  display: flex;
  align-items: flex-start;
`;

const StepItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
`;

const StepCircle = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ theme, $active }) =>
        $active ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $active }) =>
        $active ? "#fff" : theme.colors.textMuted};
`;

const StepLabel = styled.span`
  font-size: 0.72rem;
  color: ${({ theme, $active }) =>
        $active ? theme.colors.text : theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: center;
  white-space: nowrap;
`;

const StepLine = styled.div`
  flex: 1;
  height: 3px;
  margin-top: 15px;
  min-width: 20px;
  background: ${({ theme, $active }) =>
        $active ? theme.colors.primary : theme.colors.border};
`;

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

const PRProgressCard = ({ purchaseData }) => {
    const { data: processList = [] } =
        useProcessPillingList(purchaseData?.id);

    const currentStage = getStage(processList);

    return (
        <Card>
            <Header>
                <div>
                    <RefNumber>{purchaseData.po_ref_number}</RefNumber>
                    <SupplierName>
                        {purchaseData.supplier_name || "--"}
                    </SupplierName>
                </div>

                <Badge variant={currentStage === 3 ? "success" : "warning"}>
                    {STAGES[currentStage]}
                </Badge>
            </Header>

            <StepperWrap>
                {STAGES.map((label, index) => (
                    <React.Fragment key={label}>
                        <StepItem>
                            <StepCircle $active={index <= currentStage}>
                                {index + 1}
                            </StepCircle>
                            <StepLabel $active={index <= currentStage}>
                                {label}
                            </StepLabel>
                        </StepItem>

                        {index < STAGES.length - 1 && (
                            <StepLine $active={index < currentStage} />
                        )}
                    </React.Fragment>
                ))}
            </StepperWrap>
        </Card>
    );
};

export default PRProgressCard;