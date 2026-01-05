import { useState, useEffect, useRef } from "react";
import type { Transaction } from "../../shared/types";
import { formatMoney } from "../../shared/utils";

interface SearchModalProps {
  transactions: Transaction[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
}

export const SearchModal = ({
  transactions,
  currentIndex,
  isOpen,
  onClose,
  onSelect,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filteredTransactions = transactions.filter((t) =>
    t.description.toUpperCase().includes(searchQuery.toUpperCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset search state when opening modal
  // This is intentional UX behavior - we want a fresh search each time the modal opens
  // Note: setState in useEffect is intentional here to reset search on modal open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedResultIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < filteredTransactions.length - 1 ? prev + 1 : prev
        );
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (e.key === "Enter" && filteredTransactions.length > 0) {
        e.preventDefault();
        const selected = filteredTransactions[selectedResultIndex];
        const index = transactions.findIndex((t) => t.id === selected.id);
        if (index !== -1) {
          onSelect(index);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    filteredTransactions,
    selectedResultIndex,
    transactions,
    onSelect,
    onClose,
  ]);

  useEffect(() => {
    if (resultsRef.current && selectedResultIndex >= 0) {
      const selectedElement = resultsRef.current.children[
        selectedResultIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedResultIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedResultIndex(0);
              }}
              placeholder="Buscar transacción..."
              className="w-full px-4 py-3 text-lg font-light text-neutral-900 
                       bg-neutral-50 border border-neutral-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent
                       placeholder:text-neutral-400 transition-all duration-200"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <kbd className="px-2 py-1 text-xs font-light text-neutral-400 bg-neutral-100 rounded border border-neutral-200">
                Esc
              </kbd>
            </div>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto p-2">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 font-light">
              {searchQuery
                ? "No se encontraron resultados"
                : "Escribe para buscar..."}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTransactions.map((transaction, index) => {
                const actualIndex = transactions.findIndex(
                  (t) => t.id === transaction.id
                );
                const isSelected = index === selectedResultIndex;
                const isCurrent = actualIndex === currentIndex;

                return (
                  <div
                    key={`${transaction.id}-${actualIndex}`}
                    onClick={() => {
                      onSelect(actualIndex);
                      onClose();
                    }}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-50 hover:bg-neutral-100"
                              }
                              ${isCurrent ? "ring-2 ring-neutral-400" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-light ${
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        #{actualIndex + 1} · {transaction.date}
                      </span>
                      <span
                        className={`text-xs font-light px-2 py-0.5 rounded-full ${
                          transaction.type === "cargo"
                            ? isSelected
                              ? "bg-red-500/20 text-red-200"
                              : "bg-red-50 text-red-600"
                            : isSelected
                            ? "bg-green-500/20 text-green-200"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {transaction.type === "cargo" ? "Gasto" : "Ingreso"}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-normal mb-1 ${
                        isSelected ? "text-white" : "text-neutral-900"
                      }`}
                    >
                      {transaction.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-light tabular-nums ${
                          transaction.type === "cargo"
                            ? isSelected
                              ? "text-red-200"
                              : "text-red-600"
                            : isSelected
                            ? "text-green-200"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "cargo" ? "-" : "+"}
                        {formatMoney(transaction.amount)}
                      </span>
                      {isCurrent && (
                        <span
                          className={`text-xs font-light px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-neutral-700 text-neutral-200"
                              : "bg-neutral-200 text-neutral-600"
                          }`}
                        >
                          Actual
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-neutral-200 text-xs text-neutral-400 font-light text-center">
            {filteredTransactions.length} resultado
            {filteredTransactions.length !== 1 ? "s" : ""} · Usa ↑ ↓ para
            navegar · Enter para seleccionar
          </div>
        )}
      </div>
    </div>
  );
};
