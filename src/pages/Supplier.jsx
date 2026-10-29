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

/**
 * Table dedupe: one row per (supplier_id, grade_code), keeping only the
 * most recently updated record for that pair. Full history for a supplier
 * (including older records at the same grade) is available via the modal.
 */
const dedupeLatestBySupplierGrade = (list = []) => {
  const latestByKey = new Map();

  list.forEach((row) => {
    const key = `${row.supplier_id}__${row.grade_code}`;
    const existing = latestByKey.get(key);
    if (!existing || new Date(row.last_updated) > new Date(existing.last_updated)) {
      latestByKey.set(key, row);
    }
  });

  return Array.from(latestByKey.values());
};

/**
 * Modal grouping: bucket a supplier's full profile history by grade_code,
 * then sort each grade's entries newest-first so every date-wise record
 * is shown separately under its grade header.
 */
const groupProfilesByGrade = (profiles = []) => {
  const groups = new Map();

  profiles.forEach((row) => {
    const key = row.grade_code || row.grade?.id || "unknown";
    if (!groups.has(key)) {
      groups.set(key, {
        grade_code: row.grade_code,
        grade: row.grade,
        species: row.species,
        entries: [],
      });
    }
    groups.get(key).entries.push(row);
  });

  groups.forEach((group) => {
    group.entries.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
  });

  return Array.from(groups.values());
};

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

/**
 * One history row inside a grade group: Expected % | Sample Size | Updated.
 * Multiple rows under the same grade represent separate grading events
 * on different dates.
 */
const GradeHistoryRow = ({ entry }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 last:border-b-0 text-sm">
    <div>{formatPercent(entry.expected_percentage)}</div>
    <div>{entry.sample_size_mt ? `${entry.sample_size_mt} MT` : "—"}</div>
    <div className="text-muted">{formatDate(entry.last_updated)}</div>
  </div>
);

// ─── Modal: loads per-supplier data + resolves grade & species ─────────────────

const SupplierDetailModal = ({
  supplierId,
  supplierName,
  gradeCode,
  isOpen,
  onClose,
}) => {
  const { data: profileList = [], isLoading } = useSupplierProfile(
    isOpen,
    supplierId
  );

  const { data: gradeList = [] } = useGrades();
  const { data: speciesList = [] } = useSpecies();

  // grade.id (UUID) → grade
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
   * Only keep records belonging to the selected grade.
   *
   * Depending on your API, grade_code may already exist on the row.
   * If not, resolve the grade from grade_config and compare its code.
   */
  const gradeProfiles = useMemo(() => {
    return profileList.filter((row) => {
      const grade = gradeMap[row.grade_config];

      return (
        row.grade_code === gradeCode ||
        grade?.code === gradeCode ||
        String(row.grade_config) === String(gradeCode)
      );
    });
  }, [profileList, gradeMap, gradeCode]);

  /**
   * Enrich only the selected grade's records.
   */
  const enrichedProfiles = useMemo(
    () =>
      gradeProfiles.map((row) => {
        const grade = gradeMap[row.grade_config] ?? null;
        const species = grade
          ? speciesMap[grade.species_config] ?? null
          : null;

        return {
          ...row,
          grade,
          species,
        };
      }),
    [gradeProfiles, gradeMap, speciesMap]
  );

  const gradeGroups = useMemo(
    () => groupProfilesByGrade(enrichedProfiles),
    [enrichedProfiles]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supplier Grade History"
      width="max-w-2xl"
      showSaveButton={false}
      cancelButtonText="Close"
    >
      {/* Header */}
      <div className="rounded-lg px-4 py-3 mb-4 bg-primary/10 border border-primary/20 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">
            Supplier
          </div>

          <div className="text-base font-bold text-primary">
            {supplierName || supplierId}
          </div>

          <div className="text-xs text-muted mt-0.5">
            ID: {supplierId}
          </div>
        </div>

        <Badge variant="info">
          Grade: {gradeCode}
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted text-center py-6">
          Loading...
        </div>
      ) : gradeGroups.length === 0 ? (
        <div className="text-sm text-muted text-center py-6">
          No history found for grade {gradeCode}.
        </div>
      ) : (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {gradeGroups.map((group, idx) => {
            const latest = group.entries[0];

            return (
              <div
                key={group.grade_code ?? idx}
                className="border border-border rounded-lg p-4 space-y-4"
              >
                {/* Grade Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-primary">
                      {group.grade?.label ||
                        `Grade ${group.grade_code}`}
                    </span>

                    <span className="ml-2 text-xs text-muted">
                      {group.grade_code}
                    </span>
                  </div>

                  <Badge variant="secondary">
                    {group.entries.length} record
                    {group.entries.length > 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Grade Info */}
                <ModalSection title="Grade Info">
                  <ModalField
                    label="Grade Label"
                    value={group.grade?.label ?? "—"}
                  />

                  <ModalField
                    label="Price Multiplier"
                    value={group.grade?.price_multiplier ?? "—"}
                  />

                  <ModalField
                    label="Yield Multiplier"
                    value={group.grade?.yield_multiplier ?? "—"}
                  />

                  <ModalField
                    label="Last Updated"
                    value={formatDatetime(latest?.last_updated)}
                  />
                </ModalSection>

                {/* History */}
                <div>
                  <div className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 pb-1 border-b border-border">
                    History
                  </div>

                  <div className="grid grid-cols-3 gap-4 pb-1 text-xs text-muted uppercase tracking-wide">
                    <div>Expected %</div>
                    <div>Sample Size</div>
                    <div>Updated</div>
                  </div>

                  {group.entries.map((entry, entryIdx) => (
                    <GradeHistoryRow
                      key={entry.id ?? entryIdx}
                      entry={entry}
                    />
                  ))}
                </div>

                {/* Species */}
                <ModalSection title="Species">
                  {group.species ? (
                    <>
                      <ModalField
                        label="Scientific Name"
                        value={group.species.scientific_name}
                      />

                      <ModalField
                        label="Base Price / MT"
                        value={
                          group.species.base_procurement_price_per_mt
                            ? `₹${Number(
                              group.species
                                .base_procurement_price_per_mt
                            ).toLocaleString("en-IN")}`
                            : "—"
                        }
                      />

                      {group.species.export_certifications?.length > 0 && (
                        <div className="col-span-2 flex flex-wrap gap-2 mt-1">
                          {group.species.export_certifications.map(
                            (cert) => (
                              <Badge
                                key={cert}
                                variant="success"
                              >
                                {cert}
                              </Badge>
                            )
                          )}
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
            );
          })}
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

  // Table shows one row per (supplier, grade) — latest record only.
  // Full date-wise history is available via the eye button's modal.
  const dedupedList = useMemo(
    () => dedupeLatestBySupplierGrade(enrichedList),
    [enrichedList]
  );

  const filteredData = useFilter({
    data: dedupedList,
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
                  title={`View ${item.grade_code} history`}
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
          gradeCode={selectedSupplier.grade_code}
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
        />
      )}
    </Layout>
  );
};

export default Supplier;