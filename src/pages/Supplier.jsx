import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import InputField from "../components/InputField";
import DataTable, { Td } from "../components/Datatable";
import PaginationComponent from "../components/Pagination";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { FaEye } from "react-icons/fa";

import { usePagination } from "../hooks/usePagination";
import { useFilter } from "../hooks/useFilter";
import { useSupplierProfile } from "../hooks/useProductQueries";

const columns = [
  "GRADE CODE", "SUPPLIER ID", "SUPPLIER NAME", "EXPECTED %", "SAMPLE SIZE (MT)", "LAST UPDATED", "ACTION",
];

const Supplier = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // ✅ data ( customers API)
  const { data: supplierList = [], isLoading } = useSupplierProfile();

  const filteredData = useFilter({
    data: supplierList,
    fields: ["grade_code", "supplier_id", "supplier_name"],
    search,
  });

  // ✅ pagination
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
        {/* SEARCH */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <InputField
              value={search}
              placeholder="Search supplier..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <DataTable
          columns={columns}
          data={paginatedData}
          highlightFirstRow={false}
          loading={isLoading}
          renderRow={(item) => (
            <>
              <Td>{item.grade_code}</Td>
              <Td>{item.supplier_id}</Td>
              <Td>{item.supplier_name || "--"}</Td>
              <Td>
                {(Number(item.expected_percentage) * 100).toFixed(2)}%
              </Td>
              <Td>{item.sample_size_mt}</Td>
              <Td>
                {item.last_updated
                  ? new Date(item.last_updated).toLocaleDateString("en-GB")
                  : "--"}
              </Td>
              <Td>
                <Button
                  iconOnly
                  title="View"
                  onClick={() => {
                    setSelectedSupplier(item);
                    setIsModalOpen(true);
                  }}
                >
                  <FaEye />
                </Button>
              </Td>
            </>
          )}
        />

        {/* PAGINATION */}
        <PaginationComponent
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </Card>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        title="Supplier Details"
        width="max-w-lg"
        showSaveButton={false}
        cancelButtonText="Close"
      >
        {selectedSupplier && (
          <div className="space-y-3">
            <div>
              <strong>Grade Code:</strong> {selectedSupplier.grade_code}
            </div>

            <div>
              <strong>Supplier ID:</strong> {selectedSupplier.supplier_id}
            </div>

            <div>
              <strong>Supplier Name:</strong>{" "}
              {selectedSupplier.supplier_name || "--"}
            </div>

            <div>
              <strong>Expected Percentage:</strong>{" "}
              {(Number(selectedSupplier.expected_percentage) * 100).toFixed(2)}%
            </div>

            <div>
              <strong>Sample Size:</strong>{" "}
              {selectedSupplier.sample_size_mt} MT
            </div>

            <div>
              <strong>Grade Config:</strong>{" "}
              {selectedSupplier.grade_config}
            </div>

            <div>
              <strong>Last Updated:</strong>{" "}
              {selectedSupplier.last_updated
                ? new Date(selectedSupplier.last_updated).toLocaleString("en-GB")
                : "--"}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Supplier;