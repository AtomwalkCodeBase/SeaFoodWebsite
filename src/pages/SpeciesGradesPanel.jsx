"use client"

import React, { useEffect, useMemo, useState } from "react"
import styled from "styled-components"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"

// import Card from "../../../components/Card"
// import Badge from "../../../components/Badge"
// import DataTable, { Td } from "../../../components/DataTable"
import { FaPlus } from "react-icons/fa"   // plus icon
import Card from "../components/Card"
import Badge from "../components/Badge"
import DataTable, { Td } from "../components/DataTable"
import { getGrades, GetItemCategory, getSpecies } from "../services/productServices"
import { toast } from "react-toastify"

/* -------------------- DATA -------------------- */

const INIT_SPECIES = [
  {
    id: "sp-1",name: "Black Tiger",scientific: "Penaeus monodon",category_alias: "BT",base_price: 420000,processing_cost: 45000,certifications: ["EU Approved", "FDA Registered", "BAP Certified"],active: true,
  },
  {
    id: "sp-2",name: "Vannamei",scientific: "Litopenaeus vannamei",category_alias: "VN",base_price: 310000,processing_cost: 45000,certifications: ["EU Approved", "BAP Certified"],active: true,
  },
]

const INIT_GRADES = [
  { id: "g1", species: "sp-1", code: "8/12", label: "Extra Colossal", min: 8, max: 12, priceMult: 1.85, yieldMult: 1.06, rmCost: 777000, effectiveYield: 0.845, margin: -72000 },
  { id: "g2", species: "sp-1", code: "13/15", label: "Colossal", min: 13, max: 15, priceMult: 1.65, yieldMult: 1.04, rmCost: 693000, effectiveYield: 0.825, margin: 12000 },
  { id: "g3", species: "sp-1", code: "16/20", label: "Extra Jumbo", min: 16, max: 20, priceMult: 1.50, yieldMult: 1.02, rmCost: 638000, effectiveYield: 0.813, margin: 75000 },
  { id: "g4", species: "sp-1", code: "20/25", label: "Jumbo", min: 20, max: 25, priceMult: 1.40, yieldMult: 1.00, rmCost: 588000, effectiveYield: 0.797, margin: 117000 },
  { id: "g5", species: "sp-1", code: "26/30", label: "Extra Large", min: 26, max: 30, priceMult: 1.20, yieldMult: 0.98, rmCost: 584000, effectiveYield: 0.781, margin: 211000 },
  { id: "g6", species: "sp-1", code: "31/40", label: "Large", min: 31, max: 40, priceMult: 1.05, yieldMult: 0.96, rmCost: 441000, effectiveYield: 0.766, margin: 264000 },

  { id: "v1", species: "sp-2", code: "26/30", label: "Extra Large", min: 26, max: 30, priceMult: 1.15, yieldMult: 0.988, rmCost: 357000, effectiveYield: 0.781, margin: 349000 },
  { id: "v2", species: "sp-2", code: "31/40", label: "Large", min: 31, max: 40, priceMult: 1.00, yieldMult: 0.960, rmCost: 318000, effectiveYield: 0.766, margin: 395000 },
]

const INIT_YIELD_STEPS = [
  { id: "y1", yield_pct: 0.9 },
  { id: "y2", yield_pct: 0.92 },
  { id: "y3", yield_pct: 0.95 },
]

/* -------------------- STYLES -------------------- */
const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`
const SelectorWrap = styled.div`
  display: flex;
  justify-content: space-between; /* push species buttons left, add button right */
  align-items: center;
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
    active ? theme.colors.primaryLight : theme.colors.backgroundAlt};
  cursor: pointer;
`
const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 0.75rem;
`
const FieldBox = styled.div`
  padding: 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
`
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.2); /* slight tint */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`
const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: 1.5rem;
  border-radius: 12px;
  width: 420px;
  max-width: 90%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`
const ITEM_CATEGORIES = [
  { id: 1, name: "Shellfish" },
  { id: 2, name: "Raw Prawns" },
  { id: 3, name: "Whiteleg shrimp" },
]
const chartPalette = ["#1890ff", "#13c2c2", "#722ed1", "#faad14"]

const gradeColumns = [
  "GRADE","LABEL","COUNT/LB","PRICE MULT.","RM COST/MT","YIELD MULT.","EFF. YIELD %","MARGIN/MT",
]
/* -------------------- COMPONENT -------------------- */
export default function SpeciesGradesPanel() {
  const [speciesList, setSpeciesList] = useState([])
  const [gradesList, setGradesList] = useState([])
  const [itemCategoryList, setItemCategoryList] = useState([])
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newSpecies, setNewSpecies] = useState({
    item_category: "",
    scientific_name: "",
    base_procurement_price_per_mt: "",
    default_processing_cost_per_mt: "",
    export_certifications: "",
  })
  const [showGradeForm, setShowGradeForm] = useState(false)

      const [newGrade, setNewGrade] = useState({
        grade_code: "",
        label: "",
        count_per_pound_min: "",
        count_per_pound_max: "",
        price_multiplier: "",
        yield_multiplier: "",
      })

      const handleSaveGrade = () => {
        const newEntry = {
          id: `g-${gradesList.length + 1}`,
          species: selectedSpeciesId,
      
          code: newGrade.grade_code,
          label: newGrade.label,
      
          min: parseInt(newGrade.count_per_pound_min),
          max: parseInt(newGrade.count_per_pound_max),
      
          priceMult: parseFloat(newGrade.price_multiplier),
          yieldMult: parseFloat(newGrade.yield_multiplier),
        }
      
        setGradesList([...gradesList, newEntry])
      
        setShowGradeForm(false)
      
        setNewGrade({
          grade_code: "",
          label: "",
          count_per_pound_min: "",
          count_per_pound_max: "",
          price_multiplier: "",
          yield_multiplier: "",
        })
      }
  const selectedSpecies = useMemo(
    () => speciesList.find((s) => s.id === selectedSpeciesId) ?? null,
    [selectedSpeciesId, speciesList]
  )
  
  useEffect(() => {
    if (!selectedSpeciesId && speciesList.length > 0) {
      setSelectedSpeciesId(speciesList[0].id)
    }
  }, [speciesList, selectedSpeciesId])

  const grades = useMemo(
    () => gradesList.filter((g) => g.species === selectedSpeciesId),
    [selectedSpeciesId, gradesList]
  )

  const baseYield = useMemo(
    () => INIT_YIELD_STEPS.reduce((acc, step) => acc * step.yield_pct, 1),
    []
  )

  const tableRows = selectedSpecies
    ? grades.map((g) => {
        const rmCost = (selectedSpecies.base_price || 0) * (g.price_multiplier || 0)
        const effectiveYield = baseYield * g.yield_multiplier
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

  const chartData = tableRows.map((r) => ({
    grade: r.grade_code, // ✅ FIX
    rmCost: r.rmCost / 1000, // keep as number (IMPORTANT)
  }))

  const handleAddSpecies = () => {
  setShowForm(true)
}
const handleSaveSpecies = () => {
  const selectedCategory = ITEM_CATEGORIES.find(
    (c) => c.id === parseInt(newSpecies.item_category)
  )

  const newEntry = {
    id: `sp-${speciesList.length + 1}`,
    name: selectedCategory?.name || "", 
    scientific: newSpecies.scientific_name,
    category_alias: selectedCategory?.name.slice(0, 2).toUpperCase() || "",
    base_price: parseInt(newSpecies.base_procurement_price_per_mt) || 0,
    processing_cost: parseInt(newSpecies.default_processing_cost_per_mt) || 0,
    certifications: newSpecies.export_certifications
      ? newSpecies.export_certifications.split(",").map((c) => c.trim())
      : [],
    active: true,
  }
  setSpeciesList([...speciesList, newEntry])
  setSelectedSpeciesId(newEntry.id)
  setShowForm(false)

  setNewSpecies({
    item_category: "",
    scientific_name: "",
    base_procurement_price_per_mt: "",
    default_processing_cost_per_mt: "",
    export_certifications: "",
  })
}

useEffect(() => {
  getAllSpecies();
  getAllGrade();
  GetItemCategoryList();
}, [])

const getAllSpecies = async () => {
  try {
    const res = await getSpecies();

    const formatted = res.data.map((sp) => ({
      id: sp.id,
      name: sp.scientific_name, // fallback
      scientific_name: sp.scientific_name,
      base_price: parseFloat(sp.base_procurement_price_per_mt),
      processing_cost: parseFloat(sp.default_processing_cost_per_mt),
      category_alias: "SP",
      export_certifications: sp.export_certifications || [],
    }));

    setSpeciesList(formatted);
  } catch (error) {
    toast.error("Failed to fetch species list.");
  }
};

const getAllGrade = async () => {
  try {
    const res = await getGrades();

    const formatted = res.data.map((g) => ({
      id: g.id,
      species: g.species_config, // 🔥 IMPORTANT FIX

      grade_code: g.grade_code,
      label: g.label,

      count_per_pound_min: g.count_per_pound_min,
      count_per_pound_max: g.count_per_pound_max,

      price_multiplier: parseFloat(g.price_multiplier),
      yield_multiplier: parseFloat(g.yield_multiplier),
    }));

    setGradesList(formatted);
  } catch (error) {
    toast.error("Failed to fetch grades list.");
  }
};

const GetItemCategoryList = async () => {
  try {
    const res = await GetItemCategory();
    setItemCategoryList(res.data);
  } catch (error) {
    toast.error("Failed to fetch grades list.");
  }
};
  return (
    <>
    <PanelContent>
      {/* Species Selector */}
      {/* <Card title="Species Selection" variant="primary"> */}
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
          <AddButton onClick={handleAddSpecies}>
            <FaPlus />
          </AddButton>
        </SelectorWrap>
      {/* </Card> */}

      {/* Species Info */}
      <Card variant="secondary">
        <h4>{selectedSpecies?.name || "No species selected"}</h4>
        <p>{selectedSpecies?.scientific_name || "N/A"}</p>
        <FieldRow>
          <FieldBox>Base Price: ₹{selectedSpecies?.base_price ?? "0"}</FieldBox>
          <FieldBox>Processing: ₹{selectedSpecies?.processing_cost ?? "0"}</FieldBox>
          <FieldBox>Alias: {selectedSpecies?.category_alias || "N/A"}</FieldBox>
        </FieldRow>

        <div style={{ marginTop: "0.5rem" }}>
          {(selectedSpecies?.export_certifications || []).map((c) => (
            <Badge key={c} variant="success">
              {c}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Grades Table */}
      <Card variant="accent">
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap"}}>
        <h3>Grade Configuration</h3>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
            <AddButton onClick={() => setShowGradeForm(true)}>
              <FaPlus />
            </AddButton>
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
                 <Td>{row.rmCost?.toFixed(0)}</Td>
                <Td>{(row.effectiveYield * 100)?.toFixed(1)}%</Td>
                <Td>{row.margin?.toFixed(0)}</Td>
                  {/* <Td>--</Td>
                  <Td>--</Td> */}
                </>
              )}
            />
      </Card>
      
      {/* Chart */}
      <Card title="Price Comparison" variant="secondary">
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

{showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-4 font-body">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-text">Add New Species</h3>
        <button onClick={() => setShowForm(false)} className="text-textLight hover:text-error text-2xl font-bold leading-none">&times;</button>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Category</label>
          <select
            value={newSpecies.item_category}
            onChange={(e) => {
              const selectedId = e.target.value;
              setNewSpecies({
                ...newSpecies,
                item_category: selectedId,
              });
            }}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Select Category</option>
            {itemCategoryList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Scientific Name</label>
          <input
            placeholder="Scientific_name"
            value={newSpecies.scientific_name}
            onChange={(e) => setNewSpecies({ ...newSpecies, scientific_name: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Base Price (per MT)</label>
          <input
            placeholder="Base price"
            value={newSpecies.base_procurement_price_per_mt}
            onChange={(e) =>
              setNewSpecies({
                ...newSpecies,
                base_procurement_price_per_mt: e.target.value,
              })
            }
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Processing Cost (per MT)</label>
          <input
            placeholder="Processing cost"
            value={newSpecies.default_processing_cost_per_mt}
            onChange={(e) =>
              setNewSpecies({
                ...newSpecies,
                default_processing_cost_per_mt: e.target.value,
              })
            }
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Certifications</label>
          <input
            placeholder="Certifications"
            value={newSpecies.export_certifications}
            onChange={(e) =>
              setNewSpecies({
                ...newSpecies,
                export_certifications: e.target.value,
              })
            }
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 rounded-xl border border-border text-text font-semibold hover:bg-backgroundAlt transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveSpecies}
          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-secondary transition-colors shadow-md shadow-primary/30 text-sm"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

{showGradeForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-4 font-body">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-text">Add Grade</h3>
        <button onClick={() => setShowGradeForm(false)} className="text-textLight hover:text-error text-2xl font-bold leading-none">&times;</button>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Grade Code</label>
          <input
            placeholder="Grade Code"
            value={newGrade.grade_code}
            onChange={(e) => setNewGrade({ ...newGrade, grade_code: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Label</label>
          <input
            placeholder="Label"
            value={newGrade.label}
            onChange={(e) => setNewGrade({ ...newGrade, label: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Min (count/lb)</label>
          <input
            placeholder="Min"
            value={newGrade.count_per_pound_min}
            onChange={(e) => setNewGrade({ ...newGrade, count_per_pound_min: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Max (count/lb)</label>
          <input
            placeholder="Max"
            value={newGrade.count_per_pound_max}
            onChange={(e) => setNewGrade({ ...newGrade, count_per_pound_max: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Price Multiplier</label>
          <input
            placeholder="Price Mult"
            value={newGrade.price_multiplier}
            onChange={(e) => setNewGrade({ ...newGrade, price_multiplier: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-textLight uppercase tracking-wider">Yield Multiplier</label>
          <input
            placeholder="Yield Mult"
            value={newGrade.yield_multiplier}
            onChange={(e) => setNewGrade({ ...newGrade, yield_multiplier: e.target.value })}
            className="p-2 rounded-lg border border-border bg-inputBg text-text text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={() => setShowGradeForm(false)}
          className="px-4 py-2 rounded-xl border border-border text-text font-semibold hover:bg-backgroundAlt transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveGrade}
          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-secondary transition-colors shadow-md shadow-primary/30 text-sm"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </>
  )
}