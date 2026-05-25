import { FaLayerGroup, FaWeightHanging, FaPercent, FaRupeeSign, FaBoxOpen, FaCheckCircle } from 'react-icons/fa'
import Modal from '../../../components/Modal'

export default function  GradeSegregationModal({ isOpen, onClose, grnItem }) {
  if (!grnItem) return null
console.log("grnItem", grnItem)
  const totalLineValue = grnItem.grade_lines.reduce(
    (sum, g) => sum + parseFloat(g.line_value), 0
  )

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <Modal
      title='Grade Segregation'
      width='max-w-3xl'
      isOpen={isOpen}
      onClose={onClose}
      showSaveButton={false}
    >
      {/* Session Summary */}
      <div className="bg-accentLight border border-border rounded-xl p-4 mb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-text-light block text-xs mb-0.5">GRN Reference</span>
            <span className="text-primary font-semibold">{grnItem.grn_reference}</span>
          </div>
          <div>
            <span className="text-text-light block text-xs mb-0.5">ERP Batch</span>
            <span className="text-text font-semibold">{grnItem.erp_batch}</span>
          </div>
          <div>
            <span className="text-text-light block text-xs mb-0.5">Supplier</span>
            <span className="text-text font-semibold">{grnItem.supplier_name}</span>
          </div>
          <div>
            <span className="text-text-light block text-xs mb-0.5">Item</span>
            <span className="text-text font-semibold">{grnItem.item_number}</span>
          </div>
          <div>
            <span className="text-text-light block text-xs mb-0.5">Grading Date</span>
            <span className="text-text font-semibold">{formatDate(grnItem.grading_date)}</span>
          </div>
          <div>
            <span className="text-text-light block text-xs mb-0.5">Completed At</span>
            <span className="text-text font-semibold">{formatDate(grnItem.completed_at)}</span>
          </div>
        </div>
      </div>

      {/* MT Summary Strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Received', value: `${parseFloat(grnItem.total_received_mt).toFixed(2)} MT`, color: 'text-primary' },
          { label: 'Graded',   value: `${parseFloat(grnItem.total_graded_mt).toFixed(2)} MT`,  color: 'text-secondary' },
          { label: 'Waste',    value: `${parseFloat(grnItem.waste_mt).toFixed(2)} MT`,          color: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xs text-text-light mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grade Lines */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
          <FaLayerGroup className="text-primary" /> Grade Breakdown (QC inspector: {grnItem.qc_inspector})
        </h3>

        <div className="space-y-3">
          {grnItem.grade_lines.map((grade) => (
            <div
              key={grade.id}
              className="bg-card mb-3 border border-border rounded-xl p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-primaryLight text-primary text-sm font-bold px-3 py-1 rounded-full">
                    {grade.grade_code}
                  </span>
                  {grade.erp_item_batch && (
                    <span className="text-xs text-text-light flex items-center gap-1">
                      <FaBoxOpen size={11} /> {grade.erp_item_batch}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-light bg-backgroundAlt px-2 py-1 rounded-full">
                  {grade.percentage_of_total}% of total
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-text-light text-xs flex items-center gap-1 mb-0.5">
                    <FaWeightHanging size={10} /> Quantity
                  </span>
                  <span className="font-semibold text-text">
                    {parseFloat(grade.quantity_mt).toFixed(3)} MT
                  </span>
                </div>
                <div>
                  <span className="text-text-light text-xs flex items-center gap-1 mb-0.5">
                    <FaRupeeSign size={10} /> Unit Price / MT
                  </span>
                  <span className="font-semibold text-text">
                    {formatCurrency(grade.unit_price_per_mt)}
                  </span>
                </div>
                <div>
                  <span className="text-text-light text-xs flex items-center gap-1 mb-0.5">
                    <FaRupeeSign size={10} /> Line Value
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(grade.line_value)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-background-alt rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${grade.percentage_of_total}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Value Footer */}
      <div className="mt-4 flex justify-between items-center bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
        <span className="text-sm font-semibold text-primary flex items-center gap-2">
          <FaCheckCircle /> Total Grade Value
        </span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totalLineValue)}
        </span>
      </div>
    </Modal>
  )
}