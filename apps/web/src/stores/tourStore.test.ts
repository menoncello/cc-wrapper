import { beforeEach, describe, expect, it } from 'bun:test';

import { useTourStore } from './tourStore';

describe('TourStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useTourStore.getState().resetTour();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTourStore.getState();

      expect(state.isActive).toBe(false);
      expect(state.currentTourStep).toBe(0);
      expect(state.hasCompletedTour).toBe(false);
      expect(state.totalSteps).toBe(5);
    });
  });

  describe('Start Tour', () => {
    it('should activate tour and reset step to 0', () => {
      const { startTour } = useTourStore.getState();

      startTour();

      const state = useTourStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.currentTourStep).toBe(0);
    });

    it('should reset step even if tour was in progress', () => {
      const { startTour, nextStep } = useTourStore.getState();

      // Start tour and advance a few steps
      startTour();
      nextStep();
      nextStep();

      // Restart tour
      startTour();

      expect(useTourStore.getState().currentTourStep).toBe(0);
    });
  });

  describe('Next Step', () => {
    it('should advance to next step', () => {
      const { startTour, nextStep } = useTourStore.getState();

      startTour();
      nextStep();

      expect(useTourStore.getState().currentTourStep).toBe(1);
    });

    it('should advance through all steps', () => {
      const { startTour, nextStep } = useTourStore.getState();

      startTour();

      for (let i = 1; i < 5; i++) {
        nextStep();
        expect(useTourStore.getState().currentTourStep).toBe(i);
      }
    });

    it('should complete tour after last step', () => {
      const { startTour, nextStep } = useTourStore.getState();

      startTour();

      // Advance through all 5 steps (0-4)
      for (let i = 0; i < 5; i++) {
        nextStep();
      }

      const state = useTourStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentTourStep).toBe(0);
      expect(state.hasCompletedTour).toBe(true);
    });
  });

  describe('Previous Step', () => {
    it('should go back to previous step', () => {
      const { startTour, nextStep, previousStep } = useTourStore.getState();

      startTour();
      nextStep();
      nextStep();

      expect(useTourStore.getState().currentTourStep).toBe(2);

      previousStep();
      expect(useTourStore.getState().currentTourStep).toBe(1);
    });

    it('should not go below step 0', () => {
      const { startTour, previousStep } = useTourStore.getState();

      startTour();
      previousStep();
      previousStep();

      expect(useTourStore.getState().currentTourStep).toBe(0);
    });
  });

  describe('Skip Tour', () => {
    it('should mark tour as completed and deactivate', () => {
      const { startTour, nextStep, skipTour } = useTourStore.getState();

      startTour();
      nextStep();
      nextStep();

      skipTour();

      const state = useTourStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentTourStep).toBe(0);
      expect(state.hasCompletedTour).toBe(true);
    });
  });

  describe('Complete Tour', () => {
    it('should mark tour as completed and deactivate', () => {
      const { startTour, nextStep, completeTour } = useTourStore.getState();

      startTour();
      nextStep();
      nextStep();

      completeTour();

      const state = useTourStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentTourStep).toBe(0);
      expect(state.hasCompletedTour).toBe(true);
    });
  });

  describe('Reset Tour', () => {
    it('should reset all tour state', () => {
      const { startTour, nextStep, skipTour, resetTour } = useTourStore.getState();

      // Complete tour
      startTour();
      nextStep();
      skipTour();

      // Verify tour is completed
      expect(useTourStore.getState().hasCompletedTour).toBe(true);

      // Reset
      resetTour();

      const state = useTourStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentTourStep).toBe(0);
      expect(state.hasCompletedTour).toBe(false);
    });
  });

  describe('Total Steps', () => {
    it('should have 5 total steps', () => {
      expect(useTourStore.getState().totalSteps).toBe(5);
    });
  });
});
