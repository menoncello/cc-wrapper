# CC Wrapper Architecture

For the complete architecture documentation, see
[Solution Architecture](solution-architecture.md).

## Quick Links

- [Solution Architecture](solution-architecture.md) - Complete architecture
  documentation
- [Tech Spec - Epic 0](tech-spec-epic-0.md) - Epic 0 technical specifications
- [Build Process](build-process.md) - Build system architecture
- [Development Workflow](development-workflow.md) - Development processes

## Architecture Overview

CC Wrapper is built as a monorepo with the following structure:

```
cc-wrapper/
├── apps/          # Frontend applications
├── services/      # Backend microservices
├── packages/      # Shared libraries
├── docs/          # Documentation
└── tests/         # Test suites
```

### Technology Stack

- **Frontend:** React 19.2.0 + Vite 7.0.0 + TypeScript
- **Backend:** Bun 1.3.0 runtime + TypeScript
- **Testing:** Bun Test + Playwright 1.56.0
- **Build:** Vite (frontend) + Bun (backend) + TypeScript (packages)
- **Monorepo:** Bun workspaces

### Key Architectural Principles

1. **Monorepo Structure** - All code in a single repository with workspace
   management
2. **Type Safety** - TypeScript strict mode throughout the codebase
3. **Component Modularity** - Shared packages for reusable functionality
4. **Testing Strategy** - Multi-level testing (unit, integration, E2E)
5. **Build Optimization** - Fast builds with code splitting and tree shaking

For detailed architecture information, see
[Solution Architecture](solution-architecture.md).
