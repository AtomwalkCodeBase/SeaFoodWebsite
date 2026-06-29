// import dayjs from "dayjs";
import axios from "axios";

export const pushToTally = async (po) => {
    if (!po) {
        console.error("pushToTally: missing purchase order data");
        return;
    }

    const firstItem = po.po_items?.[0];
    if (!firstItem) {
        console.error("pushToTally: purchase order has no items", po);
        return;
    }

    const payload = {
        // entry_id: `GRN-${String(po.id ?? "").padStart(5, "0")}`,
        entry_id: po.po_ref_number,
        voucher_type: "Purchase",
        // voucher_number: `PUR-${String(po.id ?? "").padStart(5, "0")}`,
        voucher_number: po.po_ref_number,
        date: "20260301",
        // party_ledger: po.supplier_name || "",
        party_ledger: "ANS Traders",
        narration: `Purchase against ${po.po_ref_number || ""}`,
        ledger_entries: [
            {
                ledger: `${firstItem.po_item?.name || "Item"} Purchase`,
                amount: Number(po.total || 0),
                type: "Dr"
            },
            {
                // ledger: po.supplier_name || "",
                ledger: "ANS Traders" ,
                amount: Number(po.total || 0),
                type: "Cr"
            }
        ]
    };

    console.log("pushToTally payload:", payload);

    try {
        const response = await axios.post(
            "http://127.0.0.1:8765/push",
            payload,
             {
        headers: {
            Authorization: "Bearer d4fd5cb6bc875d759f893aa00194964c98fe0521422c49c677e388fb7763a59f"
        }
    }
        );
        console.log("pushToTally response:", response.data);
        return response;
    } catch (error) {
        console.error("pushToTally failed:", error);
        throw error;
    }
};