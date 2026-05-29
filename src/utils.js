import { toast } from "react-toastify";

export const formatCurrency = (amount, currency = "INR") => {
  if (!amount) return "—";
  const num = parseFloat(amount);
  return num >= 100000
    ? `${(num / 100000).toFixed(2)}L`
    : num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const MONTH_SHORT_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const getCurrentDateTimeDefaults = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  const yyyy = now.getFullYear()
  const mm = pad(now.getMonth() + 1)
  const dd = pad(now.getDate())
  const todayISO = `${yyyy}-${mm}-${dd}`
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const dayLogKey = `${dd}-${MONTH_SHORT_NAMES[now.getMonth()]}-${yyyy}`
  const apiDate = formatToDDMMYYYY(todayISO)

  return { todayISO, dayLogKey, apiDate, currentTime }
}

export const formatToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""

    if (dateValue instanceof Date) {
        const dd = String(dateValue.getDate()).padStart(2, "0")
        const mm = String(dateValue.getMonth() + 1).padStart(2, "0")
        const yyyy = dateValue.getFullYear()
        return `${dd}-${mm}-${yyyy}`
    }

    if (typeof dateValue === "string" && dateValue.includes("-")) {
        const [year, month, day] = dateValue.split("-")
        return `${day}-${month}-${year}`
    }

    return ""
}

export const fmt = (n, d = 2) => Number(n).toFixed(d);

// passing formate:- 2026-05-07T10:23:59.983143+05:30
export const extractDateTime = (isoString) => {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString('en-CA'),     // 2026-05-07
    time: date.toLocaleTimeString('en-US', {    // 10:23
      hour: '2-digit',
      minute: '2-digit',
    //   second: '2-digit',
      hour12: false
    }),
    dateTime: `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`
  };
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const formatField = (field) => {
  return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const handleApiError = ( error, fallbackMessage = "Something went wrong") => {
  const data = error?.response?.data;

  if (data && typeof data === "object") {

    const fieldErrors = [];

    Object.entries(data).forEach(([key, value]) => {

      if (key === "status_code") return;

      if (Array.isArray(value)) {
        fieldErrors.push(
          `${formatField(key)}: ${value.join(", ")}`
        );
      }

      else if (typeof value === "string") {
        fieldErrors.push(
          `${formatField(key)}: ${value}`
        );
      }
    });

    if (fieldErrors.length > 0) {
      fieldErrors.forEach((msg) => toast.error(msg));
      return;
    }
  }

  const message = data?.message || error?.message || fallbackMessage;
  toast.error(message);
};

export const getChangedFields = (original, updated) => {
  const changed = {};

  Object.keys(updated).forEach((key) => {
    const originalValue = String(original[key] ?? "").trim();
    const updatedValue = String(updated[key] ?? "").trim();

    if (originalValue !== updatedValue) {
      changed[key] = updated[key];
    }
  });


  return changed;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const number = Number(num);
  const [integerPart, decimalPart] = number.toString().split('.');
  
  // Indian format: last 3 digits, then groups of 2 digits
  const lastThree = integerPart.slice(-3);
  const remaining = integerPart.slice(0, -3);
  
  const formattedInteger = remaining 
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  
  return decimalPart 
    ? `${formattedInteger}.${decimalPart}` 
    : formattedInteger;
};