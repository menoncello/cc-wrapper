import { apiClient } from '@lib/api';
import { useTourStore } from '@stores/tour-store';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { tourSteps } from './tour-steps.config';
import { TourTooltip } from './tour-tooltip';

/* global HTMLElement */

/**
 * Constants for tour overlay positioning
 */
const TOUR_CONSTANTS = {
  /** Approximate tooltip height in pixels */
  TOOLTIP_HEIGHT: 250,
  /** Tooltip max-width in pixels */
  TOOLTIP_WIDTH: 600,
  /** Tooltip margin in pixels */
  TOOLTIP_MARGIN: 20,
  /** First tour step index */
  FIRST_STEP_INDEX: 0,
  /** Default offset for positioning */
  DEFAULT_OFFSET: 10,
  /** Viewport margin */
  VIEWPORT_MARGIN: 10,
  /** Division factor for centering */
  HALF_DIVISOR: 2,
  /** CSS positioning values */
  POSITION_ZERO: 0,
  /** Background color opacity */
  BACKGROUND_OPACITY: 0.5,
  /** Z-index for overlay */
  OVERLAY_Z_INDEX: 9998,
  /** Tour step adjustment constants */
  STEP_ADJUSTMENT: 1
} as const;

/** Position types for tooltip placement */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/** Tour step configuration interface */
interface TourStep {
  id: string;
  target: string;
  position: TooltipPosition;
  title: string;
  description: string;
}

/**
 * Gets scroll offsets from the window
 * @returns {object} Scroll top and left values
 */
const getScrollOffsets = (): { top: number; left: number } => ({
  top: window.pageYOffset || document.documentElement.scrollTop,
  left: window.pageXOffset || document.documentElement.scrollLeft
});

/**
 * Gets viewport dimensions
 * @returns {object} Viewport height and width
 */
const getViewportDimensions = (): { height: number; width: number } => ({
  height: window.innerHeight,
  width: window.innerWidth
});

/**
 * Calculates centered position for the first tour step
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @param {object} viewport - Viewport dimensions
 * @param {number} viewport.height - Viewport height
 * @param {number} viewport.width - Viewport width
 * @returns {object} Centered position coordinates
 */
const getCenteredPosition = (
  scrollOffsets: { top: number; left: number },
  viewport: { height: number; width: number }
): { top: number; left: number } => {
  const { TOOLTIP_HEIGHT, TOOLTIP_WIDTH, HALF_DIVISOR } = TOUR_CONSTANTS;

  return {
    top: scrollOffsets.top + (viewport.height - TOOLTIP_HEIGHT) / HALF_DIVISOR,
    left: scrollOffsets.left + (viewport.width - TOOLTIP_WIDTH) / HALF_DIVISOR
  };
};

/**
 * Calculates top position coordinates
 * @param {DOMRect} rect - Target element bounding rectangle
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @returns {object} Position coordinates for top placement
 */
const getTopPosition = (
  rect: DOMRect,
  scrollOffsets: { top: number; left: number }
): { top: number; left: number } => {
  const { TOOLTIP_HEIGHT, TOOLTIP_WIDTH, TOOLTIP_MARGIN, HALF_DIVISOR } = TOUR_CONSTANTS;
  const halfWidth = rect.width / HALF_DIVISOR;

  return {
    top: rect.top + scrollOffsets.top - TOOLTIP_HEIGHT - TOOLTIP_MARGIN,
    left: rect.left + scrollOffsets.left + halfWidth - TOOLTIP_WIDTH / HALF_DIVISOR
  };
};

/**
 * Calculates left position coordinates
 * @param {DOMRect} rect - Target element bounding rectangle
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @returns {object} Position coordinates for left placement
 */
const getLeftPosition = (
  rect: DOMRect,
  scrollOffsets: { top: number; left: number }
): { top: number; left: number } => {
  const { TOOLTIP_HEIGHT, TOOLTIP_WIDTH, TOOLTIP_MARGIN, HALF_DIVISOR } = TOUR_CONSTANTS;
  const halfHeight = rect.height / HALF_DIVISOR;

  return {
    top: rect.top + scrollOffsets.top + halfHeight - TOOLTIP_HEIGHT / HALF_DIVISOR,
    left: rect.left + scrollOffsets.left - TOOLTIP_WIDTH - TOOLTIP_MARGIN
  };
};

/**
 * Calculates right position coordinates
 * @param {DOMRect} rect - Target element bounding rectangle
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @returns {object} Position coordinates for right placement
 */
const getRightPosition = (
  rect: DOMRect,
  scrollOffsets: { top: number; left: number }
): { top: number; left: number } => {
  const { TOOLTIP_HEIGHT, TOOLTIP_MARGIN, HALF_DIVISOR } = TOUR_CONSTANTS;
  const halfHeight = rect.height / HALF_DIVISOR;

  return {
    top: rect.top + scrollOffsets.top + halfHeight - TOOLTIP_HEIGHT / HALF_DIVISOR,
    left: rect.right + scrollOffsets.left + TOOLTIP_MARGIN
  };
};

/**
 * Calculates bottom position coordinates
 * @param {DOMRect} rect - Target element bounding rectangle
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @returns {object} Position coordinates for bottom placement
 */
const getBottomPosition = (
  rect: DOMRect,
  scrollOffsets: { top: number; left: number }
): { top: number; left: number } => {
  const { TOOLTIP_WIDTH, TOOLTIP_MARGIN, HALF_DIVISOR } = TOUR_CONSTANTS;
  const halfWidth = rect.width / HALF_DIVISOR;

  return {
    top: rect.bottom + scrollOffsets.top + TOOLTIP_MARGIN,
    left: rect.left + scrollOffsets.left + halfWidth - TOOLTIP_WIDTH / HALF_DIVISOR
  };
};

/**
 * Calculates position based on tooltip placement preference
 * @param {DOMRect} rect - Target element bounding rectangle
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @param {TooltipPosition} position - Preferred tooltip position
 * @returns {object} Position coordinates
 */
const getPositionBasedCoordinates = (
  rect: DOMRect,
  scrollOffsets: { top: number; left: number },
  position: TooltipPosition
): { top: number; left: number } => {
  switch (position) {
    case 'top':
      return getTopPosition(rect, scrollOffsets);
    case 'left':
      return getLeftPosition(rect, scrollOffsets);
    case 'right':
      return getRightPosition(rect, scrollOffsets);
    default:
      // Default to bottom
      return getBottomPosition(rect, scrollOffsets);
  }
};

/**
 * Adjusts vertical position to stay within viewport bounds
 * @param {number} top - Current top position
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {object} viewport - Viewport dimensions
 * @param {number} viewport.height - Viewport height
 * @returns {number} Adjusted top position
 */
const adjustVerticalPosition = (
  top: number,
  scrollOffsets: { top: number },
  viewport: { height: number }
): number => {
  const { TOOLTIP_HEIGHT, TOOLTIP_MARGIN } = TOUR_CONSTANTS;

  // Adjust if above viewport
  if (top < scrollOffsets.top) {
    return scrollOffsets.top + TOOLTIP_MARGIN;
  }

  // Adjust if below viewport
  if (top + TOOLTIP_HEIGHT > scrollOffsets.top + viewport.height) {
    return scrollOffsets.top + viewport.height - TOOLTIP_HEIGHT - TOOLTIP_MARGIN;
  }

  return top;
};

/**
 * Adjusts horizontal position to stay within viewport bounds
 * @param {number} left - Current left position
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.left - Scroll left position
 * @param {object} viewport - Viewport dimensions
 * @param {number} viewport.width - Viewport width
 * @returns {number} Adjusted left position
 */
const adjustHorizontalPosition = (
  left: number,
  scrollOffsets: { left: number },
  viewport: { width: number }
): number => {
  const { TOOLTIP_WIDTH, TOOLTIP_MARGIN } = TOUR_CONSTANTS;

  // Adjust if left of viewport
  if (left < scrollOffsets.left) {
    return scrollOffsets.left + TOOLTIP_MARGIN;
  }

  // Adjust if right of viewport
  if (left + TOOLTIP_WIDTH > scrollOffsets.left + viewport.width) {
    return scrollOffsets.left + viewport.width - TOOLTIP_WIDTH - TOOLTIP_MARGIN;
  }

  return left;
};

/**
 * Adjusts position to ensure tooltip stays within viewport boundaries
 * @param {object} position - Current position coordinates
 * @param {number} position.top - Current top position
 * @param {number} position.left - Current left position
 * @param {object} scrollOffsets - Current scroll position
 * @param {number} scrollOffsets.top - Scroll top position
 * @param {number} scrollOffsets.left - Scroll left position
 * @param {object} viewport - Viewport dimensions
 * @param {number} viewport.height - Viewport height
 * @param {number} viewport.width - Viewport width
 * @returns {object} Adjusted position coordinates
 */
const adjustPositionToViewport = (
  position: { top: number; left: number },
  scrollOffsets: { top: number; left: number },
  viewport: { height: number; width: number }
): { top: number; left: number } => {
  const adjustedTop = adjustVerticalPosition(position.top, scrollOffsets, viewport);
  const adjustedLeft = adjustHorizontalPosition(position.left, scrollOffsets, viewport);

  return { top: adjustedTop, left: adjustedLeft };
};

/**
 * Calculates tooltip position based on element and step preferences
 * @param {HTMLElement} element - Target element for tooltip
 * @param {number} currentTourStep - Current tour step index
 * @returns {object} Position with top and left coordinates
 */
const calculateTooltipPosition = (
  element: HTMLElement,
  currentTourStep: number
): { top: number; left: number } => {
  const { FIRST_STEP_INDEX } = TOUR_CONSTANTS;
  const scrollOffsets = getScrollOffsets();
  const viewport = getViewportDimensions();

  // For the first step (welcome), center the tooltip on screen
  if (currentTourStep === FIRST_STEP_INDEX) {
    return getCenteredPosition(scrollOffsets, viewport);
  }

  const step = tourSteps[currentTourStep];
  const rect = element.getBoundingClientRect();

  const initialPosition = getPositionBasedCoordinates(
    rect,
    scrollOffsets,
    step.position as TooltipPosition
  );

  return adjustPositionToViewport(initialPosition, scrollOffsets, viewport);
};

/**
 * Handles tour completion by updating user profile
 * @returns {Promise<void>}
 */
const handleTourCompletion = async (): Promise<void> => {
  try {
    await apiClient.updateProfile({ tourCompleted: true });
  } catch {
    // Silently handle error - tour completion is not critical
  }
};

/**
 * Creates tour overlay styles for spotlight effect
 * @returns {React.CSSProperties} CSS properties for overlay
 */
const createSpotlightStyles = (): React.CSSProperties => {
  const { POSITION_ZERO, BACKGROUND_OPACITY, OVERLAY_Z_INDEX } = TOUR_CONSTANTS;

  return {
    position: 'fixed',
    top: POSITION_ZERO,
    left: POSITION_ZERO,
    right: POSITION_ZERO,
    bottom: POSITION_ZERO,
    backgroundColor: `rgba(0, 0, 0, ${BACKGROUND_OPACITY})`,
    zIndex: OVERLAY_Z_INDEX,
    pointerEvents: 'none'
  };
};

/**
 * Custom hook to manage tour target element and positioning
 * @param {boolean} isActive - Whether the tour is active
 * @param {number} currentTourStep - Current tour step index
 * @param {TourStep | undefined} currentStep - Current step configuration
 * @returns {object} Target element and tooltip position
 */
const useTourPositioning = (
  isActive: boolean,
  currentTourStep: number,
  currentStep: TourStep | undefined
): { targetElement: HTMLElement | null; tooltipPosition: { top: number; left: number } } => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({
    top: TOUR_CONSTANTS.POSITION_ZERO,
    left: TOUR_CONSTANTS.POSITION_ZERO
  });

  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }

    // Find target element
    const element = document.querySelector(currentStep.target) as HTMLElement | null;
    setTargetElement(element);

    if (element) {
      const position = calculateTooltipPosition(element, currentTourStep);
      setTooltipPosition(position);
    }
  }, [isActive, currentTourStep, currentStep]);

  return { targetElement, tooltipPosition };
};

/** Tour navigation functions interface */
interface TourNavigationFunctions {
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
}

/**
 * Creates tour step navigation handlers
 * @param {number} currentTourStep - Current tour step index
 * @param {TourNavigationFunctions} navigation - Tour navigation functions
 * @returns {object} Navigation handler functions
 */
const useTourNavigation = (
  currentTourStep: number,
  navigation: TourNavigationFunctions
): { handleNext: () => void; handlePrevious: () => void; handleSkip: () => void } => {
  const handleNext = (): void => {
    const { STEP_ADJUSTMENT } = TOUR_CONSTANTS;
    if (currentTourStep === tourSteps.length - STEP_ADJUSTMENT) {
      handleTourCompletion();
      navigation.completeTour();
    } else {
      navigation.nextStep();
    }
  };

  const handleSkip = (): void => {
    navigation.skipTour();
  };

  const handlePrevious = (): void => {
    if (currentTourStep > TOUR_CONSTANTS.FIRST_STEP_INDEX) {
      navigation.previousStep();
    }
  };

  return { handleNext, handlePrevious, handleSkip };
};

/** @ignore */
const TourTooltipPortal = ({
  currentStep,
  tooltipPosition,
  navigation,
  currentTourStep
}: {
  currentStep: TourStep;
  tooltipPosition: { top: number; left: number };
  navigation: { handleNext: () => void; handlePrevious: () => void; handleSkip: () => void };
  currentTourStep: number;
}): React.ReactElement =>
  createPortal(
    <div style={createSpotlightStyles()}>
      <TourTooltip
        step={currentStep}
        position={tooltipPosition}
        currentStepIndex={currentTourStep}
        totalSteps={tourSteps.length}
        onNext={navigation.handleNext}
        onPrevious={navigation.handlePrevious}
        onSkip={navigation.handleSkip}
        onEnd={() => {}} // Add empty onEnd handler
      />
    </div>,
    document.body
  );

/**
 * Tour overlay component that displays interactive tour tooltips
 * @returns {JSX.Element | null} Tour overlay JSX element or null if tour is inactive
 */
export const TourOverlay = (): React.ReactElement | null => {
  const { isActive, currentTourStep, nextStep, previousStep, skipTour, completeTour } =
    useTourStore();

  const currentStep = tourSteps[currentTourStep];

  if (!isActive || !currentStep) {
    return null;
  }

  const { targetElement, tooltipPosition } = useTourPositioning(
    isActive,
    currentTourStep,
    currentStep
  );

  if (!targetElement) {
    return null;
  }

  const navigation = useTourNavigation(currentTourStep, {
    nextStep,
    previousStep,
    skipTour,
    completeTour
  });

  return (
    <TourTooltipPortal
      currentStep={currentStep}
      tooltipPosition={tooltipPosition}
      navigation={navigation}
      currentTourStep={currentTourStep}
    />
  );
};
