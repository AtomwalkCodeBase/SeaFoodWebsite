import { useState } from "react";

export const useFormHandler = (initialState) => {
  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,[name]:type === "checkbox"  ? checked  : value
    }));
  };

  const resetForm = () => setForm(initialState);

  return {
    form,
    setForm,
    handleChange,
    resetForm,
  };
};