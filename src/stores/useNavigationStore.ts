import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@shared/constants";

type Step =
  | "upload"
  | "processing"
  | "table-editor"
  | "mapping"
  | "categorize"
  | "complete";
type SlideDirection = "left" | "right";

interface NavigationState {
  // State
  step: Step;
  currentIndex: number;
  slideDirection: SlideDirection;
  fileName: string;
  error: string | null;
  uploadedCount: number;
  showConfirmReset: boolean;

  // Actions — Navigation
  goNext: (transactionCount: number) => void;
  goPrev: () => void;
  goToIndex: (index: number, transactionCount: number) => void;
  goToStart: () => void;
  goToEnd: (transactionCount: number) => void;

  // Actions — Wizard flow
  setStep: (step: Step) => void;
  setError: (error: string | null) => void;
  setFileName: (fileName: string) => void;
  setUploadedCount: (count: number) => void;
  setCurrentIndex: (index: number) => void;

  // Actions — Reset
  requestReset: () => void;
  confirmReset: () => void;
  cancelReset: () => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        step: "upload",
        currentIndex: 0,
        slideDirection: "right",
        fileName: "",
        error: null,
        uploadedCount: 0,
        showConfirmReset: false,

        // Navigation
        goNext: (transactionCount) =>
          set(
            (state) => {
              if (state.currentIndex < transactionCount - 1) {
                return {
                  currentIndex: state.currentIndex + 1,
                  slideDirection: "right",
                };
              }
              return state;
            },
            false,
            "goNext"
          ),

        goPrev: () =>
          set(
            (state) => {
              if (state.currentIndex > 0) {
                return {
                  currentIndex: state.currentIndex - 1,
                  slideDirection: "left",
                };
              }
              return state;
            },
            false,
            "goPrev"
          ),

        goToIndex: (index, transactionCount) =>
          set(
            (state) => {
              if (index >= 0 && index < transactionCount) {
                return {
                  currentIndex: index,
                  slideDirection: index > state.currentIndex ? "right" : "left",
                };
              }
              return state;
            },
            false,
            "goToIndex"
          ),

        goToStart: () =>
          set(
            {
              currentIndex: 0,
              slideDirection: "right",
              step: "categorize",
            },
            false,
            "goToStart"
          ),

        goToEnd: (transactionCount) =>
          set(
            {
              currentIndex: Math.max(0, transactionCount - 1),
              slideDirection: "right",
            },
            false,
            "goToEnd"
          ),

        // Wizard flow
        setStep: (step) => set({ step }, false, "setStep"),
        setError: (error) => set({ error }, false, "setError"),
        setFileName: (fileName) => set({ fileName }, false, "setFileName"),
        setUploadedCount: (uploadedCount) =>
          set({ uploadedCount }, false, "setUploadedCount"),
        setCurrentIndex: (currentIndex) =>
          set({ currentIndex }, false, "setCurrentIndex"),

        // Reset
        requestReset: () =>
          set({ showConfirmReset: true }, false, "requestReset"),
        confirmReset: () => {
          get().reset();
          set({ showConfirmReset: false }, false, "confirmReset");
        },
        cancelReset: () =>
          set({ showConfirmReset: false }, false, "cancelReset"),
        reset: () =>
          set(
            {
              step: "upload",
              currentIndex: 0,
              slideDirection: "right",
              fileName: "",
              error: null,
              uploadedCount: 0,
              showConfirmReset: false,
            },
            false,
            "reset"
          ),
      }),
      {
        name: STORAGE_KEYS.NAVIGATION,
        partialize: (state) => ({
          // Solo persistir step y fileName (para recovery)
          step: state.step,
          fileName: state.fileName,
        }),
      }
    ),
    { name: "NavigationStore" }
  )
);

// Selectors
export const selectStep = (state: NavigationState) => state.step;
export const selectCurrentIndex = (state: NavigationState) =>
  state.currentIndex;
export const selectSlideDirection = (state: NavigationState) =>
  state.slideDirection;
export const selectError = (state: NavigationState) => state.error;
export const selectFileName = (state: NavigationState) => state.fileName;
export const selectUploadedCount = (state: NavigationState) =>
  state.uploadedCount;
export const selectShowConfirmReset = (state: NavigationState) =>
  state.showConfirmReset;
