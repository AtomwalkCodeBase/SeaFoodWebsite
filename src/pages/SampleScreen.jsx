import React, { useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiHash, FiPlus, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import styled from 'styled-components';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { FaFlask } from 'react-icons/fa';

const INITIAL_BATCHES = [
    {
        id: 1,
        name: "LOT-2023-0892",
        product: "Shrimp Grade A",
        tests: 6,
        status: "PASSED",
        note: "All microbial tests within limits.",
    },
    {
        id: 2,
        name: "LOT-2023-0901",
        product: "Tiger Prawns",
        tests: 4,
        status: "PASSED",
        note: "Integrity test successful.",
    },
    {
        id: 3,
        name: "LOT-2023-0914",
        product: "White Shrimp",
        tests: 5,
        status: "REVIEW",
        note: "Minor salinity deviation. Manual check required.",
    },
    {
        id: 4,
        name: "LOT-2023-0922",
        product: "King Prawns",
        tests: 3,
        status: "PENDING",
        note: "Lab results awaited.",
    },
];

const TestRow = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1.5px solid
    ${({ $status, theme }) =>
        $status === "PASSED"
            ? "#c3f0d0"
            : $status === "FAILED"
                ? "#ffd6cc"
                : $status === "REVIEW"
                    ? "#ffeacc"
                    : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  transition: box-shadow ${({ theme }) => theme.transitions.fast};
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const BatchInfo = styled.div`
  flex: 1;
`;

const BatchId = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: 0.06em;
`;

const ProductName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const TestNote = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  font-style: italic;
  margin-top: 2px;
`;

const TestCount = styled.div`
  text-align: center;
  min-width: 64px;
`;

const CountNum = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const CountLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

const statusIconMap = {
    PASSED: <FiCheckCircle size={16} />,
    FAILED: <FiAlertCircle size={16} />,
    REVIEW: <FiAlertCircle size={16} />,
    PENDING: <FaFlask size={16} />,
};

const statusBgMap = {
    PASSED: "#e6fff2",
    FAILED: "#fff0ec",
    REVIEW: "#fff8ec",
    PENDING: "#f0f0ff",
};

const statusColorMap = {
    PASSED: "#00C853",
    FAILED: "#FF3D00",
    REVIEW: "#FF8F00",
    PENDING: "#6C63FF",
};

const SummaryBox = styled.div`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primaryLight},
    ${({ theme }) => theme.colors.accentLight}
  );
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.primary}33;
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const SumStat = styled.div`
  text-align: center;
  flex: 1;
  min-width: 80px;
`;

const SumVal = styled.div`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const SumLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  margin-top: 2px;
`;
const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;
const Flex = styled.div`
  display: flex;
  align-items: ${({ $align }) => $align || "center"};
  justify-content: ${({ $justify }) => $justify || "flex-start"};
  gap: ${({ $gap, theme }) => ($gap ? theme.spacing[$gap] : "0")};
  flex-wrap: ${({ $wrap }) => $wrap || "nowrap"};
`;
const IconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ $bg, theme }) => $bg || theme.colors.primaryLight};
  color: ${({ $color, theme }) => $color || theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;
// const ItemNameRow = styled.div`
//   flex: 1;
// `;

// const ItemName = styled.div`
//   font-size: ${({ theme }) => theme.fontSizes.md};
//   font-weight: 700;
//   color: ${({ theme }) => theme.colors.text};
//   margin-bottom: ${({ theme }) => theme.spacing.xs};
// `;

// const ItemNumber = styled.div`
//   font-size: ${({ theme }) => theme.fontSizes.sm};
//   color: ${({ theme }) => theme.colors.textLight};
//   font-weight: 500;
//   display: flex;
//   align-items: center;
//   gap: ${({ theme }) => theme.spacing.xs};
//   svg { font-size: 11px; }
// `;

const Header = styled.div`
  background: #f7f7f7;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const ItemNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ItemName = styled.h4`
  margin: 0;
`;

const ItemNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: gray;
`;

const SampleControl = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  color: ${({ theme }) => theme.colors.background};

  input {
    padding: 8px;
    width: 200px;
  }
`;

const CreateButton = styled.button`
  background: #ff7a00;
  color: white;
  border: none;
  padding: 8px 15px;
  display: flex;
  gap: 5px;
  align-items: center;
  cursor: pointer;
  border-radius: 5px;
`;

const SampleCard = styled.div`
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const SampleHeader = styled.h4`
  margin-bottom: 15px;
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  /* display: flex; */
  align-item: center;
  gap: 10px;
  margin-bottom: 10px;
@media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AddItemButton = styled.button`
  background: #fff3e6;
  border: 1px dashed #ff7a00;
  color: #ff7a00;
  padding: 8px;
  cursor: pointer;
  display: flex;
  gap: 5px;
  align-items: center;
  border-radius: 6px;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: red;
  cursor: pointer;
`;
const Row = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:disabled {
     opacity: 0.5;
     cursor: not-allowed;
     transform: none;
   }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
  }
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: white;
  min-width: 150px;

  @media (max-width: 768px) {
    width: 45%;
    min-width: unset;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const ItemsTitle = styled.div`
  font-weight: 600;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ContentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

// Left section styles
const LeftSection = styled.div`
  flex: 1;
`;

export const Title = styled.h4`
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const ItemDetails = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
`;

// export const ItemNameRow = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 12px;
//   flex-wrap: wrap;
// `;

// export const ItemName = styled.span`
//   font-size: 18px;
//   font-weight: 600;
//   color: #1a1a1a;
// `;

// export const ItemNumber = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 4px;
//   color: #666;
//   font-size: 14px;

//   svg {
//     color: #999;
//   }
// `;

export const QuantityInfo = styled.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #444;
  font-size: 14px;
  
  span {
    font-weight: 600;
    color: #007bff;
    font-size: 16px;
  }
`;

// Right section styles
export const RightSection = styled.div`
flex : 1;
 /* min-width: 280px; */
`;

// export const SampleControl = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 12px;
// `;

// export const Input = styled.input`
//   padding: 12px 16px;
//   border: 2px solid #e0e0e0;
//   border-radius: 8px;
//   font-size: 16px;
//   transition: all 0.2s ease;
//   width: 100%;

//   &:focus {
//     outline: none;
//     border-color: #007bff;
//     box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
//   }

//   &::placeholder {
//     color: #999;
//   }
// `;
const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
  color: ${props => props.theme.colors.text};
`;
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;


const itemsList = [
    "Large King Shrimp (21/25)",
    "Medium King Shrimp (26/30)",
    "Small Shrimp (31/40)",
];

const SampleScreen = ({ onNext, samples, setSamples, poData }) => {
    const [sampleCount, setSampleCount] = useState("");

    // console.log(onNext)

    const createSamples = () => {
        const count = Number(sampleCount);

        const newSamples = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            sampleQty: "",
            totalWeight: "",
            items: [
                {
                    item: "",
                    pieces: "",
                    weight: "",
                    uom: "Kg",
                },
            ],
        }));

        setSamples(newSamples);
    };

    const updateSampleField = (index, field, value) => {
        const updated = [...samples];
        updated[index][field] = value;
        setSamples(updated);
    };

    const updateItemField = (sampleIndex, itemIndex, field, value) => {
        const updated = [...samples];
        updated[sampleIndex].items[itemIndex][field] = value;
        setSamples(updated);
    };

    const addItem = (sampleIndex) => {
        const updated = [...samples];

        updated[sampleIndex].items.push({
            item: "",
            pieces: "",
            weight: "",
            uom: "Kg",
        });

        setSamples(updated);
    };

    const removeItem = (sampleIndex, itemIndex) => {
        const updated = [...samples];
        updated[sampleIndex].items.splice(itemIndex, 1);
        setSamples(updated);
    };

    return (
        <Card>
            <PageTitle>Sample Testing</PageTitle>
            <PageSubtitle>
                Record and verify all batch test results before proceeding to inventory
                assignment.
            </PageSubtitle>
            <Card hoverable={false}>
                <ContentRow>
                    <LeftSection>
                        <Title>Selected Purchase Request</Title>
                           <ItemName> <FiHash /> {poData.po_ref_number}</ItemName>
                                  {poData?.po_items?.map((item) => (
                        <ItemDetails key={item.id}>
                            <ItemNameRow>
                             
                                <ItemNumber> 
                                    {item.po_item?.name}
                                </ItemNumber>
                            </ItemNameRow>
                            <QuantityInfo>
                                Total Quantity: <span>{item.quantity}</span>
                            </QuantityInfo>
                        </ItemDetails>
                          ))}
                    </LeftSection>

                    <RightSection>
                        <Title>Create Samples</Title>
                        <ItemDetails>
                            <SampleControl>
                                <Input
                                    type="number"
                                    placeholder="Number of Samples"
                                    value={sampleCount}
                                    onChange={(e) => setSampleCount(e.target.value)}
                                />
                                <CreateButton onClick={createSamples}>
                                    <FiPlus /> Create Samples
                                </CreateButton>
                            </SampleControl>
                        </ItemDetails>
                    </RightSection>
                </ContentRow>
            </Card>
            <>
                {samples.map((sample, sampleIndex) => (
                    <SampleCard key={sample.id}>
                        <SampleHeader>Sample {sample.id}</SampleHeader>

                        <Row>
                            <FormGroup>
                            <Label>Total Sample Pieces</Label>
                            <Input type="number" min={0} value={sample.sampleQty} onChange={(e) => updateSampleField(sampleIndex, "sampleQty", e.target.value)} placeholder="Sample Pieces" />
                            </FormGroup>
                            {/* <Label>Total Sample Pieces</Label>
                            <Input
                                placeholder="Sample Pieces"
                                value={sample.sampleQty}
                                onChange={(e) =>
                                    updateSampleField(sampleIndex, "sampleQty", e.target.value)
                                }
                            /> */}
                            <FormGroup>
                                <Label>Total Weight(kg)</Label>
                                <Input placeholder="Total Weight (kg)" value={sample.totalWeight} onChange={(e) =>   updateSampleField(sampleIndex, "totalWeight", e.target.value)} />
                            </FormGroup>
                        </Row>

                        <ItemsTitle>Items Specification segregation</ItemsTitle>

                        {sample.items.map((item, itemIndex) => (
                            <ItemRow key={item.id}>
                                <FormGroup>
                                <Label>Select Item</Label>
                                <Select
                                    value={item.item}
                                    onChange={(e) =>
                                        updateItemField(
                                            sampleIndex,
                                            itemIndex,
                                            "item",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">Select Item</option>
                                    {itemsList.map((i) => (
                                        <option key={i}>{i}</option>
                                    ))}
                                </Select>
                                </FormGroup>
                                 <FormGroup>
                                   <Label>No of Pieces</Label> 
                                <Input
                                type='number'
                                    placeholder="Pieces"
                                    value={item.pieces}
                                    onChange={(e) =>
                                        updateItemField(
                                            sampleIndex,
                                            itemIndex,
                                            "pieces",
                                            e.target.value
                                        )
                                    }
                                />
                                </FormGroup> 
                                <FormGroup>
                                <Label>Weight</Label>
                                <Input
                                type='number'
                                    placeholder="Weight"
                                    value={item.weight}
                                    onChange={(e) =>
                                        updateItemField(
                                            sampleIndex,
                                            itemIndex,
                                            "weight",
                                            e.target.value
                                        )
                                    }
                                />
                                </FormGroup>      
                                    <FormGroup>
                                    <Label>UOM</Label>
                                <Select
                                    value={item.uom}
                                    onChange={(e) =>
                                        updateItemField(sampleIndex, itemIndex, "uom", e.target.value)
                                    }
                                >
                                    <option>Kg</option>
                                    <option>Gram</option>
                                </Select>
                                    </FormGroup>
                                    <FormGroup>
                                    <Label>Action</Label>
                                <Button variant="outlines" iconOnly={true} onClick={() => removeItem(sampleIndex, itemIndex)}>
                                    <FiTrash2 />
                                </Button>
                                    </FormGroup>
                            </ItemRow>
                        ))}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                            <Button onClick={() => addItem(sampleIndex)}>
                                <FiPlus /> Add Item
                            </Button>
                        </div>
                    </SampleCard>
                ))}
                
                {onNext && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                        <Button variant="primary" onClick={onNext}>
                            Proceed to inventory →
                        </Button>
                    </div>
                )}
            </>
        </Card>
    )
}

export default SampleScreen