import React, { useState } from 'react'
import Layout from '../components/Layout'
import styled from 'styled-components';
import { FiCheck } from 'react-icons/fi';
import SampleScreen from './SampleScreen';
import InventoryScreen from './InventoryScreen';
import SummaryScreen from './SummaryScreen';
import Card from '../components/Card';
import Button from '../components/Button';
import { useLocation, useNavigate } from 'react-router-dom';

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const StepList = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 600px;
  margin: 0 auto;
`;

const StepConnector = styled.div`
  flex: 1;
  height: 2px;
  background: ${({ $done, theme }) =>
        $done ? theme.colors.primary : theme.colors.border};
  transition: background ${({ theme }) => theme.transitions.normal};
`;

const StepItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;
 
  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const StepCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  transition: all ${({ theme }) => theme.transitions.normal};
  flex-shrink: 0;
 
  ${({ $state, theme }) => {
        if ($state === "done")
            return `
      background: ${theme.colors.primary};
      color: #fff;
      box-shadow: 0 0 0 3px ${theme.colors.primaryLight};
    `;
        if ($state === "active")
            return `
      background: ${theme.colors.primary};
      color: #fff;
      box-shadow: 0 0 0 3px ${theme.colors.primaryLight};
    `;
        return `
      background: ${theme.colors.backgroundAlt};
      color: ${theme.colors.textLight};
      border: 2px solid ${theme.colors.border};
    `;
    }}
`;

const StepLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ $active }) => ($active ? "600" : "400")};
  color: ${({ $active, $done, theme }) =>
        $active || $done ? theme.colors.primary : theme.colors.textLight};
  transition: color ${({ theme }) => theme.transitions.fast};
`;

const Paragraphdata = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
`;
const RequestDeskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const QC_Screen = () => {
    const STEPS = ["Testing", "Assignment", "Review"];
    const [currentStep, setCurrentStep] = useState(1);
      const navigate = useNavigate();
    const location = useLocation();
    const { state } = location || {};
    
    // console.log(state)

    const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));
    const handleStepClick = (step) => setCurrentStep(step);

    const [selectedItems, setSelectedItems] = useState([]);
    const [samples, setSamples] = useState([]);
    const [poQuantity, setPoQuantity] = useState("");

    const handleNext = () => {
        if (currentStep === 1) {
            const itemMap = new Map();
            let currentId = 1;
            samples.forEach((sample) => {
                if (Array.isArray(sample.items)) {
                    sample.items.forEach((itemDetails) => {
                        const itemName = itemDetails.item;
                        // console.log("itemName", itemName)
                        if (itemName) {
                            const weight = Number(itemDetails.weight) || 0;
                            const pieces = Number(itemDetails.pieces) || 0;
                            const sampleName = `Sample ${sample.id}`;
                            if (itemMap.has(itemName)) {
                                const existing = itemMap.get(itemName);
                                existing.weight += weight;
                                existing.pieces += pieces;
                                if (!existing.batch.includes(sampleName)) {
                                    existing.batch += `, ${sampleName}`;
                                }
                            } else {
                                itemMap.set(itemName, {
                                    id: currentId++,
                                    name: itemName,
                                    batch: sampleName,
                                    weight: weight,
                                    pieces: pieces,
                                    price: 0
                                });
                            }
                        }
                    });
                }
            });
            const extractedItems = Array.from(itemMap.values());
            setSelectedItems(extractedItems.length > 0 ? extractedItems : []);
        }
        setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    };

    return (
        <Layout title="QC Screen">
            <RequestDeskHeader>
                    <div>
                      <Paragraphdata>QC check for raw material </Paragraphdata>
                    </div>
                    <Button onClick={() => navigate("/seafood/home")}>
                      ← Back
                    </Button>
                  </RequestDeskHeader>
            <StepperHeader
                steps={STEPS}
                currentStep={currentStep}
                onStepClick={handleStepClick}
            />
            {currentStep === 1 && <SampleScreen onNext={handleNext} samples={samples} setSamples={setSamples} poData={state} />}
            {currentStep === 2 && (<InventoryScreen items={selectedItems} setItems={setSelectedItems} onNext={handleNext} onBack={handleBack} currentStep={currentStep} poQuantity={poQuantity} setPoQuantity={setPoQuantity} />)}
            {currentStep === 3 && <SummaryScreen samples={samples} inventoryItems={selectedItems} onBack={handleBack} poQuantity={poQuantity} />}
        </Layout>
    )
}

export default QC_Screen

export const StepperHeader = ({ steps, currentStep, onStepClick }) => {
    const getState = (idx) => {
        const stepNum = idx + 1;
        if (stepNum < currentStep) return "done";
        if (stepNum === currentStep) return "active";
        return "idle";
    };

    return (
        <Card hoverable={false}>
            <StepList>
                {steps.map((label, idx) => {
                    const state = getState(idx);
                    return (
                        <React.Fragment key={label}>
                            {idx > 0 && <StepConnector $done={idx < currentStep} />}
                            <StepItem onClick={() => onStepClick(idx + 1)}>
                                <StepCircle $state={state}>
                                    {state === "done" ? <FiCheck size={14} /> : idx + 1}
                                </StepCircle>
                                <StepLabel $active={state === "active"} $done={state === "done"}>
                                    Step {idx + 1}: {label}
                                </StepLabel>
                            </StepItem>
                        </React.Fragment>
                    );
                })}
            </StepList>
        </Card>
    );
};