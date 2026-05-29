import styled from "styled-components"
import { AddGrades, AddSpecies, getGrades, getInventoryItem, GetItemCategory, getSpecies, UpdateGrades, UpdateSpecies } from "../services/productServices"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { useEffect, useMemo, useState } from "react"
import Button from "../components/Button"
import { FaPen, FaPlus } from "react-icons/fa"
import Card from "../components/Card"
import { ReadField } from "./Capacityconfigscreen "
import Badge from "../components/Badge"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import DataTable, { Td } from "../components/Datatable"
import { useFormHandler } from "../hooks/useFormHandler"
import Modal from "../components/Modal"
import InputField from "../components/InputField"
import { formatNumber, getChangedFields } from "../utils"
import { HiOutlinePencilAlt } from "react-icons/hi"
import { theme } from "../styles/Theme"

const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
`

const SelectorWrap = styled.div`
  display: flex;
  justify-content: space-between; /* push species buttons left, add button right */
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`
const SpeciesList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`
const AddButton = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.backgroundAlt};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`
const SpeciesButton = styled.button`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid
    ${({ active, theme }) =>
    active ? theme.colors.primary : theme.colors.border};
  background: ${({ active, theme }) =>
    active ? theme.colors.primaryLight : theme.colors.background};
  cursor: pointer;
`

const chartPalette = ["#1890ff", "#13c2c2", "#722ed1", "#faad14"]

const gradeColumns = [
  "GRADE", "LABEL", "COUNT/LB", "PRICE MULT.", "RM COST/MT", "YIELD MULT.", "MARGIN/MT", "ACTION"
]

export default function SpeciesGradesPanel() {
  const queryClient = useQueryClient();
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [speciesModalMode, setSpeciesModalMode] =
  useState("add");

const [gradeModalMode, setGradeModalMode] =
  useState("add");

const [editingSpecies, setEditingSpecies] =
  useState(null);

const [editingGrade, setEditingGrade] =
  useState(null);

  const { data: speciesList = [], isLoading: speciesListLoading, error: speciesListError } = useQuery({
    queryKey: ['speciesList'],
    queryFn: () => getSpecies(),
    select: (res) => res?.data,
    onError: () => toast.error('Failed to fetch species list.'),
  });

  const { data: gradeList = [], isLoading: gradeListLoading, error: gradeListError } = useQuery({
    queryKey: ['gradeList'],
    queryFn: () => getGrades(),
    select: (res) => res?.data,
    onError: () => toast.error('Failed to fetch grades list'),
  });

  useEffect(() => {
    if (!selectedSpeciesId && speciesList.length > 0) {
      setSelectedSpeciesId(speciesList[0].id)
    }
  }, [speciesList, selectedSpeciesId])

  const selectedSpecies = useMemo(
    () => speciesList.find((s) => s.id === selectedSpeciesId) ?? null,
    [selectedSpeciesId, speciesList]
  )


  const grades = useMemo(
    () => gradeList.filter((g) => g.species_config === selectedSpeciesId),
    [selectedSpeciesId, gradeList]
  )

  const tableRows = selectedSpecies
    ? grades.map((g) => {
      const rmCost = (selectedSpecies.base_procurement_price_per_mt || 0) * (g.price_multiplier || 0)
      const effectiveYield = g.yield_multiplier
      const processingCost = selectedSpecies.default_processing_cost_per_mt || 0
      const margin = 750000 - rmCost - processingCost

      return {
        ...g,
        rmCost,
        effectiveYield,
        margin,
        status: margin > 150000 ? "HIGH" : margin > 0 ? "MEDIUM" : "LOW",
        variant: margin > 150000 ? "success" : margin > 0 ? "warning" : "error",
      }
    })
    : []

    const openAddSpecies = () => {
  setSpeciesModalMode("add");
  setEditingSpecies(null);
  setShowForm(true);
};

const openEditSpecies = (species) => {
  setSpeciesModalMode("edit");
  setEditingSpecies(species);
  setShowForm(true);
};

const openAddGrade = () => {
  setGradeModalMode("add");
  setEditingGrade(null);
  setShowGradeForm(true);
};

const openEditGrade = (grade) => {
  setGradeModalMode("edit");
  setEditingGrade(grade);
  setShowGradeForm(true);
};

  // console.log("tableRows",gradeList)
  const chartData = tableRows.map((r) => ({
    grade: r.grade_code, // ✅ FIX
    rmCost: r.rmCost / 1000, // keep as number (IMPORTANT)
  }))


  return (
    <>
      <PanelContent>
        <SelectorWrap>
          <SpeciesList>
            {speciesList.map((sp) => (
              <SpeciesButton
                key={sp.id}
                active={sp.id === selectedSpeciesId}
                onClick={() => setSelectedSpeciesId(sp.id)}
              >
                {/* {sp.name} ({sp.category_alias}) */}
                {sp.scientific_name}
              </SpeciesButton>
            ))}
          </SpeciesList>
          <div className="flex flex-wrap gap-3">
          <Button variant={speciesList.length !== 0 ? "outline" : "primary"} size="sm" onClick={openAddSpecies}>
            <FaPlus /> Add New Species
          </Button>
         {speciesList.length !== 0 && <Button size="sm" onClick={() =>openEditSpecies(selectedSpecies)}>
            <HiOutlinePencilAlt />Edit Species
          </Button>}
          </div>
        </SelectorWrap>

        {/* Species Info */}
        <Card title="Species" style={{border: `2px solid ${theme.colors.primaryLight}`}}>
          <p>{selectedSpecies?.scientific_name || "N/A"}</p>
          <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <ReadField label="Base Price" value={formatNumber(selectedSpecies?.base_procurement_price_per_mt)} unit="₹" />
            <ReadField label="Processing" value={formatNumber(selectedSpecies?.default_processing_cost_per_mt)} unit="₹" />
            <div className="col-span-2">
              {(selectedSpecies?.export_certifications || []).map((c) => (
                <Badge key={c} variant="success" className="my-1 mx-1">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Grades Table */}
        <Card style={{border: `2px solid ${theme.colors.primaryLight}`}}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
            <h3>Grade Configuration</h3>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <Button size="sm" onClick={openAddGrade}>
                <FaPlus /> Add Grade
              </Button>
            </div>
          </div>
          <DataTable
            columns={gradeColumns}
            data={tableRows}
            renderRow={(row) => (
              <>
                <Td>{row.grade_code}</Td>
                <Td>{row.label}</Td>
                <Td>{row.count_per_pound_min}/{row.count_per_pound_max}</Td>
                <Td>{row.price_multiplier}</Td>
                <Td>{formatNumber(row.rmCost?.toFixed(0))}</Td>
                {/* <Td>{(row.effectiveYield * 100)?.toFixed(1)}%</Td> */}
                <Td className={Number(row.effectiveYield) > 1 ? "text-success" : Number(row.effectiveYield) < 0 ? "text-error" : "text-text" }>{row.effectiveYield}</Td>
                <Td>{formatNumber(row.margin?.toFixed(0))}</Td>
                <Td>
                  <Button size="sm" variant="outline" onClick={() => openEditGrade(row)}>
                    <HiOutlinePencilAlt />Edit
                  </Button>
                </Td>
                {/* <Td>--</Td>
                  <Td>--</Td> */}
              </>
            )}
          />
        </Card>

        {/* Chart */}
        <Card title="Price Comparison" style={{border: `2px solid ${theme.colors.primaryLight}`}}>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rmCost">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </PanelContent>
      {
        showForm && <AddSpeciesModal showForm={showForm} setShowForm={setShowForm} mode={speciesModalMode} initial={editingSpecies} queryClient={queryClient}/>
      }

      {
        showGradeForm && <AddGradeModal showGradeForm={showGradeForm} setShowGradeForm={setShowGradeForm} mode={gradeModalMode} initial={editingGrade} selectedSpeciesId={selectedSpeciesId} queryClient={queryClient}/>
      }
    </>
  )
}


const AddSpeciesModal = ({ showForm, setShowForm,mode,  initial, queryClient, }) => {
  const NEW_SPECIES_EMPTY_FORM = {
    item_category: "",
    scientific_name: "",
    base_procurement_price_per_mt: "",
    default_processing_cost_per_mt: "",
    export_certifications: "",
  }

  const { form, handleChange, resetForm } = useFormHandler(initial || NEW_SPECIES_EMPTY_FORM);

const handleSpeciesSubmit = async () => {
  const payload = {
    ...form,

    base_procurement_price_per_mt:
      Number(
        form.base_procurement_price_per_mt
      ),

    default_processing_cost_per_mt:
      Number(
        form.default_processing_cost_per_mt
      ),

    export_certifications:
      form.export_certifications
        ?.split(",")
        ?.map((s) => s.trim()) || [],
  };

  try {
    if (mode === "edit") {
      const changedPayload =
        getChangedFields(initial, payload);

      if (
        Object.keys(changedPayload).length === 0
      ) {
        toast.info("No changes detected");
        return;
      }

      await UpdateSpecies(
        changedPayload,
        initial.id
      );
      await queryClient.invalidateQueries({
  queryKey: ["speciesList"],
});

      toast.success(
        "Species updated successfully"
      );
    } else {
      await AddSpecies(payload);
      await queryClient.invalidateQueries({
  queryKey: ["speciesList"],
});

      toast.success(
        "Species added successfully"
      );
    }

    setShowForm(false);
    resetForm();
  } catch {
    toast.error("Failed to save species");
  }
};


  const { data: InventoryCategoryList = [], isLoading: InventoryCategoryListIsLoading, error: InventoryCategoryListIsError } = useQuery({
    queryKey: ['InventoryCategoryList'],
    queryFn: () => GetItemCategory(),
    select: (res) => res?.data,
    onError: () => toast.error('Failed to fetch category list.'),
  });

  return (
    <Modal title={`${mode === "add" ? "Add" : "Edit"} Species`} isOpen={showForm} onClose={() => { setShowForm(false); resetForm() }} width="max-w-2xl" onSave={handleSpeciesSubmit} showSaveButton={true} saveButtonText={
    mode === "add"
      ? "Add Species"
      : "Update Species"}>
      {/* <div className="space-y-6"> */}

      <div className="grid grid-cols-2 gap-4">

        <InputField
          label="Category"
          name="item_category"
          type="select"
          value={form.item_category}
          onChange={handleChange}
          options={InventoryCategoryList.map((item) => ({ value: item.id, label: item.name }))}
          required={true}
        />

        <InputField
          label="Species Name"
          name="scientific_name"
          type="text"
          value={form.scientific_name}
          onChange={handleChange}
          required={true}
        />

        <InputField
          label="Base Price (per MT)"
          name="base_procurement_price_per_mt"
          type="number"
          value={form.base_procurement_price_per_mt}
          onChange={handleChange}
          required={true}
        />

        <InputField
          label="Processing Cost (per MT)"
          name="default_processing_cost_per_mt"
          type="number"
          value={form.default_processing_cost_per_mt}
          onChange={handleChange}
          required={true}
        />
<div className="col-span-2">

        <InputField
          label="Certifications"
          name="export_certifications"
          type="text"
          value={form.export_certifications}
          onChange={handleChange}
        />
</div>
      </div>
    </Modal>
  )
}

const AddGradeModal = ({ showGradeForm, setShowGradeForm, mode, initial, selectedSpeciesId, queryClient}) => {
  const NEW_GRADE_EMPTY_FORM = {
    stock_item: "",
    grade_code: "",
    label: "",
    count_per_pound_min: "",
    count_per_pound_max: "",
    price_multiplier: "",
    yield_multiplier: "",
  }

  const { form, handleChange, resetForm } = useFormHandler(initial || NEW_GRADE_EMPTY_FORM);

    const { data: InventoryItemList = [], isLoading: InventoryItemListIsLoading, error: InventoryItemListIsError } = useQuery({
    queryKey: ['InventoryItem'],
    queryFn: () => getInventoryItem(),
    select: (res) => res?.data,
    onError: () => toast.error('Failed to fetch inventory item list.'),
  });

const handleGradeSubmit = async () => {
  const payload = {
    ...form,

    count_per_pound_min: Number(
      form.count_per_pound_min
    ),

    count_per_pound_max: Number(
      form.count_per_pound_max
    ),

    price_multiplier: Number(
      form.price_multiplier
    ),

    yield_multiplier: Number(
      form.yield_multiplier
    ),

    species_config: selectedSpeciesId,
  };

  try {
    if (mode === "edit") {
      const changedPayload =
        getChangedFields(initial, payload);

      if (
        Object.keys(changedPayload).length === 0
      ) {
        toast.info("No changes detected");
        return;
      }

      await UpdateGrades(
        changedPayload,
        initial.id
      );
      await queryClient.invalidateQueries({
  queryKey: ["gradeList"],
});

      toast.success(
        "Grade updated successfully"
      );
    } else {
      await AddGrades(payload);
      await queryClient.invalidateQueries({
  queryKey: ["gradeList"],
});

      toast.success(
        "Grade added successfully"
      );
    }

    setShowGradeForm(false);
    resetForm();
  } catch {
    toast.error("Failed to save grade");
  }
};

  return (
    <Modal title={`${mode === "add" ? "Add" : "Edit"} Species`} isOpen={showGradeForm} onClose={() => { setShowGradeForm(false); resetForm() }} width="max-w-2xl"   saveButtonText={
    mode === "add"
      ? "Add Species"
      : "Update Species"
  } cancelButtonText="Close" onSave={handleGradeSubmit}>
      {/* <div className="space-y-6"> */}

      <div className="grid grid-cols-2 gap-4">

        <InputField
          label="Inventory Item"
          name="stock_item"
          type="select"
          value={form.stock_item}
          onChange={handleChange}
          options={InventoryItemList.map((item) => ({ value: item.id, label: item.name }))}
          required={true}
        />

        <InputField
          label="Grade Code"
          name="grade_code"
          type="text"
          value={form.grade_code}
          onChange={handleChange}
          placeholder="Enter Grade code (20/25, 26/30 etc.)"
          required={true}
        />

        <InputField
          label="Label"
          name="label"
          type="text"
          value={form.label}
          onChange={handleChange}
          placeholder="Jumbo, Large, Extra Large etc."
          required={true}
        />

        <InputField
          label="Min (count/lb)"
          name="count_per_pound_min"
          type="number"
          value={form.count_per_pound_min}
          onChange={handleChange}
          required={true}
        />

        <InputField
          label="Max (count/lb)"
          name="count_per_pound_max"
          type="number"
          value={form.count_per_pound_max}
          onChange={handleChange}
          required={true}
        />
        <InputField
          label="Price Multiplier"
          name="price_multiplier"
          type="number"
          value={form.price_multiplier}
          onChange={handleChange}
          required={true}
        />
        <InputField
          label="Yield Multiplier"
          name="yield_multiplier"
          type="number"
          value={form.yield_multiplier}
          onChange={handleChange}
          required={true}
        />
      </div>
    </Modal>
  )
}