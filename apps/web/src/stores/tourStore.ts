import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useTourStore = create<TourState>()(
  persist(
    set => ({
      isActive: false,
      currentTourStep: 0,
      hasCompletedTour: false,
      totalSteps: TOTAL_TOUR_STEPS,

      startTour: () =>
        set({
          isActive: true,
          currentTourStep: 0
        }),

      nextStep: () =>
        set(state => {
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
        }),

      previousStep: () =>
        set(state => ({
          currentTourStep: Math.max(state.currentTourStep - 1, 0)
        })),

      skipTour: () =>
        set({
          isActive: false,
          currentTourStep: 0,
          hasCompletedTour: true
        }),

      completeTour: () =>
        set({
          isActive: false,
          currentTourStep: 0,
          hasCompletedTour: true
        }),

      resetTour: () =>
        set({
          isActive: false,
          currentTourStep: 0,
          hasCompletedTour: false
        })
    }),
    {
      name: 'tour-storage' // localStorage key
    }
  )
);
