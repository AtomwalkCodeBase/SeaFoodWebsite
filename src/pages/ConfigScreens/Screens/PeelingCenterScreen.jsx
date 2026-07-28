import { useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FaPlus } from "react-icons/fa";
import { HiOutlinePencilAlt } from "react-icons/hi";

import Card from "../../../components/Card";
import Button from "../../../components/Button";
import DataTable, { Td } from "../../../components/Datatable";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import { useFormHandler } from "../../../hooks/useFormHandler";
import { getChangedFields } from "../../../utils";

import {
    getPeelingCenters,
} from "../../../services/productServices";

import { theme } from "../../../styles/Theme";
import { AddPeelingCenter, UpdatePeelingCenter, } from "../../../services/productServices";

const PanelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const columns = [
    "NAME",
    "ALIAS",
    "CONTACT",
    "PLACE",
    "STATE",
    "ACTIVE",
    // "MANAGED",
    "ACTION",
];

export default function PeelingCenterScreen() {
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState("add");
    const [editingRow, setEditingRow] = useState(null);

    const {
        data: peelingCenters = [],
        isLoading,
    } = useQuery({
        queryKey: ["peelingCenters"],
        queryFn: getPeelingCenters,
        select: (res) => res?.data,
        onError: () =>
            toast.error("Failed to fetch peeling centers"),
    });

    const rows = useMemo(() => peelingCenters, [peelingCenters]);

    const openAdd = () => {
        setMode("add");
        setEditingRow(null);
        setShowModal(true);
    };

    const openEdit = (row) => {
        setMode("edit");
        setEditingRow(row);
        setShowModal(true);
    };

    return (
        <>
            <PanelContent>

                <Card
                    style={{
                        border: `2px solid ${theme.colors.primaryLight}`,
                    }}
                >
                    <Header>
                        <h3>Peeling Centers</h3>

                        <Button size="sm" onClick={openAdd}>
                            <FaPlus />
                            Add Peeling Center
                        </Button>
                    </Header>

                    <DataTable
                        columns={columns}
                        loading={isLoading}
                        data={rows}
                        renderRow={(row) => (
                            <>
                                <Td>{row.name}</Td>

                                <Td>{row.location_alias}</Td>

                                <Td>{row.contact_details}</Td>

                                <Td>{row.place}</Td>

                                <Td>{row.state_code}</Td>

                                <Td>
                                    {row.is_active ? "Yes" : "No"}
                                </Td>

                                {/* <Td>
                                    {row.is_managed ? "Yes" : "No"}
                                </Td> */}

                                <Td>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEdit(row)}
                                    >
                                        <HiOutlinePencilAlt />
                                        Edit
                                    </Button>
                                </Td>
                            </>
                        )}
                    />
                </Card>

            </PanelContent>

            {showModal && (
                <AddPeelingCenterModal
                    showModal={showModal}
                    setShowModal={setShowModal}
                    mode={mode}
                    initial={editingRow}
                    queryClient={queryClient}
                />
            )}
        </>
    );
}
const EMPTY_FORM = {
    name: "",
    contact_details: "",
    address_line_1: "",
    address_line_2: "",
    place: "",
    state_code: "",
    pin_code: "",
    digi_pin: "",
    geo_location_data: "",
    location_bin_delimiter: "-",
    is_active: true,
    // is_managed: false,
    image: null,
};

const AddPeelingCenterModal = ({
    showModal,
    setShowModal,
    mode,
    initial,
    queryClient,
}) => {

    const initialForm = initial
        ? {
            ...initial,
            image: null,
        }
        : EMPTY_FORM;

    const {
        form,
        handleChange,
        resetForm,
        setForm,
    } = useFormHandler(initialForm);

    const handleFileChange = (e) => {

        const file = e.target.files[0];

        if (file) {
            setForm((prev) => ({
                ...prev,
                image: file
            }));
        }

    };
    const handleCheckbox = (e) => {
        const { name, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async () => {
        try {
            if (mode === "add") {
                const payload = new FormData();

                Object.keys(form).forEach((key) => {
                    if (
                        form[key] !== null &&
                        form[key] !== undefined
                    ) {
                        payload.append(key, form[key]);
                    }
                });

                await AddPeelingCenter(payload);

                toast.success("Peeling Center added successfully");
            }

            if (mode === "edit") {

                const { image, ...currentData } = form;

                const changedFields = getChangedFields(
                    initial,
                    currentData
                );

                // remove image if accidentally included
                delete changedFields.image;

                if (
                    Object.keys(changedFields).length === 0 &&
                    !(image instanceof File)
                ) {
                    toast.info("No changes detected");
                    return;
                }

                const editPayload = new FormData();

                Object.keys(changedFields).forEach((key) => {
                    if (
                        changedFields[key] !== null &&
                        changedFields[key] !== undefined
                    ) {
                        editPayload.append(
                            key,
                            changedFields[key]
                        );
                    }
                });

                // only append image when user selects a new one
                if (image instanceof File) {
                    editPayload.append(
                        "image",
                        image
                    );
                }

                await UpdatePeelingCenter(
                    editPayload,
                    initial.id
                );

                toast.success(
                    "Peeling Center updated successfully"
                );
            }

            await queryClient.invalidateQueries({
                queryKey: ["peelingCenters"],
            });

            setShowModal(false);
            resetForm();

        } catch (err) {
            toast.error(
                mode === "add"
                    ? "Failed to add Peeling Center"
                    : "Failed to save Peeling Center"
            );
        }
    };

    return (
        <Modal
            title={
                mode === "add"
                    ? "Add Peeling Center"
                    : "Edit Peeling Center"
            }
            isOpen={showModal}
            onClose={() => {
                setShowModal(false);
                resetForm();
            }}
            onSave={handleSubmit}
            showSaveButton
            width="max-w-4xl"
            saveButtonText={
                mode === "add"
                    ? "Add"
                    : "Update"
            }
        >

            <div className="grid grid-cols-2 gap-4">

                <InputField
                    label="Location Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
                <InputField
                    label="Contact Details"
                    name="contact_details"
                    value={form.contact_details}
                    onChange={handleChange}
                />

                <InputField
                    label="Place"
                    name="place"
                    value={form.place}
                    onChange={handleChange}
                    required
                />

                <InputField
                    label="Address Line 1"
                    name="address_line_1"
                    value={form.address_line_1}
                    onChange={handleChange}
                />

                <InputField
                    label="Address Line 2"
                    name="address_line_2"
                    value={form.address_line_2}
                    onChange={handleChange}
                />

                <InputField
                    type="select"
                    label="State Code"
                    name="state_code"
                    value={form.state_code}
                    onChange={handleChange}
                    options={[
                        { value: "35", label: "Andaman and Nicobar Islands" }, { value: "37", label: "Andhra Pradesh" }, { value: "12", label: "Arunachal Pradesh" },
                        { value: "18", label: "Assam" }, { value: "10", label: "Bihar" }, { value: "04", label: "Chandigarh" },
                        { value: "22", label: "Chhattisgarh" }, { value: "26", label: "Dadra and Nagar Haveli and Daman and Diu" }, { value: "07", label: "Delhi" },
                        { value: "30", label: "Goa" }, { value: "24", label: "Gujarat" }, { value: "06", label: "Haryana" },
                        { value: "02", label: "Himachal Pradesh" }, { value: "01", label: "Jammu and Kashmir" }, { value: "20", label: "Jharkhand" },
                        { value: "29", label: "Karnataka" }, { value: "32", label: "Kerala" }, { value: "38", label: "Ladakh" },
                        { value: "31", label: "Lakshadweep" }, { value: "23", label: "Madhya Pradesh" }, { value: "27", label: "Maharashtra" },
                        { value: "14", label: "Manipur" }, { value: "17", label: "Meghalaya" }, { value: "15", label: "Mizoram" },
                        { value: "13", label: "Nagaland" }, { value: "21", label: "Odisha" }, { value: "34", label: "Puducherry" },
                        { value: "03", label: "Punjab" }, { value: "08", label: "Rajasthan" }, { value: "11", label: "Sikkim" },
                        { value: "33", label: "Tamil Nadu" }, { value: "36", label: "Telangana" }, { value: "16", label: "Tripura" },
                        { value: "09", label: "Uttar Pradesh" }, { value: "05", label: "Uttarakhand" }, { value: "19", label: "West Bengal" }
                    ]}
                />

                <InputField
                    label="PIN Code"
                    name="pin_code"
                    value={form.pin_code}
                    onChange={handleChange}
                />

                <InputField
                    label="Digi PIN"
                    name="digi_pin"
                    value={form.digi_pin}
                    onChange={handleChange}
                />

                <div className="col-span-2">

                    <InputField
                        label="Geo Location"
                        name="geo_location_data"
                        type="text"
                        value={form.geo_location_data}
                        onChange={handleChange}
                        placeholder="Latitude, Longitude"
                        helperText="Example: 12.9716, 77.5946"
                    />
                </div>

                <InputField
                    label="Bin Delimiter"
                    name="location_bin_delimiter"
                    value={form.location_bin_delimiter}
                    onChange={handleChange}
                />

                <div className="col-span-2">
                    <label className="block mb-2 font-medium">
                        Image
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                    {initial?.image && (
                        <img
                            src={initial.image}
                            alt="Preview"
                            style={{
                                width: 120,
                                marginTop: 10,
                                borderRadius: 8,
                            }}
                        />
                    )}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "2rem",
                        alignItems: "center",
                        marginTop: "1.8rem",
                    }}
                >

                    <label>

                        <input
                            type="checkbox"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleCheckbox}
                        />

                        {" "}Active

                    </label>

                    {/* <label>

                        <input
                            type="checkbox"
                            name="is_managed"
                            checked={form.is_managed}
                            onChange={handleCheckbox}
                        />

                        {" "}Managed

                    </label> */}

                </div>

            </div>

        </Modal>
    );
};