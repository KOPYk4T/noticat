interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-light text-neutral-900">{title}</h3>
          <p className="text-sm font-light text-neutral-600 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 p-6 pt-0 border-t border-neutral-200">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-light text-neutral-600 
                     hover:text-neutral-900 hover:bg-neutral-50 rounded-xl
                     transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-light text-white bg-neutral-900
                     hover:bg-neutral-800 rounded-xl
                     transition-all duration-200
                     hover:scale-[1.02] active:scale-[0.98]"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

