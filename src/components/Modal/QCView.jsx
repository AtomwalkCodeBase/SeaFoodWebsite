import { useState } from "react";
import styled, { createGlobalStyle, ThemeProvider, keyframes } from "styled-components";
import {
    FiPackage,
    FiUser,
    FiThermometer,
    FiChevronDown,
    FiChevronUp,
    FiHash,
    FiCheckCircle,
    FiClock,
    FiShield,
    FiPlusCircle,
    FiDroplet,
    FiEye,
    FiLayers,
} from "react-icons/fi";
import { TbWeight } from "react-icons/tb";
import { MdOutlineScience, MdOutlineLocalShipping } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../Layout";
import Badge from "../Badge";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const batchData = {
    role: "manager",
    rawPrawnsName: "White Leg Shrimp",
    refNo: "REF-2024-001",
    batchNo: "BATCH-WL-001",
    supplierName: "Coastal Harvest Ltd",
    qty: 500,
    qcStatus: "In Progress",
    qcDone: 2,
    qcHappen: 5,
    samples: [
        {
            sampleId: "SMP-001", status: "completed", assignedTo: "QC001",
            qcTesterName: "John Smith", empId: "EMP001",
            totalSampleWeight: 2.5, totalNoOfPieces: 25,
            temp: "-18°C", smell: "Fresh", color: "Light Pink", decision: "Pass",
            testedItems: [
                { itemName: "White Leg Shrimp - Large", noOfPieces: 15, weight: 1.5, uom: "kg" },
                { itemName: "White Leg Shrimp - Medium", noOfPieces: 10, weight: 1.0, uom: "kg" },
            ],
        },
        {
            sampleId: "SMP-002", status: "completed", assignedTo: "QC002",
            qcTesterName: "Sarah Johnson", empId: "EMP002",
            totalSampleWeight: 2.8, totalNoOfPieces: 28,
            temp: "-17°C", smell: "Fresh", color: "Light Pink", decision: "Pass",
            testedItems: [
                { itemName: "White Leg Shrimp - Large", noOfPieces: 18, weight: 1.8, uom: "kg" },
                { itemName: "White Leg Shrimp - Medium", noOfPieces: 10, weight: 1.0, uom: "kg" },
            ],
        },
        {
            sampleId: "SMP-003", status: "pending", assignedTo: "QC003",
            qcTesterName: "Michael Chen", empId: "EMP003",
            totalSampleWeight: null, totalNoOfPieces: null,
            temp: null, smell: null, color: null, decision: null, testedItems: [],
        },
        {
            sampleId: "SMP-004", status: "pending", assignedTo: "QC004",
            qcTesterName: "Emily Brown", empId: "EMP004",
            totalSampleWeight: null, totalNoOfPieces: null,
            temp: null, smell: null, color: null, decision: null, testedItems: [],
        },
        {
            sampleId: "SMP-005", status: "pending", assignedTo: "QC005",
            qcTesterName: "David Wilson", empId: "EMP005",
            totalSampleWeight: null, totalNoOfPieces: null,
            temp: null, smell: null, color: null, decision: null, testedItems: [],
        },
    ],
};

// ─── ANIMATIONS ───────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const expandDown = keyframes`
  from { opacity: 0; transform: scaleY(0.95); }
  to   { opacity: 1; transform: scaleY(1); }
`;

const pulseDot = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
`;

// ─── GLOBAL ───────────────────────────────────────────────────────────────────
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${({ theme }) => theme.colors.background};
    font-family: ${({ theme }) => theme.fonts.body};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.6;
  }
`;

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const PageWrapper = styled.div`
  max-width: 1080px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.45s ease both;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  svg { color: ${({ theme }) => theme.colors.primary}; }
`;

// ─── CARD ─────────────────────────────────────────────────────────────────────
const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primaryLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  svg { color: ${({ theme }) => theme.colors.primary}; font-size: 16px; }
`;

const CardTitle = styled.span`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

// ─── INFO GRID ────────────────────────────────────────────────────────────────
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 5px;
  svg { color: ${({ theme }) => theme.colors.primary}; opacity: 0.7; }
`;

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
const ProgressSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ProgressLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
  white-space: nowrap;
`;

const ProgressTrack = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, #9C96FF);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: width ${({ theme }) => theme.transitions.slow};
`;

const ProgressCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
`;

// ─── BADGE ────────────────────────────────────────────────────────────────────
// const Badge = styled.span`
//   display: inline-flex;
//   align-items: center;
//   gap: 5px;
//   padding: 3px 10px;
//   border-radius: ${({ theme }) => theme.borderRadius.full};
//   font-size: ${({ theme }) => theme.fontSizes.xs};
//   font-weight: 600;
//   text-transform: capitalize;
//   letter-spacing: 0.3px;

//   ${({ $variant, theme }) => {
//         switch ($variant) {
//             case "completed":
//                 return `background:${theme.colors.accentLight};color:#00897B;`;
//             case "pending":
//                 return `background:${theme.colors.secondaryLight};color:${theme.colors.secondary};`;
//             case "pass":
//                 return `background:${theme.colors.accentLight};color:#00897B;`;
//             case "fail":
//                 return `background:#FFE5E0;color:${theme.colors.error};`;
//             case "inprogress":
//                 return `background:${theme.colors.primaryLight};color:${theme.colors.primary};`;
//             default:
//                 return `background:${theme.colors.backgroundAlt};color:${theme.colors.textLight};`;
//         }
//     }}
// `;

const PendingDot = styled.span`
  width: 7px; height: 7px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  animation: ${pulseDot} 1.4s infinite;
`;

// ─── SAMPLE CARD ──────────────────────────────────────────────────────────────
const SampleCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1.5px solid ${({ $expanded, theme }) =>
        $expanded ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ $expanded, theme }) =>
        $expanded ? `0 0 0 3px ${theme.colors.primaryLight}` : theme.shadows.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  transition:
    box-shadow ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};
  animation: ${fadeIn} 0.4s ease both;
  animation-delay: ${({ $idx }) => $idx * 0.07}s;
`;

const SampleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  user-select: none;
  background: ${({ $expanded, theme }) =>
        $expanded ? theme.colors.primaryLight : "transparent"};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover { background: ${({ theme }) => theme.colors.backgroundAlt}; }
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const SampleHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SampleIndex = styled.div`
  width: 36px; height: 36px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ $completed, theme }) =>
        $completed ? theme.colors.accentLight : theme.colors.primaryLight};
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ $completed, theme }) => $completed ? "#00897B" : theme.colors.primary};
  flex-shrink: 0;
`;

const SampleMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SampleName = styled.span`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const SampleSub = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 5px;
  svg { opacity: 0.6; }
`;

const SampleHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

// ─── CHIPS ────────────────────────────────────────────────────────────────────
const ChipRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Chip = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  strong { color: ${({ theme }) => theme.colors.text}; font-weight: 600; }
  svg { color: ${({ theme }) => theme.colors.primary}; font-size: 11px; }
`;

const ToggleIcon = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 18px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

// ─── EXPANDED BODY ────────────────────────────────────────────────────────────
const SampleBody = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  animation: ${expandDown} 0.25s ease both;
  transform-origin: top;
`;

const SampleBodyInner = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

// ─── METRICS ──────────────────────────────────────────────────────────────────
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MetricTile = styled.div`
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MetricIcon = styled.div`
  width: 28px; height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.primaryLight};
  display: flex; align-items: center; justify-content: center;
  svg { color: ${({ theme }) => theme.colors.primary}; font-size: 14px; }
`;

const MetricLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
`;

const MetricValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

// ─── TABLE ────────────────────────────────────────────────────────────────────
const TableSectionLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 6px;
  svg { font-size: 13px; }
`;

const TableWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background: ${({ theme }) => theme.colors.primaryLight};
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Tr = styled.tr`
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover td { background: ${({ theme }) => theme.colors.backgroundAlt}; }
`;

const Td = styled.td`
  padding: 10px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const UomBadge = styled.span`
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

// ─── PENDING PLACEHOLDER ──────────────────────────────────────────────────────
const PendingPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.secondaryLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.secondary};
  svg { font-size: 28px; opacity: 0.6; }
  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 500;
    opacity: 0.8;
    text-align: center;
  }
`;

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CreatePOBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 11px 26px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, #9C96FF);
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px ${({ theme }) => theme.colors.shadow};
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${({ theme }) => theme.colors.shadow};
  }
  &:active { transform: translateY(0); }
`;

// ─── SAMPLE ROW ───────────────────────────────────────────────────────────────
function SampleRow({ sample, index }) {
    const [open, setOpen] = useState(sample.status === "completed");
    const isStarted = sample.qc_status === "P" ? true : false;
    const formatQcName = (key) => key.replace("QC_", "").replaceAll("_", " ");

    const getQcArray = (sample) => {
        const output = sample?.item_output || {};
        const testRequired = sample?.test_required || {};

        // If item_output has values → use it
        if (Object.keys(output).length > 0) {
            return Object.entries(output)
                .filter(([_, value]) => value) // remove empty/null
                .map(([key, value]) => ({
                    key,
                    label: formatQcName(key),
                    value
                }));
        }

        // 🔥 If item_output is empty → fallback to test_required
        return Object.keys(testRequired).map((key) => ({
            key,
            label: formatQcName(key),
            value: "--"
        }));
    };

    const qcArray = getQcArray(sample);

    return (
        <SampleCard $expanded={open} $idx={index}>
            <SampleHeader $expanded={open} onClick={() => setOpen((p) => !p)}>
                <SampleHeaderLeft>
                    <SampleIndex $completed={isStarted}>{index + 1}</SampleIndex>
                    <SampleMeta>
                        <SampleName>Employee name</SampleName>
                        <SampleSub>
                            <FiHash size={11} />
                            {sample.sample_id}&nbsp;·&nbsp;
                            <FiUser size={11} />
                            {sample.inspector_emp_id}
                        </SampleSub>
                    </SampleMeta>
                </SampleHeaderLeft>

                <SampleHeaderRight>
                    {isStarted && (
                        <ChipRow>
                          {/* {qcArray.map(item => (
                              <Chip key={item.key}>
                                  <strong>{item.label}:</strong>&nbsp;{item.value}
                              </Chip>
                          ))} */}
                          <Chip><strong>Date:</strong>&nbsp;{sample.qc_date}</Chip>
                          <Chip><strong>Planned Start Time:</strong>&nbsp;{sample.scheduled_start || "--"}</Chip>
                          <Chip><strong>Planned end Time:</strong>&nbsp;{sample.scheduled_end || "--"}</Chip>
                          <Chip><strong>Actual Start Time:</strong>&nbsp;{sample.actual_start || "--"}</Chip>
                          <Chip><strong>Actual end Time:</strong>&nbsp;{sample.actual_end || "--"}</Chip>
                      </ChipRow>
                    )}
                    <Badge variant={isStarted ? "info" : "not planned"}>
                        {isStarted
                            ? <FiCheckCircle size={11} />
                            : <PendingDot />}
                        {isStarted? "In progress" : "Not started"}
                    </Badge>
                    <ToggleIcon>
                        {open ? <FiChevronUp /> : <FiChevronDown />}
                    </ToggleIcon>
                </SampleHeaderRight>
            </SampleHeader>

            {open && (
                <SampleBody>
                    <SampleBodyInner>
                        {/* {isCompleted ? ( */}
                            <>
                                <MetricsGrid>
                                    <MetricTile>
                                        {/* <MetricIcon><TbWeight /></MetricIcon> */}
                                        <MetricLabel>Total Weight</MetricLabel>
                                        <MetricValue>{sample.totalSampleWeight || "--"} kg</MetricValue>
                                    </MetricTile>
                                    <MetricTile>
                                        {/* <MetricIcon><FiLayers /></MetricIcon> */}
                                        <MetricLabel>Total Pieces</MetricLabel>
                                        <MetricValue>{sample.totalNoOfPieces || "--"}</MetricValue>
                                      </MetricTile>
                                       {qcArray.map(item => (
                                          <MetricTile key={item.key}>
                                              {/* <MetricIcon><FiCheckCircle /></MetricIcon> */}
                                              <MetricLabel>{item.label || '--'}</MetricLabel>
                                              <MetricValue>{item.value || '--'}</MetricValue>
                                          </MetricTile>
                                      ))}
                                      <MetricTile>
                                        {/* <MetricIcon><FiShield /></MetricIcon> */}
                                        <MetricLabel>Decision</MetricLabel>
                                        <MetricValue>
                                            {/* <Badge $variant={sample?.decision?.toLowerCase()}>
                                                {sample?.decision === "Pass" && <FiCheckCircle size={10} />}
                                                {sample?.decision || "pending"}
                                            </Badge> */}
                                            pending
                                        </MetricValue>
                                    </MetricTile>
                                </MetricsGrid>

                                {sample.item_output && (
                                    <>
                                        <TableSectionLabel>
                                            <MdOutlineScience /> Tested Items
                                        </TableSectionLabel>
                                        <TableWrapper>
                                            <Table>
                                                <Thead>
                                                    <Tr>
                                                        <Th>#</Th>
                                                        <Th>Item Name</Th>
                                                        <Th>No. of Pieces</Th>
                                                        <Th>Weight</Th>
                                                        <Th>UOM</Th>
                                                    </Tr>
                                                </Thead>
                                                <tbody>
                                                    {Object.keys(sample.item_output).length > 0 ? (
                                                        <Tr>
                                                            <Td>1</Td>
                                                            <Td>{sample.item_output.itemName}</Td>
                                                            <Td>{sample.item_output.noOfPieces}</Td>
                                                            <Td>{sample.item_output.weight}</Td>
                                                            <Td><UomBadge>{sample.item_output.uom}</UomBadge></Td>
                                                        </Tr>
                                                    ) : (
                                                        <Tr>
                                                            <Td colSpan="5" style={{ textAlign: 'center' }}>
                                                                Item not selected
                                                            </Td>
                                                        </Tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </TableWrapper>
                                    </>
                                )}
                            </>
                        {/* ) : (
                            <PendingPlaceholder>
                                <FiClock />
                                <span>Awaiting QC inspection by {sample.qcTesterName}</span>
                            </PendingPlaceholder>
                        )} */}
                    </SampleBodyInner>
                </SampleBody>
            )}
        </SampleCard>
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function QCView() {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.batchData || batchData;
    const poItems = data?.po_items?.[0]
    const pct = Math.round((data.total_qc / data.total_allocated) * 100);

    return (
        <Layout title="QC View">
            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <FiPackage />
                    <CardTitle>Basic Info</CardTitle>
                </CardHeader>
                <CardBody>
                    <InfoGrid>
                        <InfoItem>
                            <InfoLabel><FiHash size={11} /> PO Ref Number</InfoLabel>
                            <InfoValue>{data.po_ref_number}</InfoValue>
                        </InfoItem>
                        {/* <InfoItem>
                            <InfoLabel><FiHash size={11} /> Ref No.</InfoLabel>
                            <InfoValue>{data.refNo}</InfoValue>
                        </InfoItem> */}
                        <InfoItem>
                            <InfoLabel><FiPackage size={11} /> Item</InfoLabel>
                            <InfoValue>{poItems?.po_item?.name}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                            <InfoLabel><TbWeight size={11} /> Received Qty</InfoLabel>
                            <InfoValue>{poItems?.quantity} Kg</InfoValue>
                        </InfoItem>
                        <InfoItem>
                            <InfoLabel><MdOutlineLocalShipping size={11} /> Supplier</InfoLabel>
                            <InfoValue>{data.supplier_name}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                            <InfoLabel><MdOutlineScience size={11} /> Total Samples</InfoLabel>
                            {/* <InfoValue>{data.qcHappen}</InfoValue> */}
                            <InfoValue>30</InfoValue>
                        </InfoItem>
                    </InfoGrid>
                </CardBody>
                <ProgressSection>
                    <ProgressLabel>QC Progress</ProgressLabel>
                    <ProgressTrack>
                        <ProgressFill $pct={pct} />
                    </ProgressTrack>
                    <ProgressCount>{data.total_qc} / {data.total_allocated} done</ProgressCount>
                </ProgressSection>
            </Card>

            {/* Samples */}
            <Card>
                <CardHeader>
                    <MdOutlineScience />
                    <CardTitle>Sample Inspections</CardTitle>
                </CardHeader>
                <CardBody>
                    {data.qc_data.map((sample, idx) => (
                        <SampleRow key={sample.id} sample={sample} index={idx} />
                    ))}
                    <Divider />
                    <FooterBar>
                        <CreatePOBtn onClick={() => navigate("/POCreationScreen", { state: { batchData: data } })}>
                            <FiPlusCircle size={16} />
                            Create PO Item
                        </CreatePOBtn>
                    </FooterBar>
                </CardBody>
            </Card>
        </Layout>

    );
}