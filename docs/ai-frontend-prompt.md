# CC Wrapper AI Frontend Development Prompt

**Optimized for:** Vercel v0, Lovable.ai, and other AI frontend generation tools
**Target:** Modern web application with TypeScript and React
**Generated:** 2025-10-19

---

## Prompt Overview

Create a revolutionary AI developer productivity platform called "CC Wrapper" that optimizes wait-time productivity through intelligent task orchestration and multi-AI tool integration. The application features a unique three-column layout (terminal, browser, AI context) that delivers measurable productivity improvements within the first 5 minutes of use.

## Core Application Architecture

### Technology Stack Requirements
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with custom design system tokens
- **State Management:** Zustand for global state
- **Terminal:** xterm.js integration for web-based terminal
- **Animations:** Framer Motion for smooth interactions
- **Icons:** Lucide React for consistent iconography
- **Data Persistence:** LocalStorage with future API integration

### Design System Implementation

```css
/* Color Palette - Dark Developer Theme */
:root {
  /* Backgrounds */
  --bg-primary: #0D1117;
  --bg-secondary: #161B22;
  --bg-tertiary: #21262D;

  /* Accent Colors */
  --accent-primary: #0969DA;
  --accent-success: #1A7F37;
  --accent-warning: #D19A66;
  --accent-error: #DA3633;
  --accent-ai: #8B5CF6;

  /* Text Colors */
  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --text-tertiary: #6E7681;

  /* Typography */
  --font-primary: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

## Key Features to Implement

### 1. Three-Column Layout (Desktop)
- **Left Panel (30%):** Terminal interface with xterm.js integration
- **Center Panel (40%):** Web browser for documentation and AI interactions
- **Right Panel (30%):** AI context panel with conversation history and suggestions
- **Resizable Panels:** Drag-to-resize with minimum width constraints
- **Responsive Adaptation:** Single column on mobile, two columns on tablet

### 2. Progressive Onboarding Flow
```typescript
interface OnboardingData {
  userType: 'solo' | 'team' | 'enterprise';
  aiTools: string[];
  workspaceName: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}
```

### 3. AI Tool Integration Interface
- Multi-AI service connections (Claude, ChatGPT, GitHub Copilot)
- Real-time status indicators and rate limit monitoring
- Unified chat interface with conversation threading
- Intelligent tool switching based on context and cost

### 4. Wait-Time Optimization System
- AI response time monitoring (detects >30 seconds)
- Parallel task suggestions based on current project context
- Smart notification system for AI responses
- Productivity metrics tracking and visualization

### 5. Workspace Management
- Multiple workspace support with project isolation
- Session persistence and automatic recovery
- Workspace templates for different project types
- Quick workspace switching with recent projects

## Component Implementation Priority

### Phase 1: Core Infrastructure (High Priority)

#### Layout Component
```typescript
interface LayoutProps {
  children: React.ReactNode;
  activeWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
}
```

#### Terminal Component
```typescript
interface TerminalProps {
  onCommand: (command: string) => void;
  workspace: Workspace;
  theme: 'dark' | 'light';
}
```

#### AI Context Panel
```typescript
interface AIContextProps {
  conversations: Conversation[];
  activeConversation: string;
  onSendMessage: (message: string, tool: string) => void;
  suggestions: TaskSuggestion[];
}
```

#### Notification System
```typescript
interface NotificationProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}
```

### Phase 2: User Experience Features (Medium Priority)

#### Analytics Dashboard
```typescript
interface AnalyticsData {
  timeSaved: number;
  aiWaitTimeOptimized: number;
  tasksCompleted: number;
  costData: CostBreakdown;
  toolUsage: ToolUsageStats;
}
```

#### Settings Panel
```typescript
interface SettingsProps {
  userPreferences: UserPreferences;
  aiTools: AIToolConfig[];
  onSettingsUpdate: (settings: Partial<UserPreferences>) => void;
}
```

#### Cost Management
```typescript
interface CostManagerProps {
  budget: Budget;
  currentSpend: number;
  alerts: BudgetAlert[];
  onBudgetUpdate: (budget: Budget) => void;
}
```

## Critical User Interactions

### 1. AI Response Wait-Time Detection
```typescript
// Monitor AI response times and trigger suggestions
const useAIOptimization = () => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);

  useEffect(() => {
    if (isWaiting && waitTime > 30000) { // 30 seconds
      generateParallelTaskSuggestions();
    }
  }, [isWaiting, waitTime]);
};
```

### 2. Parallel Task Suggestions
```typescript
interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  category: 'code-review' | 'documentation' | 'testing' | 'research';
  priority: 'high' | 'medium' | 'low';
}
```

### 3. Session Persistence
```typescript
interface SessionData {
  workspace: Workspace;
  terminalState: TerminalSession;
  aiConversations: Conversation[];
  browserTabs: BrowserTab[];
  lastActivity: Date;
}
```

## Responsive Design Requirements

### Mobile Layout (< 768px)
- Single-column vertical stacking
- Bottom navigation for panel switching
- Touch-optimized interface (44px minimum touch targets)
- Swipe gestures for enhanced mobile interaction
- Progressive disclosure of advanced features

### Tablet Layout (768px - 1023px)
- Two-column layout with collapsible panels
- Adaptive panel prioritization based on context
- Touch + keyboard input support
- Split-screen multitasking support

### Desktop Layout (> 1024px)
- Full three-column layout with resizable panels
- Keyboard-first navigation for power users
- Multi-monitor support capabilities
- Advanced animations and micro-interactions

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Color Contrast:** Minimum 4.5:1 for normal text
- **Keyboard Navigation:** Full interface accessible via keyboard
- **Screen Reader Support:** Semantic HTML with ARIA labels
- **Focus Management:** Visible focus indicators and logical tab order
- **Reduced Motion:** Respect prefers-reduced-motion setting

### Implementation Checklist
- [ ] Semantic HTML5 elements (header, nav, main, section)
- [ ] ARIA labels for custom components
- [ ] Skip navigation links
- [ ] Focus trap for modals and dropdowns
- [ ] Live regions for dynamic content updates

## Performance Optimization

### Performance Targets
- **First Contentful Paint:** < 1.5 seconds
- **Time to Interactive:** < 3 seconds
- **Terminal Response Time:** < 100ms
- **Animation Frame Rate:** 60 FPS
- **Bundle Size:** < 2MB initial load

### Optimization Strategies
- Code splitting with React.lazy()
- Service Worker for offline functionality
- Image optimization and lazy loading
- Component memoization with React.memo()
- Virtual scrolling for large lists

## Implementation Guidelines

### 1. Component Architecture
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   ├── terminal/        # Terminal-related components
│   ├── ai/              # AI integration components
│   └── analytics/       # Analytics dashboard components
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # Global styles and design tokens
```

### 2. State Management Pattern
```typescript
// Global state with Zustand
interface AppStore {
  // User state
  user: User | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;

  // AI state
  aiTools: AITool[];
  conversations: Conversation[];
  activeConversation: string | null;

  // UI state
  layout: LayoutConfig;
  notifications: Notification[];
  settings: UserSettings;

  // Actions
  setActiveWorkspace: (workspace: Workspace) => void;
  sendMessage: (message: string, toolId: string) => void;
  updateLayout: (layout: Partial<LayoutConfig>) => void;
}
```

### 3. Error Handling Strategy
```typescript
// Error boundary for component-level error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Send error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Testing (Jest + React Testing Library)
- Component rendering and interaction tests
- Hook behavior validation
- Utility function testing
- State management tests

### Integration Testing
- Component integration scenarios
- API integration mock testing
- User flow testing
- Cross-component state synchronization

### E2E Testing (Playwright)
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness testing
- Accessibility testing

## Deployment Considerations

### Build Optimization
- Tree shaking for unused code elimination
- Code compression with Terser
- Image optimization and format conversion
- CSS optimization and purging

### Security Implementation
- Content Security Policy (CSP) headers
- XSS protection with input sanitization
- Secure storage for API keys and tokens
- HTTPS enforcement and secure cookies

### Monitoring and Analytics
- Performance monitoring with Core Web Vitals
- Error tracking and reporting
- User behavior analytics
- Usage metrics for optimization

---

## Getting Started with Development

### 1. Initialize Project
```bash
npx create-react-app cc-wrapper --template typescript
cd cc-wrapper
npm install @tanstack/react-query zustand
npm install xterm xterm-addon-fit xterm-addon-web-links
npm install framer-motion lucide-react
npm install -D tailwindcss @types/node
```

### 2. Setup Tailwind CSS
```bash
npx tailwindcss init -p
```

### 3. Configure Design System
Create `tailwind.config.js` with custom design tokens from the specification above.

### 4. Component Development Order
1. Layout components and design system setup
2. Terminal integration with xterm.js
3. AI context panel and chat interface
4. Notification system and toast components
5. Analytics dashboard components
6. Settings and configuration panels

### 5. Integration Testing
- Test three-column layout responsiveness
- Verify terminal functionality
- Test AI tool integration flows
- Validate wait-time optimization features
- Check accessibility compliance

## Success Metrics

### Technical Metrics
- **Performance:** Lighthouse scores > 90 across all categories
- **Accessibility:** WCAG 2.1 AA compliance with 100% keyboard accessibility
- **Bundle Size:** < 2MB initial load, < 500KB per additional route
- **Error Rate:** < 0.1% JavaScript errors in production

### User Experience Metrics
- **Time to First Value:** < 5 minutes for new users
- **Onboarding Completion:** > 85% within first session
- **User Retention:** > 70% after first week
- **Productivity Impact:** Measurable time savings in user workflows

---

## Next Steps After Implementation

1. **Visual Design Enhancement:** Apply high-fidelity designs from Figma
2. **Advanced Features:** Implement team collaboration and enterprise features
3. **Performance Optimization:** Advanced caching and optimization strategies
4. **Testing Expansion:** Comprehensive accessibility and cross-browser testing
5. **Deployment:** CI/CD pipeline setup and production deployment

This AI Frontend Prompt provides a comprehensive foundation for building the CC Wrapper application with modern web technologies, ensuring a delightful user experience while maintaining high performance and accessibility standards.

---

**Generated with:** CC Wrapper UX/UI Specification
**Last Updated:** 2025-10-19
**Author:** Eduardo Menoncello