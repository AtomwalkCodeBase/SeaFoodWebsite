import React from "react";

export const EmptyState = ({ message, className = "" }) => {
  return (
    <div className={`text-center p-4 text-text-light bg-bg rounded-md ${className}`}>
      {message}
    </div>
  );
};

export const SectionHeader = ({ step, icon, title, sub }) => (
    <div className="flex items-start p-2  border-b border-border">
      {step && (
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text text-sm font-bold`}>
          {step}
        </span>
      )}
        <div className="text-base font-bold flex items-center gap-2.5 text-text">
            <span>{icon}</span> {title}
        </div>
        {sub && <div className="text-xs text-text-light mt-1">{sub}</div>}
    </div>
);

const BADGE_VARIANTS = {
  species: 'bg-primaryLight text-primary',
  grn: 'bg-accentLight text-primary border border-border',
  cleaning: 'bg-warning/20 text-warning',
  cooking: 'bg-error/20 text-error',
  critical: 'bg-error/15 text-error',
  urgent: 'bg-warning/15 text-warning',
  standard: 'bg-backgroundAlt text-text-light',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  iof: 'bg-info/10 text-info',
  raw: 'bg-warning/10 text-warning',
  whl: 'bg-primaryLight text-primary',
  pd: 'bg-secondaryLight/20 text-secondary',
  default: 'bg-backgroundAlt text-text-light',
};
 
export function Badge({ label, variant = 'default', className = '' }) {
  const cls = BADGE_VARIANTS[variant?.toLowerCase()] ?? BADGE_VARIANTS.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cls} ${className}`}>
      {label}
    </span>
  );
}
 
// ── StatusDot ────────────────────────────────────────────────────────────────
const DOT_COLORS = {
  active: 'bg-success',
  pending: 'bg-warning',
  error: 'bg-error',
  idle: 'bg-text-light',
};
 
export function StatusDot({ status = 'idle', pulse = false }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${DOT_COLORS[status]} ${pulse ? 'animate-pulse' : ''}`} />
  );
}
 
// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader2({ step, title, subtitle, phaseColor = 'pre' }) {
  const colors =
    phaseColor === 'pre'
      ? 'text-phasePreText bg-phasePre'
      : 'text-phasePostText bg-phasePost';
  return (
    <div className="flex items-start gap-3 mb-4">
      {step && (
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text text-sm font-bold ${colors}`}>
          {step}
        </span>
      )}
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {subtitle && <p className="text-xs text-text-light mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
 
// ── Panel / Card ─────────────────────────────────────────────────────────────
export function Panel({ children, className = '', accent }) {
  const border = accent === 'pre'
    ? 'border-l-4 border-l-primary'
    : accent === 'post'
    ? 'border-l-4 border-l-secondary'
    : '';
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm ${border} p-4 ${className}`}>
      {children}
    </div>
  );
}
 
// ── ActionButton ──────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: 'bg-btn hover:bg-btnHover text-white',
  secondary: 'bg-transparent border border-primary text-primary hover:bg-phasePre',
  ghost: 'bg-backgroundAlt hover:bg-border text-text',
  danger: 'bg-error/10 hover:bg-error/20 text-error border border-error/30',
  success: 'bg-success/10 hover:bg-success/20 text-success border border-success/30',
};
 
export function ActionButton({
  children,
  variant = 'primary',
  size = 'sm',
  onClick,
  disabled = false,
  loading = false,
  className = '',
}) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${BTN_VARIANTS[variant]} ${sz} ${className}`}
    >
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
 
// ── InfoRow ───────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, valueClass = '', className='' }) {
  return (
    <div className={`flex items-center text-xs gap-2 ${className}`}>
      <span className="text-text-light">{label}: </span>
      <span className={`font-medium text-text ${valueClass}`}>{value}</span>
    </div>
  );
}
 
// ── EmptyState ─────────────────────────────────────────────────────────────────
// export function EmptyState({ icon: Icon, message }) {
//   return (
//     <div className="flex flex-col items-center gap-2 py-8 text-text-light">
//       {Icon && <Icon size={28} className="opacity-40" />}
//       <p className="text-sm">{message}</p>
//     </div>
//   );
// }
 
// ── LoadingSpinner ─────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20 }) {
  return (
    <div className="flex justify-center py-6">
      <span
        className="rounded-full border-2 border-border border-t-primary animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
 
// ── Metric Card ────────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, sub, color = 'text-primary' }) {
  return (
    <div className="bg-backgroundAlt rounded-lg p-3 flex flex-col gap-1">
      <span className="text-xs text-text-light uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-xs text-text-light">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-text-light">{sub}</span>}
    </div>
  );
}
 
// ── Step Progress ──────────────────────────────────────────────────────────────
export function StepFlow({ steps, current }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.label}>
            <div className={`flex flex-col items-center gap-0.5 min-w-[56px] ${done ? 'opacity-100' : active ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all
                ${done ? 'bg-success/20 text-success' : active ? 'bg-primary text-white ring-2 ring-primary/30' : 'bg-backgroundAlt text-text-light'}`}>
                {done ? '✓' : <step.icon size={14} />}
              </div>
              <span className="text-[10px] text-text-light text-center leading-tight">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full min-w-[12px] ${i < current ? 'bg-success' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}