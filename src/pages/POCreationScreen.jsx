import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const BATCH = {
    refBatchId: "#6754763",
    item: "Vannamei Shrimp",
    receivedQty: "500 Kg",
    totalSampleTested: 3,
    supplier: "Supplier 1",
};

const UOM_OPTIONS = ["Kg", "Gram", "Pieces"];

const INITIAL_ITEMS = [
    { id: 1, itemName: "King Size Prawns", totalSamplePieces: 10, totalSampleWeight: "2kg", actualWeight: "100", unitPrice: "100" },
    { id: 2, itemName: "Medium Size Prawns", totalSamplePieces: 30, totalSampleWeight: "4kg", actualWeight: "200", unitPrice: "100" },
    { id: 3, itemName: "Small Size Prawns", totalSamplePieces: 20, totalSampleWeight: "2.6kg", actualWeight: "200", unitPrice: "100" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcTotal = (actualWeight, unitPrice) => {
    const w = parseFloat(actualWeight) || 0;
    const p = parseFloat(unitPrice) || 0;
    return w && p ? (w * p).toLocaleString() : "—";
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const POCreationScreen = () => {
    const location = useLocation();
    const batchData = location.state?.batchData || null;

    const displayBatchId = batchData?.batchNo || BATCH.refBatchId;
    const displayItem = batchData?.rawPrawnsName || BATCH.item;
    const displayQty = batchData?.qty ? `${batchData.qty} Kg` : BATCH.receivedQty;
    const displaySampleTested = batchData?.qcDone || BATCH.totalSampleTested;
    const displaySupplier = batchData?.supplierName || BATCH.supplier;

    const aggregateItems = () => {
        if (!batchData || !batchData.samples) return INITIAL_ITEMS;
        let itemMap = {};
        let idCounter = 1;

        batchData.samples.forEach(sample => {
            if (sample.testedItems) {
                sample.testedItems.forEach(item => {
                    if (!itemMap[item.itemName]) {
                        itemMap[item.itemName] = {
                            id: idCounter++,
                            itemName: item.itemName,
                            totalSamplePieces: 0,
                            totalSampleWeight: 0,
                            actualWeight: "",
                            unitPrice: "100",
                            uom: item.uom || "Kg"
                        };
                    }
                    itemMap[item.itemName].totalSamplePieces += (Number(item.noOfPieces) || 0);
                    itemMap[item.itemName].totalSampleWeight += (Number(item.weight) || 0);
                });
            }
        });

        const aggregated = Object.values(itemMap);
        return aggregated.length > 0 ? aggregated : INITIAL_ITEMS;
    };

    const [actualTotalWeight, setActualTotalWeight] = useState("");
    const [uom, setUom] = useState(UOM_OPTIONS[0]);
    const [items, setItems] = useState(aggregateItems());

    const handleActualTotalWeightChange = (e) => {
        const val = e.target.value;
        setActualTotalWeight(val);
        const actualWeightNum = parseFloat(val);

        if (isNaN(actualWeightNum) || actualWeightNum === 0) {
            setItems(prev => prev.map(item => ({ ...item, actualWeight: "" })));
            return;
        }

        const totalSampleWt = items.reduce((sum, item) => sum + Number(item.totalSampleWeight), 0);
        if (totalSampleWt > 0) {
            setItems(prev => prev.map(item => {
                const share = Number(item.totalSampleWeight) / totalSampleWt;
                const calculatedActual = (share * actualWeightNum).toFixed(2);
                return { ...item, actualWeight: calculatedActual };
            }));
        }
    };

    const updateItem = (id, field, value) =>
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );

    const handleApprove = () => {
        console.log({ actualTotalWeight, uom, items });
    };

    return (
        <Layout title="PO Creation">
            {/* <Wrapper> */}

            {/* Basic Info */}
            <Section>
                <SectionLabel>Basic Info</SectionLabel>
                <Table>
                    <thead>
                        <tr>
                            <Th>ref/Batch ID</Th>
                            <Th>Item</Th>
                            <Th>Received Qty</Th>
                            <Th>Total Sample Tested</Th>
                            <Th>Supplier</Th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <Td>{displayBatchId}</Td>
                            <Td>{displayItem}</Td>
                            <Td>{displayQty}</Td>
                            <Td>{displaySampleTested}</Td>
                            <Td>{displaySupplier}</Td>
                        </tr>
                    </tbody>
                </Table>
            </Section>

            {/* Actual Total Weight */}
            <WeightRow>
                <WeightLabel>Enter Actual Total Weight: </WeightLabel>
                <WeightInput
                    type="number"
                    value={actualTotalWeight}
                    onChange={handleActualTotalWeightChange}
                    placeholder="0"
                />
                <UomSelect value={uom} onChange={(e) => setUom(e.target.value)}>
                    {UOM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </UomSelect>
            </WeightRow>

            {/* Items Table */}
            <TableSection>
                <Table>
                    <thead>
                        <tr>
                            <Th>Item Name</Th>
                            <Th>Total Sample Pieces</Th>
                            <Th>Total Sample Weight</Th>
                            <Th>Actual Weight</Th>
                            <Th>Unit Price</Th>
                            <Th>Total Price</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <Td>{item.itemName}</Td>
                                <Td>{item.totalSamplePieces}</Td>
                                <Td>{Number(item.totalSampleWeight).toFixed(2)}</Td>
                                <Td>
                                    <InputCell
                                        type="number"
                                        value={item.actualWeight}
                                        onChange={(e) => updateItem(item.id, "actualWeight", e.target.value)}
                                    />
                                    <UomTag>{item.uom}</UomTag>
                                </Td>
                                <Td>
                                    <InputCell
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                                    />
                                </Td>
                                <Td>{calcTotal(item.actualWeight, item.unitPrice)}</Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </TableSection>

            {/* Footer */}
            <Footer>
                <ApproveBtn type="button" onClick={handleApprove}>
                    Approve &amp; Create PO
                </ApproveBtn>
            </Footer>

            {/* </Wrapper> */}
        </Layout>
    );
};

export default POCreationScreen;

// ─── STYLED COMPONENTS ────────────────────────────────────────────────────────
const Wrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 40px;
  font-family: ${({ theme }) => theme.fonts.body};
`;

const Section = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  margin-bottom: 20px;
  background: ${({ theme }) => theme.colors.card};
`;

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 9px 14px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  tr:last-child & { border-bottom: none; }
`;

// ─── WEIGHT ROW ───────────────────────────────────────────────────────────────
const WeightRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const WeightLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
`;

const WeightInput = styled.input`
  width: 80px;
  padding: 5px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const UomSelect = styled.select`
  padding: 5px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

// ─── ITEMS TABLE ──────────────────────────────────────────────────────────────
const TableSection = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.card};
  margin-bottom: 20px;
`;

const InputCell = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const UomTag = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  margin-left: 4px;
`;

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ApproveBtn = styled.button`
  padding: 9px 22px;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: ${({ theme }) => theme.colors.backgroundAlt}; }
`;