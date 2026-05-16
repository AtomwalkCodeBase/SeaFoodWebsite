import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  onSave,
  title = "Modal Title",
  width = "max-w-md",
  maxHeight = "max-h-[80vh]",
  children,
  showSaveButton = true,
  saveButtonText = "Save Changes",
  cancelButtonText = "Cancel",
  saveDisabled = false,
  setIsConfirmOpen,   // For opening confirm popup
}) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (saveDisabled) return;
    if (setIsConfirmOpen) {
      setIsConfirmOpen(true);
    } else if (onSave) {
      onSave();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className={`bg-card w-full ${width} rounded-2xl shadow-2xl border border-border p-4 flex flex-col max-h-[95vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-text">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-textLight hover:text-error text-2xl font-bold leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto ${maxHeight} px-1`}>
          <div className="space-y-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        {(showSaveButton || cancelButtonText) && (
          <div className="mt-4 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-text font-semibold hover:bg-backgroundAlt transition-colors text-sm"
            >
              {cancelButtonText}
            </button>
            {showSaveButton && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
                className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-colors ${
                  saveDisabled
                    ? "cursor-not-allowed bg-border text-text-light opacity-70 shadow-none"
                    : "bg-primary text-white hover:bg-secondary shadow-primary/30"
                }`}
              >
                {saveButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default Modal;