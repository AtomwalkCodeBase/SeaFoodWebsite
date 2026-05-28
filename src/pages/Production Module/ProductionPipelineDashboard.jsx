import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import StatsCard from '../../components/StatsCard'
import { GrNotes } from 'react-icons/gr'
import { BsBookmarkCheckFill } from 'react-icons/bs'
import { FaRegHourglassHalf } from 'react-icons/fa6'
import Tabs from '../../components/Tabs'
import Card from '../../components/Card'
import { Badge as BadgeUI, EmptyState, SectionHeader } from '../../components/EmptyState'
import { useCreateGradingSession, useGetBaseUnitList, useGetEmployeeList, useGradeSegregation, useGRNList, usePOItemList, useSpecies } from '../../hooks/useProductQueries'
import { RiDraftFill } from 'react-icons/ri'
import { theme } from '../../styles/Theme'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { useFormHandler } from '../../hooks/useFormHandler'
import InputField from '../../components/InputField'
import { toast } from 'react-toastify'
import { LuUserRound } from 'react-icons/lu'
import { FaBoxOpen, FaClipboardCheck, FaEye, FaFlask, FaLayerGroup, FaMapMarkerAlt, FaStore, FaUser } from 'react-icons/fa'
import { formatDate } from '../../utils'
import { TbArrowAutofitContentFilled } from 'react-icons/tb'
import DataTable, { Td } from '../../components/Datatable'
import Badge from '../../components/Badge'
import { useFilter } from '../../hooks/useFilter'
import { usePagination } from '../../hooks/usePagination'
import PaginationComponent from '../../components/Pagination'
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io'
import GradeSegregationViewModal from './Modal/GradeSegregationViewModal'

const PIPELINE_COLUMNS = [ "Purchase Ref.",  "GRN Number", "Species", "Received(MT)", "Graded(MT)", "Waste(MT)", "Status", "Action"];

const getStatusDisplay = (grnItem) => {
  if (!grnItem) return { label: "Not assigned", variant: "error" };
  
  const statusMap = {
    IN_PROGRESS: { label: "In progress", variant: "info" },
    COMPLETED: { label: "Completed", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "error" }
  };
  
  return statusMap[grnItem.status] || { label: "Unknown", variant: "warning" };
};
const today = new Date().toISOString().split("T")[0];

const ProductionPipelineDashboard = () => {
  const [activeTab, setActiveTab] = useState("GRN");
  const [filters, setFilters] = useState({ search: "", status: "", item_number: "", qcManager: "", fromDate: "", toDate: ""});
  const [expandedRow, setExpandedRow] = useState(null);
  const [startGradingData, setStartGradingData] = useState(null);
  const [segregationData, setSegregationData] = useState(null);
  const [segregationDataView, setSegregationDataView] = useState(null);

  const {data: PoItemList, isLoading: poItemListIsLoading, error: poItemListError} = usePOItemList({po_type: "R"});
  const {data: grnList, isLoading: grnLoading, error: grnError} = useGRNList();
  
  const filteredPoData = PoItemList?.filter((data) => data.po_status === "D");

  const combinationData = filteredPoData?.reduce((result, poItem) => {
      const matchingGrn = grnList?.find(
          (grn) => poItem.grn_detail?.grn_number === grn?.grn_reference
      );

    result.push({
          poItem,
          grnItem: matchingGrn || null,
        });

        return result;
  }, []) || [];

   console.log("combinationData",combinationData)

  
  const filteredPoList = useFilter({
    data: combinationData, fields: ["poItem.po_ref_number", "poItem.po_items[].po_item.name", "poItem.supplier_name", "poItem.po_items[].po_item.item_number", "poItem.supplier_ref_number", "poItem.grn_detail.grn_number"],
    search: filters.search, extraFilters: { "grnItem?.status": filters.status, "poItem.po_items[0].po_item.item_number": filters.item_number, dateRange: { field: "poItem.grn_detail?.grn_date", from: filters.fromDate, to: filters.toDate, }, },
  })
  
    const {paginatedData, totalItems, currentPage, itemsPerPage, handlePageChange} = usePagination(filteredPoList, 10);

    // console.log("filteredPoList", JSON.stringify(filteredPoList))

    const inProgressQc = filteredPoList.filter((item) => item?.grnItem?.status === "IN_PROGRESS").length;
    const draftPO = filteredPoList.filter((item) => item?.poItem?.ref_po?.po_status === "D").length;
   

  const STATS_CARD = [
    {label: "Total GRN", icon: <GrNotes />, value: filteredPoList.length, color: "primary"},
    // {label: "Active QC",icon: <BsBookmarkCheckFill />, value: "2", color: "secondary"},
    {label: "In Progress QC",icon: <FaRegHourglassHalf />, value: inProgressQc, color: "accent"},
    {label: "Draft PO", icon: <RiDraftFill />, value: draftPO, color: "success"}
  ] 

  return (
    <Layout title="Production Pipeline">
      <div className='statsGrid'>
        {STATS_CARD.map((data) => (
          <StatsCard label={data.label} icon={data.icon} color={data.color} value={data.value} />
        ))}
      </div>

      <Card style={{marginTop: "1.5rem"}}>
        <SectionHeader title="Unsorted Grade List" />
<div className="w-full pb-4 pt-4">
  <div
    className="
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-12 
      gap-4 
      items-end
    "
  >

    {/* Search */}
    <div className="lg:col-span-4">
      <InputField
        label=""
        type="text"
        value={filters.search}
        onChange={(e) =>
          setFilters((prev) => ({
            ...prev,
            search: e.target.value,
          }))
        }
        placeholder="Search by purchase ref, supplier, product..."
      />
    </div>

    {/* Status */}
    <div className="lg:col-span-2">
      <InputField
        label="Status"
        type="select"
        value={filters.status}
        onChange={(e) =>
          setFilters((prev) => ({
            ...prev,
            status: e.target.value,
          }))
        }
        options={[
          { label: "All", value: "ALL" },
          { label: "In Progress", value: "IN_PROGRESS" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
        ]}
      />
    </div>

    {/* From Date */}
    <div className="lg:col-span-2">
      <InputField
        label="From Date"
        type="date"
        value={filters.fromDate}
        onChange={(e) =>
          setFilters((prev) => ({
            ...prev,
            fromDate: e.target.value,
          }))
        }
      />
    </div>

    {/* To Date */}
    <div className="lg:col-span-2">
      <InputField
        label="To Date"
        type="date"
        value={filters.toDate}
        onChange={(e) =>
          setFilters((prev) => ({
            ...prev,
            toDate: e.target.value,
          }))
        }
      />
    </div>

    {/* Clear Button */}
    <div className="lg:col-span-2">
      <Button
        onClick={() =>
          setFilters({
            search: "",
            status: "ALL",
            item_number: "",
            qcManager: "",
            fromDate: today,
            toDate: today,
          })
        }
        className="w-full h-10"
      >
        Clear
      </Button>
    </div>
  </div>
</div>

        <DataTable
        columns={PIPELINE_COLUMNS}
        data={paginatedData}
        renderRow={(data) => {
          const status = getStatusDisplay(data?.grnItem);
          return(
          <>
          {/* <Td className="cursor-pointer" onClick={() =>  setExpandedRow((prev) => prev === data.id ? null : data.id)} >{expandedRow === data.id ? <IoIosArrowUp /> : <IoIosArrowDown /> }</Td> */}
          <Td>{data?.poItem?.po_ref_number}</Td>
          <Td>{data?.poItem?.grn_detail?.grn_number}</Td>
          <Td>{data?.poItem?.po_items[0].po_item.name}</Td>
          <Td>{data?.poItem?.po_items[0].quantity} MT</Td>
          <Td>{data?.grnItem?.total_graded_mt || 0} MT</Td>
          <Td>{data?.grnItem?.waste_mt || 0} MT</Td>
          {/* <Td>{data?.poItem?.supplier_name}</Td> */}
          {/* <Td>{data?.poItem?.grn_detail.grn_date}</Td> */}
          {/* <Td>{data?.grnItem?.qc_inspector || "Not Assigned"}</Td> */}
          <Td><Badge variant={status.variant}>{status.label}</Badge></Td>
          <Td className='flex gap-3'>
            { !data?.grnItem && 
            <Button size='sm' onClick={() => setStartGradingData(data?.poItem)}><FaFlask />Start Grading</Button>
            }
             {data?.grnItem?.grade_lines.length === 0 ?
            <Button size='sm' onClick={() => setSegregationData({ grnItem: data?.grnItem, poItem: data?.poItem})}><FaLayerGroup /> Grade Segregation </Button> 
              : <Button size='sm' onClick={() => setSegregationDataView(data.grnItem)}>
                <FaEye className="mr-1" /> View Grades
              </Button>
            }
            <Button size='sm' onClick={() => console.log(data)}><FaClipboardCheck />QC View</Button>

          
      
            {/* {!data?.grnItem && 
            <Button size='sm' onClick={() => setStartGradingData(data.poItem)}}>Start Grading</Button> }
            {data?.grnItem?.grade_lines.length === 0 &&
            <Button size='sm' onClick={() => setSegregationData({ grnItem: data.grnItem, poItem: data.poItem})}> Grade Segregation </Button> 
          } */}

            {/* <Button size='sm' onClick={() => setStartGradingData(data.poItem)}>Start Grading</Button>  */}
          {/* <Button size='sm' onClick={() => setSegregationData({ grnItem: data.grnItem, poItem: data.poItem})}> Grade Segregation </Button>  */}
            {/* <Button size='sm' onClick={() => console.log(data)}>QC View</Button> */}
          </Td>
          </>
        )}}

        expandedRow={expandedRow}
        renderExpandedRow={(data) => (
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Batch Number", "Name", "Item Number", "Quantity"].map((header) => (
                      <th key={header} className="py-3 px-2 font-semibold whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data?.poItem?.ref_po?.po_items.length === 0 ? 
                   <tr className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-2 whitespace-nowrap"> No grading found</td>
                    </tr>
                  :
                  data?.poItem?.ref_po?.po_items?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-muted/40 transition-colors"
                    >
                      {/* Batch Number */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {data?.grnItem?.erp_batch || "-"}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {item?.po_item?.name || "-"}
                      </td>

                      {/* Item Number */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {item?.po_item?.item_number || "-"}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        {item?.quantity || 0} MT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        
        />

        <PaginationComponent totalItems={totalItems} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={handlePageChange}/>

      </Card>

      <StartGradingModal
        isOpen={!!startGradingData}
        onClose={() => setStartGradingData(null)}
        grnData={startGradingData}
      />

      <GradeSegregationModal
        isOpen={!!segregationData}
        onClose={() => setSegregationData(null)}
        segregationData={segregationData}
      />

      <GradeSegregationViewModal  
        isOpen={!!segregationDataView}
        onClose={() => setSegregationDataView(null)}
        grnItem={segregationDataView} />
    </Layout>
  )
}

export default ProductionPipelineDashboard

const StartGradingModal = ({ isOpen, onClose, grnData }) => {

  const EMPTY_FORM = {
    item_number: "",
    grn_reference: "",
    erp_batch: "",
    storage_location: "",
    supplier_id: "",
    supplier_name: "",
    species_config: "",
    total_received_mt: "",
    total_graded_mt: "",
    waste_mt: "",
    qc_inspector: "",
    temperature_on_arrival: "",
    qc_notes: ""
  }

  const {form,setForm, handleChange, resetForm} = useFormHandler(EMPTY_FORM);
  const {data: speciesList = [], isLoading: speciesLoading  } = useSpecies(isOpen);
  const {data: employeeList = [], isLoading: employeeListLoading  } = useGetEmployeeList(isOpen);
  const managerList = employeeList?.filter((employee) => employee.is_manager === true);

  useEffect(() => {
      if (isOpen && grnData) {
        setForm({
          item_number: grnData?.po_items?.[0]?.po_item?.item_number || "",
          grn_reference: grnData?.grn_detail?.grn_number || "",
          erp_batch: `BATCH-${grnData?.po_ref_number}`,
          storage_location: grnData?.location || "",
          supplier_id: grnData?.supplier_id || "",
          supplier_name: grnData?.supplier_name || "",
          species_config: "",
          total_received_mt: Number(grnData?.po_items?.[0]?.quantity) || "",
          qc_inspector: "",
          temperature_on_arrival: "",
          qc_notes: "",
        });
      }
    }, [isOpen, grnData, setForm]);

  const createGradingMutation = useCreateGradingSession(onClose);

  const handleSubmit = () => {
    createGradingMutation.mutate(form);
  };

  return(

     <Modal title= "Start Grading" saveButtonText='Create Grading Session' width='max-w-xl'isOpen={isOpen} onClose={onClose} onSave={handleSubmit} showSaveButton={true}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* <div className="col-span-2"> */}
                <InputField
                  label="GRN reference number"
                  name="grn_reference"
                  type="text"
                  value={form.grn_reference}
                  onChange={handleChange}
                  disabled={true}
                />

                <InputField
                  label="Batch Number"
                  name="erp_batch"
                  type="text"
                  value={form.erp_batch}
                  onChange={handleChange}
                  disabled={true}
                />
                
                <InputField
                  label="Species"
                  name="species_config"
                  type="select"
                  value={form.species_config}
                  onChange={handleChange}
                  options={speciesList?.map(item => ({ id: item.id, value: item.id, label: `${item.scientific_name}`}))}
                  required
              />


              {/* </div> */}

              <InputField
                label="Enter grading Quantity(MT)"
                name="total_received_mt"
                type="number"
                value={form.total_received_mt}
                onChange={handleChange}
                />

              <InputField
                label="QC Manager"
                name="qc_inspector"
                type="select"
                value={form.qc_inspector}
                options={managerList?.map(item => ({ id: item.id, value: item.name, label: item.name}))}
                onChange={handleChange}
                required
              />


              <div className='col-span-2'>

                <InputField
                  label="Storage Location"
                  name="storage_location"
                  type="text"
                  value={form.storage_location}
                  onChange={handleChange}
                />
              </div>
            </div>
        </div>
    </Modal>
  )
}

const STATUS_CONFIG = {
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', color: '#633806' },
  COMPLETED: { label: 'Completed', bg: '#EAF3DE', color: '#27500A' },
  PENDING: { label: 'Pending', bg: '#E6F1FB', color: '#0C447C' },
  REJECTED: { label: 'Rejected', bg: '#FCEBEB', color: '#791F1F' },
}


const GradeSegregationModal = ({ isOpen, onClose, segregationData }) => {
  const qcData = segregationData?.grnItem;
  const poData = segregationData?.poItem;
  // console.log()

  const EMPTY_GRADE_ROW = { grade_config_id: "", quantity_mt: "", unit_of_quantity: ""};
  const [gradeRows, setGradeRows] = useState([EMPTY_GRADE_ROW ]);
  const [wasteMt, setWasteMt] = useState(0);
  const [notes, setNotes] = useState("");

  const { data: speciesList, isLoading: speciesLoading } = useSpecies(isOpen, qcData?.species_config);
  const { data: baseUnitList = [], isLoading: baseUnitLoading } = useGetBaseUnitList();
  const speciesArray = Array.isArray(speciesList) ? speciesList : speciesList ? [speciesList] : [];

  const gradeOptions = speciesArray.flatMap(
    (species) => (species?.grades || []).map((grade) => ({
        id: grade.id,
        value: grade.id,
        label: `${species.scientific_name} (${grade.grade_code})`,
      }))
  );

  const handleInputChange = (index, e) => {
    const { name, value, type } = event.target;
setGradeRows((prev) =>
    prev.map((row, i) =>
      i === index
        ? {
            ...row,
            [name]:
              type === "number"
                ? value === "" 
                  ? ""                    // Allow empty when user clears the field
                  : Number(value) || 0    // Convert only when there's actual input
                : value,
          }
        : row
    )
  );
};

  const handleAddRow = () => setGradeRows((prev) => [ ...prev, EMPTY_GRADE_ROW]);
  const handleRemoveRow = (index) => setGradeRows((prev) => prev.filter((_, i) => i !== index));
  
  const createGradeSegregation = useGradeSegregation(onClose);

  const handleSubmit = async () => {
   const grade_data_list = gradeRows.map(row => ({
      grade_config_id: row.grade_config_id,
      unit_of_quantity: Number(row.unit_of_quantity),
      quantity_mt: Number(row.quantity_mt) || 0,
    }));

    const formData = new FormData();

    formData.append("g_session_id", qcData?.id);
    formData.append("call_mode", "CLOSE");
    formData.append("po_id", poData?.id);
    formData.append("waste_mt", Number(wasteMt) || 0);
    formData.append(
      "notes",
      notes.trim() || "Normal grading completed"
    );

    // append array data
    formData.append(
      "grade_data_list",
      JSON.stringify(grade_data_list)
    );

    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    createGradeSegregation.mutate(formData);
  };

  useEffect(() => {
    if (!isOpen) {
      setGradeRows([EMPTY_GRADE_ROW]);
      setWasteMt(0);
      setNotes("");
    }
  }, [isOpen]);



  return (
      <Modal title='Grade Segregation' width='max-w-6xl' isOpen={isOpen} onClose={onClose} saveButtonText='Save Segregation' onSave={handleSubmit}>
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
                    name="grade_config_id"
                    type="select"
                    value={row.grade_config_id}
                    onChange={(e) => handleInputChange(index, e)}
                    options={gradeOptions}
                  />
                </div>

                <div className="col-span-3">
                  <InputField
                    label="Quantity (MT)"
                    name="quantity_mt"
                    type="number"
                    value={row.quantity_mt}
                    onChange={(e) =>handleInputChange(index, e)}
                  />
                </div>
                <div className="col-span-3">
                  <InputField
                    label="Unit"
                    name="unit_of_quantity"
                    type="select"
                    value={row.unit_of_quantity}
                    options={baseUnitList?.filter((data)=> data.unit_type === "W")?.map(item => ({ id: item.id, value: item.id, label: item.name}))}
                    onChange={(e) =>handleInputChange(index, e)}
                  />
                </div>

                {/* <div className="col-span-3">
                  <InputField
                    label="Bin Location ID"
                    name="bin_location_id"
                    type="text"
                    value={row.bin_location_id}
                    onChange={(e) =>
                      handleInputChange(index, e)
                    }
                  />
                </div> */}

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
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <InputField
                label="Waste (MT)"
                type="number"
                value={wasteMt}
                onChange={(e) => setWasteMt(e.target.value)}
              />
              <InputField
                label="Notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes..."
              />
            </div>

          </div>
        </div>

      </Modal>
  )
}
