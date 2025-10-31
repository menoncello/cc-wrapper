import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Test environment detection
const isTestEnvironment =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof window !== 'undefined' && window.__vitest__ !== undefined);

interface TourState {
  // Tour active state
  isActive: boolean;

  // Current step (0-4 for 5 steps)
  currentTourStep: number;

  // Completion status
  hasCompletedTour: boolean;

  // Actions
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;

  // Total steps
  totalSteps: number;
}

const TOTAL_TOUR_STEPS = 5;

/**
 * Handles next step logic with tour completion
 * @param {TourState} state - Current tour state
 * @returns {Partial<TourState>} Updated state for next step
 */
function handleNextStep(state: TourState): Partial<TourState> {
  const nextStep = state.currentTourStep + 1;
  if (nextStep >= TOTAL_TOUR_STEPS) {
    // Tour completed
    return {
      isActive: false,
      currentTourStep: 0,
      hasCompletedTour: true
    };
  }
  return {
    currentTourStep: nextStep
  };
}

/**
 * Handles previous step logic with minimum step validation
 * @param {TourState} state - Current tour state
 * @returns {Partial<TourState>} Updated state for previous step
 */
function handlePreviousStep(state: TourState): Partial<TourState> {
  return {
    currentTourStep: Math.max(state.currentTourStep - 1, 0)
  };
}

/**
 * Handles tour completion/skip logic
 * @returns {Partial<TourState>} State for tour completion
 */
function handleTourCompletion(): Partial<TourState> {
  return {
    isActive: false,
    currentTourStep: 0,
    hasCompletedTour: true
  };
}

/**
 * Handles tour reset logic
 * @returns {Partial<TourState>} State for tour reset
 */
function handleTourReset(): Partial<TourState> {
  return {
    isActive: false,
    currentTourStep: 0,
    hasCompletedTour: false
  };
}

/**
 * Creates the tour store with all state and actions
 * @param {(fn: (state: TourState) => Partial<TourState>) => void} set - Zustand set function
 * @returns {Omit<TourState, 'startTour' | 'nextStep' | 'previousStep' | 'skipTour' | 'completeTour' | 'resetTour'>} Tour store state and actions
 */
function createTourStore(set: (fn: (state: TourState) => Partial<TourState>) => void): TourState {
  return {
    isActive: false,
    currentTourStep: 0,
    hasCompletedTour: false,
    totalSteps: TOTAL_TOUR_STEPS,

    startTour: (): void =>
      set(() => ({
        isActive: true,
        currentTourStep: 0
      })),

    nextStep: (): void => set(state => handleNextStep(state)),

    previousStep: (): void => set(state => handlePreviousStep(state)),

    skipTour: (): void => set(() => handleTourCompletion()),

    completeTour: (): void => set(() => handleTourCompletion()),

    resetTour: (): void => set(() => handleTourReset())
  };
}

export const useTourStore = create<TourState>()(
  persist((set, _get) => createTourStore(set), {
    name: 'tour-storage', // localStorage key
    storage: isTestEnvironment
      ? createJSONStorage(() => {
          // In test environment, use memory storage
          const memoryStorage: Record<string, string> = {};
          return {
            getItem: (key: string) => memoryStorage[key] || null,
            setItem: (key: string, value: string) => {
              memoryStorage[key] = value;
            },
            removeItem: (key: string) => {
              delete memoryStorage[key];
            }
          };
        })
      : undefined, // Use default localStorage in production
    partialize: state => ({
      hasCompletedTour: state.hasCompletedTour,
      isActive: state.isActive,
      currentTourStep: state.currentTourStep
    })
  })
);
