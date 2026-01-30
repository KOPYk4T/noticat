import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@shared/constants";
import type { BankAdapter } from "@shared/services/bankAdapters/types";
import {
  FalabellaAdapter,
  SantanderAdapter,
} from "@shared/services/bankAdapters";

interface CustomAdapter {
  id: string;
  name: string;
  description: string;
  version: string;
  // Config for custom parsing (futuro)
  config: {
    headers: string[];
    columnMapping: Record<string, number>;
    dateFormat: string;
  };
}

interface AdapterRegistryState {
  // State
  builtInAdapters: BankAdapter[];
  customAdapters: CustomAdapter[];

  // Actions
  registerCustomAdapter: (adapter: CustomAdapter) => void;
  updateCustomAdapter: (id: string, adapter: Partial<CustomAdapter>) => void;
  removeCustomAdapter: (id: string) => void;
  getAdapter: (id: string) => BankAdapter | CustomAdapter | undefined;
  getAllAdapters: () => Array<BankAdapter | CustomAdapter>;
}

const BUILT_IN_ADAPTERS: BankAdapter[] = [
  new FalabellaAdapter(),
  new SantanderAdapter(),
];

export const useAdapterRegistryStore = create<AdapterRegistryState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        builtInAdapters: BUILT_IN_ADAPTERS,
        customAdapters: [],

        registerCustomAdapter: (adapter) =>
          set(
            (state) => ({
              customAdapters: [...state.customAdapters, adapter],
            }),
            false,
            "registerCustomAdapter"
          ),

        updateCustomAdapter: (id, updates) =>
          set(
            (state) => ({
              customAdapters: state.customAdapters.map((a) =>
                a.id === id ? { ...a, ...updates } : a
              ),
            }),
            false,
            "updateCustomAdapter"
          ),

        removeCustomAdapter: (id) =>
          set(
            (state) => ({
              customAdapters: state.customAdapters.filter((a) => a.id !== id),
            }),
            false,
            "removeCustomAdapter"
          ),

        getAdapter: (id) => {
          const { builtInAdapters, customAdapters } = get();
          return [...builtInAdapters, ...customAdapters].find((a) =>
            "id" in a ? a.id === id : a.bankName === id
          );
        },

        getAllAdapters: () => {
          const { builtInAdapters, customAdapters } = get();
          return [...builtInAdapters, ...customAdapters];
        },
      }),
      {
        name: STORAGE_KEYS.ADAPTER_REGISTRY,
        partialize: (state) => ({
          customAdapters: state.customAdapters,
          // No persistir builtInAdapters (siempre hardcoded)
        }),
      }
    ),
    { name: "AdapterRegistryStore" }
  )
);

// Selectors
export const selectBuiltInAdapters = (state: AdapterRegistryState) =>
  state.builtInAdapters;
export const selectCustomAdapters = (state: AdapterRegistryState) =>
  state.customAdapters;
export const selectAllAdapters = (state: AdapterRegistryState) =>
  state.getAllAdapters();
