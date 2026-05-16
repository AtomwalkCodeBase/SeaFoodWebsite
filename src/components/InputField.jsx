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
  options = [],
  placeholder = "",
  required = false,
  disabled = false,
}) => {
  const guardedChange = (e) => {
    if (disabled) {
      e.preventDefault?.();
      return;
    }
    onChange?.(e);
  };

  return (
  <div className={`flex flex-col gap-1 ${className}`}>
    {labelIcon && labelIcon}

    <label className="text-sm font-medium text-text-light">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>} {/* 👈 star */}
    </label>

    <div className="flex items-center gap-2">
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={guardedChange}
          required={required && !disabled}
          disabled={disabled}
          aria-disabled={disabled}
          className={`flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <option value="">
            {placeholder || `Select ${label}`}
          </option>
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
          onChange={guardedChange}
          required={required && !disabled}
          disabled={disabled}
          aria-disabled={disabled}
          className={`w-4 h-4 rounded text-primary border-border focus:ring-primary ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={guardedChange}
          placeholder={placeholder}
          required={required && !disabled}
          disabled={disabled}
          aria-disabled={disabled}
          autoComplete={disabled ? "off" : undefined}
          step={type === "number" ? "any" : undefined}
          className={`flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        />
      )}

      {unit && type !== "checkbox" && (
        <span className="text-xs text-textLight shrink-0">{unit}</span>
      )}
    </div>
  </div>
  );
};

export default InputField