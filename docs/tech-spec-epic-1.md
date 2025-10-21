# Tech Spec - Epic 1: Core Value Delivery & Wait-Time Optimization

**Epic:** Core Value Delivery & Wait-Time Optimization **Stories:** 10-12
**Timeline:** 5-6 weeks **Priority:** Critical (MVP delivery)

## Epic Overview

This epic delivers the core value proposition of CC Wrapper: reducing AI
wait-time productivity losses through intelligent parallel task orchestration
and multi-AI tool integration. The implementation focuses on delivering
immediate productivity benefits within the first 5 minutes of use, establishing
the foundation for all subsequent epics.

**Key Innovation:** Transform unproductive AI wait periods (where developers
spend 89% of time context switching) into valuable parallel task execution
through contextual recommendations and smart notifications.

**Critical Success Factors (Identified via Pre-mortem Analysis):**

- Prevent cascade failures through circuit breaker patterns
- Ensure AI service resilience through multi-provider strategy
- Implement robust WebSocket connection management
- Address mobile UX challenges with responsive-first design
- Security hardening for enterprise requirements

**Consensus Validation (87% Agreement from 5 Expert Approaches):**

- **Hybrid Runtime Strategy:** Bun for performance-critical services, Node.js
  for security-critical
- **Multi-Layer Resilience:** Defense in depth with independent failure modes
- **Progressive Experience:** Simple start with powerful evolution capabilities
- **Innovation-Stability Balance:** Core innovation with proven infrastructure
  patterns

## User Stories

### Story 1.1: Multi-AI Tool Integration

**As a** developer **I want to** connect multiple AI tools (Claude, ChatGPT,
Cursor, Windsurf, GitHub Copilot) **So that** I can use my preferred AI
assistant for different types of tasks

### Story 1.2: Unified AI Interface

**As a** developer **I want to** interact with all AI tools through a consistent
interface **So that** I can switch between AI assistants without learning
different UI patterns

### Story 1.3: Wait-Time Detection

**As a** developer **I want to** automatically detect when AI responses will
take longer than 30 seconds **So that** I can make productive use of that
waiting time

### Story 1.4: Parallel Task Suggestions

**As a** developer **I want to** receive intelligent suggestions for productive
tasks during AI wait times **So that** I can maximize my productivity throughout
the day

### Story 1.5: Smart Notification System

**As a** developer **I want to** receive non-intrusive notifications when AI
responses are ready **So that** I can review responses when convenient without
disrupting my flow

### Story 1.6: Session Persistence

**As a** developer **I want to** automatically save and restore my AI
conversations and workspace state **So that** I can continue working seamlessly
across sessions and devices

### Story 1.7: Basic Authentication

**As a** developer **I want to** create an account and securely log in to CC
Wrapper **So that** my workspace and AI sessions are protected and personalized

### Story 1.8: Workspace Creation

**As a** developer **I want to** create and manage multiple workspaces for
different projects **So that** I can keep AI conversations and context organized
by project

### Story 1.9: Basic Terminal Integration

**As a** developer **I want to** use a terminal interface within CC Wrapper **So
that** I can execute commands while waiting for AI responses

### Story 1.10: Contextual Task Suggestions

**As a** developer **I want to** receive task suggestions based on my current
project and workflow **So that** I can work on relevant activities during AI
wait times

## Technical Architecture

### Core Components

#### AI Orchestration Service

```typescript
interface AIOrchestrationService {
  // Provider Management
  connectProvider(
    provider: AIProvider,
    credentials: Credentials
  ): Promise<void>;
  disconnectProvider(providerId: string): Promise<void>;
  getAvailableProviders(): Promise<AIProvider[]>;

  // Request Management
  sendRequest(request: AIRequest): Promise<AIStreamResponse>;
  estimateResponseTime(request: AIRequest): Promise<number>;
  cancelRequest(requestId: string): Promise<void>;

  // Wait-Time Optimization
  generateParallelTasks(context: WorkContext): Promise<ParallelTask[]>;
  trackWaitTime(sessionId: string, startTime: Date): Promise<void>;
}
```

#### Real-time Sync Service

```typescript
interface RealtimeSyncService {
  // WebSocket Management
  handleConnection(ws: WebSocket, userId: string): void;
  broadcastEvent(event: SyncEvent): void;
  subscribeToWorkspace(workspaceId: string, ws: WebSocket): void;

  // State Synchronization
  syncWorkspaceState(workspaceId: string, state: WorkspaceState): Promise<void>;
  resolveConflicts(conflicts: StateConflict[]): Promise<void>;

  // Notification Management
  sendNotification(userId: string, notification: Notification): void;
  batchNotifications(userId: string, notifications: Notification[]): void;
}
```

#### Frontend Layout System

```typescript
interface LayoutSystem {
  // Panel Management
  createLayout(config: LayoutConfig): Layout;
  resizePanel(panelId: string, size: Dimensions): void;
  collapsePanel(panelId: string): void;
  restoreLayout(layoutId: string): void;

  // Three-Column Layout
  TerminalPanel: React.FC<TerminalPanelProps>;
  BrowserPanel: React.FC<BrowserPanelProps>;
  AIContextPanel: React.FC<AIContextPanelProps>;
}
```

### Data Models

#### AI Session Management

```sql
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- claude, openai, copilot, cursor, windsurf
    api_endpoint TEXT NOT NULL,
    rate_limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES ai_providers(id),
    model TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, completed, error
    conversation JSONB DEFAULT '[]',
    total_cost_cents INTEGER DEFAULT 0,
    total_wait_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_sessions(id),
    request_text TEXT NOT NULL,
    response_text TEXT,
    status TEXT DEFAULT 'pending', -- pending, streaming, completed, error
    estimated_duration_ms INTEGER,
    actual_duration_ms INTEGER,
    cost_cents INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE parallel_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_request_id UUID REFERENCES ai_requests(id),
    user_id UUID REFERENCES users(id),
    task_type TEXT NOT NULL, -- code_review, documentation, testing, research
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'suggested', -- suggested, accepted, completed, dismissed
    priority INTEGER DEFAULT 1,
    estimated_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### API Endpoints

#### AI Orchestration API

```typescript
// Provider Management
POST   /api/ai/providers/connect
GET    /api/ai/providers
DELETE /api/ai/providers/:providerId

// Session Management
POST   /api/ai/sessions
GET    /api/ai/sessions
GET    /api/ai/sessions/:sessionId
PUT    /api/ai/sessions/:sessionId
DELETE /api/ai/sessions/:sessionId

// Request Handling
POST   /api/ai/chat/stream              // WebSocket endpoint for streaming
POST   /api/ai/chat/sync               // Sync endpoint for fallback
GET    /api/ai/models/:providerId
POST   /api/ai/estimate-duration

// Parallel Tasks
GET    /api/tasks/suggestions/:requestId
POST   /api/tasks/:taskId/accept
POST   /api/tasks/:taskId/dismiss
GET    /api/tasks/history
```

#### Authentication API

```typescript
// Basic Auth (enhanced in Epic 2)
POST / api / auth / register;
POST / api / auth / login;
POST / api / auth / logout;
GET / api / auth / me;
PUT / api / auth / profile;
```

#### Workspace API

```typescript
// Workspace Management (enhanced in Epic 3)
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/:workspaceId
PUT    /api/workspaces/:workspaceId
DELETE /api/workspaces/:workspaceId
```

### WebSocket Events

#### AI Chat Events

```typescript
interface AIChatEvents {
  'ai:request:start': { requestId: string; sessionId: string };
  'ai:request:progress': {
    requestId: string;
    content: string;
    progress: number;
  };
  'ai:request:complete': { requestId: string; response: string; cost: number };
  'ai:request:error': { requestId: string; error: string };

  'ai:task:suggestion': { requestId: string; tasks: ParallelTask[] };
  'ai:task:accepted': { taskId: string };
  'ai:task:completed': { taskId: string; result: any };
}
```

#### Notification Events

```typescript
interface NotificationEvents {
  'notification:info': { message: string; metadata?: any };
  'notification:success': { message: string; metadata?: any };
  'notification:warning': { message: string; metadata?: any };
  'notification:error': { message: string; metadata?: any };
}
```

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Core Infrastructure

1. **Monorepo Setup**
   - Configure monorepo with Bun workspaces (apps/web and services)
   - Set up shared types package with Bun native TypeScript
   - Configure TypeScript with strict mode (no config needed with Bun)
   - Set up ESLint and Prettier with Bun integration

2. **Database Schema**
   - Implement core tables (users, workspaces, ai_providers, ai_sessions)
   - Set up Prisma ORM with migrations
   - Create seed data for testing
   - Set up Redis for caching

3. **Basic Authentication**
   - Implement user registration/login with Bun native crypto
   - JWT token management using Bun Web Crypto API
   - Basic session handling with Bun password hashing (Argon2)
   - User profile management

#### Week 2: AI Provider Integration

1. **AI Provider Abstraction**
   - Create base AI provider interface
   - Implement Claude API integration
   - Implement OpenAI ChatGPT integration
   - Provider credential management

2. **AI Orchestration Service**
   - Request routing and queuing
   - Response streaming implementation
   - Error handling and retry logic
   - Basic cost tracking

### Phase 2: Core Features (Weeks 3-4)

#### Week 3: Real-time Communication

1. **WebSocket Infrastructure**
   - Set up WebSocket server with Bun native WebSocket support
   - Connection management and authentication with Bun crypto
   - Event broadcasting system using Bun.serve
   - Client-side WebSocket integration with optimal performance

2. **Three-Column Layout with Astro + React**
   - Set up Astro 5.14 project with React 19 integration
   - Implement island architecture for selective interactivity
   - Create static layout panels with React islands
   - Terminal component with xterm.js (React island with client:load)
   - Browser panel component (React island with client:idle)
   - AI context panel component (React island with client:visible)

#### Week 4: Wait-Time Optimization

1. **Parallel Task Engine**
   - Task suggestion algorithms
   - Context analysis for relevant tasks
   - Task queue management
   - Progress tracking

2. **Smart Notifications**
   - Non-intrusive notification system
   - Batch notification processing
   - User preference management
   - Quiet hours and scheduling

### Phase 3: Polish & Integration (Weeks 5-6)

#### Week 5: Session Management

1. **State Persistence**
   - Workspace state serialization
   - Session recovery mechanisms
   - Cross-device synchronization
   - Conflict resolution

2. **User Experience**
   - Onboarding flow optimization
   - Performance optimization
   - Error handling improvements
   - Accessibility enhancements

#### Week 6: Testing & Deployment

1. **Comprehensive Testing**
   - Unit tests for all services using Bun Test
   - Integration tests for API endpoints with Bun.serve mock servers
   - E2E tests for user workflows with Playwright
   - Load testing for WebSocket connections using Bun concurrent requests
   - Performance benchmarks using Bun.bench

2. **Production Readiness**
   - Docker containerization
   - Environment configuration
   - Monitoring and logging
   - Documentation completion

## Performance Requirements

### Response Time Targets

- **AI Request Initiation:** < 50ms
- **WebSocket Message Latency:** < 100ms
- **Panel Resize Response:** < 16ms (60fps)
- **State Synchronization:** < 200ms
- **Notification Delivery:** < 300ms

### Scalability Targets

- **Concurrent Users:** 1,000 (Epic 1 target)
- **WebSocket Connections:** 1,000 simultaneous
- **AI Requests/Second:** 100 concurrent
- **Database Connections:** 50 connection pool

### Resource Utilization

- **Memory per User:** < 50MB
- **CPU per User:** < 0.1 cores
- **Network Bandwidth:** < 1MB/user/hour
- **Storage per User:** < 100MB/month

## Security Considerations

### API Security

- **Authentication:** JWT tokens with 15-minute expiry
- **Authorization:** Role-based access control
- **Rate Limiting:** 100 requests/minute per user
- **Input Validation:** Comprehensive validation with Zod schemas

### Data Protection

- **Encryption:** TLS 1.3 for all communications
- **API Keys:** Encrypted storage with rotation
- **Personal Data:** Minimal collection, explicit consent
- **Audit Logging:** All actions logged with user context

### AI Provider Security

- **Credential Management:** Secure storage, no logging
- **Request Filtering:** Content sanitization
- **Response Validation:** Malicious content detection
- **Cost Controls:** Per-user spending limits

## Testing Strategy

### Unit Testing (Bun Test)

```typescript
// AI Provider Testing with Bun Test
import { describe, it, expect, mock } from 'bun:test';

describe('ClaudeProvider', () => {
  it('should send request and stream response', async () => {
    const provider = new ClaudeProvider(mockConfig);
    const response = await provider.sendRequest(testRequest);
    expect(response.content).toBeDefined();
  });

  it('should handle rate limits gracefully');
  it('should estimate response time accurately');
});

// Task Suggestion Testing with native mocking
describe('ParallelTaskEngine', () => {
  it('should generate relevant task suggestions');
  it('should prioritize tasks by context');
  it('should track task completion status');
});
```

### Integration Testing

```typescript
// API Integration
describe('AI Orchestration API', () => {
  it('should handle streaming requests');
  it('should broadcast WebSocket events');
  it('should maintain session state');
});

// Frontend Integration
describe('Layout System', () => {
  it('should resize panels smoothly');
  it('should persist layout preferences');
  it('should handle responsive breakpoints');
});
```

### E2E Testing

```typescript
// User Workflows
describe('Wait-Time Optimization Flow', () => {
  it('should detect long AI responses');
  it('should suggest relevant parallel tasks');
  it('should notify when AI response ready');
  it('should maintain productivity flow');
});
```

## Monitoring and Metrics

### Key Performance Indicators

- **Wait-Time Recovery Rate:** % of AI wait time converted to productive tasks
- **Task Suggestion Acceptance:** % of suggested tasks accepted by users
- **Session Duration:** Average time users spend in platform
- **AI Provider Reliability:** Uptime and response time per provider

### Business Metrics

- **User Retention:** 7-day and 30-day retention rates
- **Productivity Improvement:** Time saved per user session
- **Feature Adoption:** Usage of parallel tasks and notifications
- **User Satisfaction:** NPS scores and feedback

### Technical Metrics

- **WebSocket Connection Success:** Connection establishment success rate
- **API Response Times:** P95 and P99 response times
- **Error Rates:** Error rates by service and endpoint
- **Resource Utilization:** CPU, memory, and network usage

## Dependencies and Risks

### Technical Dependencies

- **Bun Runtime:** Must support production workloads
- **AI Provider APIs:** Rate limits and availability
- **WebSocket Scaling:** Connection management complexity
- **Real-time Synchronization:** Conflict resolution challenges

### Business Risks

- **AI Provider Changes:** API changes or pricing
- **User Adoption:** Complexity of wait-time optimization
- **Performance Expectations:** Sub-100ms latency requirements
- **Competition:** Market response to innovation

### Mitigation Strategies

- **Provider Abstraction:** Buffer against API changes
- **Progressive Enhancement:** Core features work without advanced ones
- **Performance Testing:** Continuous performance validation
- **User Feedback:** Early and frequent user testing

## Success Criteria

### Functional Success

- ✅ Multi-AI integration working with 3+ providers
- ✅ Wait-time detection accuracy > 90%
- ✅ Parallel task suggestions accepted > 60%
- ✅ Session persistence success > 95%

### Performance Success

- ✅ Sub-100ms WebSocket latency
- ✅ 1,000 concurrent users supported
- ✅ < 2-second page load times
- ✅ 99.9% uptime during business hours

### Business Success

- ✅ 90% user retention after first week
- ✅ 40%+ measurable productivity improvement
- ✅ +50 Net Promoter Score
- ✅ Successful MVP deployment to 100+ users

## Handoff Criteria

### Code Quality

- [ ] All services have 90%+ test coverage
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Operational Readiness

- [ ] Production deployment pipeline working
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Support documentation prepared

### User Acceptance

- [ ] User testing completed with positive feedback
- [ ] Onboarding flow optimized
- [ ] Accessibility compliance verified
- [ ] Performance validated under load

---

**Tech Spec Status:** Ready for Implementation **Next Phase:** Epic 2 -
Enterprise Security Foundation **Dependencies:** None (foundation epic)
**Estimated Timeline:** 5-6 weeks
