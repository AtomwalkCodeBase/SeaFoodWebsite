import React, { ReactNode } from 'react';
//   width?: string; // e.g., "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl"
//   maxHeight?: string; // e.g., "max-h-[80vh]", "max-h-[600px]"

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
  isConfirmOpen,
  setIsConfirmOpen,
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (setIsConfirmOpen) {
      setIsConfirmOpen(true);
    } else if (onSave) {
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-card w-full ${width} rounded-2xl shadow-xl border border-border p-4 font-body flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-text">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-textLight hover:text-error text-2xl font-bold leading-none transition-colors"
          >
            &times;
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
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-secondary transition-colors shadow-md shadow-primary/30 text-sm"
              >
                {saveButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;