import React, { useState, useMemo, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import styled from "styled-components";
import Button from '../components/Button';

const Container = styled.div`
  padding: 30px;
  background: #fafafa;
`;

const Title = styled.h2`
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px;
    background: #f3f4f6;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
`;

const Input = styled.input`
  width: 80px;
  padding: 6px;
  margin-right: 6px;
  
  &:disabled {
     opacity: 0.5;
     cursor: not-allowed;
     transform: none;
   }
`;

const Footer = styled.div`
  margin-top: 30px;
  background: white;
  border-radius: 10px;
display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const Summary = styled.div`
  display: flex;
  gap: 40px;
  margin-bottom: 15px;
`;

// const Label = styled.div`
//   color: gray;
// `;

const Value = styled.div`
  font-weight: bold;
`;

const GrandTotal = styled.div`
  display: flex;
  justify-content: flex-end;
  font-size: 18px;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text};

  span {
    color: #ff6a00;
    font-weight: bold;
  }
`;

const Buttons = styled.div`
  display: flex;
  gap: 10px;
`;

const DraftBtn = styled.button`
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: white;
`;

const OrderBtn = styled.button`
  padding: 10px 16px;
  background: #ff6a00;
  color: white;
  border: none;
`;
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;
// const Input = styled.input`
//   width: 100%;
//   padding: 10px 12px;
//   border: 2px solid ${props => props.theme.colors.border};
//   border-radius: 10px;
//   font-size: 0.95rem;
//   transition: all 0.3s;

//   &:disabled {
//      opacity: 0.5;
//      cursor: not-allowed;
//      transform: none;
//    }

//   &:focus {
//     outline: none;
//     border-color: ${props => props.theme.colors.primary};
//     box-shadow: 0 0 0 3px ${props => props.theme.colors.primaryLight};
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

const InventoryScreen = ({ items, setItems, onNext, onBack, readOnly = false, currentStep, poQuantity, setPoQuantity }) => {
    const data = items || [];

    const updateField = (index, field, value) => {
        if (!setItems) return;
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value === '' ? '' : Number(value) };
        setItems(updated);
    };

    const grandTotal = useMemo(() => {
        return data.reduce((sum, item) => sum + (Number(item.actual) || 0) * (Number(item.price) || 0), 0);
    }, [data]);

    const totalWeight = useMemo(() => {
        return data.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
    }, [data]);

    const totalSampleWeight  = useMemo(() => {
        return data.reduce((sum, item) => sum + (item.weight || 0), 0);
    }, [data]);

useEffect(() => {
    if (!setItems || poQuantity === '' || poQuantity === undefined || !totalSampleWeight ) return;

    const updated = data.map((item) => {
        const percentage = item.weight / totalSampleWeight ;
        const actualQty = percentage * poQuantity;

        return {
            ...item,
            actual: Number(actualQty.toFixed(2))
        };
    });

    setItems(updated);
}, [poQuantity]);

    return (
        <Container>
            <FormGroup>
                            <Label>Total Quantity of the PO</Label>
                            <Input type="number" min={0} value={poQuantity} onChange={(e) => setPoQuantity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Entered Actual quantity" disabled={currentStep === 3} />
                            </FormGroup>
            <Title>Inventory</Title>

            <Table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Source Batch</th>
                        <th>Sample Pieces</th>
                        <th>Sample Quantity</th>
                        <th>Actual Quantity</th>
                        <th>Price / Unit</th>
                        <th>Total Price</th>
                        {/* <th>Action</th> */}
                    </tr>
                </thead>

                <tbody>
                    {data.map((item, index) => (
                        <InventoryRow
                            key={item.id}
                            item={item}
                            onChange={(field, value) =>
                                updateField(index, field, value)
                            }
                            readOnly={readOnly}
                        />
                    ))}
                </tbody>
            </Table>
             <GrandTotal>
                    Grand Total Value: <span>₹{grandTotal.toLocaleString()}</span>
                </GrandTotal>

            <Footer>
                {/* <Summary>
                    <div>
                        <Label>Total Items</Label>
                        <Value>{data.length} Categories</Value>
                    </div>

                    <div>
                        <Label>Total Net Weight</Label>
                        <Value>{totalWeight} kg</Value>
                    </div>
                </Summary>
 */}

                {!readOnly && (
                    <Buttons>
                        {onBack && <Button variant="ghost" onClick={onBack}>← Back</Button>}
                        {onNext ? (
                            <Button variant="primary" onClick={onNext}>Review QC →</Button>
                        ) : (
                            <Button variant="ghost">Order In →</Button>
                        )}
                    </Buttons>
                )}
            </Footer>
        </Container>
    );
};

export default InventoryScreen;

export const InventoryRow = ({ item, onChange, readOnly = false }) => {
    const quantity = item.actual || 0;
    const price = item.price || 0;
    const total = quantity * price;

    // console.log("item", item)

    return (
        <tr>
            <td>{item.name}</td>

            <td>{item.batch}</td>
            <td style={{textAlign: "right"}}>{item.pieces}</td>

            <td style={{textAlign: "right"}}>
                {item.weight}kg
            </td>
            <td>
                    <Input
                        type="number"
                        value={item.actual}
                        onChange={(e) => onChange("actual", e.target.value)}
                        disabled={readOnly}
                    />
                kg
            </td>

            <td>
                ₹
                {!readOnly && (
                    <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => onChange("price", e.target.value)}
                        disabled={readOnly}
                    />
                )}
            </td>

            <td style={{textAlign: "right"}}>${total.toLocaleString()}</td>

            {/* <td>
                <FiEdit />
            </td> */}
        </tr>
    );
};