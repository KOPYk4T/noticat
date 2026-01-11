import { useEffect, useState, useRef } from "react";
import type { Transaction } from "../shared/types";
import { parseBankStatementExcel } from "../shared/services/excelParser";
import { suggestCategory, detectRecurringTransaction } from "../shared/services/categorySuggestions";
import {
  categorizeBatchWithGroq,
  isGroqAvailable,
  type BatchCategoryItem,
  parseCsvToStructure,
  inferColumnMapping,
  mapStructureToTransactions,
} from "../shared/services";
import { parseDate } from "../shared/utils/dateUtils";
import type { FileStructure, ColumnMapping } from "../shared/types/fileMapping";

type Step = "upload" | "processing" | "table-editor" | "mapping" | "categorize" | "complete";
type SlideDirection = "left" | "right";

interface UseTransactionNavigationReturn {
  step: Step;
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  currentIndex: number;
  slideDirection: SlideDirection;
  fileName: string;
  error: string | null;
  uploadedCount: number;
  // Column mapping state
  fileStructure?: FileStructure;
  columnMapping?: ColumnMapping;
  autoDetectedMapping?: boolean;
  handleFileSelect: (file: File) => void;
  handleTableEditorConfirm: (structure: FileStructure) => void;
  handleTableEditorCancel: () => void;
  handleMappingConfirm: (mapping: ColumnMapping) => void;
  handleMappingCancel: () => void;
  handleCategoryChange: (index: number, category: string) => void;
  handleRecurringChange: (index: number, isRecurring: boolean) => void;
  handleTypeChange: (index: number, type: "cargo" | "abono") => void;
  handleDelete: (index: number) => void;
  handleRestore: (index: number) => void;
  handleMassDelete: (ids: number[]) => void;
  handleMassCategoryChange: (ids: number[], category: string) => void;
  handleMassRecurringChange: (ids: number[], isRecurring: boolean) => void;
  handleMassTypeChange: (ids: number[], type: "cargo" | "abono") => void;
  handleUploadSuccess: (uploadedCount: number) => void;
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

const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
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
  const [uploadedCount, setUploadedCount] = useState(0);
  const [fileStructure, setFileStructure] = useState<FileStructure | undefined>();
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | undefined>();
  const [autoDetectedMapping, setAutoDetectedMapping] = useState(false);
  const pendingResetRef = useRef<(() => void) | null>(null);

  const processTransactions = async (
    parsedTransactions: Array<{
      date: string;
      description: string;
      amount: number;
      type: "cargo" | "abono";
    }>
  ) => {
    let idCounter = nextId;
    const convertedTransactions: Transaction[] = [];
    const transactionsNeedingAI: BatchCategoryItem[] = [];

    for (let i = 0; i < parsedTransactions.length; i++) {
      const t = parsedTransactions[i];
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
        const aiResults = await categorizeBatchWithGroq(transactionsNeedingAI);

        for (const aiResult of aiResults) {
          const item = transactionsNeedingAI.find(
            (ai) => ai.batchIndex === aiResult.batchIndex
          );
          if (item) {
            const transactionIndex = item.originalIndex;
            const existingTransaction = convertedTransactions[transactionIndex];
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
        console.error("Error categorizando transacciones:", error);
      }
    }

    setNextId(idCounter);
    setTransactions(sortTransactionsByDate(convertedTransactions));
    setStep("categorize");
  };

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setStep("processing");
    setError(null);
    setFileStructure(undefined);
    setColumnMapping(undefined);
    setAutoDetectedMapping(false);

    try {
      const fileName = file.name.toLowerCase();
      const isCsv = fileName.endsWith(".csv");
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

      if (isExcel) {
        try {
          const result = await parseBankStatementExcel(file);
          if (result.success && result.transactions.length > 0) {
            await processTransactions(result.transactions);
            return;
          }
        } catch (excelError) {}
      }

      if (isCsv || isExcel) {
        const csvResult = await parseCsvToStructure(file);

        if (!csvResult.success || !csvResult.structure) {
          setError(
            csvResult.error ||
              "No se pudo procesar el archivo. Asegúrate de que tenga un formato válido."
          );
          setStep("upload");
          return;
        }

        const inferred = inferColumnMapping(csvResult.structure);
        setFileStructure(csvResult.structure);
        setColumnMapping(inferred.mapping);
        setAutoDetectedMapping(inferred.isAutoDetected);
        setStep("mapping");
        return;
      }

      setError("Formato de archivo no soportado. Por favor, usa Excel (.xlsx, .xls) o CSV (.csv)");
      setStep("upload");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al procesar el archivo"
      );
      setStep("upload");
    }
  };

  const handleMappingConfirm = async (mapping: ColumnMapping) => {
    if (!fileStructure) {
      setError("No hay estructura de archivo disponible");
      setStep("upload");
      return;
    }

    setColumnMapping(mapping);
    setStep("processing");

    try {
      const transactions = mapStructureToTransactions(fileStructure, mapping);

      if (transactions.length === 0) {
        setError(
          "No se pudieron extraer transacciones con el mapeo proporcionado. Por favor, verifica el mapeo de columnas."
        );
        setStep("mapping");
        return;
      }

      await processTransactions(transactions);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al procesar las transacciones"
      );
      setStep("mapping");
    }
  };

  const handleTableEditorConfirm = (structure: FileStructure) => {
    setFileStructure(structure);
    const inferred = inferColumnMapping(structure);
    setColumnMapping(inferred.mapping);
    setAutoDetectedMapping(inferred.isAutoDetected);
    setStep("mapping");
  };

  const handleTableEditorCancel = () => {
    setFileStructure(undefined);
    setStep("upload");
  };

  const handleMappingCancel = () => {
    setFileStructure(undefined);
    setColumnMapping(undefined);
    setAutoDetectedMapping(false);
    setStep("upload");
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

  const handleTypeChange = (index: number, type: "cargo" | "abono") => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, type } : t))
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

        // Guardar la transacción actual para mantener la vista
        const currentTransaction = prevTransactions[currentIndex];

        // Agregar la transacción restaurada y ordenar
        const updated = sortTransactionsByDate([...prevTransactions, restored]);

        // Encontrar el nuevo índice de la transacción actual
        if (currentTransaction) {
          const newIndex = updated.findIndex((t) => t.id === currentTransaction.id);
          if (newIndex !== -1) {
            setCurrentIndex(newIndex);
          }
        }

        setSlideDirection("right");
        setStep("categorize");
        return updated;
      });

      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMassDelete = (ids: number[]) => {
    setTransactions((prev) => {
      // Guardar las transacciones eliminadas
      const toDelete = prev.filter((t) => ids.includes(t.id));

      setDeletedTransactions((prevDeleted) => {
        const newDeleted = [...prevDeleted];
        toDelete.forEach((deleted) => {
          if (!newDeleted.some((t) => t.id === deleted.id)) {
            newDeleted.push(deleted);
          }
        });
        return newDeleted;
      });

      // Filtrar las transacciones eliminadas
      const newTransactions = prev.filter((t) => !ids.includes(t.id));

      // Ajustar el índice actual si es necesario
      if (newTransactions.length === 0) {
        setCurrentIndex(0);
      } else if (currentIndex >= newTransactions.length) {
        setCurrentIndex(newTransactions.length - 1);
      }

      return newTransactions;
    });
  };

  const handleMassCategoryChange = (ids: number[], category: string) => {
    setTransactions((prev) => {
      return prev.map((t) =>
        ids.includes(t.id) ? { ...t, selectedCategory: category } : t
      );
    });
  };

  const handleMassRecurringChange = (ids: number[], isRecurring: boolean) => {
    setTransactions((prev) => {
      return prev.map((t) => (ids.includes(t.id) ? { ...t, isRecurring } : t));
    });
  };

  const handleMassTypeChange = (ids: number[], type: "cargo" | "abono") => {
    setTransactions((prev) => {
      return prev.map((t) => (ids.includes(t.id) ? { ...t, type } : t));
    });
  };

  const goNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex < transactions.length - 1) {
        setSlideDirection("right");
        return prevIndex + 1;
      }
      return prevIndex;
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
    setFileStructure(undefined);
    setColumnMapping(undefined);
    setAutoDetectedMapping(false);
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

    const isInputFocused = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLButtonElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused(e.target)) return;

      const actions: Record<string, () => void> = {
        "ArrowRight": () => {
          if (currentIndex < transactions.length - 1) {
            setSlideDirection("right");
            setCurrentIndex(currentIndex + 1);
          }
        },
        "ArrowLeft": () => {
          if (currentIndex > 0) {
            setSlideDirection("left");
            setCurrentIndex(currentIndex - 1);
          }
        },
        "Home": () => {
          setSlideDirection("left");
          setCurrentIndex(0);
        },
        "End": () => {
          setSlideDirection("right");
          setCurrentIndex(transactions.length - 1);
        },
        "r": () => {
          const current = transactions[currentIndex];
          if (current) handleRecurringChange(currentIndex, !current.isRecurring);
        },
        "R": () => {
          const current = transactions[currentIndex];
          if (current) handleRecurringChange(currentIndex, !current.isRecurring);
        },
        "Delete": () => handleDelete(currentIndex),
        "Backspace": () => handleDelete(currentIndex),
      };

      if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        setSlideDirection("right");
        setCurrentIndex(Math.min(currentIndex + 10, transactions.length - 1));
      } else if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideDirection("left");
        setCurrentIndex(Math.max(currentIndex - 10, 0));
      } else if (actions[e.key]) {
        e.preventDefault();
        actions[e.key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, transactions, currentIndex, handleRecurringChange, handleDelete]);

  // Prevenir pérdida de progreso al cerrar/recargar
  useEffect(() => {
    const hasProgress =
      transactions.length > 0 || deletedTransactions.length > 0;
    const isProcessing = step === "categorize";

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

  const handleUploadSuccess = (count: number) => {
    setUploadedCount(count);
    setStep("complete");
  };

  return {
    step,
    transactions,
    deletedTransactions,
    currentIndex,
    slideDirection,
    fileName,
    error,
    uploadedCount,
    fileStructure,
    columnMapping,
    autoDetectedMapping,
    handleFileSelect,
    handleTableEditorConfirm,
    handleTableEditorCancel,
    handleMappingConfirm,
    handleMappingCancel,
    handleCategoryChange,
    handleRecurringChange,
    handleTypeChange,
    handleDelete,
    handleRestore,
    handleMassDelete,
    handleMassCategoryChange,
    handleMassRecurringChange,
    handleMassTypeChange,
    handleUploadSuccess,
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
