import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import InputField from "../components/InputField";
import DataTable, { Td } from "../components/Datatable";
import PaginationComponent from "../components/Pagination";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { FaEye } from "react-icons/fa";

import { usePagination } from "../hooks/usePagination";
import { useFilter } from "../hooks/useFilter";
import { useCustomers, useGrades, useSpecies, useSupplierProfile } from "../hooks/useProductQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_COLUMNS = [
  "GRADE CODE",
  "SUPPLIER NAME",
  "EXPECTED %",
  "SAMPLE SIZE (MT)",
  "LAST UPDATED",
  "ACTION",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a supplier_id (string number) → supplier_name map.
 * Customers API returns { id, name } where id matches supplier.supplier_id.
 */
const buildSupplierNameMap = (customerList = []) =>
  Object.fromEntries(customerList.map((c) => [String(c.id), c.name]));

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString("en-GB") : "--";

const formatDatetime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString("en-GB") : "--";

const formatPercent = (value) =>
  value != null ? `${(Number(value) * 100).toFixed(2)}%` : "--";

// ─── Sub-components ───────────────────────────────────────────────────────────

const ModalField = ({ label, value, className = "", colSpan = false }) => (
  <div className={colSpan ? "col-span-2" : ""}>
    <div className="text-xs text-muted uppercase tracking-wide mb-0.5">
      {label}
    </div>
    <div className={`text-sm font-medium ${className}`}>{value ?? "—"}</div>
  </div>
);

const ModalSection = ({ title, children }) => (
  <div>
    <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 pb-1 border-b border-border">
      {title}
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
  </div>
);

// ─── Modal: loads per-supplier data + resolves grade & species ─────────────────

const SupplierDetailModal = ({ supplierId, supplierName, isOpen, onClose }) => {
  const { data: profileList = [], isLoading } = useSupplierProfile({id: supplierId});
  const { data: gradeList = [] } = useGrades();
  const { data: speciesList = [] } = useSpecies();

  // grade.id (UUID) → grade  — because supplier.grade_config is a grade UUID
  const gradeMap = useMemo(
    () => Object.fromEntries(gradeList.map((g) => [g.id, g])),
    [gradeList]
  );

  // species.id (UUID) → species
  const speciesMap = useMemo(
    () => Object.fromEntries(speciesList.map((s) => [s.id, s])),
    [speciesList]
  );

  /**
   * Lookup chain per profile row:
   *   row.grade_config (UUID) → gradeMap → grade
   *   grade.species_config (single UUID) → speciesMap → scientific_name
   */
  const enrichedProfiles = useMemo(
    () =>
      profileList.map((row) => {
        const grade = gradeMap[row.grade_config] ?? null;
        const species = grade ? speciesMap[grade.species_config] ?? null : null;
        return { ...row, grade, species };
      }),
    [profileList, gradeMap, speciesMap]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supplier Profile"
      width="max-w-2xl"
      showSaveButton={false}
      cancelButtonText="Close"
    >
      {/* ── Header Banner ── */}
      <div className="rounded-lg px-4 py-3 mb-4 bg-primary/10 border border-primary/20 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">
            Supplier
          </div>
          <div className="text-base font-bold text-primary">
            {supplierName || supplierId}
          </div>
          <div className="text-xs text-muted mt-0.5">ID: {supplierId}</div>
        </div>
        <Badge variant="info">{enrichedProfiles.length} Grade(s)</Badge>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted text-center py-6">Loading...</div>
      ) : enrichedProfiles.length === 0 ? (
        <div className="text-sm text-muted text-center py-6">
          No profile data found.
        </div>
      ) : (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {enrichedProfiles.map((row, idx) => (
            <div
              key={row.id ?? idx}
              className="border border-border rounded-lg p-4 space-y-4"
            >
              {/* Grade Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-primary">
                    {row.grade?.label || "—"}
                  </span>
                  <span className="ml-2 text-xs text-muted">
                    {row.grade?.grade_code}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  Updated: {formatDatetime(row.last_updated)}
                </span>
              </div>

              {/* Grade Info */}
              <ModalSection title="Grade Info">
                <ModalField label="Size Code" value={row.grade_code} />
                <ModalField
                  label="Expected %"
                  value={formatPercent(row.expected_percentage)}
                />
                <ModalField
                  label="Sample Size"
                  value={row.sample_size_mt ? `${row.sample_size_mt} MT` : "—"}
                />
                <ModalField
                  label="Grade Label"
                  value={row.grade?.label ?? "—"}
                />
                <ModalField
                  label="Price Multiplier"
                  value={row.grade?.price_multiplier ?? "—"}
                />
                <ModalField
                  label="Yield Multiplier"
                  value={row.grade?.yield_multiplier ?? "—"}
                />
              </ModalSection>

              {/* Species */}
              <ModalSection title="Species">
                {row.species ? (
                  <>
                    <ModalField
                      label="Scientific Name"
                      value={row.species.scientific_name}
                    />
                    <ModalField
                      label="Base Price / MT"
                      value={
                        row.species.base_procurement_price_per_mt
                          ? `₹${Number(row.species.base_procurement_price_per_mt).toLocaleString("en-IN")}`
                          : "—"
                      }
                    />
                    {row.species.export_certifications?.length > 0 && (
                      <div className="col-span-2 flex flex-wrap gap-2 mt-1">
                        {row.species.export_certifications.map((cert) => (
                          <Badge key={cert} variant="success">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="col-span-2 text-sm text-muted">
                    No species linked to this grade.
                  </div>
                )}
              </ModalSection>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Supplier = () => {
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const { data: supplierList = [], isLoading } = useSupplierProfile();
  const { data: customerList = [] } = useCustomers({ is_supplier: "YES" });

  const supplierNameMap = useMemo(
    () => buildSupplierNameMap(customerList),
    [customerList]
  );

  // Enrich list rows with resolved supplier name
  const enrichedList = useMemo(
    () =>
      supplierList.map((row) => ({
        ...row,
        supplier_name: supplierNameMap[row.supplier_id] ?? row.supplier_name,
      })),
    [supplierList, supplierNameMap]
  );

  const filteredData = useFilter({
    data: enrichedList,
    fields: ["grade_code", "supplier_id", "supplier_name"],
    search,
  });

  const {
    currentPage,
    paginatedData,
    totalItems,
    handlePageChange,
    itemsPerPage,
  } = usePagination(filteredData, 10);

  return (
    <Layout title="Supplier List">
      <Card>
        {/* Search */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <InputField
              value={search}
              placeholder="Search by grade, supplier ID or name..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={TABLE_COLUMNS}
          data={paginatedData}
          highlightFirstRow={false}
          loading={isLoading}
          renderRow={(item) => (
            <>
              <Td>{item.grade_code}</Td>
              <Td>
                <div className="font-medium">
                  {item.supplier_name || "--"}
                </div>
                <div className="text-xs text-muted">{item.supplier_id}</div>
              </Td>
              <Td>{formatPercent(item.expected_percentage)}</Td>
              <Td>{item.sample_size_mt ?? "--"} MT</Td>
              <Td>{formatDate(item.last_updated)}</Td>
              <Td>
                <Button
                  iconOnly
                  title="View"
                  onClick={() => setSelectedSupplier(item)}
                >
                  <FaEye />
                </Button>
              </Td>
            </>
          )}
        />

        {/* Pagination */}
        <PaginationComponent
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* Detail Modal — only mounts when a supplier is selected */}
      {selectedSupplier && (
        <SupplierDetailModal
          supplierId={selectedSupplier.supplier_id}
          supplierName={selectedSupplier.supplier_name}
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </Layout>
  );
};

export default Supplier;