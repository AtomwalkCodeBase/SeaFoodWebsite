import React from 'react'

const InputField = ({ 
  label, 
  labelIcon, 
  name, 
  type = "text", 
  value, 
  onChange, 
  unit, 
  className = "",
  options = [],        // for select dropdown
  placeholder = ""     
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {labelIcon && labelIcon}
    <label className="text-1 font-medium text-textLight">{label}</label>
    <div className="flex items-center gap-2">
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}  // Your handle function works perfectly here
          className="flex-1 rounded-3 border border-border bg-background px-3 py-2 text-2 font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map((option) => (
            <option key={option.id || option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          name={name}
          checked={value}
          onChange={onChange}  // Your handle function handles checked vs value
          className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          step={type === "number" ? "any" : undefined}
          className="flex-1 rounded-3 border border-border bg-background px-3 py-2 text-2 font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
        />
      )}
      {unit && type !== "checkbox" && <span className="text-1 text-textLight shrink-0">{unit}</span>}
    </div>
  </div>
);

export default InputField