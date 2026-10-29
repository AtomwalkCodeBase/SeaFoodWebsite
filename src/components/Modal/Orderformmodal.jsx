import React from 'react'
import styled from 'styled-components';

import InputField from '../InputField';
import Modal from '../Modal';

import { ORDERS_CUSTOMER_TIER, ORDERS_PRIORITY_OPTIONS, } from '../../constants'

export const RECURRING_FREQUENCY_OPTIONS = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'HALF_YEARLY', label: 'Half-Yearly' },
    { value: 'YEARLY', label: 'Yearly' },
];

const RecurringCheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const Section = ({ title, children }) => (
    <div>
        <h3 className="text-md font-bold text-primary mb-3 uppercase tracking-wide">{title}</h3>
        <hr className="border-border mb-4" />
        {children}
    </div>
);

/**
 * Add/Edit Order modal. Fully controlled by the parent — this component
 * owns no state of its own beyond what's passed in as props.
 */
const OrderFormModal = ({
    isOpen,
    isEditMode,
    form,
    handleChange,
    handleCustomerNameChange,
    handleRecurringToggle,
    onClose,
    onSave,
    customerList,
    productList,
    gradesOptions,
    selectedProductBaseUnit,
    // selectedProductWeightKg,
    // convertQuantityToMT
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            title={isEditMode ? "Edit Order" : "Add New Order"}
            width="max-w-2xl"
            maxHeight="max-h-[75vh]"
            showSaveButton={true}
            saveButtonText={isEditMode ? "Edit" : "Add Order"}
            cancelButtonText="Cancel"
        >
            <div className="space-y-6">
                <Section title="Order Details">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <InputField
                                label="Sales Order"
                                name="erp_order_reference"
                                type="text"
                                value={form.erp_order_reference}
                                onChange={handleChange}
                                required={true}
                                disabled={isEditMode}
                            />
                        </div>

                        <InputField
                            label="Customer Name"
                            name="customer_id"
                            type="select"
                            value={form.customer_id}
                            onChange={handleCustomerNameChange}
                            options={customerList.map((c) => ({ value: c.id, label: c.name }))}
                            required={true}
                            disabled={isEditMode}
                        />

                        <InputField
                            label="Customer Tier"
                            name="customer_tier"
                            type="select"
                            value={form.customer_tier}
                            onChange={handleChange}
                            options={ORDERS_CUSTOMER_TIER.map((item) => ({
                                value: item.value,
                                label: item.label,
                            }))}
                            required={true}
                        />

                        <InputField
                            label="Product"
                            name="product"
                            type="select"
                            value={form.product}
                            onChange={handleChange}
                            options={productList.map(item => ({ id: item.id, value: item.id, label: item.product_name }))}
                            required={true}
                        />

                        <InputField
                            label="Grade"
                            name="grade_config"
                            type="select"
                            value={form.grade_config}
                            onChange={handleChange}
                            options={gradesOptions}
                            required={true}
                        />

                        <InputField
                            label={`Quantity (in ${selectedProductBaseUnit})`}
                            name="quantity_mt"
                            type="number"
                            value={form.quantity_mt}
                            onChange={handleChange}
                            required={true}
                        />
                        {/* <InputField
                            label="Quantity (MT)"
                            name="quantity_in_mt"
                            type="number"
                            value={convertQuantityToMT(
                                form.quantity_mt,
                                selectedProductBaseUnit,
                                // selectedProductWeightKg
                            )}
                            readOnly={true}
                        /> */}
                    </div>
                </Section>

                <Section title="Destination">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Country"
                            name="destination_country"
                            type="text"
                            value={form.destination_country}
                            onChange={handleChange}
                            required={true}
                        />

                        <InputField
                            label="Destination Port"
                            name="destination_port"
                            type="text"
                            value={form.destination_port}
                            onChange={handleChange}
                        />
                    </div>
                </Section>

                <Section title="Pricing & Schedule">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label={`Selling Price (per ${selectedProductBaseUnit})`}
                            name="selling_price_per_mt"
                            type="number"
                            value={form.selling_price_per_mt}
                            onChange={handleChange}
                            required={true}
                        />

                        <InputField
                            label="Delivery Date"
                            name="delivery_date"
                            type="date"
                            value={form.delivery_date}
                            onChange={handleChange}
                            required={true}
                        />

                        <InputField
                            label="Cold Chain Buffer Days"
                            name="cold_chain_buffer_days"
                            type="number"
                            value={form.cold_chain_buffer_days}
                            onChange={handleChange}
                        />

                        <InputField
                            label="Priority"
                            name="priority_override"
                            type="select"
                            value={form.priority_override}
                            onChange={handleChange}
                            options={ORDERS_PRIORITY_OPTIONS.map(item => ({
                                id: item.id,
                                value: item.label,
                                label: item.label
                            }))}
                        />
                    </div>
                </Section>

                <Section title="Recurrence">
                    <RecurringCheckboxRow htmlFor="is_recurring">
                        <input
                            type="checkbox"
                            id="is_recurring"
                            checked={form.is_recurring}
                            onChange={handleRecurringToggle}
                        />
                        Make this a recurring order ?
                    </RecurringCheckboxRow>

                    {form.is_recurring && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="col-span-2">
                                <InputField
                                    label="Schedule Name (optional)"
                                    name="recurring_schedule_name"
                                    type="text"
                                    value={form.recurring_schedule_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Monthly supply — xyz Foods"
                                />
                            </div>

                            <InputField
                                label="Frequency"
                                name="recurring_frequency"
                                type="select"
                                value={form.recurring_frequency}
                                onChange={handleChange}
                                options={RECURRING_FREQUENCY_OPTIONS}
                                required={true}
                            />

                            {/* <InputField
                                label="Amount Type"
                                name="recurring_amount_type"
                                type="select"
                                value={form.recurring_amount_type}
                                onChange={handleChange}
                                options={AMOUNT_TYPE_OPTIONS}
                                required={true}
                            /> */}
                            <InputField
                                label="Next Run Date"
                                name="recurring_next_run_date"
                                type="date"
                                value={form.recurring_next_run_date}
                                onChange={handleChange}
                                required={true}
                            />
                            {form.recurring_next_run_date && form.delivery_date && form.recurring_next_run_date >= form.delivery_date && (
                                <div className="col-span-2 text-xs text-error">
                                    Next run date should be before the next delivery date, so there's lead time to produce and ship.
                                </div>
                            )}

                            <InputField
                                label="Ends On (optional)"
                                name="recurring_end_date"
                                type="date"
                                value={form.recurring_end_date}
                                onChange={handleChange}
                            />

                            <div className="col-span-2 text-xs text-textLight">
                                New orders will be generated automatically from this one on a {form.recurring_frequency?.toLowerCase() || "monthly"} basis
                                {form.recurring_end_date ? ` until ${form.recurring_end_date}` : ", with no end date"}. Auto-generated orders appear in the list with a system-generated marker.
                            </div>
                        </div>
                    )}
                </Section>
            </div>
        </Modal>
    );
};

export default OrderFormModal;