import { useState, useEffect } from "react";
import type { Transaction } from "../../shared/types";
import { NavigationHeader } from "./NavigationHeader";
import { ProgressBar } from "./ProgressBar";
import { TransactionCard } from "./TransactionCard";
import { SearchModal } from "./SearchModal";

interface CategorizeScreenProps {
  transactions: Transaction[];
  currentIndex: number;
  slideDirection: "left" | "right";
  onCategoryChange: (index: number, category: string) => void;
  onRecurringChange: (index: number, isRecurring: boolean) => void;
  onDelete: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToEnd: () => void;
  onGoToIndex: (index: number) => void;
}

export const CategorizeScreen = ({
  transactions,
  currentIndex,
  slideDirection,
  onCategoryChange,
  onRecurringChange,
  onDelete,
  onPrev,
  onNext,
  onGoToEnd,
  onGoToIndex,
}: CategorizeScreenProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const current = transactions[currentIndex];
  const progress = ((currentIndex + 1) / transactions.length) * 100;

  const handleCategoryChange = (category: string) => {
    onCategoryChange(currentIndex, category);
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    onRecurringChange(currentIndex, isRecurring);
  };

  const handleDelete = () => {
    onDelete(currentIndex);
  };

  // Keyboard shortcut for search (Cmd/Ctrl + K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (e.key === "/" && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <>
      <SearchModal
        transactions={transactions}
        currentIndex={currentIndex}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={onGoToIndex}
      />

      <div className="min-h-screen bg-white flex flex-col font-sans">
        <NavigationHeader
          currentIndex={currentIndex}
          totalCount={transactions.length}
          onPrev={onPrev}
          onNext={onNext}
        />

        <ProgressBar progress={progress} />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
          {current && (
            <TransactionCard
              transaction={current}
              slideDirection={slideDirection}
              onCategoryChange={handleCategoryChange}
              onRecurringChange={handleRecurringChange}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Action buttons */}
        {currentIndex < transactions.length - 1 && (
          <div className="px-8 pb-6 flex justify-center">
            <button
              onClick={onGoToEnd}
              className="text-xs text-neutral-400 hover:text-neutral-600 
                     transition-colors duration-300 font-light px-4 py-2
                     hover:bg-neutral-50 rounded-lg"
            >
              Ir al final
            </button>
          </div>
        )}

        {/* Keyboard hint */}
        <div className="px-8 py-6 text-center space-y-1">
          <p className="text-xs text-neutral-300 font-light tracking-wide">
            ← → navegar · Shift+←→ saltar 10 · Home/End inicio/fin
          </p>
          <p className="text-xs text-neutral-300 font-light tracking-wide">
            Enter continuar · Delete saltar · Espacio toggle recurrente · / o
            Cmd+K buscar
          </p>
        </div>
      </div>
    </>
  );
};
