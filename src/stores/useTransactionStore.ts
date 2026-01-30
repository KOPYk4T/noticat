import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Transaction } from "@shared/types";
import {
  suggestCategory,
  detectRecurringTransaction,
  categorizeBatchWithGroq,
  isGroqAvailable,
  type BatchCategoryItem,
} from "@shared/services";
import { parseDate } from "@shared/utils/dateUtils";

interface TransactionState {
  // State
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  nextId: number;

  // Actions — Single operations (by ID)
  updateCategory: (id: number, category: string) => void;
  updateRecurring: (id: number, isRecurring: boolean) => void;
  updateType: (id: number, type: "cargo" | "abono") => void;
  deleteTransaction: (id: number) => void;
  restoreTransaction: (id: number) => void;

  // Actions — Batch operations
  batchDelete: (ids: number[]) => void;
  batchUpdateCategory: (ids: number[], category: string) => void;
  batchUpdateRecurring: (ids: number[], isRecurring: boolean) => void;
  batchUpdateType: (ids: number[], type: "cargo" | "abono") => void;

  // Actions — Processing
  processTransactions: (
    parsedTransactions: Array<{
      date: string;
      description: string;
      amount: number;
      type: "cargo" | "abono";
    }>
  ) => Promise<void>;

  // Actions — Reset
  clear: () => void;
}

// Helpers
const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));

export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      transactions: [],
      deletedTransactions: [],
      nextId: 1,

      // Single operations (by ID, not index)
      updateCategory: (id, category) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, selectedCategory: category } : t
            ),
          }),
          false,
          "updateCategory"
        ),

      updateRecurring: (id, isRecurring) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, isRecurring } : t
            ),
          }),
          false,
          "updateRecurring"
        ),

      updateType: (id, type) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, type } : t
            ),
          }),
          false,
          "updateType"
        ),

      deleteTransaction: (id) =>
        set(
          (state) => {
            const deleted = state.transactions.find((t) => t.id === id);
            if (!deleted) return state;

            return {
              transactions: state.transactions.filter((t) => t.id !== id),
              deletedTransactions: state.deletedTransactions.some(
                (t) => t.id === id
              )
                ? state.deletedTransactions
                : [...state.deletedTransactions, deleted],
            };
          },
          false,
          "deleteTransaction"
        ),

      restoreTransaction: (id) =>
        set(
          (state) => {
            const restored = state.deletedTransactions.find((t) => t.id === id);
            if (!restored) return state;

            return {
              transactions: sortTransactionsByDate([
                ...state.transactions,
                restored,
              ]),
              deletedTransactions: state.deletedTransactions.filter(
                (t) => t.id !== id
              ),
            };
          },
          false,
          "restoreTransaction"
        ),

      // Batch operations
      batchDelete: (ids) =>
        set(
          (state) => {
            const toDelete = state.transactions.filter((t) =>
              ids.includes(t.id)
            );
            const newDeleted = [...state.deletedTransactions];

            toDelete.forEach((deleted) => {
              if (!newDeleted.some((t) => t.id === deleted.id)) {
                newDeleted.push(deleted);
              }
            });

            return {
              transactions: state.transactions.filter(
                (t) => !ids.includes(t.id)
              ),
              deletedTransactions: newDeleted,
            };
          },
          false,
          "batchDelete"
        ),

      batchUpdateCategory: (ids, category) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              ids.includes(t.id) ? { ...t, selectedCategory: category } : t
            ),
          }),
          false,
          "batchUpdateCategory"
        ),

      batchUpdateRecurring: (ids, isRecurring) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              ids.includes(t.id) ? { ...t, isRecurring } : t
            ),
          }),
          false,
          "batchUpdateRecurring"
        ),

      batchUpdateType: (ids, type) =>
        set(
          (state) => ({
            transactions: state.transactions.map((t) =>
              ids.includes(t.id) ? { ...t, type } : t
            ),
          }),
          false,
          "batchUpdateType"
        ),

      // Processing with AI
      processTransactions: async (parsedTransactions) => {
        const { nextId } = get();
        let idCounter = nextId;
        const convertedTransactions: Transaction[] = [];
        const transactionsNeedingAI: BatchCategoryItem[] = [];

        // First pass: local categorization
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

        // Second pass: AI categorization for low-confidence items
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
                };
              }
            }
          } catch (error) {
            console.error("Error categorizando transacciones:", error);
          }
        }

        set(
          {
            nextId: idCounter,
            transactions: sortTransactionsByDate(convertedTransactions),
          },
          false,
          "processTransactions"
        );
      },

      clear: () =>
        set(
          {
            transactions: [],
            deletedTransactions: [],
            nextId: 1,
          },
          false,
          "clear"
        ),
    }),
    { name: "TransactionStore" }
  )
);

// Selectors (para usar con useShallow)
export const selectTransactions = (state: TransactionState) =>
  state.transactions;
export const selectDeletedTransactions = (state: TransactionState) =>
  state.deletedTransactions;
export const selectTransactionById =
  (id: number) => (state: TransactionState) =>
    state.transactions.find((t) => t.id === id);
export const selectTransactionCount = (state: TransactionState) =>
  state.transactions.length;
