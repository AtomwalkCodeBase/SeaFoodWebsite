import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPackage, FiActivity, FiSliders, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
// import {
//   Badge, Panel, ActionButton, InfoRow, LoadingSpinner, EmptyState,
//   SectionHeader, StepFlow, MetricCard,
// } from './ui';
import { ActionButton, Badge, EmptyState, InfoRow, MetricCard, Panel, StepFlow } from '../components/EmptyState';
import { AdvanceBatchActivity, CreateParentBatch, CreateSubBatches, getBatchList, getCustomerListView, getGradingSessionsList, getProductList, getSpecies, RecordGrades } from '../services/productServices';
import { toast } from 'react-toastify';
import { extractDateTime } from '../utils';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmPopup from '../components/ConfirmPopup';
import InputField from '../components/InputField';

// ── Mock data (replace with real API) ─────────────────────────────────────────
const MOCK_GRNS = [
  {
    id: 'GRN-2026-0041', species: 'Black Tiger', supplier: 'KeralaFish Exports',
    received: '2026-05-03', erpBatch: 'BAT-INW-041', location: 'Cold Store A',
    quantityMt: 12,
    expectedGrades: ['20/25 (35%)', '16/20 (26%)', '26/30 (26%)', '31/40 (8%)'],
  },
  {
    id: 'GRN-2026-0042', species: 'Vannamei', supplier: 'Coastal Marine',
    received: '2026-05-04', erpBatch: 'BAT-INW-042', location: 'Cold Store B',
    quantityMt: 8,
    expectedGrades: ['26/30 (33%)', '31/40 (35%)', '41/50 (10%)'],
  },
];

const MOCK_PARENT_BATCHES = [
  {
    id: 'BAT-P-20260504-001', species: 'Black Tiger', quantityMt: 10,
    activity: 'Cleaning', expectedCleaned: 9.2,
  },
];

const MOCK_GRADING_SESSIONS = [
  {
    id: 'GS-001', batchId: 'BAT-P-20260503-001', species: 'Black Tiger',
    cleanedMt: 9.2, status: 'READY',
    gradeSlots: [
      { code: '8/12' }, { code: '13/15' }, { code: '16/20' }, { code: '20/25' },
      { code: '26/30' }, { code: '31/40' }, { code: '41/50' }, { label: 'Waste' },
    ],
  },
];

// ── GRN Card ──────────────────────────────────────────────────────────────────
function GrnCard({ grn, onCreateBatch }) {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const EMPTY_FORM = {
    batch_number: grn.erp_batch,
    input_weight_mt: grn.total_received_mt,
    species_config: "",
    erp_batch: "",
  }
  const [form, setForm] = useState(EMPTY_FORM);

  const { date } = extractDateTime(grn.created_at);

  const {data: speciesList = [], isLoading: speciesLoading, error: speciesError } = useQuery  ({
    queryKey: ['species'],
    queryFn: () => getSpecies(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load species'),
  });

  const {data: productList = [], isLoading: productLoading, error: productError } = useQuery  ({
    queryKey: ['product'],
    queryFn: () => getProductList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load species'),
  });

  const { data: supplierList = [], isLoading: supplierLoading, error: suppliersError,} = useQuery({
    queryKey: ['suppliers', { is_supplier: 'YES' }],
    queryFn: () => getCustomerListView({ is_supplier: 'YES' }),
    select: (res) => res.data,
    enabled: isModalOpen,
    onError: () => toast.error('Failed to load supplier list'),
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // setForm((prev) => ({...prev,[name]: type === 'number' ? Number(value) || 0 : value,}));
    setForm((prev) => ({...prev,[name]: value,}));
  };

    const mutation = useMutation({
    mutationFn: (payload) => CreateParentBatch(payload),

    onSuccess: () => {
      toast.success('Batch created successfully');

      qc.invalidateQueries(['session']);

      onCreateBatch?.();

      setForm(EMPTY_FORM);

      setIsModalOpen(false);
      setIsConfirmOpen(false);
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        'Failed to create batch'
      );
    },
  });

  const handleCreateBatch = () => {

    // VALIDATION

    if (!form.batch_number?.trim()) {
      return toast.error('Please enter batch number');
    }

    if (!form.input_weight_mt || Number(form.input_weight_mt) <= 0) {
      return toast.error('Please enter valid quantity');
    }

    if (!form.scheduled_date) {
      return toast.error('Please select scheduled date');
    }

    if (!form.product) {
      return toast.error('Please select product');
    }

    if (!form.species_config) {
      return toast.error('Please select species');
    }

    // PAYLOAD

    const payload = {
      batch_number: form.batch_number,
      input_weight_mt: Number(form.input_weight_mt),
      scheduled_date: form.scheduled_date,
      product: Number(form.product),
      species_config: form.species_config,

      // Optional if backend requires linkage with GRN
      // grn_reference: grn.id,
      // batch_type: 'PARENT',
    };

    mutation.mutate(payload);
    // console.log("payload",payload)
  };

  return (
    <>
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={grn.grn_reference} variant="grn" />
        <Badge label={grn.species_name} variant="species" />
        <span className="text-xs text-text-light">{grn.supplier_name || "Supplier Name not found"}</span>
          {/* <span className="text-lg font-bold text-text">{grn.total_received_mt} MT</span> */}
          <InfoRow label="Total Received(MT)" value={grn.total_received_mt || "--"} className='font-semibold' />
        <div className="ml-auto">
           <Button variant='primary' size="sm" onClick={() => setIsModalOpen(true)} loading={mutation.isPending}>
          Start Grading Process
        </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-x-4 gap-y-1 pl-1">
        <InfoRow label="Received Date" value={date} />
        <InfoRow label="ERP Batch" value={grn.erp_batch || "--"} />
        <InfoRow label="Location" value={grn.storage_location || "--"} />
      </div>
      {/* <div className="flex flex-wrap gap-1.5 pl-1">
        <span className="text-xs text-text-light">Expected grades:</span>
        {grn.grade_lines.map((g) => (
          <span key={g} className="text-xs bg-accentLight text-primary px-1.5 py-0.5 rounded">{g}</span>
        ))}
      </div> */}
       {/* <div className="flex justify-end">
        <Button variant='outline' size="sm" onClick={() => setIsModalOpen(true)} loading={mutation.isPending}>
          Proceed for Grading
        </Button>
      </div> */}
      {/* <p className="text-[10px] text-text-light/60 font-mono pl-1">
        POST /api/planning/batches/ — creates PARENT batch with pre-grading activities
      </p> */}
    </div>
    {/* <Modal title= "Create Grading Batch" saveButtonText='Create Batch' width='max-w-xl' isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateBatch} showSaveButton={true} isConfirmOpen={isConfirmOpen} setIsConfirmOpen={setIsConfirmOpen}> */}
    <Modal title= "Create Grading Batch" saveButtonText='Create Batch' width='max-w-xl' isOpen={isModalOpen} onClose={() => {setIsModalOpen(false);  setForm(EMPTY_FORM)}} onSave={handleCreateBatch} showSaveButton={true}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  label="Enter Batch Number"
                  name="batch_number"
                  type="text"
                  value={form.batch_number}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <InputField
                label="Enter grading Quantity(MT)"
                name="input_weight_mt"
                type="number"
                value={form.input_weight_mt}
                onChange={handleInputChange}
              />

              <InputField
                label="Scheduled Date"
                name="scheduled_date"
                type="date"
                value={form.scheduled_date}
                onChange={handleInputChange}
              />
              <InputField
                label="Product"
                name="product"
                type="select"
                value={form.product}
                onChange={handleInputChange}
                options={productList.map(item => ({ id: item.id, value: item.id, label: `${item.product_name}`}))}
              />

              <InputField
                label="Species"
                name="species_config"
                type="select"
                value={form.species_config}
                onChange={handleInputChange}
                options={speciesList.map(item => ({ id: item.id, value: item.id, label: `${item.scientific_name}`}))}
              />
            </div>
        </div>
    </Modal>
    {/* <ConfirmPopup isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} /> */}
    </>
  );
}

// ── Parent Batch In-Progress Card ─────────────────────────────────────────────
function ParentBatchCard({ batch, onAdvance }) {
    const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => AdvanceBatchActivity(batch.id),

    onSuccess: () => {
      toast.success('Activity advanced successfully');

      qc.invalidateQueries(['parentBatches']);

      onAdvance?.();
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
        'Failed to advance activity'
      );
    },
  });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3">
      <Badge label={batch.batch_number} variant="grn" />
      <Badge label={batch.species_name} variant="species" />
      <span className="font-bold text-text">{batch.input_weight_mt} MT</span>
      <Badge label={batch.current_activity_name || "--"} variant="cleaning" />
      <span className="text-xs text-text-light">Expected : {batch.expected_output_mt} MT</span>
      <span className="text-xs text-text-light">Actual : {batch.actual_output_mt} MT</span>
      <div className="ml-auto flex items-center gap-2">
        {/* <ActionButton variant="secondary" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Advance activity
        </ActionButton> */}
        <Button variant="primary" size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Advance activity
        </Button>
        {/* <span className="text-[10px] text-text-light/50 font-mono hidden sm:block">
          POST /batches/&#123;id&#125;/advance-activity/
        </span> */}
      </div>
    </div>
  );
}

// ── Grade Input Row ────────────────────────────────────────────────────────────
// function GradeInputRow({ grades }) {
//   return (
//     <div className="overflow-x-auto">
//       <div className="flex gap-2 min-w-max pb-1">
//         {grades.grade_lines.map((g, i) => (
//           <div key={i} className="flex flex-col items-center gap-1">
//             <span className={`text-xs font-medium ${g.label === 'Waste' ? 'text-error' : 'text-text-light'}`}>
//               {g.grade_code ?? g.label}
//             </span>
//             <span className="w-16 text-center text-xs border border-border rounded-md py-1 bg-inputBg text-text focus:outline-none focus:ring-1 focus:ring-primary">
//               {g.quantity_mt}
//             </span>
//             <span className="text-[10px] text-text-light">MT</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

function GradeInputRow({ 
  gradeLines = [], 
  waste_mt = 0 
}) {
  // const totalGraded = gradeLines.reduce((sum, line) => {
  //   return sum + parseFloat(line.quantity_mt || 0);
  // }, 0);

  const wasteValue = parseFloat(waste_mt || 0);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-2">
        {/* Regular Grades */}
        {gradeLines.map((line, index) => (
          <div 
            key={line.id || index} 
            className="flex flex-col items-center gap-1 min-w-[110px]"
          >
            <span className="text-xs font-medium text-text-light">
              {line.grade_code}
            </span>

            <div className="w-20 text-center font-semibold text-sm border border-border rounded-lg py-2 bg-inputBg text-text">
              {parseFloat(line.quantity_mt || 0).toFixed(3)}
            </div>

            <span className="text-[10px] text-text-light">MT</span>
          </div>
        ))}

        {/* Waste - Always shown */}
        <div className="flex flex-col items-center gap-1 min-w-[110px]">
          <span className="text-xs font-medium text-error">
            WASTE
          </span>

          <div className="w-20 text-center font-semibold text-sm border border-error/30 rounded-lg py-2 bg-inputBg text-error">
            {wasteValue.toFixed(3)}
          </div>

          <span className="text-[10px] text-text-light">MT</span>
        </div>
      </div>
    </div>
  );
}

// ── Grading Session Card ───────────────────────────────────────────────────────
function GradingSessionCard({ session, onConfirm, parentBatchData }) {
    const queryClient = useQueryClient();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCreateSubModalOpen, setIsCreateSubModalOpen] = useState(false);
  const [gradeRows, setGradeRows] = useState([
    {
      grade_code: "",
      quantity_mt: 0,
      bin_location_id: "",
    },
  ]);
  const [subBatchGrades, setSubBatchGrades] = useState([
    {
      grade_code: "",
      quantity_mt: 0,
      item_batch_id: "",
    },
  ]);

      const {data: speciesList = [], isLoading: speciesLoading, error: speciesError } = useQuery  ({
        queryKey: ['species', session.species_config],
        queryFn: () => getSpecies(null, session.species_config),
        select: (res) => res.data,
        onError: () => toast.error('Failed to load species'),
      });

      const speciesArray = Array.isArray(speciesList) ? speciesList : [speciesList];
      const gradeOptions = speciesArray.flatMap((species) =>
        (species.grades || []).map((grade) => ({
          id: grade.id,
          value: grade.grade_code,
          label: `${species.scientific_name} (${grade.grade_code})`,
        }))
      );
  const handleInputChange = (index, e) => {
    const { name, value, type } = e.target;

    const updatedRows = [...gradeRows];

    updatedRows[index][name] =
      type === "number" ? Number(value) || 0 : value;

    setGradeRows(updatedRows);
  };

  const handleChange = (index, e) => {
  const { name, value, type } = e.target;

  const updatedRows = [...subBatchGrades];

  if (name === "grade_code") {
    const selectedGrade = gradeOptions.find(
      (grade) => grade.value === value
    );

    updatedRows[index].grade_code = selectedGrade?.value || "";
    updatedRows[index].item_batch_id =
      selectedGrade?.item_batch_id || "";
  } else {
    updatedRows[index][name] =
      type === "number" ? Number(value) || 0 : value;
  }

  setSubBatchGrades(updatedRows);
};

   const handleAddRow = () => {
    setGradeRows((prev) => [
      ...prev,
      {
        grade_code: "",
        quantity_mt: 0,
        bin_location_id: "",
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (index) => {
    const updatedRows = gradeRows.filter((_, i) => i !== index);
    setGradeRows(updatedRows);
  };

   const handleAddBatchesRow = () => {
    setSubBatchGrades((prev) => [
      ...prev,
      {
        grade_code: "",
        quantity_mt: 0,
        item_batch_id: "",
      },
    ]);
  };

  // Remove row
  const handleRemoveBatchesRow = (index) => {
    const updatedRows = subBatchGrades.filter((_, i) => i !== index);
    setSubBatchGrades(updatedRows);
  };

  // Submit grades
  const handleSubmitGrades = async () => {
    const payload = {
      grades: gradeRows.map((row) => ({
        grade_code: row.grade_code,
        quantity_mt: row.quantity_mt,
        bin_location_id: row.bin_location_id,
      })),
    };

    // console.log("Payload", payload);

    try {
      await RecordGrades(session.id, payload);

      toast.success("Grades recorded successfully");

      setIsRecordModalOpen(false);

      // Reset form
      setGradeRows([
        {
          grade_code: "",
          quantity_mt: 0,
          bin_location_id: "",
        },
      ]);
    } catch (error) {
      toast.error("Failed to record grades");
    }
  };

  const handleCreateSubBatches = async () => {
  const payload = {
    grade_quantities: {},
  };

  subBatchGrades.forEach((row) => {
    if (row.grade_code) {
      payload.grade_quantities[row.grade_code] = {
        quantity_mt: row.quantity_mt,
        item_batch_id: row.item_batch_id,
      };
    }
  });

  // console.log(payload);
    // Find the latest batch from parentBatchData
  let latestBatchId = null;
  
  if (parentBatchData && parentBatchData.length > 0) {
    // Find the batch with the latest updated_at timestamp
    const latestBatch = parentBatchData.reduce((latest, current) => {
      const latestDate = new Date(latest.updated_at || latest.created_at);
      const currentDate = new Date(current.updated_at || current.created_at);
      return currentDate > latestDate ? current : latest;
    }, parentBatchData[0]);
    
    latestBatchId = latestBatch.id;
  }

  try {
    await CreateSubBatches(latestBatchId, payload);
    await queryClient.invalidateQueries({queryKey: 'session'});

    toast.success("Sub batches created successfully");

    setIsCreateSubModalOpen(false);

    setSubBatchGrades([
      {
        grade_code: "",
        quantity_mt: 0,
        item_batch_id: "",
      },
    ]);
  } catch (error) {
    toast.error("Failed to create sub batches");
  }
};


  const hasGrading = session.grade_lines && session.grade_lines.length > 0;

  return (
    <>
    <div className="rounded-xl border-2 border-secondary/30 bg-phasePost/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={session.erp_batch || "--"} variant="grn" />
        <Badge label={session.batch_number || "--"} variant="grn" />
        <Badge label={session.species_name} variant="species" />
        <span className="text-sm font-bold text-text">{session.total_graded_mt} MT cleaned</span>
       {!hasGrading && 
       <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRecordModalOpen(true)}
          className="ml-auto"
          // loading={recordMutation.isPending}
        >
          Record grades
        </Button>
        } 
      </div>
      <p className="text-xs text-text-light">Grade-wise weight from QC sorting:</p>
        {/* <GradeInputRow grades={session} values={gradeValues} /> */}
     {hasGrading ? (
        <GradeInputRow 
          gradeLines={session.grade_lines} 
          waste_mt={session.waste_mt} 
        />
      ) : (
        <div className="py-10 text-center border border-dashed border-border rounded-xl">
          <EmptyState 
            icon={FiSliders} 
            message="No grading found" 
          />
        </div>
      )}

      {/* <p className="text-[10px] text-text-light/50 font-mono">
        POST /grading-sessions/&#123;id&#125;/record-grades/ — creates sub-batches + updates inventory
      </p> */}
     {hasGrading && <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateSubModalOpen(true)}
          // loading={subBatchMutation.isPending}
        >
          Confirm grades &amp; create sub-batches
        </Button>
      </div>}
    </div>
    <Modal title='Record Grade' width='max-w-6xl' isOpen={isRecordModalOpen} onClose={() => {setIsRecordModalOpen(false); setGradeRows([])}} onSave={handleSubmitGrades} saveButtonText='Add Grades'>
        <div className="space-y-6">
          <div className="space-y-4">
            {gradeRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 items-end border border-border rounded-xl p-4"
              >
                <div className="col-span-4">
                  <InputField
                    label="Grade Code"
                    name="grade_code"
                    type="select"
                    value={row.grade_code}
                    onChange={(e) =>
                      handleInputChange(index, e)
                    }
                    options={gradeOptions}
                  />
                </div>

                <div className="col-span-3">
                  <InputField
                    label="Quantity (MT)"
                    name="quantity_mt"
                    type="number"
                    value={row.quantity_mt}
                    onChange={(e) =>
                      handleInputChange(index, e)
                    }
                  />
                </div>

                <div className="col-span-3">
                  <InputField
                    label="Bin Location ID"
                    name="bin_location_id"
                    type="text"
                    value={row.bin_location_id}
                    onChange={(e) =>
                      handleInputChange(index, e)
                    }
                  />
                </div>

                <div className="col-span-2 flex gap-2">
                  {/* Add Button */}
                  {index === gradeRows.length - 1 && (
                    <Button
                      variant="primary"
                      onClick={handleAddRow}
                      size='sm'
                    >
                     Add
                    </Button>
                  )}

                  {/* Remove Button */}
                  {gradeRows.length > 1 && (
                    <Button
                    size="sm"
                      variant="outlines"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

    </Modal>

    <Modal title='Create sub-batches' width='max-w-6xl' isOpen={isCreateSubModalOpen} onClose={() => {setIsCreateSubModalOpen(false); setSubBatchGrades([])}} onSave={handleCreateSubBatches} saveButtonText='Create Sub Batches'>
        <div className="space-y-6">
          <div className="space-y-4">
            {subBatchGrades.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 items-end border border-border rounded-xl p-4"
              >
                <div className="col-span-4">
                  <InputField
                    label="Grade Code"
                    name="grade_code"
                    type="select"
                    value={row.grade_code}
                    onChange={(e) =>
                      handleChange(index, e)
                    }
                    options={gradeOptions}
                  />
                </div>

                <div className="col-span-3">
                  <InputField
                    label="Quantity (MT)"
                    name="quantity_mt"
                    type="number"
                    value={row.quantity_mt}
                    onChange={(e) =>
                      handleChange(index, e)
                    }
                  />
                </div>

                <div className="col-span-3">
                  <InputField
                    label="Batch ID"
                    name="item_batch_id"
                    type="text"
                    value={row.item_batch_id}
                    onChange={(e) =>
                      handleChange(index, e)
                    }
                  />
                </div>

                <div className="col-span-2 flex gap-2">
                  {/* Add Button */}
                  {index === subBatchGrades.length - 1 && (
                    <Button
                      variant="primary"
                      onClick={handleAddBatchesRow}
                      size='sm'
                    >
                     Add
                    </Button>
                  )}

                  {/* Remove Button */}
                  {subBatchGrades.length > 1 && (
                    <Button
                    size="sm"
                      variant="outlines"
                      onClick={() => handleRemoveBatchesRow(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

    </Modal>
    </>
  );
}

// ── Phase 1 Root ───────────────────────────────────────────────────────────────
export function PreGradingPhase({speciesList}) {
  const qc = useQueryClient();

  // Use mock data – swap for real useQuery calls in production
  const grns = MOCK_GRNS;
  const parentBatches = MOCK_PARENT_BATCHES;
  const gradingSessions = MOCK_GRADING_SESSIONS;

  const STEPS = [
    { label: 'GRN received', icon: FiPackage },
    { label: 'Pre-grading', icon: FiActivity },
    { label: 'Grade sorting', icon: FiSliders },
    { label: 'Graded stock', icon: FiCheckCircle },
  ];

  
  const {data: sessionList = [], isLoading: speciesLoading, error: speciesError } = useQuery  ({
    queryKey: ['session'],
    queryFn: () => getGradingSessionsList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load GRN list.'),
  });

  const {data: parentBatchList = [], isLoading: parentBatchLoading, error: parentBatchError } = useQuery  ({
    queryKey: ['parentBatch'],
    queryFn: () => getBatchList(),
    select: (res) => res.data,
    onError: () => toast.error('Failed to load GRN list.'),
  });

  const parentBatchData = parentBatchList.filter((p) => p.batch_type === "PARENT" )
  // const sessionData = sessionList.filter((p) => p.status === 'COMPLETED' )

  // console.log("sessionList", sessionList)

   const pendingGrns = sessionList.filter(grn => grn.status !== 'COMPLETED').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  //  const pendingGrns = sessionList.filter(grn => grn.status === 'COMPLETED').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

   const getSpeciesName = (pendingGrns, speciesList) => {
    const matchedSpecies = speciesList.find(species => species.id === pendingGrns.species_config);
    return matchedSpecies?.scientific_name || 'Unknown Species';
  };

  return (
    <div className="space-y-5">
      {/* Flow indicator */}
      {/* <Panel>
        <StepFlow steps={STEPS} current={1} />
      </Panel> */}

      {/* Section 1 – Ungraded raw material */}
      <Panel accent="pre">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text flex items-center gap-2">
              <FiPackage className="text-primary" size={16} />
              Ungraded raw material
            </h3>
            <p className="text-xs text-text-light mt-0.5">
              Received via GRN; needs pre-grading activities (cleaning) then grade sorting
            </p>
          </div>
          <Badge label={`${sessionList.filter(grn => grn.status !== 'COMPLETED').length} pending GRNs`} variant="info" />
        </div>
        <div className="space-y-3">
            {speciesLoading ? (
              <EmptyState message="Loading GRNs..." />
            ) : speciesError ? (
              <EmptyState message="Failed to load GRNs" />
            ) : pendingGrns.length === 0 ? (
              <EmptyState message="No pending GRNs" />
            ) : (
              pendingGrns.map((grn) => {
              const scientificName = getSpeciesName(grn, speciesList);
              return (
                // <GrnCard key={grn.id} grn={{...grn, species_name: scientificName}} onCreateBatch={() => qc.invalidateQueries(['session'])} />
                <GrnCard key={grn.id} grn={{...grn, species_name: scientificName}} />
              );
            })
            )}
            {/* {pendingGrns.map((grn) => {
              const scientificName = getSpeciesName(grn, speciesList);
              return (
                <GrnCard key={grn.id} grn={{...grn, species_name: scientificName}} onCreateBatch={() => qc.invalidateQueries(['session'])} />
              );
            })} */}
          </div>
      </Panel>

      {/* Section 2 – Parent batches in progress */}
      <Panel accent="pre">
        <div className="flex items-center gap-2 mb-3">
          <FiActivity className="text-primary" size={16} />
          <h3 className="font-semibold text-text">Parent batches in progress</h3>
          <span className="text-xs text-text-light">Pre-grading activities running</span>
        </div>
        <div className="space-y-2">
          {parentBatchLoading ? (
              <EmptyState message="Loading Batches..." />
            ) : parentBatchError ? (
              <EmptyState message="Failed to load batches" />
            ) : (() => {
          const pendingBatches = parentBatchData.filter(batch => !['COMPLETED', 'GRADING'].includes(batch.status)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));            return pendingBatches.length === 0 ? (
              <EmptyState icon={FiActivity} message="No batches in progress" />
            ) : (
              pendingBatches.map((b) => {
                const specifiedName = getSpeciesName(b, speciesList);
                return (
                  <ParentBatchCard key={b.id} batch={{...b, species_name: specifiedName}} onAdvance={() => qc.invalidateQueries(['parentBatches'])} />
                  // <ParentBatchCard key={b.id} batch={{...b, species_name: specifiedName}} />
                );
              })
            );
          })()}
        </div>
      </Panel>

      {/* Section 3 – Ready for grading */}
      <Panel accent="pre">
        <div className="flex items-center gap-2 mb-3">
          <FiSliders className="text-primary" size={16} />
          <h3 className="font-semibold text-text">Ready for grading</h3>
          <span className="text-xs text-text-light">Pre-grading done; QC sorts into grades</span>
        </div>
        <div className="space-y-3">
          {parentBatchLoading ? (
              <EmptyState message="Loading Batches..." />
            ) : parentBatchError ? (
              <EmptyState icon={FiSliders} message="Failed to load batches" />
            ) : (() => {
                // const completedBatches = sessionList.filter(batch => batch.status === 'COMPLETED').sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
                const completedBatches = sessionList.filter(batch => batch.status !== 'COMPLETED');
                // console.log("completedBatches", completedBatches)
                return completedBatches.length === 0 ? (
                  <EmptyState icon={FiSliders} message="No batches ready for grading" />
                ) : (
                  completedBatches.map((batch) => {
                    const specifiedName = getSpeciesName(batch, speciesList);
                    return (
                      <GradingSessionCard 
                        key={batch.id} 
                        session={{...batch, species_name: specifiedName}} 
                        parentBatchData={parentBatchData}
                      />
                    );
                  })
                );
              })()}
          {/* {gradingSessions.length === 0 ? (
            <EmptyState icon={FiSliders} message="No sessions ready for grading" />
          ) : (
            gradingSessions.map((s) => (
              <GradingSessionCard key={s.id} session={s} onConfirm={() => qc.invalidateQueries(['inventory'])} />
            ))
          )} */}
        </div>
      </Panel>
    </div>
  );
}