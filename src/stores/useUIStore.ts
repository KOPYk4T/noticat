import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@shared/constants";

type ViewMode = "card" | "table";

interface UIState {
  // State — View mode
  viewMode: ViewMode;

  // State — Modals
  modals: {
    search: boolean;
    massEdit: boolean;
    summary: boolean;
    accountSelector: boolean;
    history: boolean;
  };

  // State — Keyboard shortcuts
  shortcutsEnabled: boolean;

  // Actions — View mode
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;

  // Actions — Modals
  openModal: (modal: keyof UIState["modals"]) => void;
  closeModal: (modal: keyof UIState["modals"]) => void;
  toggleModal: (modal: keyof UIState["modals"]) => void;
  closeAllModals: () => void;

  // Actions — Shortcuts
  enableShortcuts: () => void;
  disableShortcuts: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        viewMode: "card",
        modals: {
          search: false,
          massEdit: false,
          summary: false,
          accountSelector: false,
          history: false,
        },
        shortcutsEnabled: true,

        // View mode
        setViewMode: (mode) => set({ viewMode: mode }, false, "setViewMode"),
        toggleViewMode: () =>
          set(
            (state) => ({
              viewMode: state.viewMode === "card" ? "table" : "card",
            }),
            false,
            "toggleViewMode"
          ),

        // Modals
        openModal: (modal) =>
          set(
            (state) => ({
              modals: { ...state.modals, [modal]: true },
            }),
            false,
            `openModal:${modal}`
          ),

        closeModal: (modal) =>
          set(
            (state) => ({
              modals: { ...state.modals, [modal]: false },
            }),
            false,
            `closeModal:${modal}`
          ),

        toggleModal: (modal) =>
          set(
            (state) => ({
              modals: { ...state.modals, [modal]: !state.modals[modal] },
            }),
            false,
            `toggleModal:${modal}`
          ),

        closeAllModals: () =>
          set(
            {
              modals: {
                search: false,
                massEdit: false,
                summary: false,
                accountSelector: false,
                history: false,
              },
            },
            false,
            "closeAllModals"
          ),

        // Shortcuts
        enableShortcuts: () =>
          set({ shortcutsEnabled: true }, false, "enableShortcuts"),
        disableShortcuts: () =>
          set({ shortcutsEnabled: false }, false, "disableShortcuts"),
      }),
      {
        name: STORAGE_KEYS.UI_STATE,
        partialize: (state) => ({
          viewMode: state.viewMode,
          // No persistir modals (siempre cerrados al recargar)
        }),
      }
    ),
    { name: "UIStore" }
  )
);

// Selectors
export const selectViewMode = (state: UIState) => state.viewMode;
export const selectModals = (state: UIState) => state.modals;
export const selectIsModalOpen =
  (modal: keyof UIState["modals"]) => (state: UIState) =>
    state.modals[modal];
export const selectShortcutsEnabled = (state: UIState) =>
  state.shortcutsEnabled;
