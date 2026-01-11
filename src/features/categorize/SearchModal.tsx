import { useState, useEffect, useRef } from "react";
import type { Transaction } from "../../shared/types";
import { Button } from "../../components/Button";
import { formatMoney } from "../../shared/utils";
import { categories } from "../../shared/constants/categories";

interface SearchModalProps {
  transactions: Transaction[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (index: number) => void;
  onTypeChange?: (index: number, type: "cargo" | "abono") => void;
  onMassEdit?: (selectedIds: number[]) => void;
  onMassDelete?: (selectedIds: number[]) => void;
}

interface ActiveFilters {
  type?: "cargo" | "abono";
  category?: string;
  amountRange?: string;
  onlyAI?: boolean;
}

export const SearchModal = ({
  transactions,
  currentIndex,
  isOpen,
  onClose,
  onSelect,
  onTypeChange,
  onMassEdit,
  onMassDelete,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  const getAmountRange = (amount: number): string => {
    if (amount < 10000) return "< $10k";
    if (amount < 50000) return "$10k-$50k";
    return "> $50k";
  };

  const filteredTransactions = transactions.filter((t) => {
    // Text search
    const matchesSearch = t.description
      .toUpperCase()
      .includes(searchQuery.toUpperCase());

    // Type filter
    const matchesType =
      !activeFilters.type || t.type === activeFilters.type;

    // Category filter
    const matchesCategory =
      !activeFilters.category ||
      (t.selectedCategory || t.suggestedCategory) === activeFilters.category;

    // Amount range filter
    const matchesAmountRange =
      !activeFilters.amountRange ||
      getAmountRange(t.amount) === activeFilters.amountRange;

    // AI filter
    const matchesAI =
      !activeFilters.onlyAI || t.confidence === "low" || t.confidence === "ai";

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesAmountRange &&
      matchesAI
    );
  });

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
      setActiveFilters({});
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const selectSimilar = (description: string) => {
    const normalized = description.toUpperCase().trim();
    const similarIds = transactions
      .filter(
        (t) => t.description.toUpperCase().trim() === normalized
      )
      .map((t) => t.id);
    setSelectedIds(new Set(similarIds));
  };

  const handleMassEdit = () => {
    if (onMassEdit && selectedIds.size > 0) {
      onMassEdit(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleMassDelete = () => {
    if (onMassDelete && selectedIds.size > 0) {
      onMassDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const toggleFilter = (
    filterType: keyof ActiveFilters,
    value: string | boolean | undefined
  ) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (filterType === "type") {
        if (newFilters.type === value) {
          delete newFilters.type;
        } else {
          newFilters.type = value as "cargo" | "abono";
        }
      } else if (filterType === "category") {
        if (newFilters.category === value) {
          delete newFilters.category;
        } else {
          newFilters.category = value as string;
        }
      } else if (filterType === "amountRange") {
        if (newFilters.amountRange === value) {
          delete newFilters.amountRange;
        } else {
          newFilters.amountRange = value as string;
        }
      } else if (filterType === "onlyAI") {
        if (newFilters.onlyAI) {
          delete newFilters.onlyAI;
        } else {
          newFilters.onlyAI = true;
        }
      }
      return newFilters;
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input o textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

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
      if (e.key === " " && onMassEdit && filteredTransactions.length > 0) {
        e.preventDefault();
        const selected = filteredTransactions[selectedResultIndex];
        if (selected) {
          toggleSelection(selected.id);
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
    onMassEdit,
    toggleSelection,
  ]);

  useEffect(() => {
    if (resultsListRef.current && resultsRef.current && selectedResultIndex >= 0 && filteredTransactions.length > 0) {
      const selectedElement = resultsListRef.current.children[
        selectedResultIndex
      ] as HTMLElement;
      if (selectedElement) {
        const container = resultsRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();
        
        // Padding del contenedor (p-2 = 8px)
        const padding = 8;
        
        // Calcular si el elemento está fuera de la vista (considerando padding)
        const containerTop = containerRect.top + padding;
        const containerBottom = containerRect.bottom - padding;
        const isAboveView = elementRect.top < containerTop;
        const isBelowView = elementRect.bottom > containerBottom;
        
        if (isAboveView || isBelowView) {
          // Calcular scrollTop necesario
          const currentScrollTop = container.scrollTop;
          const elementTopRelative = elementRect.top - containerRect.top + currentScrollTop;
          const containerHeight = container.clientHeight;
          const elementHeight = elementRect.height;
          
          let targetScrollTop: number;
          
          if (isAboveView) {
            // Scroll hacia arriba: colocar el elemento al inicio con padding
            targetScrollTop = elementTopRelative - padding;
          } else {
            // Scroll hacia abajo: colocar el elemento al final con padding
            targetScrollTop = elementTopRelative + elementHeight - containerHeight + padding;
          }
          
          // Aplicar el scroll suavemente
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: "smooth",
          });
        }
      }
    }
  }, [selectedResultIndex, filteredTransactions]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-[scaleIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 space-y-4">
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
          
          {/* Filters */}
          <div className="space-y-3">
            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => toggleFilter("onlyAI", true)}
                className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                  ${
                    activeFilters.onlyAI
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
              >
                Solo IA
              </button>
              <button
                onClick={() => toggleFilter("type", "cargo")}
                className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                  ${
                    activeFilters.type === "cargo"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
              >
                Gastos
              </button>
              <button
                onClick={() => toggleFilter("type", "abono")}
                className={`px-4 py-1.5 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                  ${
                    activeFilters.type === "abono"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
              >
                Ingresos
              </button>
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                <button
                  onClick={() => toggleFilter("amountRange", "< $10k")}
                  className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                    ${
                      activeFilters.amountRange === "< $10k"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                >
                  &lt; $10k
                </button>
                <button
                  onClick={() => toggleFilter("amountRange", "$10k-$50k")}
                  className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                    ${
                      activeFilters.amountRange === "$10k-$50k"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                >
                  $10k-$50k
                </button>
                <button
                  onClick={() => toggleFilter("amountRange", "> $50k")}
                  className={`px-4 py-2 text-sm font-light rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer
                    ${
                      activeFilters.amountRange === "> $50k"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                    }`}
                >
                  &gt; $50k
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-light text-neutral-500 px-2">Categoría:</span>
              <select
                value={activeFilters.category || ""}
                onChange={(e) => {
                  if (e.target.value) {
                    toggleFilter("category", e.target.value);
                  } else {
                    setActiveFilters((prev) => {
                      const newFilters = { ...prev };
                      delete newFilters.category;
                      return newFilters;
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-light text-neutral-900 
                         bg-white border border-neutral-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent
                         transition-all duration-200 min-w-[180px]"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {onMassEdit && filteredTransactions.length > 0 && (
            <div className="px-6 py-3 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between flex-shrink-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={selectAll}
                    className="w-5 h-5 text-neutral-900 border-neutral-300 rounded 
                             focus:ring-2 focus:ring-neutral-900 focus:ring-offset-0
                             cursor-pointer transition-colors
                             checked:bg-neutral-900 checked:border-neutral-900"
                  />
                </div>
                <span className="text-sm font-light text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  Seleccionar todas ({filteredTransactions.length})
                </span>
              </label>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  {onMassDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMassDelete}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar {selectedIds.size}
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMassEdit}
                    className="shadow-sm"
                  >
                    Editar {selectedIds.size}
                  </Button>
                </div>
              )}
            </div>
          )}
          <div ref={resultsRef} className="flex-1 overflow-y-auto p-2">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 font-light">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "Escribe para buscar..."}
              </div>
            ) : (
              <div ref={resultsListRef} className="space-y-1">
                {filteredTransactions.map((transaction, index) => {
                const actualIndex = transactions.findIndex(
                  (t) => t.id === transaction.id
                );
                const isSelected = index === selectedResultIndex;
                const isCurrent = actualIndex === currentIndex;
                const isChecked = selectedIds.has(transaction.id);

                return (
                  <div
                    key={`${transaction.id}-${actualIndex}`}
                    className={`p-4 rounded-xl transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-neutral-900 text-white"
                                  : "bg-neutral-50 hover:bg-neutral-100"
                              }
                              ${isCurrent ? "ring-2 ring-neutral-400" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {onMassEdit && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(transaction.id);
                            setSelectedResultIndex(index);
                            // Quitar el foco del checkbox para que las flechas funcionen
                            (e.target as HTMLInputElement).blur();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResultIndex(index);
                          }}
                          className="mt-1 w-5 h-5 text-neutral-900 border-neutral-300 rounded 
                                   focus:ring-2 focus:ring-neutral-900 focus:ring-offset-0
                                   cursor-pointer transition-colors
                                   checked:bg-neutral-900 checked:border-neutral-900"
                        />
                      )}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          onSelect(actualIndex);
                          onClose();
                        }}
                      >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-light ${
                          isSelected ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        #{actualIndex + 1} · {transaction.date}
                      </span>
                      <div className="flex items-center gap-2">
                        {(transaction.confidence === "low" || transaction.confidence === "ai") && (
                          <span
                            className={`text-xs font-light px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-purple-500/20 text-purple-200"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            IA
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onTypeChange && actualIndex !== -1) {
                              onTypeChange(actualIndex, transaction.type === "cargo" ? "abono" : "cargo");
                            }
                          }}
                          className={`text-xs font-light px-2 py-0.5 rounded-full cursor-pointer transition-all hover:scale-105 ${
                            transaction.type === "cargo"
                              ? isSelected
                                ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                              : isSelected
                              ? "bg-green-500/20 text-green-200 hover:bg-green-500/30"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {transaction.type === "cargo" ? "Gasto" : "Ingreso"}
                        </button>
                      </div>
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
                      {onMassEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSimilar(transaction.description);
                          }}
                          className="text-xs font-light text-neutral-400 hover:text-neutral-600 px-2 py-1 rounded hover:bg-neutral-200 transition-colors cursor-pointer"
                          title="Seleccionar similares"
                        >
                          Similares
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
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
