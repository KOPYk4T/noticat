import { useEffect, useState, useRef } from "react";
import type { Transaction } from "../shared/types";
import { parseBankStatementExcel } from "../shared/services/excelParser";
import {
  suggestCategory,
  detectRecurringTransaction,
} from "../shared/services/categorySuggestions";
import {
  categorizeBatchWithGroq,
  isGroqAvailable,
  type BatchCategoryItem,
} from "../shared/services/groqCategoryService";

type Step = "upload" | "processing" | "categorize" | "complete";
type SlideDirection = "left" | "right";

interface UseTransactionNavigationReturn {
  step: Step;
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  currentIndex: number;
  slideDirection: SlideDirection;
  fileName: string;
  error: string | null;
  handleFileSelect: (file: File) => void;
  handleCategoryChange: (index: number, category: string) => void;
  handleRecurringChange: (index: number, isRecurring: boolean) => void;
  handleDelete: (index: number) => void;
  handleRestore: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  goToEnd: () => void;
  goToStart: () => void;
  goToIndex: (index: number) => void;
  reset: () => void;
  confirmReset: (onConfirm: () => void) => void;
  showConfirmReset: boolean;
  handleConfirmReset: () => void;
  handleCancelReset: () => void;
}

export const useTransactionNavigation = (): UseTransactionNavigationReturn => {
  const [step, setStep] = useState<Step>("upload");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>(
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("right");
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const pendingResetRef = useRef<(() => void) | null>(null);

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setStep("processing");
    setError(null);

    try {
      const result = await parseBankStatementExcel(file);

      if (!result.success || result.transactions.length === 0) {
        setError(
          result.error ||
            "No se pudieron extraer transacciones del archivo Excel"
        );
        setStep("upload");
        return;
      }

      let idCounter = nextId;
      const convertedTransactions: Transaction[] = [];
      const transactionsNeedingAI: BatchCategoryItem[] = [];

      for (let i = 0; i < result.transactions.length; i++) {
        const t = result.transactions[i];
        const suggestion = suggestCategory(t.description, t.type);

        if (suggestion.confidence === "low" && isGroqAvailable()) {
          transactionsNeedingAI.push({
            description: t.description,
            transactionType: t.type,
            batchIndex: transactionsNeedingAI.length,
            originalIndex: i,
          });
        }

        const isRecurring = detectRecurringTransaction(t.description);

        convertedTransactions.push({
          id: idCounter++,
          description: t.description,
          amount: t.amount,
          date: t.date,
          type: t.type,
          suggestedCategory: suggestion.category,
          confidence: suggestion.confidence,
          selectedCategory: suggestion.category,
          isRecurring,
        });
      }

      if (transactionsNeedingAI.length > 0) {
        try {
          const aiResults = await categorizeBatchWithGroq(
            transactionsNeedingAI
          );

          for (const aiResult of aiResults) {
            const item = transactionsNeedingAI.find(
              (ai) => ai.batchIndex === aiResult.batchIndex
            );
            if (item) {
              const transactionIndex = item.originalIndex;
              const existingTransaction =
                convertedTransactions[transactionIndex];
              convertedTransactions[transactionIndex] = {
                ...existingTransaction,
                suggestedCategory: aiResult.category,
                confidence: "ai",
                selectedCategory: aiResult.category,
                isRecurring: existingTransaction.isRecurring,
              };
            }
          }
        } catch (error) {
          console.error(
            "Error al categorizar batch con IA, manteniendo categorías por defecto:",
            error
          );
        }
      }

      setNextId(idCounter);
      setTransactions(convertedTransactions);
      setStep("categorize");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al procesar el archivo Excel"
      );
      setStep("upload");
    }
  };

  const handleCategoryChange = (index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, selectedCategory: category } : t
      )
    );
  };

  const handleRecurringChange = (index: number, isRecurring: boolean) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, isRecurring } : t))
    );
  };

  const handleDelete = (index: number) => {
    setTransactions((prev) => {
      const deleted = prev[index];
      if (!deleted) return prev;

      setDeletedTransactions((prevDeleted) => {
        const exists = prevDeleted.some((t) => t.id === deleted.id);
        if (exists) {
          return prevDeleted;
        }
        return [...prevDeleted, deleted];
      });

      const newTransactions = prev.filter((_, i) => i !== index);

      if (newTransactions.length === 0) {
        setCurrentIndex(0);
        setStep("complete");
      } else if (index >= newTransactions.length) {
        setCurrentIndex(newTransactions.length - 1);
      }

      return newTransactions;
    });
  };

  const handleRestore = (index: number) => {
    setDeletedTransactions((prev) => {
      const restored = prev[index];
      if (!restored) return prev;

      setTransactions((prevTransactions) => {
        const exists = prevTransactions.some((t) => t.id === restored.id);
        if (exists) {
          return prevTransactions;
        }

        const updated = [...prevTransactions, restored];
        setCurrentIndex(updated.length - 1);
        setSlideDirection("right");
        setStep("categorize");
        return updated;
      });

      return prev.filter((_, i) => i !== index);
    });
  };

  const goNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < transactions.length - 1) {
        setSlideDirection("right");
        return prevIndex + 1;
      } else {
        setStep("complete");
        return prevIndex;
      }
    });
  };

  const goPrev = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex > 0) {
        setSlideDirection("left");
        return prevIndex - 1;
      }
      return prevIndex;
    });
  };

  const goToEnd = () => {
    setCurrentIndex(transactions.length - 1);
    setSlideDirection("right");
  };

  const goToStart = () => {
    setCurrentIndex(0);
    setSlideDirection("right");
    setStep("categorize");
  };

  const reset = () => {
    setStep("upload");
    setTransactions([]);
    setDeletedTransactions([]);
    setCurrentIndex(0);
    setFileName("");
    setSlideDirection("right");
    setError(null);
    setNextId(1);
    setShowConfirmReset(false);
    pendingResetRef.current = null;
  };

  const confirmReset = (onConfirm: () => void) => {
    if (transactions.length > 0 || deletedTransactions.length > 0) {
      pendingResetRef.current = onConfirm;
      setShowConfirmReset(true);
    } else {
      onConfirm();
    }
  };

  const handleConfirmReset = () => {
    if (pendingResetRef.current) {
      pendingResetRef.current();
    }
    reset();
  };

  const handleCancelReset = () => {
    setShowConfirmReset(false);
    pendingResetRef.current = null;
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < transactions.length) {
      const direction = index > currentIndex ? "right" : "left";
      setSlideDirection(direction);
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    if (step !== "categorize") return;

    const jumpForward = (amount: number = 10) => {
      setCurrentIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex + amount, transactions.length - 1);
        setSlideDirection("right");
        return newIndex;
      });
    };

    const jumpBackward = (amount: number = 10) => {
      setCurrentIndex((prevIndex) => {
        const newIndex = Math.max(prevIndex - amount, 0);
        setSlideDirection("left");
        return newIndex;
      });
    };

    const toggleRecurring = () => {
      if (transactions[currentIndex]) {
        const current = transactions[currentIndex];
        handleRecurringChange(currentIndex, !current.isRecurring);
      }
    };

    const goToIndexInEffect = (index: number) => {
      if (index >= 0 && index < transactions.length) {
        const direction = index > currentIndex ? "right" : "left";
        setSlideDirection(direction);
        setCurrentIndex(index);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      // Shift + Arrow for fast navigation
      if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        jumpForward(10);
        return;
      }
      if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        jumpBackward(10);
        return;
      }

      // Home/End keys
      if (e.key === "Home") {
        e.preventDefault();
        goToIndexInEffect(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        goToIndexInEffect(transactions.length - 1);
        return;
      }

      // Space for toggle recurring (only if not on button)
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        toggleRecurring();
        return;
      }

      // Normal navigation
      if (e.key === "ArrowRight" || e.key === "Enter") {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < transactions.length - 1) {
            setSlideDirection("right");
            return prevIndex + 1;
          } else {
            setStep("complete");
            return prevIndex;
          }
        });
        return;
      }
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prevIndex) => {
          if (prevIndex > 0) {
            setSlideDirection("left");
            return prevIndex - 1;
          }
          return prevIndex;
        });
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        setTransactions((prev) => {
          const deleted = prev[currentIndex];
          if (!deleted) return prev;

          setDeletedTransactions((prevDeleted) => {
            const exists = prevDeleted.some((t) => t.id === deleted.id);
            if (exists) {
              return prevDeleted;
            }
            return [...prevDeleted, deleted];
          });

          const newTransactions = prev.filter((_, i) => i !== currentIndex);

          if (newTransactions.length === 0) {
            setCurrentIndex(0);
            setStep("complete");
          } else if (currentIndex >= newTransactions.length) {
            setCurrentIndex(newTransactions.length - 1);
          }

          return newTransactions;
        });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, transactions.length, currentIndex, transactions]);

  // Prevenir pérdida de progreso al cerrar/recargar
  useEffect(() => {
    const hasProgress =
      transactions.length > 0 || deletedTransactions.length > 0;
    const isProcessing = step === "categorize" || step === "complete";

    if (!hasProgress || !isProcessing) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [transactions.length, deletedTransactions.length, step]);

  return {
    step,
    transactions,
    deletedTransactions,
    currentIndex,
    slideDirection,
    fileName,
    error,
    handleFileSelect,
    handleCategoryChange,
    handleRecurringChange,
    handleDelete,
    handleRestore,
    goNext,
    goPrev,
    goToEnd,
    goToStart,
    goToIndex,
    reset,
    confirmReset,
    showConfirmReset,
    handleConfirmReset,
    handleCancelReset,
  };
};
