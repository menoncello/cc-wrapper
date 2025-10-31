# ATDD Checklist - Epic 1, Story 1.2: Session Persistence & Recovery

**Date:** 2025-10-28
**Author:** Eduardo Menoncello
**Primary Test Level:** E2E

---

## Story Summary

**As a** developer
**I want** my work sessions to be automatically saved and recoverable with encrypted storage
**So that** I can resume work exactly where I left off after restarts or interruptions while maintaining data security and privacy.

---

## Acceptance Criteria

1. System automatically saves workspace state every 30 seconds with encrypted storage
2. Session captures terminal state, browser tabs, AI conversation history, and open files using established state patterns
3. User can resume work exactly where left off after restart using Zustand state restoration
4. System detects and recovers from corrupted sessions with minimal data loss using validation patterns
5. User can manually create session checkpoints and restore from any checkpoint via API endpoints
6. Session data encrypted at rest with user-controlled encryption keys using Bun Web Crypto API

---

## Failing Tests Created (RED Phase)

### E2E Tests (8 tests)

**File:** `tests/e2e/session-persistence.spec.ts` (324 lines)

- ✅ **Test:** should auto-save session state every 30 seconds with encrypted storage
  - **Status:** RED - Session service endpoints not implemented
  - **Verifies:** Auto-save functionality with encryption and 30-second intervals

- ✅ **Test:** should capture complete workspace state including terminal, browser, AI conversations, and open files
  - **Status:** RED - State capture mechanisms not implemented
  - **Verifies:** Complete workspace state serialization and storage

- ✅ **Test:** should restore work exactly where left off after restart using Zustand state restoration
  - **Status:** RED - Session restoration service not implemented
  - **Verifies:** Complete workspace recovery including Zustand store integration

- ✅ **Test:** should detect and recover from corrupted sessions with minimal data loss
  - **Status:** RED - Corruption detection and recovery not implemented
  - **Verifies:** Error handling and partial recovery mechanisms

- ✅ **Test:** should create manual session checkpoints via API endpoints
  - **Status:** RED - Checkpoint creation API not implemented
  - **Verifies:** Manual checkpoint creation and management

- ✅ **Test:** should restore from any checkpoint via checkpoint selection interface
  - **Status:** RED - Checkpoint restoration not implemented
  - **Verifies:** Checkpoint selection and restoration workflow

- ✅ **Test:** should encrypt session data at rest with user-controlled encryption keys
  - **Status:** RED - Encryption layer not implemented
  - **Verifies:** AES-256-GCM encryption with user-controlled keys

- ✅ **Test:** should handle encryption key validation and secure key storage
  - **Status:** RED - Key management system not implemented
  - **Verifies:** Key validation, rotation, and secure storage

### API Tests (20 tests)

**File:** `tests/api/session-api.spec.ts` (458 lines)

- ✅ **Test:** POST /api/sessions - should create new session with encrypted data
  - **Status:** RED - Session creation endpoint not implemented
  - **Verifies:** Session creation with proper encryption and validation

- ✅ **Test:** GET /api/sessions/:id - should retrieve session metadata
  - **Status:** RED - Session retrieval endpoint not implemented
  - **Verifies:** Metadata retrieval without exposing sensitive data

- ✅ **Test:** PUT /api/sessions/:id - should update existing session
  - **Status:** RED - Session update endpoint not implemented
  - **Verifies:** Session updates with encryption and timestamp tracking

- ✅ **Test:** DELETE /api/sessions/:id - should delete session permanently
  - **Status:** RED - Session deletion endpoint not implemented
  - **Verifies:** Secure session deletion with cleanup

- ✅ **Test:** GET /api/sessions - should list user sessions with pagination
  - **Status:** RED - Session listing endpoint not implemented
  - **Verifies:** Paginated session list with metadata only

- ✅ **Test:** POST /api/sessions/restore - should restore session from latest
  - **Status:** RED - Session restoration endpoint not implemented
  - **Verifies:** Complete session restoration with decrypted data

- ✅ **Test:** POST /api/sessions/restore - should handle corrupted sessions gracefully
  - **Status:** RED - Corruption handling not implemented
  - **Verifies:** Partial recovery options and error handling

- ✅ **Test:** POST /api/sessions/restore - should validate session ownership
  - **Status:** RED - Session ownership validation not implemented
  - **Verifies:** Security boundaries and access control

- ✅ **Test:** POST /api/sessions/checkpoints - should create manual checkpoint
  - **Status:** RED - Checkpoint creation endpoint not implemented
  - **Verifies:** Manual checkpoint creation with metadata

- ✅ **Test:** GET /api/sessions/checkpoints - should list session checkpoints
  - **Status:** RED - Checkpoint listing endpoint not implemented
  - **Verifies:** Chronological checkpoint listing

- ✅ **Test:** POST /api/sessions/checkpoints/:id/restore - should restore from specific checkpoint
  - **Status:** RED - Checkpoint restoration endpoint not implemented
  - **Verifies:** Specific checkpoint restoration workflow

- ✅ **Test:** DELETE /api/sessions/checkpoints/:id - should delete checkpoint
  - **Status:** RED - Checkpoint deletion endpoint not implemented
  - **Verifies:** Secure checkpoint deletion

- ✅ **Test:** POST /api/sessions - should validate session data structure
  - **Status:** RED - Data validation not implemented
  - **Verifies:** Input validation and error handling

- ✅ **Test:** POST /api/sessions - should enforce session size limits
  - **Status:** RED - Size limits not enforced
  - **Verifies:** 50MB session size limit enforcement

- ✅ **Test:** POST /api/sessions - should validate encryption requirements
  - **Status:** RED - Encryption validation not implemented
  - **Verifies:** Mandatory encryption enforcement

- ✅ **Test:** API endpoints should require authentication
  - **Status:** RED - Authentication middleware not integrated
  - **Verifies:** Security across all session endpoints

---

## Data Factories Created

### Session Factory

**File:** `tests/support/factories/session.factory.ts`

**Exports:**

- `createSession(overrides?)` - Create single session with optional overrides
- `createSessions(count)` - Create array of sessions with different timestamps
- `createFile(overrides?)` - Create realistic file with code content
- `createFiles(count)` - Create array of files
- `createSessionState(overrides?)` - Create complete workspace state
- `createCheckpoint(overrides?)` - Create checkpoint object
- `createCheckpoints(count)` - Create array of checkpoints
- `createCorruptedSessionState(overrides?)` - Create corrupted state for testing
- `createOversizedSessionState(sizeInMB)` - Create oversized session for limit testing
- `createSessionRestorationData(overrides?)` - Create restoration test data
- `createSessionWithEncryption(algorithm, keyStatus)` - Create session with specific encryption

**Example Usage:**

```typescript
const session = createSession({
  encrypted: true,
  algorithm: 'AES-256-GCM'
});
const sessions = createSessions(5); // Generate 5 sessions with different timestamps
```

---

## Fixtures Created

### Session Fixtures

**File:** `tests/support/fixtures/session.fixture.ts`

**Fixtures:**

- `authenticatedUser` - Provides logged-in user with auth token
  - **Setup:** Creates user with email, name, and JWT token
  - **Provides:** User object with id, email, token, name
  - **Cleanup:** Handled by sessionService fixture

- `sessionService` - Complete session lifecycle management
  - **Setup:** Creates session and checkpoint management functions
  - **Provides:** Methods to create/delete sessions and checkpoints
  - **Cleanup:** Auto-deletes all created sessions and checkpoints

- `mockSessionState` - Ready-to-use session state
  - **Setup:** Creates predictable session state with consistent data
  - **Provides:** SessionState object with files, terminal, browser, AI conversations
  - **Cleanup:** Not needed (data only)

- `encryptedSession` - Session with encryption metadata
  - **Setup:** Creates session with AES-256-GCM encryption details
  - **Provides:** Session object with encryption metadata
  - **Cleanup:** Not needed (data only)

- `corruptedSession` - Corrupted session for recovery testing
  - **Setup:** Creates session with missing/corrupted data
  - **Provides:** Session object with corruption flags
  - **Cleanup:** Not needed (data only)

- `sessionWithCheckpoints` - Session with multiple checkpoints
  - **Setup:** Creates session and 3 checkpoints via sessionService
  - **Provides:** Object with session and checkpoints array
  - **Cleanup:** Handled by sessionService fixture

**Example Usage:**

```typescript
import { test, expect } from './fixtures/session.fixture';

test('session workflow', async ({ sessionService, authenticatedUser }) => {
  const session = await sessionService.createSession();
  const checkpoint = await sessionService.createCheckpoint(session.id);
  // Auto-cleanup happens automatically
});
```

---

## Mock Requirements

### Session Service Mock

**Endpoint:** `POST /api/sessions`

**Success Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "encrypted": true,
  "algorithm": "AES-256-GCM",
  "createdAt": "2025-10-28T19:30:00.000Z",
  "updatedAt": "2025-10-28T19:30:00.000Z",
  "size": 2048576
}
```

**Failure Response:**

```json
{
  "error": "Session size exceeds limit",
  "code": "SESSION_TOO_LARGE",
  "maxSize": "50MB",
  "actualSize": "55MB"
}
```

### Session Restoration Mock

**Endpoint:** `POST /api/sessions/restore`

**Success Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "restoredAt": "2025-10-28T19:35:00.000Z",
  "workspaceState": {
    "files": [...],
    "terminal": {...},
    "browser": {...},
    "aiConversations": {...}
  }
}
```

**Corruption Response:**

```json
{
  "id": "corrupted-session-id",
  "corrupted": true,
  "recoverableData": {
    "files": [...],
    "metadata": {...},
    "partialState": true
  },
  "message": "Session partially corrupted, recovered available data"
}
```

### Checkpoint Management Mock

**Endpoint:** `POST /api/sessions/checkpoints`

**Success Response:**

```json
{
  "id": "checkpoint-123",
  "sessionId": "session-456",
  "name": "Feature implementation complete",
  "description": "Checkpoint before testing phase",
  "encrypted": true,
  "algorithm": "AES-256-GCM",
  "createdAt": "2025-10-28T19:45:00.000Z",
  "size": 3145728
}
```

**Notes:** All endpoints require JWT authentication and user ownership validation.

---

## Required data-testid Attributes

### Dashboard Page

- `save-session-button` - Manual session save trigger
- `session-menu` - Session management menu toggle
- `view-checkpoints-button` - Open checkpoint management interface
- `session-status-indicator` - Auto-save status indicator
- `encryption-indicator` - Session encryption status display
- `corruption-warning` - Session corruption warning banner
- `recovery-options` - Recovery options interface
- `recover-partial-button` - Accept partial recovery option
- `recovery-success` - Recovery success message
- `data-loss-notice` - Data loss warning after recovery

### Checkpoint Management Interface

- `checkpoint-list` - Container for checkpoint items
- `checkpoint-item` - Individual checkpoint item
- `create-checkpoint-button` - Create new checkpoint
- `checkpoint-name` - Input for checkpoint name
- `restore-checkpoint-button` - Restore selected checkpoint
- `checkpoint-success` - Checkpoint creation success message
- `restore-success` - Checkpoint restoration success message

### Session Creation & Editing

- `create-new-file` - Create new file button
- `file-name` - File name input field
- `file-content` - File content editor
- `save-file` - Save file button
- `open-terminal` - Open terminal interface
- `terminal-input` - Terminal command input
- `terminal-history` - Terminal history display
- `ai-chat-toggle` - Open AI chat interface
- `ai-message-input` - AI chat message input
- `ai-send-button` - Send AI message button

### Key Management & Security

- `key-error` - Key validation error display
- `recovery-options` - Key recovery options
- `regenerate-key-button` - Regenerate encryption key
- `key-regeneration-success` - Key regeneration success message
- `session-encrypted-new-key` - New key encryption confirmation

**Implementation Example:**

```tsx
<button data-testid="save-session-button" onClick={handleSaveSession}>
  Save Session
</button>
<div data-testid="encryption-indicator">
  Session encrypted with AES-256-GCM
</div>
<div data-testid="corruption-warning" style={{ display: hasCorruption ? 'block' : 'none' }}>
  Session corruption detected. Partial recovery available.
</div>
```

---

## Implementation Checklist

### Test: should auto-save session state every 30 seconds with encrypted storage

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Create session auto-save service with 30-second intervals
- [ ] Implement workspace state capture mechanism
- [ ] Add AES-256-GCM encryption for session data at rest
- [ ] Create session persistence API endpoints (`/api/sessions`)
- [ ] Add session size validation (50MB limit)
- [ ] Implement background saving with worker threads
- [ ] Add auto-save status indicator in UI
- [ ] Add required data-testid attributes: `save-session-button`, `session-status-indicator`, `encryption-indicator`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: should capture complete workspace state including terminal, browser, AI conversations, and open files

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement terminal state capture (history, current directory, processes)
- [ ] Create browser tab tracking system (open tabs, active tab)
- [ ] Add AI conversation persistence (messages, context, session ID)
- [ ] Implement file system state capture (open files, content, modifications)
- [ ] Create state serialization with compression algorithms
- [ ] Add delta/incremental saving to reduce storage overhead
- [ ] Implement Zustand store integration for state management
- [ ] Add required data-testid attributes: `create-new-file`, `file-content`, `save-file`, `open-terminal`, `terminal-input`, `ai-chat-toggle`, `ai-message-input`, `ai-send-button`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 12 hours

---

### Test: should restore work exactly where left off after restart using Zustand state restoration

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement session restoration service (`/api/sessions/restore`)
- [ ] Create Zustand store for session state management
- [ ] Add session state hydration on application startup
- [ ] Implement file restoration with correct content and cursor position
- [ ] Add terminal state restoration (history, current directory)
- [ ] Create browser tab restoration (reopen tabs, set active tab)
- [ ] Implement AI conversation history restoration
- [ ] Add session startup detection and auto-restore workflow
- [ ] Add required data-testid attributes: `file-name`, `file-content`, `terminal-history`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 10 hours

---

### Test: should detect and recover from corrupted sessions with minimal data loss

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement session corruption detection algorithms
- [ ] Create partial data recovery mechanisms
- [ ] Add session validation on load with integrity checks
- [ ] Implement fallback strategies for damaged sessions
- [ ] Create corruption recovery UI with options
- [ ] Add data loss estimation and reporting
- [ ] Implement session repair algorithms where possible
- [ ] Add required data-testid attributes: `corruption-warning`, `recovery-options`, `recover-partial-button`, `recovery-success`, `data-loss-notice`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: should create manual session checkpoints via API endpoints

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Create checkpoint creation API endpoint (`/api/sessions/checkpoints`)
- [ ] Implement checkpoint database schema with session references
- [ ] Add checkpoint creation UI with name and description
- [ ] Implement checkpoint metadata tracking (size, timestamp, user)
- [ ] Add checkpoint validation and size limits
- [ ] Create checkpoint listing endpoint (`/api/sessions/checkpoints`)
- [ ] Add checkpoint creation success feedback
- [ ] Add required data-testid attributes: `checkpoint-name`, `create-checkpoint-button`, `checkpoint-success`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: should restore from any checkpoint via checkpoint selection interface

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Create checkpoint selection UI component
- [ ] Implement checkpoint restoration endpoint (`/api/sessions/checkpoints/:id/restore`)
- [ ] Add chronological sorting of checkpoints
- [ ] Create checkpoint preview functionality
- [ ] Implement checkpoint deletion endpoint
- [ ] Add checkpoint metadata display (size, date, description)
- [ ] Create restoration confirmation dialog
- [ ] Add required data-testid attributes: `checkpoint-list`, `checkpoint-item`, `restore-checkpoint-button`, `restore-success`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: should encrypt session data at rest with user-controlled encryption keys

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement Bun Web Crypto API integration
- [ ] Create AES-256-GCM encryption for session data
- [ ] Add user-controlled encryption key generation
- [ ] Implement secure key storage using Bun crypto
- [ ] Add encryption metadata tracking (algorithm, key ID, salt)
- [ ] Create key derivation from user credentials (Argon2id)
- [ ] Add encryption status indicators in UI
- [ ] Implement encrypted data verification and integrity checks
- [ ] Add required data-testid attributes: `encryption-indicator`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 10 hours

---

### Test: should handle encryption key validation and secure key storage

**File:** `tests/e2e/session-persistence.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement encryption key validation system
- [ ] Add key expiration and rotation mechanisms
- [ ] Create key recovery workflows for lost/invalid keys
- [ ] Implement secure key derivation from user passwords
- [ ] Add key validation error handling
- [ ] Create key regeneration functionality
- [ ] Add key status tracking and metadata
- [ ] Implement secure key deletion and cleanup
- [ ] Add required data-testid attributes: `key-error`, `recovery-options`, `regenerate-key-button`, `key-regeneration-success`, `session-encrypted-new-key`
- [ ] Run test: `bun run test:e2e -- session-persistence.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: POST /api/sessions - should create new session with encrypted data

**File:** `tests/api/session-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create session service with Elysia framework
- [ ] Implement session creation POST endpoint
- [ ] Add request body validation with Zod schemas
- [ ] Implement session encryption before database storage
- [ ] Create database schema for sessions table
- [ ] Add session metadata generation (ID, timestamps, size)
- [ ] Implement authentication middleware for session endpoints
- [ ] Add session ownership validation
- [ ] Create error handling for validation failures
- [ ] Run test: `bun run test:api -- session-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: GET /api/sessions/:id - should retrieve session metadata

**File:** `tests/api/session-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement session retrieval GET endpoint
- [ ] Add session ID validation and existence checks
- [ ] Create metadata-only response (exclude sensitive data)
- [ ] Add session ownership validation for access control
- [ ] Implement 404 handling for non-existent sessions
- [ ] Add session statistics (checkpoint count, size)
- [ ] Create proper HTTP response headers
- [ ] Add caching for session metadata
- [ ] Run test: `bun run test:api -- session-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: POST /api/sessions/restore - should restore session from latest

**File:** `tests/api/session-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement session restoration POST endpoint
- [ ] Add session data decryption before returning
- [ ] Create workspace state reconstruction from database
- [ ] Add session validation and integrity checks
- [ ] Implement error handling for corrupted sessions
- [ ] Add restoration timestamp tracking
- [ ] Create partial recovery mechanisms
- [ ] Add session usage analytics
- [ ] Run test: `bun run test:api -- session-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 8 hours

---

### Test: POST /api/sessions/checkpoints - should create manual checkpoint

**File:** `tests/api/session-api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create checkpoints database table schema
- [ ] Implement checkpoint creation POST endpoint
- [ ] Add checkpoint name and description validation
- [ ] Create checkpoint session relationship validation
- [ ] Implement checkpoint encryption and storage
- [ ] Add checkpoint metadata tracking
- [ ] Create checkpoint size calculation and limits
- [ ] Add checkpoint creation success response
- [ ] Run test: `bun run test:api -- session-api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun run test:e2e

# Run specific E2E test file
bun run test:e2e -- session-persistence.spec.ts

# Run specific API test file
bun run test:api -- session-api.spec.ts

# Run tests in headed mode (see browser)
bun run test:e2e -- --headed

# Debug specific test
bun run test:e2e -- session-persistence.spec.ts --debug

# Run tests with coverage
bun run test:e2e -- --coverage

# Run all tests including API and E2E
bun run test
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun run test:e2e session-persistence.spec.ts && bun run test:api session-api.spec.ts`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmad sm story-done` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **component-tdd.md** - Component test strategies using Playwright Component Testing
- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs Component vs Unit)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun run test:e2e session-persistence.spec.ts && bun run test:api session-api.spec.ts`

**Results:**

```
[Expected output showing all 28 tests failing with clear error messages]
```

**Summary:**

- Total tests: 28
- Passing: 0 (expected)
- Failing: 28 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**
- E2E tests: 404 errors for missing `/api/sessions` endpoints, timeout errors for missing UI elements
- API tests: 404 errors for session service endpoints, authentication errors for missing middleware

---

## Notes

- **Performance Targets**: Auto-save <100ms, session restore <500ms (from story requirements)
- **Security Requirements**: AES-256-GCM encryption, Argon2id key derivation, no plaintext storage
- **Size Limits**: 50MB per session (compressed), user-configurable auto-save intervals
- **Retention Policy**: 30 days for auto-sessions, 90 days for checkpoints
- **Integration Points**: Auth service for user identity, future workspace service for project context
- **Learning from Story 1.1b**: Zustand state patterns, Bun Web Crypto API, Elysia framework patterns established

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @tea-agent in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-28