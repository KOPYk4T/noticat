import { useState } from "react";
import type { Transaction } from "../../shared/types";
import { categories } from "../../shared/constants/categories";
import { formatMoney } from "../../shared/utils";
import { ModalFooter } from "../../components/ModalFooter";
import { Button } from "../../components/Button";

interface MassEditModalProps {
  isOpen: boolean;
  selectedTransactions: Transaction[];
  onClose: () => void;
  onApply: (category?: string, isRecurring?: boolean, type?: "cargo" | "abono") => void;
}

export const MassEditModal = ({
  isOpen,
  selectedTransactions,
  onClose,
  onApply,
}: MassEditModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<"cargo" | "abono" | undefined>(undefined);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(
      selectedCategory || undefined,
      isRecurring !== undefined ? isRecurring : undefined,
      selectedType
    );
    setSelectedCategory("");
    setIsRecurring(undefined);
    setSelectedType(undefined);
  };

  const normalizeDescription = (desc: string) => {
    return desc.toUpperCase().trim();
  };

  const getSimilarCount = (description: string) => {
    const normalized = normalizeDescription(description);
    return selectedTransactions.filter(
      (t) => normalizeDescription(t.description) === normalized
    ).length;
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-xl font-light text-neutral-900">
            Editar {selectedTransactions.length} transacciones
          </h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Edit Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-light text-neutral-600 mb-2">
                Cambiar categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 text-sm font-light text-neutral-900 
                         bg-neutral-50 border border-neutral-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              >
                <option value="">Mantener categoría actual</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-light text-neutral-600 mb-2">
                Cambiar tipo de transacción
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant={selectedType === undefined ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedType(undefined)}
                  className={selectedType === undefined ? "" : "bg-neutral-50"}
                >
                  Mantener
                </Button>
                <Button
                  variant={selectedType === "cargo" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedType("cargo")}
                  className={selectedType === "cargo" ? "" : "bg-neutral-50"}
                >
                  Gasto
                </Button>
                <Button
                  variant={selectedType === "abono" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedType("abono")}
                  className={selectedType === "abono" ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-neutral-50"}
                >
                  Ingreso
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-neutral-600 mb-2">
                Marcar como recurrente
              </label>
              <div className="flex items-center gap-4">
                <Button
                  variant={isRecurring === undefined ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setIsRecurring(undefined)}
                  className={isRecurring === undefined ? "" : "bg-neutral-50"}
                >
                  Mantener
                </Button>
                <Button
                  variant={isRecurring === true ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setIsRecurring(true)}
                  className={isRecurring === true ? "" : "bg-neutral-50"}
                >
                  Sí
                </Button>
                <Button
                  variant={isRecurring === false ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setIsRecurring(false)}
                  className={isRecurring === false ? "" : "bg-neutral-50"}
                >
                  No
                </Button>
              </div>
            </div>
          </div>

          {/* Preview List */}
          <div className="space-y-2">
            <p className="text-sm font-light text-neutral-600">
              Transacciones seleccionadas:
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {selectedTransactions.map((transaction, index) => {
                const similarCount = getSimilarCount(transaction.description);
                const category =
                  transaction.selectedCategory ||
                  transaction.suggestedCategory;

                return (
                  <div
                    key={`${transaction.id}-${index}`}
                    className="p-3 bg-neutral-50 rounded-xl text-sm"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-light text-neutral-900 flex-1">
                        {transaction.description}
                      </p>
                      <span
                        className={`text-xs font-light tabular-nums ml-2 ${
                          transaction.type === "cargo"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "cargo" ? "-" : "+"}
                        {formatMoney(transaction.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>{transaction.date}</span>
                      <span>·</span>
                      <span>{category}</span>
                      {similarCount > 1 && (
                        <>
                          <span>·</span>
                          <span className="text-blue-600">
                            {similarCount} similares
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ModalFooter
          onCancel={onClose}
          onConfirm={handleApply}
          cancelText="Cancelar"
          confirmText="Aplicar cambios"
        />
      </div>
    </div>
  );
};

