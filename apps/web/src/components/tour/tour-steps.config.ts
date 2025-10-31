export interface TourStepConfig {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const tourSteps: TourStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to CC Wrapper',
    description:
      'CC Wrapper helps you optimize your wait time when working with AI tools. Let us show you around!',
    target: 'body',
    position: 'bottom'
  },
  {
    id: 'terminal-panel',
    title: 'Terminal Panel',
    description:
      'This is where your AI tasks execute in real-time. Monitor output and progress here.',
    target: '[data-tour="terminal-panel"]',
    position: 'right'
  },
  {
    id: 'browser-panel',
    title: 'Browser Panel',
    description: 'Visual feedback, debugging, and development tools appear in this panel.',
    target: '[data-tour="browser-panel"]',
    position: 'left'
  },
  {
    id: 'context-panel',
    title: 'AI Context Panel',
    description:
      'View your conversation history and switch between different AI contexts seamlessly.',
    target: '[data-tour="context-panel"]',
    position: 'bottom'
  },
  {
    id: 'optimization-features',
    title: 'Wait-Time Optimization',
    description:
      'Get automatic task suggestions and productivity metrics while AI processes your requests.',
    target: '[data-tour="optimization-panel"]',
    position: 'bottom'
  }
];
