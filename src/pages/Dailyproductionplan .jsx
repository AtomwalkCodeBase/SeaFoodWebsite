import React, { useState } from 'react';
import Layout from '../components/Layout';
import Tabs from '../components/Tabs';
import { SectionHeader, SectionHeader2 } from '../components/EmptyState';
import { PreGradingPhase } from './Pregradingphase ';
import { PostGradingPhase } from './Postgradingphase';
import { FullDayPlan } from './Fulldayplan';
import Card from '../components/Card';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import { getCustomerListView, getSpecies } from '../services/productServices';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';

 const tabs = [
    {
      key: 'full',
      label: 'Full day plan',
      icon: '📋',
      description: 'Both phases',
    },
    {
      key: 'pre',
      label: 'Phase 1: Pre-grading',
      icon: '⚗️',
      description: 'Raw → Graded',
    },
    {
      key: 'post',
      label: 'Phase 2: Post-grading',
      icon: '📦',
      description: 'Graded → Orders',
    },
  ];

  const EMPTY_FORM = {
  grn_reference: "",
  supplier_id: "",
  total_received_mt: 0,
  species_config: "",
  erp_batch: "",
};

export default function DailyProductionPlanInner() {
  const [activeTab, setActiveTab] = useState('full');
    const [isOpenGrnModal, setIsOpenGrnModal] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

     const [form, setForm] = useState(EMPTY_FORM);

    const { data: supplierList = [], isLoading: supplierLoading, error: suppliersError,} = useQuery({
      queryKey: ['suppliers', { is_supplier: 'YES' }],
      queryFn: () => getCustomerListView({ is_supplier: 'YES' }),
      select: (res) => res.data,
      enabled: isOpenGrnModal,
      onError: () => toast.error('Failed to load supplier list'),
    });

    const {data: speciesList = [], isLoading: speciesLoading, error: speciesError } = useQuery  ({
      queryKey: ['species'],
      queryFn: () => getSpecies(),
      select: (res) => res.data,
      onError: () => toast.error('Failed to load species'),
    });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({...prev,[name]: type === 'number' ? Number(value) || 0 : value,}));
  };

  return (
    <Layout>
        {/* <TopBar activeTab={activeTab} /> */}
        <Card>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        {/* <PhaseTabBar activeTab={activeTab} onChange={setActiveTab} /> */}

        {activeTab === 'full' && <FullDayPlan setIsOpenGrnModal={setIsOpenGrnModal} speciesList={speciesList}/>}

        {activeTab === 'pre' && (
          // <div className="max-w-3xl mx-auto">
          <div className="mx-auto">
            <SectionHeader
              step="1"
              title="Pre-grading: raw material → grading → graded inventory"
              // phaseColor="pre"
            />
            <PreGradingPhase speciesList={speciesList} />
          </div>
        )}

        {activeTab === 'post' && (
          // <div className="max-w-3xl mx-auto">
          <div className="mx-auto">
            <SectionHeader2
              step="2"
              title="Post-grading: graded stock → processing → orders fulfilled"
              phaseColor="post"
            />
            <PostGradingPhase />
          </div>
        )}

        </Card>

            <Modal 
    isOpen={isOpenGrnModal}
  onClose={() => setIsOpenGrnModal(false)}
  onSave
  title = "Add New GRN"
  width = "max-w-xl"
  maxHeight = "max-h-[80vh]"
  showSaveButton = {true}
  saveButtonText = "Add GRN"
  cancelButtonText = "Cancel"
  isConfirmOpen={isConfirmModalOpen}
  setIsConfirmOpen ={setIsConfirmModalOpen}
  >
    <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  label="GRN Reference Number"
                  name="grn_reference"
                  type="text"
                  value={form.grn_reference}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <InputField
                label="Supplier Name"
                name="supplier_id"
                type="select"
                value={form.supplier_id}
                onChange={handleInputChange}
                options={supplierList.map((c) => ({ value: c.id, label: c.name }))}
              />

              <InputField
                label="Total Received Quantity (MT)"
                name="total_received_mt"
                type="number"
                value={form.total_received_mt}
                onChange={handleInputChange}
              />

              <InputField
                label="Species"
                name="species_config"
                type="select"
                value={form.species_config}
                onChange={handleInputChange}
                options={speciesList.map(item => ({ id: item.id, value: item.id, label: `${item.scientific_name}`}))}
              />
              
              <InputField
                label="ERP Batch"
                name="erp_batch"
                type="text"
                value={form.erp_batch}
                onChange={handleInputChange}
              />
            </div>
        </div>

    </Modal>
    </Layout>
  );
}