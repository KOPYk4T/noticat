import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { FileStructure, ColumnMapping } from "@shared/types/fileMapping";
import {
  parseBankStatementExcel,
  parseCsvToStructure,
  inferColumnMapping,
  mapStructureToTransactions,
} from "@shared/services";
import { useTransactionStore } from "./useTransactionStore";
import { useNavigationStore } from "./useNavigationStore";

interface FileState {
  // State
  fileStructure?: FileStructure;
  columnMapping?: ColumnMapping;
  autoDetectedMapping: boolean;
  isProcessing: boolean;

  // Actions
  handleFileSelect: (file: File) => Promise<void>;
  handleMappingConfirm: (mapping: ColumnMapping) => Promise<void>;
  handleMappingCancel: () => void;
  handleTableEditorConfirm: (structure: FileStructure) => void;
  handleTableEditorCancel: () => void;
  clear: () => void;
}

export const useFileStore = create<FileState>()(
  devtools(
    (set, get) => ({
      // Initial state
      fileStructure: undefined,
      columnMapping: undefined,
      autoDetectedMapping: false,
      isProcessing: false,

      handleFileSelect: async (file) => {
        const setStep = useNavigationStore.getState().setStep;
        const setError = useNavigationStore.getState().setError;
        const setFileName = useNavigationStore.getState().setFileName;
        const processTransactions =
          useTransactionStore.getState().processTransactions;

        setFileName(file.name);
        setStep("processing");
        setError(null);
        set({
          fileStructure: undefined,
          columnMapping: undefined,
          autoDetectedMapping: false,
          isProcessing: true,
        });

        try {
          const fileName = file.name.toLowerCase();
          const isCsv = fileName.endsWith(".csv");
          const isExcel =
            fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

          // Try bank adapter first (Excel only)
          if (isExcel) {
            try {
              const result = await parseBankStatementExcel(file);
              if (result.success && result.transactions.length > 0) {
                await processTransactions(result.transactions);
                setStep("categorize");
                set({ isProcessing: false });
                return;
              }
            } catch (excelError) {
              // Fallback to CSV parser
            }
          }

          // Fallback: CSV generic parser
          if (isCsv || isExcel) {
            const csvResult = await parseCsvToStructure(file);

            if (!csvResult.success || !csvResult.structure) {
              setError(
                csvResult.error ||
                  "No se pudo procesar el archivo. Asegúrate de que tenga un formato válido."
              );
              setStep("upload");
              set({ isProcessing: false });
              return;
            }

            const inferred = inferColumnMapping(csvResult.structure);
            set({
              fileStructure: csvResult.structure,
              columnMapping: inferred.mapping,
              autoDetectedMapping: inferred.isAutoDetected,
              isProcessing: false,
            });
            setStep("mapping");
            return;
          }

          setError(
            "Formato de archivo no soportado. Por favor, usa Excel (.xlsx, .xls) o CSV (.csv)"
          );
          setStep("upload");
          set({ isProcessing: false });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Error al procesar el archivo"
          );
          setStep("upload");
          set({ isProcessing: false });
        }
      },

      handleMappingConfirm: async (mapping) => {
        const { fileStructure } = get();
        const setStep = useNavigationStore.getState().setStep;
        const setError = useNavigationStore.getState().setError;
        const processTransactions =
          useTransactionStore.getState().processTransactions;

        if (!fileStructure) {
          setError("No hay estructura de archivo disponible");
          setStep("upload");
          return;
        }

        set({ columnMapping: mapping, isProcessing: true });
        setStep("processing");

        try {
          const transactions = mapStructureToTransactions(
            fileStructure,
            mapping
          );

          if (transactions.length === 0) {
            setError(
              "No se pudieron extraer transacciones con el mapeo proporcionado. Por favor, verifica el mapeo de columnas."
            );
            setStep("mapping");
            set({ isProcessing: false });
            return;
          }

          await processTransactions(transactions);
          setStep("categorize");
          set({ isProcessing: false });
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al procesar las transacciones"
          );
          setStep("mapping");
          set({ isProcessing: false });
        }
      },

      handleMappingCancel: () => {
        const setStep = useNavigationStore.getState().setStep;
        set({
          fileStructure: undefined,
          columnMapping: undefined,
          autoDetectedMapping: false,
        });
        setStep("upload");
      },

      handleTableEditorConfirm: (structure) => {
        const setStep = useNavigationStore.getState().setStep;
        const inferred = inferColumnMapping(structure);
        set({
          fileStructure: structure,
          columnMapping: inferred.mapping,
          autoDetectedMapping: inferred.isAutoDetected,
        });
        setStep("mapping");
      },

      handleTableEditorCancel: () => {
        const setStep = useNavigationStore.getState().setStep;
        set({ fileStructure: undefined });
        setStep("upload");
      },

      clear: () =>
        set({
          fileStructure: undefined,
          columnMapping: undefined,
          autoDetectedMapping: false,
          isProcessing: false,
        }),
    }),
    { name: "FileStore" }
  )
);

// Selectors
export const selectFileStructure = (state: FileState) => state.fileStructure;
export const selectColumnMapping = (state: FileState) => state.columnMapping;
export const selectAutoDetectedMapping = (state: FileState) =>
  state.autoDetectedMapping;
export const selectIsProcessing = (state: FileState) => state.isProcessing;
