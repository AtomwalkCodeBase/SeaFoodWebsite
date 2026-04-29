import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";

// ─── MOCK BATCH DATA ──────────────────────────────────────────────────────────
const BATCH = {
    batchId: "BATCH-001",
    item: "Vannamei Shrimp",
    receivedQty: "500 Kg",
    sampleToBeTested: 1,
};

const ITEM_OPTIONS = ["King Size Prawns", "Medium Prawns", "Small Prawns"];
const UOM_OPTIONS = ["Gram", "Kg", "Pieces"];
const TEMP_OPTIONS = ["2°C", "4°C", "6°C", "8°C"];
const ICE_OPTIONS = ["Good", "Average", "Poor"];
const SMELL_OPTIONS = ["Fresh", "Mild", "Bad"];
const COLOR_OPTIONS = ["Normal", "Pale", "Dark"];
const APPEARANCE_OPTIONS = ["Bright", "Dull", "Damaged"];

// ─── REUSABLE SELECT ──────────────────────────────────────────────────────────
const LabeledSelect = ({ label, value, onChange, options }) => (
    <InlineField>
        <FieldLabel>{label}</FieldLabel>
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
    </InlineField>
);

// ─── REUSABLE TEXT INPUT ──────────────────────────────────────────────────────
const LabeledInput = ({ label, value, onChange, width }) => (
    <InlineField>
        <FieldLabel>{label}</FieldLabel>
        <SmallInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            $width={width}
        />
    </InlineField>
);

// ─── DEFAULT SAMPLE STATE ─────────────────────────────────────────────────────
const defaultSample = () => ({
    sampleWeight: "",
    pieceCount: "",
    temp: TEMP_OPTIONS[1],
    ice: ICE_OPTIONS[0],
    smell: SMELL_OPTIONS[0],
    color: COLOR_OPTIONS[0],
    appearance: APPEARANCE_OPTIONS[0],
    decision: "",
    remark: "",
    items: [],
});

const defaultItem = () => ({
    itemName: ITEM_OPTIONS[0],
    pieceCount: "",
    weight: "",
    uom: UOM_OPTIONS[0],
});

// ─── SAMPLE CARD ──────────────────────────────────────────────────────────────
const SampleCard = ({ data, onChange }) => {
    const update = (field, value) => onChange({ ...data, [field]: value });

    const addItem = () =>
        onChange({ ...data, items: [...data.items, defaultItem()] });

    const updateItem = (idx, field, value) => {
        const updated = data.items.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item
        );
        onChange({ ...data, items: updated });
    };

    const removeItem = (idx) =>
        onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });

const formatQcName = (key) => key.replace("QC_", "").replaceAll("_", " ");

const parseOptions = (value) => {
    if (!value || value === "-") return null;

    return value
        .split(/\/|\|/)   // split by / or |
        .map(v => v.trim())
        .filter(Boolean);
};

const renderQcFields = (data, update) => {
    if (!data?.test_required) return null;

    return Object.entries(data.test_required).map(([key, value]) => {
        const label = formatQcName(key);
        const options = parseOptions(value);

        // store values dynamically inside data.qc_values
        const fieldValue = data.qc_values?.[key] || "";

        const handleChange = (val) => {
            update("qc_values", {
                ...data.qc_values,
                [key]: val
            });
        };

        if (options) {
            return (
                <LabeledSelect
                    key={key}
                    label={label}
                    value={fieldValue}
                    onChange={handleChange}
                    options={options}
                />
            );
        }

        return (
            <LabeledInput
                key={key}
                label={label}
                value={fieldValue}
                onChange={handleChange}
                width="80px"
            />
        );
    });
};

    return (
        <Card>
            {/* <CardTitle>{data.sample_id}</CardTitle> */}

            {/* Row 1 — Weight & Piece Count */}
            <FieldRow>
                <LabeledInput
                    label="Sample Weight:"
                    value={data.sampleWeight}
                    onChange={(v) => update("sampleWeight", v)}
                    width="70px"
                />
                <LabeledInput
                    label="Piece Count:"
                    value={data.pieceCount}
                    onChange={(v) => update("pieceCount", v)}
                    width="60px"
                />
            </FieldRow>

            <FieldRow>
                {renderQcFields(data, update)}
           </FieldRow>

            {/* Item Specific Section */}
            <ItemSection>
                <ItemSectionHeader>
                    <ItemSectionTitle>Item Specific Segregation</ItemSectionTitle>
                    <AddItemBtn type="button" onClick={addItem}>Add Item</AddItemBtn>
                </ItemSectionHeader>

                {/* {!data && (
                    <EmptyItemNote>No items added yet. Click "Add Item" to begin.</EmptyItemNote>
                )}

                {data.items.map((item, idx) => (
                    <ItemRow key={idx}>
                        <InlineField>
                            <FieldLabel>Item:</FieldLabel>
                            <Select value={item.itemName} onChange={(e) => updateItem(idx, "itemName", e.target.value)}>
                                {ITEM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </Select>
                        </InlineField>
                        <LabeledInput
                            label="Piece Count:"
                            value={item.pieceCount}
                            onChange={(v) => updateItem(idx, "pieceCount", v)}
                            width="60px"
                        />
                        <LabeledInput
                            label="Weight:"
                            value={item.weight}
                            onChange={(v) => updateItem(idx, "weight", v)}
                            width="70px"
                        />
                        <InlineField>
                            <FieldLabel>UOM:</FieldLabel>
                            <Select value={item.uom} onChange={(e) => updateItem(idx, "uom", e.target.value)}>
                                {UOM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </Select>
                        </InlineField>
                        <RemoveBtn type="button" onClick={() => removeItem(idx)}>×</RemoveBtn>
                    </ItemRow>
                ))} */}
            </ItemSection>

            {/* Decision */}
            <RadioRow>
                <RadioLabel>
                    <input
                        type="radio"
                        name={`decision-${data.id || "sample"}`}
                        value="Accept"
                        checked={data.decision === "Accept"}
                        onChange={() => update("decision", "Accept")}
                    />
                    Accept
                </RadioLabel>
                <RadioLabel>
                    <input
                        type="radio"
                        name={`decision-${data.id || "sample"}`}
                        value="Reject"
                        checked={data.decision === "Reject"}
                        onChange={() => update("decision", "Reject")}
                    />
                    Reject
                </RadioLabel>
            </RadioRow>

            {/* Remark + Submit */}
            <BottomRow>
                <RemarkInput
                    placeholder="Remark"
                    value={data.remark}
                    onChange={(e) => update("remark", e.target.value)}
                />
                <SubmitBtn type="button">Submit</SubmitBtn>
            </BottomRow>
        </Card>
    );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const SampleTestScreen = () => {
    const location = useLocation();
    const batchData = location.state?.batchData || null;
    const qc_status = batchData.qc_status === "P" ? "In Progress" : "Not Started";

    const [sampleData, setSampleData] = useState(batchData);

    useEffect(() => {
        if (batchData) {
            setSampleData(batchData);
        }
    }, [batchData]);

    console.log(batchData)

    // Setup initial state from batchData if present
    // const incomingSamples = batchData?.samples || [];
    // const initialSamplesCount = incomingSamples.length > 0 ? incomingSamples.length : (batchData?.qcHappen || BATCH.sampleToBeTested);

    // const [user, setUser] = useState("Employee_001");
    // const [samples, setSamples] = useState(
    //     incomingSamples.length > 0 
    //         ? incomingSamples.map(s => ({ 
    //             ...defaultSample(), 
    //             ...s,
    //             sampleWeight: s.totalSampleWeight || "",
    //             pieceCount: s.totalNoOfPieces || "",
    //             items: s.testedItems && s.testedItems.length > 0 
    //                 ? s.testedItems.map(ti => ({
    //                     itemName: ti.itemName || ITEM_OPTIONS[0],
    //                     pieceCount: ti.noOfPieces || "",
    //                     weight: ti.weight || "",
    //                     uom: ti.uom || UOM_OPTIONS[0]
    //                 })) 
    //                 : []
    //         }))
    //         : Array.from({ length: initialSamplesCount }, defaultSample)
    // );

    // const displayBatchId = batchData?.batchNo || BATCH.batchId;
    // const displayItem = batchData?.rawPrawnsName || BATCH.item;
    // const displayQty = batchData?.qty ? `${batchData.qty} Kg` : BATCH.receivedQty;
    // const displaySamplesCount = initialSamplesCount;

    // const updateSample = (idx, data) =>
    //     setSamples((prev) => prev.map((s, i) => (i === idx ? data : s)));

    return (
        <Layout title="Sample Test Screen">
            {/* <Wrapper> */}

            {/* Basic Info */}
            <Section>
                <SectionLabel>Basic Info</SectionLabel>
                <Table>
                    <thead>
                        <tr>
                            <Th>Batch ID</Th>
                            <Th>Item</Th>
                            <Th>Sample to be tested</Th>
                            <Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <Td>{batchData.po_ref_number}</Td>
                            <Td>{batchData.sample_id}</Td>
                            <Td>{batchData.qc_quantity}</Td>
                            <Td><Badge variant={batchData.qc_status === "P" ? "info" : "notPlanned"}>{qc_status}</Badge></Td>
                        </tr>
                    </tbody>
                </Table>
            </Section>

            {/* Sample Tests Header */}
            <SampleTestsHeader>
                <SectionLabel>Sample Tests</SectionLabel>
                {/* <UserRow>
                    <UserLabel>User:</UserLabel>
                    <Select value={user} onChange={(e) => setUser(e.target.value)}>
                        <option value="Employee_001">Employee_001</option>
                        <option value="Employee_002">Employee_002</option>
                    </Select>
                </UserRow> */}
            </SampleTestsHeader>

            {/* Sample Cards */}
                <SampleCard  data={sampleData} onChange={setSampleData} />

            {/* </Wrapper> */}
        </Layout>
    );
};

export default SampleTestScreen;

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
`;

const Td = styled.td`
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const SampleTestsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UserLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

// ─── CARD ─────────────────────────────────────────────────────────────────────
const Card = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 16px;
  margin-bottom: 16px;
`;

const CardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 12px;
`;

const FieldRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  align-items: center;
`;

const InlineField = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  white-space: nowrap;
`;

const SmallInput = styled.input`
  width: ${({ $width }) => $width || "80px"};
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Select = styled.select`
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  cursor: pointer;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

// ─── ITEM SECTION ─────────────────────────────────────────────────────────────
const ItemSection = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 12px;
  margin-bottom: 12px;
`;

const ItemSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ItemSectionTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
`;

const AddItemBtn = styled.button`
  padding: 5px 14px;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.backgroundAlt}; }
`;

const ItemRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textLight};
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  &:hover { color: ${({ theme }) => theme.colors.error}; }
`;

const EmptyItemNote = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 10px 0;
`;

// ─── DECISION & REMARK ────────────────────────────────────────────────────────
const RadioRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const RemarkInput = styled.input`
  flex: 1;
  min-width: 180px;
  padding: 7px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const SubmitBtn = styled.button`
  padding: 7px 24px;
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