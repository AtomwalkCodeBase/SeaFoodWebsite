import { useState } from "react";
import { INVENTORY_TYPE, PO_STATUS, PO_TYPE } from "../../constants";
import { formatCurrency } from "../../utils";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const POCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(108,99,255,0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(108,99,255,0.15);
    border-color: ${({ theme }) => theme.colors.primary}44;
  }
`;

const CardHeader = styled.div`
  background: linear-gradient(125deg, ${({ theme }) => theme.colors.primaryLight} 0%, ${({ theme }) => theme.colors.accentLight} 100%);
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1.5px solid ${({ theme }) => theme.colors.border};
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PORefWrap = styled.div`
  flex: 1;
`;

const PORef = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PODateRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textLight};
  svg { font-size: 12px; }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 700;
  background: ${({ $s, theme }) => PO_STATUS[$s]?.bg};
  color: ${({ $s, theme }) => PO_STATUS[$s]?.color};
  white-space: nowrap;
  flex-shrink: 0;

  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: ${({ theme }) => theme.borderRadius.full};
    background: ${({ $s, theme }) => PO_STATUS[$s]?.dot};
  }
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  align-items: center;
`;

const MetaPill = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ $bg, theme }) => $bg || theme.colors.backgroundAlt};
  color: ${({ $color, theme }) => $color || theme.colors.text};
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  svg { font-size: 12px; flex-shrink: 0; }
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
`;

// Supplier & Location info
const InfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InfoBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const InfoIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 13px;
  margin-top: 1px;
  flex-shrink: 0;
  display: flex;
`;

const InfoContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.div`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 1px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// PO Items Section
const ItemsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ItemsHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.primary}33;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-family: inherit;
  margin-bottom: ${({ $open, theme }) => ($open ? theme.spacing.xs : "0")};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}22;
    border-color: ${({ theme }) => theme.colors.primary}66;
  }
`;

const ItemsHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ItemsIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.primary}22;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 14px;
`;

const ItemsTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const ItemsCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
`;

const ChevronIcon = styled.span`
  display: flex;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 16px;
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $open }) => ($open ? "rotate(0)" : "rotate(0)")};
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const POItemCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  transition: all 0.18s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary}66;
    background: ${({ theme }) => theme.colors.background};
    transform: translateX(4px);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ItemNameRow = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ItemNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  svg { font-size: 11px; }
`;

const ItemTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 0.65rem;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.infoLight};
  color: ${({ theme }) => theme.colors.info};
  white-space: nowrap;
`;

const ItemDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ItemDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ItemDetailLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const ItemDetailValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  svg { font-size: 12px; color: ${({ theme }) => theme.colors.primary}; }
`;

const ItemTotal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.accentLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.accent}33;
`;

const ItemTotalLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
`;

const ItemTotalValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  svg { font-size: 14px; }
`;

const ItemRemarks = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.secondaryLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.secondary}33;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.text};
  font-style: italic;
  line-height: 1.4;
`;

// Grand Total Bar
const GrandTotalBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primaryLight}, ${({ theme }) => theme.colors.accentLight});
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.primary}22;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const GrandTotalLeft = styled.div``;

const GrandTotalLabel = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const GrandTotalValue = styled.div`
  font-size: 1.15rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  svg { font-size: 18px; }
`;

const TaxRow = styled.div`
  text-align: right;
`;

const TaxLabel = styled.div`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1px;
`;

const TaxValue = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.xs};
  svg { font-size: 13px; }
`;

// Card Footer
const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-top: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundAlt};
`;

const FooterInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FooterLabel = styled.span`
  font-size: 0.65rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const FooterValue = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;


export function POCardItem({ po, index, supplier_screen = false }) {
  const navigate = useNavigate()
  const [itemsOpen, setItemsOpen] = useState(false);
    // const showButton = window.location.pathname ="/seaFood/home"

  const poStatus = PO_STATUS[po.po_status] || PO_STATUS.P;
  const poType = PO_TYPE[po.po_type] || PO_TYPE.P;

  return (
    <POCard>
      {/* ── Header ── */}
      <CardHeader>
        <HeaderTop>
          <PORefWrap>
            <PORef>{po.po_ref_number}</PORef>
            <PODateRow>
              <FiCalendar />
              {po.po_date}
            </PODateRow>
          </PORefWrap>
          <Badge variant={poStatus.variant}>{poStatus.label}</Badge>
        </HeaderTop>

        <HeaderMeta>
          {!supplier_screen && <MetaPill $bg={poType.bg} $color={poType.color}>
            <FiPackage />
            {poType.label}
          </MetaPill>}
          <MetaPill>
            <BsBoxSeam />
            {po.po_items?.length || 0} Item{po.po_items?.length !== 1 ? "s" : ""}
          </MetaPill>
          {po.expected_due_date && (
            <MetaPill>
              <FiCalendar />
              Due: {po.expected_due_date}
            </MetaPill>
          )}
        </HeaderMeta>
      </CardHeader>

      {/* ── Body ── */}
      <CardBody>
        {/* Supplier & Location */}
        <InfoRow>
          {!supplier_screen && <InfoBox>
            <InfoIcon><FiUser /></InfoIcon>
            <InfoContent>
              <InfoLabel>Supplier</InfoLabel>
              <InfoValue>{po.supplier_name || "—"}</InfoValue>
            </InfoContent>
          </InfoBox>}

          <InfoBox>
            <InfoIcon><FiMapPin /></InfoIcon>
            <InfoContent>
              <InfoLabel>Location</InfoLabel>
              <InfoValue>{po.location || "—"}</InfoValue>
            </InfoContent>
          </InfoBox>

          {po.branch_id && (
            <InfoBox>
              <InfoIcon><FiHash /></InfoIcon>
              <InfoContent>
                <InfoLabel>Branch</InfoLabel>
                <InfoValue>{po.branch_id}</InfoValue>
              </InfoContent>
            </InfoBox>
          )}
        </InfoRow>

        {/* ── PO Items Section ── */}
        <ItemsSection>
          <ItemsHeader $open={itemsOpen} onClick={() => setItemsOpen(!itemsOpen)}>
            <ItemsHeaderLeft>
              <ItemsIcon><BsBoxSeam /></ItemsIcon>
              <ItemsTitle>Purchase Order Items</ItemsTitle>
              <ItemsCount>{po.po_items?.length || 0}</ItemsCount>
            </ItemsHeaderLeft>
            <ChevronIcon $open={itemsOpen}>
              {itemsOpen ? <FiChevronUp /> : <FiChevronDown />}
            </ChevronIcon>
          </ItemsHeader>

          {itemsOpen && (
            <ItemsList>
              {po.po_items?.map((item) => (
                <POItemCard key={item.id}>
                  <ItemHeader>
                    <ItemNameRow>
                      <ItemName>{item.po_item.name}</ItemName>
                      <ItemNumber>
                        <FiHash />
                        {item.po_item.item_number}
                      </ItemNumber>
                    </ItemNameRow>
                    {!supplier_screen && <ItemTypeBadge>
                      {INVENTORY_TYPE[item.po_item.inventory_type]?.short || item.po_item.inventory_type}
                    </ItemTypeBadge>}
                  </ItemHeader>

                  <ItemDetails>
                    <ItemDetail>
                      <ItemDetailLabel>Quantity</ItemDetailLabel>
                      <ItemDetailValue>
                        <BsBoxSeam />
                        {parseFloat(item.quantity).toFixed(2)}
                      </ItemDetailValue>
                    </ItemDetail>

                    <ItemDetail>
                      <ItemDetailLabel>Unit Price</ItemDetailLabel>
                      <ItemDetailValue>
                        <TbCurrencyRupee />
                        {formatCurrency(item.unit_price, po.po_currency)}
                      </ItemDetailValue>
                    </ItemDetail>

                    <ItemDetail>
                      <ItemDetailLabel>Tax Rate</ItemDetailLabel>
                      <ItemDetailValue>{parseFloat(item.tax_rate).toFixed(2)}%</ItemDetailValue>
                    </ItemDetail>

                    {supplier_screen && <ItemDetail>
                      <ItemDetailLabel>TDS</ItemDetailLabel>
                      <ItemDetailValue>1%</ItemDetailValue>
                    </ItemDetail>}

                    {supplier_screen && <ItemDetail>
                      <ItemDetailLabel>TDS Amount</ItemDetailLabel>
                      <ItemDetailValue>₹{item.tax_amount}</ItemDetailValue>
                    </ItemDetail>}
                  </ItemDetails>

                  <ItemTotal>
                    <ItemTotalLabel>Item Total (incl. tax)</ItemTotalLabel>
                    <ItemTotalValue>
                      <TbCurrencyRupee />
                      {formatCurrency(item.total_price, po.po_currency)}
                    </ItemTotalValue>
                  </ItemTotal>

                  {item.remarks && (
                    <ItemRemarks>"{item.remarks}"</ItemRemarks>
                  )}
                </POItemCard>
              ))}
            </ItemsList>
          )}
        </ItemsSection>

        {/* ── Grand Total ── */}
        <GrandTotalBar>
          <GrandTotalLeft>
            <GrandTotalLabel>Grand Total</GrandTotalLabel>
            <GrandTotalValue>
              <TbCurrencyRupee />
              {formatCurrency(po.total, po.po_currency)}
            </GrandTotalValue>
          </GrandTotalLeft>
          <TaxRow>
            <TaxLabel>Tax Amount</TaxLabel>
            <TaxValue>
              <TbCurrencyRupee />
              {formatCurrency(po.tax_amount, po.po_currency)}
            </TaxValue>
          </TaxRow>
        </GrandTotalBar>
      </CardBody>

      {/* ── Footer ── */}
      <CardFooter>
        <FooterInfo>
          <FooterLabel>Currency</FooterLabel>
          <FooterValue>{po.po_currency}</FooterValue>
        </FooterInfo>
        {po.payment_terms && (
          <FooterInfo>
            <FooterLabel>Payment Terms</FooterLabel>
            <FooterValue>{po.payment_terms}</FooterValue>
          </FooterInfo>
        )}
       {/* {!supplier_screen && <ActionBtns>
          <IconBtn title="View" $hbg={T.infoLight} $hcolor={T.info}>
            <FiEye />
          </IconBtn>
          <IconBtn title="Edit" $hbg={T.primaryLight} $hcolor={T.primary}>
            <FiEdit2 />
          </IconBtn>
          <IconBtn title="Delete" $hbg={T.errorLight} $hcolor={T.error}>
            <FiTrash2 />
          </IconBtn>
          <Button onClick={() => navigate("/qc-check", { state: po })}>QC Check</Button>
        </ActionBtns>} */}
      </CardFooter>
    </POCard>
  );
}