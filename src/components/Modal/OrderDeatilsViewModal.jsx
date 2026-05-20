import { useState } from "react";
import {
  FiX, FiPackage, FiUser, FiMapPin, FiCalendar,
  FiTrendingUp, FiClock, FiTag, FiHash, FiAlertCircle,
  FiCheckCircle, FiAnchor, FiFileText, FiStar,
} from "react-icons/fi";


import React from 'react'
import Modal from "../Modal";
import Badge from "../Badge";

const OrderDeatilsViewModal = ({isOpen, onClose, order}) => {

    // console.log(isOpen, onClose, order)
  return (
    <Modal isOpen={isOpen}
        onClose={onClose}
        title="Order Details"
        showSaveButton={false}
        cancelButtonText="Close"
        width="max-w-3xl"
        >
        <OrderDetailContent order={order} />

    </Modal>
  )
}

export default OrderDeatilsViewModal

/* ── Helpers ──────────────────────────────────────────────── */
function fmtCurrency(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d) {
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TIER_CONFIG = {
  TIER_1: { label: "Tier 1", color: "text-success" },
  TIER_2: { label: "Tier 2", color: "text-warning)" },
  TIER_3: { label: "Tier 3", color: "text-info)" },
};
const PRIORITY_CONFIG = {
  STANDARD: { label: "Standard", color: "text-text-light)" },
  HIGH:     { label: "High",     color: "text-warning)" },
  CRITICAL: { label: "Critical", color: "text-error)" },
};

/* ── Small atoms ──────────────────────────────────────────── */
function Divider() {
  return <div className="my-4 h-px" style={{ background: "var(--color-border)" }} />;
}

function Label({ children }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "text-text-light)", opacity: 0.6 }}>
      {children}
    </span>
  );
}

function Value({ children, mono = false, style = {} }) {
  return (
    <span className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}
      style={{ color: "text-text)", ...style }}>
      {children}
    </span>
  );
}

function Row({ label, value, mono = false, valueStyle = {} }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5 gap-4">
      <Label>{label}</Label>
      <Value mono={mono} style={valueStyle}>{value}</Value>
    </div>
  );
}

function StatCard({ label, value, sub, color = "var(--color-text)" }) {
  return (
    <div className="flex-1 rounded-xl p-3 border"
      style={{ background: "var(--color-input-bg)", borderColor: "var(--color-border)" }}>
      <Label>{label}</Label>
      <div className="mt-1.5 text-lg font-extrabold leading-none" style={{ color }}>{value}</div>
      {sub && <div className="mt-1 text-xs" style={{ color: "var(--color-text-light)" }}>{sub}</div>}
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────── */
function FulfillmentBar({ pct }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <Label>Fulfillment</Label>
        <span className="text-sm font-bold" style={{ color: pct === 0 ? "var(--color-error)" : pct < 50 ? "var(--color-warning)" : "var(--color-success)" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 0 ? "var(--color-error)" : pct < 50 ? "var(--color-warning)" : "var(--color-success)",
            minWidth: pct > 0 ? 8 : 0,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: "var(--color-text-light)" }}>0 MT</span>
        {/* <span className="text-xs" style={{ color: "var(--color-text-light)" }}>{order.quantity_mt} MT</span> */}
      </div>
    </div>
  );
}

/* ── Section wrapper ──────────────────────────────────────── */
function Section({ icon: Icon, title, iconColor = "var(--color-primary)", children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color: iconColor }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-light)" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── Main content ─────────────────────────────────────────── */
function OrderDetailContent({ order }) {
  const tier     = TIER_CONFIG[order.customer_tier]     || TIER_CONFIG.TIER_3;
//   const priority = PRIORITY_CONFIG[order.priority_override] || PRIORITY_CONFIG.STANDARD;
  const isUrgent = order.days_until_delivery <= 2;
  const variantMap = new Map([
  ["critical", "error"],
  ["urgent", "warning"],
  ["normal", "info"],
]);

function getBadgeVariant(status) {
  return variantMap.get(status.toLowerCase());
}


  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero: ref + product ── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        {/* top accent strip */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, var(--color-primary), var(--color-primary-light))` }} />

        <div className="p-4" style={{ background: "var(--color-background-alt)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold tracking-tight" style={{ color: "var(--color-text)" }}>
                {order.erp_order_reference}
              </div>
              <div className="flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-light)" }}>
                <FiHash size={11} />
                <span className="text-xs font-mono">{order.product_code}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-col items-end gap-1.5">
              {/* Active */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: order.is_active ? "var(--color-success)18" : "var(--color-error)18",
                  color: order.is_active ? "var(--color-success)" : "var(--color-error)",
                }}>
                {order.is_active ? <FiCheckCircle size={11} /> : <FiAlertCircle size={11} />}
                {order.is_active ? "Active" : "Inactive"}
              </span>
              {/* Priority */}
              {/* <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                style={{ color: priority.color, borderColor: priority.color + "40", background: priority.color + "12" }}>
                {priority.label}
              </span> */}
              <Badge variant={getBadgeVariant(order.priority_override) || "primary"}>{order.priority_override}</Badge>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{order.product_name}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                style={{ background: "var(--color-accent-light)", color: "var(--color-primary)" }}>
                Grade {order.grade_code}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-light)" }}>
                Qty: <strong style={{ color: "var(--color-text)" }}>{order?.quantity_mt} MT</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fulfillment stats ── */}
      <Section icon={FiTrendingUp} title="Fulfillment">
        <div className="flex gap-3 mb-4">
          <StatCard label="Fulfilled"  value={`${order.fulfilled_qty_mt} MT`}
            color={order.fulfilled_qty_mt > 0 ? "var(--color-success)" : "var(--color-text-light)"} />
          <StatCard label="Remaining"  value={`${order.remaining_qty_mt} MT`}
            color={order.remaining_qty_mt > 0 ? "var(--color-error)" : "var(--color-success)"} />
          <StatCard label="Margin / MT" value={fmtCurrency(order.margin_per_mt)}
            color="var(--color-primary)" />
        </div>
        <FulfillmentBar pct={order.fulfillment_pct} />
      </Section>

      <Divider />

      {/* ── Customer + Destination ── */}
      <Section icon={FiUser} title="Customer & Destination" iconColor="var(--color-secondary)">
        <div className="rounded-xl border p-4 grid grid-cols-2 gap-x-8 gap-y-0"
          style={{ background: "var(--color-background-alt)", borderColor: "var(--color-border)" }}>
          <div>
            <Row label="Customer" value={order.customer_name} />
            <Row label="Tier" value={
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: tier.color + "18", color: tier.color }}>
                {tier.label}
              </span>
            } />
            <Row label="Selling Price" value={`${fmtCurrency(parseFloat(order.selling_price_per_mt))} / MT`} />
          </div>
          <div>
            <Row label="Country" value={order.destination_country} />
            <Row label="Port" value={order.destination_port} />
            <Row label="Cold Chain Buffer" value={`${order.cold_chain_buffer_days}d`} />
          </div>
        </div>
      </Section>

      <Divider />

      {/* ── Timeline ── */}
      <Section icon={FiCalendar} title="Delivery Timeline" iconColor="var(--color-accent)">
        <div className="flex gap-3">
          <StatCard
            label="Delivery Date"
            value={fmtDate(order.delivery_date)}
            sub={isUrgent ? `⚡ ${order.days_until_delivery}d away` : `${order.days_until_delivery} days away`}
            color={isUrgent ? "var(--color-error)" : "var(--color-text)"}
          />
          <StatCard
            label="Est. Completion"
            value={fmtDate(order.estimated_completion_date)}
            sub="based on current progress"
            color="var(--color-secondary)"
          />
        </div>
      </Section>

      <Divider />

      {/* ── System info ── */}
      <Section icon={FiFileText} title="System Info" iconColor="var(--color-text-light)">
        <div className="rounded-xl border p-4" style={{ background: "var(--color-background-alt)", borderColor: "var(--color-border)" }}>
          <Row label="Order ID"    value={order.id.slice(0, 8) + "…"} mono />
          <Row label="ERP Ref"     value={order.erp_order_reference} mono />
          {order.erp_project_id && <Row label="Project ID" value={order.erp_project_id} mono />}
          <Row label="Created"     value={fmtDateTime(order.created_at)} />
          <Row label="Last Updated" value={fmtDateTime(order.updated_at)} />
        </div>
      </Section>

      {/* ── Notes (only if present) ── */}
      {order.notes?.trim() && (
        <>
          <Divider />
          <Section icon={FiTag} title="Notes">
            <p className="text-sm rounded-xl border p-3"
              style={{
                color: "var(--color-text-light)", background: "var(--color-background-alt)",
                borderColor: "var(--color-border)", lineHeight: 1.6,
              }}>
              {order.notes}
            </p>
          </Section>
        </>
      )}
    </div>
  );
}

/* ── App demo ─────────────────────────────────────────────── */
// export default function App() {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="min-h-screen flex items-center justify-center"
//       style={{ background: "var(--color-background)" }}>
//       <button
//         onClick={() => setOpen(true)}
//         className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
//         style={{ background: "var(--color-primary)" }}>
//         Open Order Detail
//       </button>

//       <Modal
//         isOpen={open}
//         onClose={() => setOpen(false)}
//         title="Order Details"
//         showSaveButton={false}
//         cancelButtonText="Close"
//       >
//         <OrderDetailContent order={order} />
//       </Modal>
//     </div>
//   );
// }