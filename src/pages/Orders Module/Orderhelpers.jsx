// pages/orders/orderHelpers.js
// Pure helpers/constants for the Orders screen. No React in here.

/* ----------------------------- Badges / status ---------------------------- */

const variantMap = new Map([
    ["critical", "error"],
    ["urgent", "warning"],
    ["normal", "info"],
]);

export function getBadgeVariant(status) {
    return variantMap.get(status.toLowerCase());
}

export const orderStatus = (order_status) => {
    if (!order_status) return { label: "Not assigned", variant: "error" };

    const statusMap = {
        PARTIAL: { label: "Partial", variant: "info" },
        COMPLETED: { label: "Completed", variant: "success" },
        NOT_STARTED: { label: "Not Started", variant: "error" },
    };

    return statusMap[order_status] || { label: "Unknown", variant: "warning" };
};

/* ------------------------------ Unit helpers ------------------------------ */

// const UNIT_TO_KG = {
//     MT: 1000,
//     TONNE: 1000,
//     TONNES: 1000,
//     KG: 1,
//     KGS: 1,
//     "5KG": 5,
//     "2KG": 2,
// };

// export const getUnitToKgFactor = (unit) => {
//     const normalizedUnit = String(unit || "MT")
//         .trim()
//         .toUpperCase();

//     return UNIT_TO_KG[normalizedUnit] ?? 1000;
// };

// export const toMt = (qty, unit) => {
//     const factor = getUnitToKgFactor(unit);

//     return Number(
//         ((Number(qty || 0) * factor) / 1000).toFixed(6)
//     );
// };

// export const fromMt = (mt, unit) => {
//     const factor = getUnitToKgFactor(unit);

//     return mt === "" || mt == null
//         ? ""
//         : Number(((Number(mt) * 1000) / factor).toFixed(6));
// };
// export const convertQuantityToMT = (quantity, unit) => {
//     const qty = Number(quantity);

//     if (!Number.isFinite(qty) || qty < 0) return '';

//     switch (unit?.toUpperCase()?.trim()) {
//         case 'MT':
//         case 'METRIC TONNE':
//         case 'METRIC TONNES':
//             return qty;

//         case 'KG':
//         case 'KGS':
//         case 'KILOGRAM':
//         case 'KILOGRAMS':
//             return qty / 1000;

//         case '2KG':
//         case '2 KG':
//             return (qty * 2) / 1000;

//         case '5KG':
//         case '5 KG':
//             return (qty * 5) / 1000;

//         default:
//             return '';
//     }
// };
/* ------------------------------ Table config ------------------------------ */

export const orderColumns = ["CUSTOMER(ORDER Id)", "PRODUCT", "GRADE", "QTY-MT", "MARGIN/MT", "SHIPMENT DATE", "STATUS", "DAYS LEFT", "PRIORITY", "ACTIONS"];

export const MIN_DAYS_FOR_ORDER_EDIT = -100;

export const canShowEditForOrder = (order) =>
    Number(order?.days_until_delivery) >= MIN_DAYS_FOR_ORDER_EDIT;

export const getSpeciesGradeLabel = (speciesList, gradeList, speciesConfigId) => {
    const foundGrade = gradeList.find((grade) => grade.id === speciesConfigId);
    if (!foundGrade) return "--";

    const foundSpecies = speciesList.find((species) => species.id === foundGrade.species_config);
    if (!foundSpecies) return "--";

    return `${foundSpecies.scientific_name} (${foundGrade.grade_code})`;
};

/* ------------------------------- Form state ------------------------------- */

export const EMPTY_FORM = {
    erp_order_reference: "",
    erp_project_id: "",
    product: "",
    grade_config: "",
    quantity_mt: "",
    customer_id: "",
    customer_name: "",
    customer_tier: "TIER_3",
    destination_country: "",
    destination_port: "",
    selling_price_per_mt: "",
    delivery_date: "",
    cold_chain_buffer_days: "",
    priority_override: "",
    notes: "",
    is_recurring: false,
    recurring_schedule_name: "",
    recurring_frequency: "MONTHLY",
    // recurring_amount_type: "F",
    recurring_end_date: "",
    recurring_next_run_date: "",
    recurring_schedule_id: null,
};

export function normalizeDeliveryDateForInput(value) {
    if (value == null || value === "") return "";
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
}

/** Map API order row into modal form fields */
export function orderToForm(order) {
    return {
        erp_order_reference: order.erp_order_reference ?? "",
        erp_project_id: order.erp_project_id ?? "",
        product: Number(order.product?.id ?? order.product) || 0,
        grade_config: Number(order.grade_config) || 0,
        quantity_mt: order.quantity_mt ?? "",
        customer_name: order.customer_name ?? "",
        customer_tier: order.customer_tier ?? "",
        destination_country: order.destination_country ?? "",
        destination_port: order.destination_port ?? "",
        selling_price_per_mt: order.selling_price_per_mt ?? "",
        delivery_date: normalizeDeliveryDateForInput(order.delivery_date),
        cold_chain_buffer_days: order.cold_chain_buffer_days ?? "",
        priority_override: order.priority_override ?? "",
        notes: order.notes ?? "",
        is_recurring: Boolean(order.is_recurring),
        recurring_schedule_name: order.recurring_schedule_name ?? "",
        recurring_frequency: order.recurring_frequency ?? "MONTHLY",
        // recurring_amount_type: order.recurring_amount_type ?? "F",
        recurring_end_date: normalizeDeliveryDateForInput(order.recurring_end_date),
        recurring_next_run_date: normalizeDeliveryDateForInput(order.recurring_next_run_date),
        // Not a real editable field — carried along so we know which schedule to
        // UPDATE/CLOSE/CANCEL against. Excluded from ORDER_UPDATE_PATCH_KEYS below.
        recurring_schedule_id: order.recurring_schedule_id ?? null,
    };
}

export function isOrderFormValid(form) {
    const refOk = String(form.erp_order_reference ?? "").trim() !== "";
    const customerOk = String(form.customer_name ?? "").trim() !== "";
    const tierOk = String(form.customer_tier ?? "").trim() !== "";
    const productOk = Number(form.product) > 0;
    const gradeOk = Number(form.grade_config) > 0;
    const qtyRaw = form.quantity_mt;
    const qtyOk = qtyRaw !== "" && qtyRaw != null && !Number.isNaN(Number(qtyRaw)) && Number(qtyRaw) > 0;
    const countryOk = String(form.destination_country ?? "").trim() !== "";
    const priceRaw = form.selling_price_per_mt;
    const priceOk = priceRaw !== "" && priceRaw != null && !Number.isNaN(Number(priceRaw)) && Number(priceRaw) >= 0;
    const dateOk = String(form.delivery_date ?? "").trim() !== "";
    const recurringOk = !form.is_recurring || (
        String(form.recurring_frequency ?? "").trim() !== "" &&
        String(form.recurring_amount_type ?? "").trim() !== "" &&
        String(form.recurring_next_run_date ?? "").trim() !== "" &&
        (!form.delivery_date || form.recurring_next_run_date < form.delivery_date) // string compare works, both are YYYY-MM-DD
    );
    return refOk && customerOk && tierOk && productOk && gradeOk && qtyOk && countryOk && priceOk && dateOk && recurringOk;
}

export function resolveOrderRecordId(order) {
    return order?.id ?? order?.pk ?? order?.order_id;
}

/* ------------------------------- PATCH build ------------------------------ */

/** Fields allowed on PATCH; erp_order_reference / customer_name excluded (read-only in edit UI). */
const ORDER_UPDATE_PATCH_KEYS = [
    "erp_project_id",
    "product",
    "grade_config",
    "quantity_mt",
    "customer_tier",
    "destination_country",
    "destination_port",
    "selling_price_per_mt",
    "delivery_date",
    "cold_chain_buffer_days",
    "priority_override",
    "notes",
    "is_recurring",
];

function normalizeForOrderPatchCompare(key, value) {
    if (key === "delivery_date") return normalizeDeliveryDateForInput(value);
    if (key === "is_recurring") return Boolean(value);
    if (
        key === "product" ||
        key === "grade_config" ||
        key === "quantity_mt" ||
        key === "selling_price_per_mt" ||
        key === "cold_chain_buffer_days"
    ) {
        const n = Number(value === "" || value == null ? 0 : value);
        return Number.isNaN(n) ? 0 : n;
    }
    return String(value ?? "").trim();
}

function serializeOrderPatchField(key, form) {
    switch (key) {
        case "erp_project_id":
            return form.erp_project_id || undefined;
        case "product":
        case "grade_config":
            return Number(form[key]);
        case "quantity_mt":
        case "selling_price_per_mt":
        case "cold_chain_buffer_days":
            return Number(form[key] || 0);
        case "delivery_date": {
            const d = normalizeDeliveryDateForInput(form.delivery_date);
            return d || undefined;
        }
        case "is_recurring":
            return Boolean(form.is_recurring);
        default:
            return form[key] ?? "";
    }
}

/** Partial body for PATCH: only keys that differ from the snapshot taken when edit opened. */
export function buildOrderUpdatePatch(form, baseline) {
    if (!baseline) return {};
    const patch = {};
    for (const key of ORDER_UPDATE_PATCH_KEYS) {
        if (
            normalizeForOrderPatchCompare(key, form[key]) !==
            normalizeForOrderPatchCompare(key, baseline[key])
        ) {
            patch[key] = serializeOrderPatchField(key, form);
        }
    }
    return patch;
}