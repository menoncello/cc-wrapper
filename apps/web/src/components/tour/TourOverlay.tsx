import { apiClient } from '@lib/api';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useTourStore } from '@stores/tourStore';
import { tourSteps } from './tourSteps.config';
import TourTooltip from './TourTooltip';

export default function TourOverlay() {
  const { isActive, currentTourStep, nextStep, previousStep, skipTour, completeTour } =
    useTourStore();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const currentStep = tourSteps[currentTourStep];

  useEffect(() => {
    if (!isActive || !currentStep) {
      return;
    }

    // Find target element
    const element = document.querySelector(currentStep.target) as HTMLElement | null;
    setTargetElement(element);

    if (element) {
      // Calculate spotlight and tooltip position
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Position tooltip based on step position preference
      const tooltipHeight = 250; // Approximate tooltip height
      const tooltipWidth = 600; // Tooltip max-width
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let top = rect.top + scrollTop;
      let left = rect.left + scrollLeft;

      // For the first step (welcome), center the tooltip on screen
      if (currentTourStep === 0) {
        top = scrollTop + (viewportHeight - tooltipHeight) / 2;
        left = scrollLeft + (viewportWidth - tooltipWidth) / 2;
      } else {
        switch (currentStep.position) {
          case 'top':
            top = rect.top + scrollTop - tooltipHeight - 20; // Tooltip above
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollTop + 20; // Tooltip below
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollLeft - tooltipWidth - 20; // Tooltip to the left
            break;
          case 'right':
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + scrollLeft + 20; // Tooltip to the right
            break;
        }

        // Ensure tooltip stays within viewport bounds
        // Check if tooltip would go below viewport
        if (top - scrollTop + tooltipHeight > viewportHeight) {
          top = viewportHeight - tooltipHeight + scrollTop - 20;
        }

        // Check if tooltip would go above viewport
        if (top < scrollTop) {
          top = scrollTop + 20;
        }

        // Check if tooltip would go off right edge
        if (left + tooltipWidth > viewportWidth) {
          left = viewportWidth - tooltipWidth - 20;
        }

        // Check if tooltip would go off left edge
        if (left < 0) {
          left = 20;
        }
      }

      setTooltipPosition({ top, left });

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStep, currentTourStep]);

  const handleSkip = async () => {
    skipTour();
    await apiClient.updateProfile({ tourCompleted: true });
  };

  const handleComplete = async () => {
    completeTour();
    await apiClient.updateProfile({ tourCompleted: true });
  };

  if (!isActive || !currentStep) {
    return null;
  }

  const overlayContent = (
    <>
      {/* Dark overlay */}
      <div className="tour-overlay" />

      {/* Spotlight effect */}
      {targetElement && (
        <div
          className="tour-spotlight"
          style={{
            top: `${targetElement.getBoundingClientRect().top + window.pageYOffset}px`,
            left: `${targetElement.getBoundingClientRect().left + window.pageXOffset}px`,
            width: `${targetElement.getBoundingClientRect().width}px`,
            height: `${targetElement.getBoundingClientRect().height}px`
          }}
        />
      )}

      {/* Tooltip */}
      <div className="tour-tooltip-container" style={tooltipPosition}>
        <TourTooltip
          step={currentStep}
          currentStepIndex={currentTourStep}
          totalSteps={tourSteps.length}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={handleSkip}
          onEnd={handleComplete}
        />
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(overlayContent, document.body) : null;
}
