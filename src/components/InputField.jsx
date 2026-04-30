import React from 'react'

const InputField = ({ label,labelIcon , name, type = "text", value, onChange, unit, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {labelIcon && labelIcon}
    <label className="text-1 font-medium text-textLight">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={type === "number" ? "any" : undefined}
        className="flex-1 rounded-3 border border-border bg-background px-3 py-2 text-2 font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
      />
      {unit && <span className="text-1 text-textLight shrink-0">{unit}</span>}
    </div>
  </div>
);

export default InputField
