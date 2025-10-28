# CC Wrapper Developer Onboarding Guide

**Author:** Eduardo Menoncello **Date:** 2025-10-19 **Target Audience:** New
developers joining CC Wrapper project **Required Background:** Intermediate
TypeScript/JavaScript, basic React, some backend experience

---

## 🚀 Welcome to CC Wrapper!

CC Wrapper is a revolutionary enterprise SaaS platform that solves the $2.1B
annual productivity crisis in AI-assisted development. Our core innovation
converts unproductive AI wait periods (where developers spend 89% of time
context switching) into valuable parallel task execution.

This guide will help you understand our architecture decisions and get
productive quickly.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Development Environment Setup](#development-environment-setup)
5. [Code Organization](#code-organization)
6. [Key Architectural Patterns](#key-architectural-patterns)
7. [Development Workflow](#development-workflow)
8. [Testing Strategy](#testing-strategy)
9. [Common Questions](#common-questions)
10. [Resources](#resources)

---

## 🎯 Project Overview

### What We're Building

CC Wrapper is a **hybrid TUI/web platform** with a unique three-column layout:

```
┌─────────────────────────────────────────────────────────┐
│  Terminal Panel    │    Browser Panel    │  AI Context   │
│  (30% width)       │     (40% width)     │   (30% width) │
│                   │                     │               │
│  • xterm.js       │  • Web browser      │  • Chat history│
│  • Command exec   │  • Documentation    │  • Suggestions │
│  • File system    │  • AI interactions  │  • Cost tracking│
│  • Git operations │  • Preview tools    │  • Notifications│
└─────────────────────────────────────────────────────────┘
```

### Core Value Proposition

1. **Wait-Time Optimization**: Transform 89% of unproductive AI wait time into
   parallel task execution
2. **Multi-AI Integration**: Unified interface for Claude, ChatGPT, Copilot,
   Cursor, Windsurf
3. **Real-time Sync**: Sub-100ms synchronization between terminal and web
   interfaces
4. **Enterprise Security**: Role-based access control, audit logging, compliance

### Target Users

- **Enterprise Alex**: Large organization with multiple AI tools, security
  requirements
- **SMB Sarah**: Small/medium team needing cost optimization and workflow
  efficiency
- **Independent Ian**: Solo developer maximizing productivity across AI tools

---

## 🏗️ Architecture Philosophy

### Key Principles

1. **Performance First**: Sub-100ms real-time synchronization
2. **Developer Experience**: Familiar terminal patterns with modern web
   capabilities
3. **Enterprise Ready**: Security, scalability, compliance built-in
4. **Microservices**: Independent services for scalability and team coordination
5. **Type Safety**: End-to-end TypeScript with shared types

### Why This Architecture?

#### Decision 1: Microservices with Event-Driven Patterns

**Problem**: Need to support 10K+ concurrent users with real-time requirements
**Solution**: Independent services communicating via events and REST APIs
**Benefits**:

- Scalability (scale individual services)
- Fault isolation (one service failure doesn't crash everything)
- Team coordination (different teams can work on different services)

#### Decision 2: Bun Runtime + Elysia Framework

**Problem**: Node.js performance limitations for real-time features
**Solution**: Bun runtime with Elysia framework **Benefits**:

- 4x faster startup time
- 50% less memory usage
- Native TypeScript support
- Built-in testing and tooling

#### Decision 3: Astro + React Hybrid Architecture

**Problem**: Traditional React apps are heavy and slow to load **Solution**:
Astro with React islands for selective interactivity **Benefits**:

- 50-70% smaller JavaScript bundles
- Server-first rendering with instant paint
- Progressive hydration based on user interaction
- Better Core Web Vitals scores

#### Decision 4: Three-Column Layout

**Problem**: Developers lose terminal context when using web-based AI tools
**Solution**: Hybrid interface keeping terminal visible while providing web
capabilities **Benefits**:

- Maintains developer workflow patterns
- Immediate productivity (no learning curve)
- Unique market differentiation
- Addresses specific pain point of context switching

---

## 💻 Technology Stack Deep Dive

### Runtime and Framework

#### Bun Runtime 1.3.0

```bash
# Why Bun?
- 4x faster than Node.js
- 50% less memory usage
- Native TypeScript support
- Built-in package manager, test runner, bundler
- Excellent WebSocket support
```

#### Elysia Framework 1.4.12

```typescript
// Why Elysia?
import { Elysia } from 'elysia';

const app = new Elysia().get('/', () => 'Hello CC Wrapper').listen(3000);

// Benefits:
// - Built specifically for Bun
// - Extreme performance (2x faster than Express)
// - Enhanced type safety
// - Automatic OpenAPI documentation
// - Plugin system for easy extension
```

### Frontend Stack

#### Astro + React Island Architecture

```typescript
// astro.config.mjs
export default defineConfig({
  integrations: [react()],
  output: 'hybrid', // Static + server-rendered pages
  vite: {
    plugins: []
  }
});
```

**Island Architecture Explained:**

```astro
---
// MainLayout.astro - Static HTML shell
---
<html>
  <body>
    <header>Static Header</header>
    <main>
      <TerminalInteractive client:load />  <!-- Immediate hydration -->
      <BrowserInteractive client:idle />   <!-- Hydrate after load -->
      <AIContextInteractive client:visible /> <!-- Hydrate when visible -->
    </main>
  </body>
</html>
```

### Database and Caching

#### PostgreSQL 18.0 + Redis 8.2.2

```sql
-- Why PostgreSQL?
-- 3x performance improvement with AIO
-- JSONB support for flexible schemas
-- Excellent reliability and tooling
-- ACID compliance for data integrity

-- Why Redis?
-- Sub-microsecond latency for real-time features
-- Pub/sub for WebSocket scaling
-- Session storage and caching
-- Vector support for future AI features
```

### Development Tools

#### Testing Strategy: Bun Test + Playwright

```typescript
// Bun Test for unit/integration tests
import { test, expect } from 'bun:test';

test('AI service responds correctly', async () => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'test' })
  });
  expect(response.status).toBe(200);
});

// Playwright for E2E tests
import { test, expect } from '@playwright/test';

test('user can chat with AI', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="ai-input"]', 'Hello AI');
  await page.click('[data-testid="send-button"]');
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
});
```

---

## 🛠️ Development Environment Setup

### Prerequisites

```bash
# Required tools
- Bun 1.3.0+
- Docker 28.5.1+
- Docker Compose 2.27.0+
- Git
- VS Code (recommended)
```

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd ccwrapper

# 2. Install dependencies
bun install

# 3. Start development environment
bun run dev

# 4. Open application
# Frontend: http://localhost:20000
# Auth Service: http://localhost:20001
# Workspace Service: http://localhost:20002
# AI Service: http://localhost:200003
```

### Development Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Services started:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - Auth Service (port 3001)
# - Workspace Service (port 3002)
# - AI Service (port 3003)
# - Analytics Service (port 3004)
# - Notification Service (port 3005)
# - Frontend (port 20000)
```

### Environment Configuration

```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/ccwrapper"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
AI_PROVIDERS_API_KEYS="claude:xxx,openai:yyy,copilot:zzz"
```

---

## 📁 Code Organization

### Monorepo Structure

```
ccwrapper/
├── apps/                          # Applications
│   ├── web/                      # Main frontend (Astro + React)
│   ├── auth-service/             # Authentication microservice
│   ├── workspace-service/        # Workspace management
│   ├── ai-service/               # AI orchestration
│   ├── analytics-service/        # Analytics and reporting
│   └── notification-service/     # Notification system
├── packages/                     # Shared code
│   ├── shared-types/             # TypeScript definitions
│   ├── ui-components/            # Reusable UI components
│   ├── utils/                    # Utility functions
│   └── config/                   # Shared configuration
├── docs/                         # Documentation
├── infrastructure/               # Deployment configs
└── scripts/                      # Build/deployment scripts
```

### Frontend Structure (apps/web)

```
apps/web/
├── src/
│   ├── components/
│   │   ├── layout/               # Layout components
│   │   │   ├── TerminalPanel.astro
│   │   │   ├── BrowserPanel.astro
│   │   │   └── AIContextPanel.astro
│   │   ├── islands/              # React interactive components
│   │   │   ├── TerminalInteractive.tsx
│   │   │   ├── BrowserInteractive.tsx
│   │   │   └── AIContextInteractive.tsx
│   │   └── ui/                   # Shared UI components
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand state stores
│   ├── services/                 # API service functions
│   └── types/                    # TypeScript type definitions
```

### Backend Service Structure

```
apps/auth-service/
├── src/
│   ├── routes/                   # API route handlers
│   ├── middleware/               # Request middleware
│   ├── services/                 # Business logic
│   ├── models/                   # Database models
│   └── types/                    # TypeScript definitions
├── tests/                        # Test files
├── Dockerfile                    # Container configuration
└── package.json                  # Dependencies
```

---

## 🔄 Key Architectural Patterns

### 1. Microservices Communication

#### REST API Pattern

```typescript
// services/auth-service/src/routes/auth.ts
import { Elysia } from 'elysia';

const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/login', async ({ body }) => {
    // Authentication logic
    return { token: 'jwt-token', user: userData };
  })
  .get('/me', async ({ request }) => {
    // Get current user
    return currentUser;
  });
```

#### WebSocket Events

```typescript
// services/real-time-sync/src/websocket.ts
interface WebSocketEvents {
  'ai:response': { sessionId: string; content: string };
  'sync:state': { workspaceId: string; state: WorkspaceState };
  notification: { type: string; message: string };
}

// WebSocket event handling
websocket.on('ai:response', data => {
  // Broadcast to clients in same workspace
  broadcastToWorkspace(data.sessionId, data);
});
```

### 2. State Management Pattern

#### Zustand Store Example

```typescript
// stores/useWorkspaceStore.ts
import { create } from 'zustand';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  activeSessions: AISession[];

  // Actions
  setCurrentWorkspace: (workspace: Workspace) => void;
  addSession: (session: AISession) => void;
}

export const useWorkspaceStore = create<WorkspaceState>(set => ({
  currentWorkspace: null,
  workspaces: [],
  activeSessions: [],

  setCurrentWorkspace: workspace => set({ currentWorkspace: workspace }),
  addSession: session =>
    set(state => ({
      activeSessions: [...state.activeSessions, session]
    }))
}));
```

### 3. Database Pattern with Prisma

```typescript
// packages/shared-types/src/database.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  createdAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: Date;
}

// Prisma model usage
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    workspaces: {
      include: {
        members: true
      }
    }
  }
});
```

### 4. Error Handling Pattern

```typescript
// services/auth-service/src/middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Usage in routes
try {
  const result = await authenticateUser(credentials);
  return { success: true, user: result };
} catch (error) {
  if (error instanceof AppError) {
    throw error;
  }
  throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
}
```

---

## 🔄 Development Workflow

### 1. Feature Development Process

```bash
# 1. Create feature branch
git checkout -b feature/ai-chat-improvements

# 2. Make changes
# Edit files...

# 3. Run tests
bun run test
bun run lint

# 4. Commit changes
git add .
git commit -m "feat: improve AI chat response handling"

# 5. Push and create PR
git push origin feature/ai-chat-improvements
# Create Pull Request on GitHub
```

### 2. Code Quality Standards

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### ESLint Rules

```json
// .eslintrc.json
{
  "extends": ["@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 3. Testing Workflow

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test test/auth.test.ts

# Run E2E tests
bun run test:e2e
```

#### Test Structure

```typescript
// Example test file
import { test, expect, describe } from 'bun:test';
import { AuthService } from '../src/services/AuthService';

describe('AuthService', () => {
  test('should authenticate valid user', async () => {
    const authService = new AuthService();
    const result = await authService.login('user@example.com', 'password');

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const authService = new AuthService();
    const result = await authService.login('user@example.com', 'wrong-password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```
    E2E Tests (Playwright)
  ──────────────────────
     Integration Tests
  ──────────────────────
       Unit Tests (Bun)
```

### 1. Unit Tests (Bun Test)

**What to test:**

- Individual functions and classes
- Component logic
- Service methods
- Utility functions

```typescript
// Example: AI Service Unit Test
import { test, expect } from 'bun:test';
import { AIOrchestrator } from '../src/services/AIOrchestrator';

test('should format AI request correctly', () => {
  const orchestrator = new AIOrchestrator();
  const request = orchestrator.formatRequest({
    message: 'Hello, world!',
    provider: 'claude',
    model: 'claude-3-sonnet'
  });

  expect(request.messages).toHaveLength(1);
  expect(request.messages[0].content).toBe('Hello, world!');
});
```

### 2. Integration Tests

**What to test:**

- API endpoints
- Database operations
- WebSocket connections
- Third-party integrations

```typescript
// Example: API Integration Test
import { test, expect } from 'bun:test';
import { app } from '../src/index';

test('POST /api/auth/login returns JWT token', async () => {
  const response = await app.handle(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    })
  );

  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.token).toBeDefined();
});
```

### 3. E2E Tests (Playwright)

**What to test:**

- Complete user workflows
- Cross-browser compatibility
- Real-time synchronization
- Mobile responsiveness

```typescript
// Example: E2E Test
import { test, expect } from '@playwright/test';

test('user can have conversation with AI', async ({ page }) => {
  await page.goto('/');

  // Login
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Start AI conversation
  await page.fill('[data-testid="ai-input"]', 'Write a hello world function');
  await page.click('[data-testid="send-button"]');

  // Verify response
  await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
  await expect(page.locator('[data-testid="ai-response"]')).toContainText('function');
});
```

---

## ❓ Common Questions

### Q: Why did we choose Bun over Node.js?

**A:** Performance and developer experience. Bun is 4x faster, uses 50% less
memory, and has built-in TypeScript support, testing, and bundling. This is
crucial for our real-time features requiring sub-100ms response times.

### Q: Why microservices instead of a monolith?

**A:** Scalability and team coordination. We need to support 10K+ concurrent
users, and microservices allow us to scale individual components. They also
enable different teams to work independently on different services.

### Q: Why Astro + React instead of just React?

**A:** Performance and user experience. Astro's island architecture gives us
50-70% smaller bundles and faster initial page loads while maintaining React's
component model for interactive parts.

### Q: How do real-time features work across services?

**A:** WebSocket connections are managed by a dedicated sync service that
publishes events to Redis. Other services subscribe to these events and update
their state accordingly. This ensures consistent real-time updates across all
clients.

### Q: How do we handle AI provider failures?

**A:** We implement a circuit breaker pattern with multi-provider failover. If
one AI provider fails, we automatically switch to another provider while
maintaining the conversation context.

### Q: What's the deployment strategy?

**A:** Docker containers orchestrated with Docker Compose for development and
Kubernetes for production. Each service runs in its own container with proper
isolation and scaling capabilities.

---

## 📚 Resources

### Documentation

- [Architecture Document](./solution-architecture.md)
- [API Documentation](./api/)
- [Tech Specs by Epic](./tech-spec-epic-*.md)

### External Resources

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Framework](https://elysiajs.com/)
- [Astro Documentation](https://docs.astro.build/)
- [Zustand State Management](https://zustand-demo.pmnd.rs/)
- [Prisma ORM](https://www.prisma.io/docs/)

### Team Communication

- **Slack:** #ccwrapper-development
- **Standups:** Daily at 10:00 AM UTC
- **Sprint Planning:** Every 2 weeks
- **Retrospectives:** End of each sprint

### Getting Help

1. **Technical questions:** Ask in #ccwrapper-development Slack channel
2. **Architecture decisions:** Review ADRs in architecture document
3. **Code review:** Create pull request and tag relevant team members
4. **Urgent issues:** Contact tech lead directly

---

## 🎉 Next Steps

1. **Set up your development environment** using the quick start guide
2. **Explore the codebase** starting with the service that interests you most
3. **Pick up a good first issue** from the GitHub Issues (labeled "good first
   issue")
4. **Join team standups** to understand current priorities
5. **Read your assigned epic's tech spec** to understand detailed requirements

Welcome aboard! We're excited to have you join us in building the future of
AI-assisted development.

---

_Last updated: 2025-10-19_ _For questions or updates, contact Eduardo Menoncello
or the development team_
