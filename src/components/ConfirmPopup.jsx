import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const ConfirmPopup = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "default"   // "danger" or "default"
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/10 backdrop-blur-xs p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-text">{title}</h3>
          <button 
            onClick={onClose}
            className="text-3xl leading-none text-textLight hover:text-error"
          >
            ×
          </button>
        </div>

        <p className="text-textLight text-[15px] leading-relaxed mb-6 text-text">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-border hover:bg-backgroundAlt transition-colors font-medium text-text"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3 py-2 rounded-xl font-semibold text-white transition-colors ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default ConfirmPopup;