// Modal.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  IoClose,
  IoBusiness,
  IoCalendar,
  IoTicket,
  IoCube,
  IoScale,
  IoCash,
  IoLocation,
  IoCar,
  IoDocumentText,
  IoChevronDown,
  IoDocumentTextOutline,
  IoAdd,
  IoTrash,
  IoListOutline
} from 'react-icons/io5';
import { theme } from '../../styles/Theme';
import { getCustomerListView, getInventoryItem, postProcessPoRequest } from '../../services/productServices';
import { toast } from 'react-toastify';

// ─── Styled Components ─────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  z-index: 1000;
  animation: fadeIn ${theme.transitions.normal};

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background-color: ${theme.colors.card};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.xl};
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideIn ${theme.transitions.normal};

  @keyframes slideIn {
    from {
      transform: translateY(-30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.colors.background};
    border-radius: ${theme.borderRadius.full};
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: ${theme.borderRadius.full};
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.backgroundAlt};
  border-radius: ${theme.borderRadius.xl} ${theme.borderRadius.xl} 0 0;
  position: sticky;
  top: 0;
  z-index: 10;

  h2 {
    margin: 0;
    color: ${theme.colors.primary};
    font-size: ${theme.fontSizes.xl};
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${theme.fontSizes.xl};
  cursor: pointer;
  color: ${theme.colors.textLight};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.full};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.primaryLight};
    color: ${theme.colors.primary};
  }
`;

const ModalBody = styled.div`
  padding: ${theme.spacing.xl};
`;

const Section = styled.div`
  margin-bottom: ${theme.spacing.xl};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.text};
  font-size: ${theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: ${theme.spacing.md};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 2px solid ${theme.colors.primaryLight};

  svg {
    color: ${theme.colors.primary};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.md};
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.text};
  font-size: ${theme.fontSizes.sm};
  font-weight: 500;

  svg {
    color: ${theme.colors.primary};
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: ${theme.spacing.sm};
    color: ${theme.colors.textLight};
    font-size: ${theme.fontSizes.md};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  padding-left: ${props => props.hasicon ? '2.2rem' : theme.spacing.md};
  border: 1px solid ${props => props.error ? theme.colors.error : theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  transition: all ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryLight};
  }

  &::placeholder {
    color: ${theme.colors.textLight};
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  padding-left: 2.2rem;
  border: 1px solid ${props => props.error ? theme.colors.error : theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  color: ${theme.colors.text};
  background: ${theme.colors.background};
  appearance: none;
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primaryLight};
  }
`;

const SelectIcon = styled(IoChevronDown)`
  position: absolute;
  right: ${theme.spacing.sm};
  left: auto !important;
  color: ${theme.colors.textLight};
  pointer-events: none;
`;

const ErrorMessage = styled.span`
  color: ${theme.colors.error};
  font-size: ${theme.fontSizes.xs};
  margin-top: ${theme.spacing.xs};
`;

// ─── Item List Styles ──────────────────────────────────────────────────────────

const ItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ItemCard = styled.div`
  background: ${theme.colors.background};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.xl};
  padding: ${theme.spacing.lg};
  position: relative;
  transition: all ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: 0 4px 12px ${theme.colors.shadow};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const ItemNumber = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.primary};
  font-weight: 600;
  font-size: ${theme.fontSizes.sm};

  svg {
    color: ${theme.colors.primary};
  }
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${theme.colors.errorLight};
  color: ${theme.colors.error};
  border: 1px solid ${theme.colors.error};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.xs};
  font-weight: 500;
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.error};
    color: white;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const AddItemButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  width: 100%;
  padding: ${theme.spacing.md};
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  border: 2px dashed ${theme.colors.primary};
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.primary};
    color: white;
    border-style: solid;
  }

  svg {
    font-size: ${theme.fontSizes.lg};
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.backgroundAlt};
  border-radius: 0 0 ${theme.borderRadius.xl} ${theme.borderRadius.xl};
  position: sticky;
  bottom: 0;

  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const ItemCount = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  color: ${theme.colors.textLight};
  font-size: ${theme.fontSizes.sm};
  font-weight: 500;

  span {
    background: ${theme.colors.primaryLight};
    color: ${theme.colors.primary};
    padding: 2px 8px;
    border-radius: ${theme.borderRadius.full};
    font-weight: 700;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  margin-left: auto;
  gap: ${theme.spacing.md};
`;

const Button = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.xl};
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: ${theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }

  &:active {
    transform: translateY(0);
  }
`;

const PrimaryButton = styled(Button)`
  background: ${theme.colors.primary};
  color: white;

  &:hover {
    background: ${theme.colors.primary};
    opacity: 0.9;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  border: 1px solid ${theme.colors.border};

  &:hover {
    background: ${theme.colors.backgroundAlt};
  }
`;

// ─── Reusable FormField Component ──────────────────────────────────────────────

const FormField = ({
  label,
  name,
  type = "text",
  icon: Icon,
  options = null,
  required = false,
  value,
  onChange,
  error,
  placeholder,
  valueKey = "id",
  labelKey = "name"
}) => {
  const fieldId = `field-${name}`;
  const hasicon = !!Icon;

  return (
    <FormGroup>
      <Label htmlFor={fieldId}>
        {Icon && <Icon size={16} />}
        {label}
        {required && <span style={{ color: theme.colors.error }}>*</span>}
      </Label>
      <InputWrapper>
        {type === "select" ? (
          <>
            <StyledSelect
              id={fieldId}
              name={name}
              value={value}
              onChange={onChange}
              error={error}
              required={required}
            >
              <option value="">Select {label}</option>
              {options?.map(opt => (
                <option
                  key={opt[valueKey]}
                  value={opt[valueKey]}
                >
                  {opt[labelKey] ?? opt.name ?? opt.id}
                </option>
              ))}
            </StyledSelect>
            <SelectIcon size={18} />
          </>
        ) : (
          <StyledInput
            id={fieldId}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            error={error}
            required={required}
            hasicon={hasicon}
          />
        )}
      </InputWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FormGroup>
  );
};

// ─── Main Modal Component ──────────────────────────────────────────────────────

const PurchaseOrderModal = ({ isOpen, onClose, mode = "ADD", supplier_id, screen, addMultipleItem = true, refreshData }) => {
  const [supplierList, setSupplierList] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);

  const [formData, setFormData] = useState({
    call_mode: mode,
    supplier_id: "",
    supplier_ref_number: "",
    po_due_date: new Date().toISOString().split('T')[0],
    location_name: "",
    po_ref_number: "", // Required for UPDATE/DELETE
  });

  // Initialize with one empty item
  const [itemList, setItemList] = useState([
    {
      item_number: "",
      unit_price: "",
      quantity: screen === "purchase_request" ? "" : 1,
      remarks: ""
    }
  ]);

  const [errors, setErrors] = useState({});

  // ── Handlers ──

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...itemList];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setItemList(updatedItems);

    // Clear item-specific errors
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: "" }));
    }
  };

  const addItem = () => {
    setItemList([
      ...itemList,
      {
        item_number: "",
        unit_price: "",
        quantity: "",
        remarks: ""
      }
    ]);
  };

  const removeItem = (index) => {
    if (itemList.length > 1) {
      setItemList(itemList.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate PO data
    const requiredFields = ["supplier_id", "po_due_date",];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });

    // Validate items
    itemList.forEach((item, index) => {
      if (!item.item_number) {
        newErrors[`item_${index}_item_number`] = "Item is required";
      }
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_unit_price`] = "Valid price required";
      }
      if (screen === "purchase_request") {
        if (!item.quantity || item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = "Valid quantity required";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      const payload = {
        po_data: {
          ...formData,
          // Convert date to DD-MM-YYYY format
          po_type: screen === "purchase_request" ? "R" : "S",
          po_due_date: formData.po_due_date.split('-').reverse().join('-'),
          ...(screen !== "purchase_request" && {
            service_item: itemList[0]?.item_number
          }),
          item_list: itemList.map(item => ({
            ...item,
            unit_price: parseFloat(item.unit_price),
            quantity: parseFloat(item.quantity)
          }))
        }
      };

      // console.log('Submitting payload:', payload);
      try {
        await postProcessPoRequest(payload);
        toast.success(screen === "purchase_request" ? "Purchase order request is initiated." : "Purchase service is initiated.")
        await refreshData();
      } catch (error) {
        toast.error("something went wrong. try again later !!!")
      }
      onClose();
    }
  };

  // ── Effects ──

  useEffect(() => {
    if (isOpen) {
      getSupplierList();
      if (screen === "purchase_service") {
        const payload = { is_service: 1, inventory_type: "ALL" }
        getItemOptionList(payload);
      } else {
        getItemOptionList();
      }
    }
  }, [isOpen, screen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        call_mode: mode,
        supplier_id: "",
        supplier_ref_number: "",
        po_due_date: new Date().toISOString().split('T')[0],
        location_name: "",
        po_ref_number: "",
      });
      setItemList([
        {
          item_number: "",
          unit_price: "",
          quantity: "",
          remarks: ""
        }
      ]);
      setErrors({});
    }
  }, [isOpen, mode]);

  // Auto-populate supplier field when supplier_id is available
  useEffect(() => {
    if (isOpen && supplier_id) {
      setFormData(prev => ({
        ...prev,
        supplier_id: supplier_id
      }));
    }
  }, [isOpen, supplier_id]);

  const getSupplierList = async () => {
    try {
      const response = await getCustomerListView({ is_supplier: "YES" });
      const data = response.data || [];

      if (supplier_id) {
        const supplier = data.find((d) => Number(d.id) === Number(supplier_id));

        if (supplier) {
          setSupplierList([supplier]); // only that supplier
        }
      } else {
        setSupplierList(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const getItemOptionList = async (payload = {}) => {
    try {
      const response = await getInventoryItem(payload);
      setItemOptions(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2> {screen === "purchase_request" ? "Create Purchase Request" : "Create Purchase Service"}</h2>
          <CloseButton onClick={onClose}>
            <IoClose size={24} />
          </CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            {/* ── PO Information Section ── */}
            <Section>
              <SectionTitle>
                <IoDocumentText size={20} />
                Purchase {screen === "purchase_request" ? "Order" : "Service"} Information
              </SectionTitle>

              <FormGrid>
                {screen === "purchase_request" && <FormField
                  label="Supplier"
                  name="supplier_id"
                  icon={IoBusiness}
                  type="select"
                  options={supplierList}
                  value={formData.supplier_id}
                  onChange={handleChange}
                  error={errors.supplier_id}
                  required
                  valueKey="id"
                  labelKey="name"
                />}

                <FormField
                  label="Supplier Ref Number"
                  name="supplier_ref_number"
                  icon={IoDocumentTextOutline}
                  type="text"
                  placeholder="Enter supplier reference"
                  value={formData.supplier_ref_number}
                  onChange={handleChange}
                />

                {!screen === "purchase_service" && <FormField
                  label="Due Date"
                  name="po_due_date"
                  icon={IoCalendar}
                  type="date"
                  value={formData.po_due_date}
                  onChange={handleChange}
                  error={errors.po_due_date}
                  required
                />}

                {!screen === "purchase_service" && <FormField
                  label="Location"
                  name="location_name"
                  icon={IoLocation}
                  type="text"
                  placeholder="Enter location"
                  value={formData.location_name}
                  onChange={handleChange}
                  error={errors.location_name}
                  required
                />}
              </FormGrid>
            </Section>

            {/* ── Items Section ── */}
            <Section>
              <SectionTitle>
                <IoListOutline size={20} />
                Order Items{screen === "purchase_request" ? `(${itemList.length})` : ""}
              </SectionTitle>

              <ItemsContainer>
                {itemList.map((item, index) => (
                  <ItemCard key={index}>
                    {screen === "purchase_request" && <ItemHeader>
                      <ItemNumber>
                        <IoCube />
                        Item #{index + 1}
                      </ItemNumber>
                      <RemoveButton
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={itemList.length === 1}
                      >
                        <IoTrash /> Remove
                      </RemoveButton>
                    </ItemHeader>}
                    <FormGrid>
                      <FormField
                        label="Item"
                        name={`item_number_${index}`}
                        icon={IoTicket}
                        type="select"
                        options={itemOptions}
                        value={item.item_number}
                        onChange={(e) => handleItemChange(index, 'item_number', e.target.value)}
                        error={errors[`item_${index}_item_number`]}
                        required
                        valueKey="item_number"
                      />

                      <FormField
                        label="Unit Price"
                        name={`unit_price_${index}`}
                        icon={IoCash}
                        type="number"
                        placeholder="Enter price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        error={errors[`item_${index}_unit_price`]}
                        required
                      />

                      {/* {screen === "purchase_request" &&  */}
                      <FormField
                        label="Quantity"
                        name={`quantity_${index}`}
                        icon={IoCube}
                        type="number"
                        placeholder="Enter quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        error={errors[`item_${index}_quantity`]}
                        required
                      />
                      {/* } */}

                      <FormField
                        label="Remarks"
                        name={`remarks_${index}`}
                        icon={IoDocumentText}
                        type="text"
                        placeholder="Optional remarks"
                        value={item.remarks}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                      />
                    </FormGrid>

                    {/* Item Total Preview */}
                    {item.unit_price && item.quantity && (
                      <div style={{
                        marginTop: theme.spacing.md,
                        padding: theme.spacing.sm,
                        background: theme.colors.primaryLight,
                        borderRadius: theme.borderRadius.lg,
                        textAlign: 'right',
                        fontWeight: 600,
                        color: theme.colors.primary
                      }}>
                        Subtotal: ₹{(parseFloat(item.unit_price) * parseFloat(item.quantity)).toFixed(2)}
                      </div>
                    )}
                  </ItemCard>
                ))}

                {addMultipleItem && <AddItemButton type="button" onClick={addItem}>
                  <IoAdd />
                  Add Another Item
                </AddItemButton>}
              </ItemsContainer>
            </Section>
          </ModalBody>

          <ModalFooter>
            {screen === "purchase_request" && <ItemCount>
              Total Items: <span>{itemList.length}</span>
            </ItemCount>}

            <ButtonGroup>
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                {screen === "purchase_request" ? "Create Purchase Request" : "Create Purchase Service"}
              </PrimaryButton>
            </ButtonGroup>
          </ModalFooter>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default PurchaseOrderModal;