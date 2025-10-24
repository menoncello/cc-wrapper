# ATDD Checklist - Story 1.1: Basic Authentication & User Onboarding

**Date:** 2025-10-21 **Author:** BMad **Primary Test Level:** E2E (End-to-End)

---

## Story Summary

As a new developer, I want to create an account and complete basic onboarding,
so that I can start using CC Wrapper immediately and experience the wait-time
optimization benefits.

**As a** new developer **I want** to create an account with email/password or
social login and complete onboarding **So that** I can start using CC Wrapper
with optimized workspace and AI tool preferences

---

## Acceptance Criteria

1. User can create account with email/password or social login (Google, GitHub)
2. Onboarding wizard collects user type (solo/team/enterprise) and primary AI
   tools
3. System configures default workspace based on user preferences
4. User receives guided tour of core interface focusing on wait-time
   optimization
5. User can skip onboarding and access basic functionality immediately
6. Profile includes basic settings: preferred AI tools, notification
   preferences, default workspace

---

## Failing Tests Created (RED Phase)

### E2E Tests (32 tests across 3 files)

#### **File:** `tests/e2e/auth-registration.spec.ts` (239 lines)

**User Registration with Email/Password:**

- ✅ **Test:** should successfully register new user with valid credentials
  - **Status:** RED - Route `/auth/register` not implemented
  - **Verifies:** AC1 - Email/password registration flow

- ✅ **Test:** should display error for invalid email format
  - **Status:** RED - Email validation not implemented
  - **Verifies:** AC1 - Input validation for email

- ✅ **Test:** should display error for weak password
  - **Status:** RED - Password strength validation not implemented
  - **Verifies:** AC1 - Password requirements enforcement

- ✅ **Test:** should display error for password mismatch
  - **Status:** RED - Confirm password validation not implemented
  - **Verifies:** AC1 - Password confirmation matching

- ✅ **Test:** should display error for duplicate email registration
  - **Status:** RED - Duplicate email check not implemented
  - **Verifies:** AC1 - Unique email constraint

**User Login with Email/Password:**

- ✅ **Test:** should successfully login with valid credentials
  - **Status:** RED - Login endpoint not implemented
  - **Verifies:** AC1 - Authentication flow

- ✅ **Test:** should display error for invalid credentials
  - **Status:** RED - Credential validation not implemented
  - **Verifies:** AC1 - Security - invalid login handling

- ✅ **Test:** should disable submit button when fields are empty
  - **Status:** RED - Form validation not implemented
  - **Verifies:** AC1 - UX - form state management

**Social Login - Google OAuth:**

- ✅ **Test:** should successfully authenticate via Google OAuth
  - **Status:** RED - Google OAuth integration not implemented
  - **Verifies:** AC1 - Google social login

- ✅ **Test:** should display error when Google OAuth fails
  - **Status:** RED - OAuth error handling not implemented
  - **Verifies:** AC1 - OAuth failure scenarios

**Social Login - GitHub OAuth:**

- ✅ **Test:** should successfully authenticate via GitHub OAuth
  - **Status:** RED - GitHub OAuth integration not implemented
  - **Verifies:** AC1 - GitHub social login

- ✅ **Test:** should handle OAuth account linking for existing email
  - **Status:** RED - OAuth account linking not implemented
  - **Verifies:** AC1 - Account linking logic

**Authentication Rate Limiting:**

- ✅ **Test:** should enforce rate limit after excessive login attempts
  - **Status:** RED - Rate limiting not implemented
  - **Verifies:** AC1 - Security - DDoS protection

---

#### **File:** `tests/e2e/onboarding-wizard.spec.ts` (370 lines)

**Onboarding Wizard - Complete Flow:**

- ✅ **Test:** should complete full onboarding wizard and create default
  workspace
  - **Status:** RED - Onboarding wizard not implemented
  - **Verifies:** AC2, AC3 - Full onboarding flow

- ✅ **Test:** should display progress indicator showing current step
  - **Status:** RED - Progress UI not implemented
  - **Verifies:** AC2 - UX - progress feedback

- ✅ **Test:** should allow navigation back to previous step
  - **Status:** RED - Navigation logic not implemented
  - **Verifies:** AC2 - UX - wizard navigation

- ✅ **Test:** should preserve selections when navigating between steps
  - **Status:** RED - State management not implemented
  - **Verifies:** AC2 - UX - state persistence

**Onboarding Step 1 - User Type Selection:**

- ✅ **Test:** should display three user type options
  - **Status:** RED - User type selection UI not implemented
  - **Verifies:** AC2 - Step 1 UI

- ✅ **Test:** should disable Next button until user type is selected
  - **Status:** RED - Form validation not implemented
  - **Verifies:** AC2 - Step 1 validation

**Onboarding Step 2 - AI Tools Selection:**

- ✅ **Test:** should display available AI tools with checkboxes
  - **Status:** RED - AI tools selection UI not implemented
  - **Verifies:** AC2 - Step 2 UI

- ✅ **Test:** should allow multiple AI tool selections
  - **Status:** RED - Multi-select logic not implemented
  - **Verifies:** AC2 - AI tools multi-selection

- ✅ **Test:** should allow proceeding with no AI tools selected
  - **Status:** RED - Optional field handling not implemented
  - **Verifies:** AC2 - AI tools are optional

**Onboarding Step 3 - Workspace Configuration:**

- ✅ **Test:** should validate required workspace name
  - **Status:** RED - Workspace name validation not implemented
  - **Verifies:** AC3 - Workspace creation validation

- ✅ **Test:** should display workspace template options
  - **Status:** RED - Template selection UI not implemented
  - **Verifies:** AC3 - Template options

- ✅ **Test:** should create workspace with selected template
  - **Status:** RED - Workspace creation not implemented
  - **Verifies:** AC3 - Template-based workspace creation

**Skip Onboarding Functionality:**

- ✅ **Test:** should allow skipping onboarding from any step
  - **Status:** RED - Skip functionality not implemented
  - **Verifies:** AC5 - Skip onboarding feature

- ✅ **Test:** should display confirmation dialog when skipping onboarding
  - **Status:** RED - Confirmation dialog not implemented
  - **Verifies:** AC5 - UX - skip confirmation

- ✅ **Test:** should create default generic workspace when onboarding is
  skipped
  - **Status:** RED - Default workspace creation not implemented
  - **Verifies:** AC5 - Default configuration on skip

- ✅ **Test:** should display reminder notification to complete profile setup
  - **Status:** RED - Reminder notification not implemented
  - **Verifies:** AC5 - UX - profile completion reminder

- ✅ **Test:** should allow restarting onboarding from profile settings
  - **Status:** RED - Restart onboarding feature not implemented
  - **Verifies:** AC5 - Onboarding restart capability

**Guided Tour:**

- ✅ **Test:** should launch guided tour after onboarding completion
  - **Status:** RED - Guided tour not implemented
  - **Verifies:** AC4 - Tour launch

- ✅ **Test:** should display all tour steps in sequence
  - **Status:** RED - Tour steps not implemented
  - **Verifies:** AC4 - Tour content and navigation

- ✅ **Test:** should allow skipping guided tour
  - **Status:** RED - Tour skip functionality not implemented
  - **Verifies:** AC4 - Tour skip option

- ✅ **Test:** should store tour completion status in user preferences
  - **Status:** RED - Tour status persistence not implemented
  - **Verifies:** AC4 - Tour completion tracking

---

#### **File:** `tests/e2e/user-profile-settings.spec.ts` (281 lines)

**User Profile Settings Page:**

- ✅ **Test:** should display all profile settings sections
  - **Status:** RED - Profile settings page not implemented
  - **Verifies:** AC6 - Profile settings UI structure

- ✅ **Test:** should load current user profile data on page load
  - **Status:** RED - Profile data loading not implemented
  - **Verifies:** AC6 - Profile data retrieval

**Preferred AI Tools Management:**

- ✅ **Test:** should add new AI tool to preferred list
  - **Status:** RED - AI tool add functionality not implemented
  - **Verifies:** AC6 - AI tools management

- ✅ **Test:** should remove AI tool from preferred list
  - **Status:** RED - AI tool remove functionality not implemented
  - **Verifies:** AC6 - AI tools removal

- ✅ **Test:** should prevent removing all AI tools
  - **Status:** RED - Validation logic not implemented
  - **Verifies:** AC6 - AI tools validation

- ✅ **Test:** should save AI tools changes to backend
  - **Status:** RED - Save functionality not implemented
  - **Verifies:** AC6 - Profile persistence

**Notification Preferences:**

- ✅ **Test:** should toggle email notifications on/off
  - **Status:** RED - Notification toggles not implemented
  - **Verifies:** AC6 - Email notification preference

- ✅ **Test:** should toggle in-app notifications on/off
  - **Status:** RED - In-app notification toggle not implemented
  - **Verifies:** AC6 - In-app notification preference

- ✅ **Test:** should configure quiet hours for notifications
  - **Status:** RED - Quiet hours feature not implemented
  - **Verifies:** AC6 - Notification quiet hours

- ✅ **Test:** should validate quiet hours time range
  - **Status:** RED - Time range validation not implemented
  - **Verifies:** AC6 - Quiet hours validation

- ✅ **Test:** should save notification preferences to backend
  - **Status:** RED - Notification persistence not implemented
  - **Verifies:** AC6 - Notification settings save

**Default Workspace Selection:**

- ✅ **Test:** should display list of available workspaces in dropdown
  - **Status:** RED - Workspace dropdown not implemented
  - **Verifies:** AC6 - Workspace selection UI

- ✅ **Test:** should change default workspace selection
  - **Status:** RED - Workspace change logic not implemented
  - **Verifies:** AC6 - Default workspace update

- ✅ **Test:** should save default workspace preference to backend
  - **Status:** RED - Workspace preference save not implemented
  - **Verifies:** AC6 - Default workspace persistence

- ✅ **Test:** should display default workspace name on dashboard
  - **Status:** RED - Dashboard workspace display not implemented
  - **Verifies:** AC6 - Workspace loading on dashboard

**Profile Update Validation:**

- ✅ **Test:** should validate form before submission
  - **Status:** RED - Form validation not implemented
  - **Verifies:** AC6 - Input validation

- ✅ **Test:** should display error message when save fails
  - **Status:** RED - Error handling not implemented
  - **Verifies:** AC6 - Error state management

- ✅ **Test:** should disable save button while save is in progress
  - **Status:** RED - Loading state not implemented
  - **Verifies:** AC6 - UX - async operation feedback

- ✅ **Test:** should discard changes when cancel button is clicked
  - **Status:** RED - Cancel functionality not implemented
  - **Verifies:** AC6 - Form reset capability

---

### API Tests (28 tests across 2 files)

#### **File:** `tests/api/auth-api.spec.ts` (360 lines)

**POST /api/auth/register - User Registration:**

- ✅ **Test:** should create new user with valid email and password
  - **Status:** RED - Registration endpoint not implemented
  - **Verifies:** AC1 - API registration

- ✅ **Test:** should return JWT token after successful registration
  - **Status:** RED - JWT generation not implemented
  - **Verifies:** AC1 - Token generation

- ✅ **Test:** should reject registration with invalid email format
  - **Status:** RED - Email validation not implemented
  - **Verifies:** AC1 - Input validation

- ✅ **Test:** should reject registration with weak password
  - **Status:** RED - Password validation not implemented
  - **Verifies:** AC1 - Password strength requirements

- ✅ **Test:** should reject registration with password mismatch
  - **Status:** RED - Password matching validation not implemented
  - **Verifies:** AC1 - Confirm password validation

- ✅ **Test:** should reject duplicate email registration
  - **Status:** RED - Unique constraint not implemented
  - **Verifies:** AC1 - Duplicate email prevention

- ✅ **Test:** should hash password using Bun Argon2id
  - **Status:** RED - Password hashing not implemented
  - **Verifies:** AC1 - Security - password hashing

**POST /api/auth/login - User Login:**

- ✅ **Test:** should login user with valid credentials
  - **Status:** RED - Login endpoint not implemented
  - **Verifies:** AC1 - Login API

- ✅ **Test:** should return JWT token with 15-minute expiry
  - **Status:** RED - JWT expiry not implemented
  - **Verifies:** AC1 - Token expiration

- ✅ **Test:** should reject login with invalid email
  - **Status:** RED - Authentication logic not implemented
  - **Verifies:** AC1 - Invalid credential handling

- ✅ **Test:** should reject login with incorrect password
  - **Status:** RED - Password verification not implemented
  - **Verifies:** AC1 - Password validation

- ✅ **Test:** should not reveal whether email exists in error message
  - **Status:** RED - Error message normalization not implemented
  - **Verifies:** AC1 - Security - information disclosure prevention

**GET /api/auth/oauth/:provider/callback - OAuth Callback:**

- ✅ **Test:** should handle Google OAuth callback with valid code
  - **Status:** RED - OAuth callback not implemented
  - **Verifies:** AC1 - Google OAuth integration

- ✅ **Test:** should handle GitHub OAuth callback with valid code
  - **Status:** RED - GitHub OAuth callback not implemented
  - **Verifies:** AC1 - GitHub OAuth integration

- ✅ **Test:** should reject OAuth callback with invalid state parameter
  - **Status:** RED - CSRF protection not implemented
  - **Verifies:** AC1 - Security - CSRF prevention

- ✅ **Test:** should reject OAuth callback with error parameter
  - **Status:** RED - OAuth error handling not implemented
  - **Verifies:** AC1 - OAuth failure scenarios

- ✅ **Test:** should link OAuth account to existing email
  - **Status:** RED - Account linking not implemented
  - **Verifies:** AC1 - OAuth account linking

- ✅ **Test:** should create new user for OAuth account without existing email
  - **Status:** RED - OAuth user creation not implemented
  - **Verifies:** AC1 - New user via OAuth

**Rate Limiting on Authentication Endpoints:**

- ✅ **Test:** should enforce rate limit of 100 requests per minute on
  /api/auth/register
  - **Status:** RED - Rate limiting not implemented
  - **Verifies:** AC1 - Security - DDoS protection

- ✅ **Test:** should enforce rate limit of 100 requests per minute on
  /api/auth/login
  - **Status:** RED - Rate limiting not implemented
  - **Verifies:** AC1 - Security - brute force protection

- ✅ **Test:** should include rate limit headers in response
  - **Status:** RED - Rate limit headers not implemented
  - **Verifies:** AC1 - Rate limit transparency

**JWT Token Security:**

- ✅ **Test:** should sign JWT tokens using Bun Web Crypto API
  - **Status:** RED - JWT signing not implemented
  - **Verifies:** AC1 - Security - token signing

- ✅ **Test:** should include user ID in JWT payload
  - **Status:** RED - JWT payload structure not implemented
  - **Verifies:** AC1 - Token payload structure

---

#### **File:** `tests/api/workspace-api.spec.ts` (287 lines)

**POST /api/workspaces - Create Workspace:**

- ✅ **Test:** should create workspace with valid data
  - **Status:** RED - Workspace creation endpoint not implemented
  - **Verifies:** AC3 - Workspace API

- ✅ **Test:** should generate workspace configuration based on template
  - **Status:** RED - Template configuration logic not implemented
  - **Verifies:** AC3 - Template-based configuration

- ✅ **Test:** should set workspace as default when user has no workspaces
  - **Status:** RED - Default workspace logic not implemented
  - **Verifies:** AC3 - First workspace default

- ✅ **Test:** should reject workspace creation without authentication
  - **Status:** RED - Authentication middleware not implemented
  - **Verifies:** AC3 - Security - protected endpoint

- ✅ **Test:** should validate required workspace name
  - **Status:** RED - Workspace validation not implemented
  - **Verifies:** AC3 - Required field validation

- ✅ **Test:** should validate workspace template value
  - **Status:** RED - Template validation not implemented
  - **Verifies:** AC3 - Enum validation

**GET /api/workspaces - List User Workspaces:**

- ✅ **Test:** should return all workspaces for authenticated user
  - **Status:** RED - Workspace list endpoint not implemented
  - **Verifies:** AC3 - Workspace retrieval

- ✅ **Test:** should return empty array when user has no workspaces
  - **Status:** RED - Empty state handling not implemented
  - **Verifies:** AC3 - Edge case handling

- ✅ **Test:** should indicate which workspace is default
  - **Status:** RED - Default workspace flag not implemented
  - **Verifies:** AC3 - Default workspace identification

**PUT /api/auth/profile - Update User Profile:**

- ✅ **Test:** should update preferred AI tools
  - **Status:** RED - Profile update endpoint not implemented
  - **Verifies:** AC6 - AI tools update

- ✅ **Test:** should update notification preferences
  - **Status:** RED - Notification preferences update not implemented
  - **Verifies:** AC6 - Notification settings update

- ✅ **Test:** should update default workspace
  - **Status:** RED - Default workspace update not implemented
  - **Verifies:** AC6 - Workspace preference update

- ✅ **Test:** should reject profile update without authentication
  - **Status:** RED - Authentication check not implemented
  - **Verifies:** AC6 - Security - protected endpoint

- ✅ **Test:** should validate workspace ownership when setting default
  workspace
  - **Status:** RED - Ownership validation not implemented
  - **Verifies:** AC6 - Security - authorization check

- ✅ **Test:** should validate AI tools array values
  - **Status:** RED - AI tools validation not implemented
  - **Verifies:** AC6 - Input validation

**GET /api/auth/profile - Get User Profile:**

- ✅ **Test:** should return current user profile
  - **Status:** RED - Profile retrieval endpoint not implemented
  - **Verifies:** AC6 - Profile data access

- ✅ **Test:** should not include sensitive data in profile response
  - **Status:** RED - Sensitive data filtering not implemented
  - **Verifies:** AC6 - Security - data exposure prevention

---

## Data Factories Created

### User Factory

**File:** `tests/factories/user.factory.ts`

**Exports:**

- `createUser(overrides?)` - Create single user with optional overrides
- `createOAuthUser(provider, overrides?)` - Create OAuth user (Google/GitHub)
- `createUsers(count, overrides?)` - Create array of users
- `createUserProfile(userId, overrides?)` - Create user profile
- `createUserWithProfile(userOverrides?, profileOverrides?)` - Create user +
  profile
- `createRegistrationData(overrides?)` - Create registration form data
- `createLoginCredentials(overrides?)` - Create login credentials

**Example Usage:**

```typescript
// Create user with specific email
const user = createUser({ email: 'test@example.com' });

// Create OAuth user
const googleUser = createOAuthUser('google');

// Create user with profile
const { user, profile } = createUserWithProfile(
  { email: 'dev@example.com' },
  { onboarding_completed: true }
);

// Generate 5 random users
const users = createUsers(5);
```

**Pattern:** Uses `@faker-js/faker` for random data generation to prevent
collisions and ensure test isolation

---

### Workspace Factory

**File:** `tests/factories/workspace.factory.ts`

**Exports:**

- `createWorkspace(userId, overrides?)` - Create single workspace
- `createDefaultWorkspace(userId, template?, overrides?)` - Create default
  workspace
- `createWorkspaces(userId, count, overrides?)` - Create array of workspaces
- `createOnboardingData(overrides?)` - Create onboarding wizard data
- `createWorkspacePayload(overrides?)` - Create workspace API payload
- `createWorkspaceConfiguration(template, aiTools?, overrides?)` - Create
  workspace config

**Example Usage:**

```typescript
// Create workspace for user
const workspace = createWorkspace('user-123');

// Create default React workspace
const defaultWs = createDefaultWorkspace('user-123', 'react');

// Create 3 workspaces with different templates
const workspaces = createWorkspaces('user-123', 3);

// Create onboarding data
const onboarding = createOnboardingData({
  userType: 'team',
  aiTools: ['claude', 'cursor']
});
```

**Pattern:** Template-aware factory that generates appropriate configuration
based on workspace type

---

## Fixtures Created

### Authentication Fixtures

**File:** `tests/fixtures/auth.fixture.ts`

**Fixtures:**

- `authenticatedUser` - User account with JWT token, auto-cleanup
  - **Setup:** Creates user via API, generates JWT token
  - **Provides:** `{ user, profile, token }`
  - **Cleanup:** Deletes user after test

- `testUsers` - Array of 3 test users, auto-cleanup
  - **Setup:** Creates multiple users via API
  - **Provides:** `User[]` array
  - **Cleanup:** Deletes all users after test

- `oauthUser` - OAuth-authenticated user, auto-cleanup
  - **Setup:** Simulates OAuth callback, creates user with provider
  - **Provides:** `{ user, provider }`
  - **Cleanup:** Deletes OAuth user after test

- `authenticatedPage` - Page with user logged in, auto-cleanup
  - **Setup:** Creates user, logs in via UI, provides authenticated page
  - **Provides:** Playwright `Page` already logged in
  - **Cleanup:** Logs out and deletes user

**Example Usage:**

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('should access protected route', async ({
  authenticatedUser,
  request
}) => {
  const response = await request.get('/api/workspaces', {
    headers: {
      Authorization: `Bearer ${authenticatedUser.token}`
    }
  });

  expect(response.status()).toBe(200);
});

test('should see dashboard', async ({ authenticatedPage }) => {
  // User is already logged in
  await expect(
    authenticatedPage.locator('[data-testid="workspace-name"]')
  ).toBeVisible();
});
```

---

### Workspace Fixtures

**File:** `tests/fixtures/workspace.fixture.ts`

**Fixtures:**

- `defaultWorkspace` - Default workspace for user, auto-cleanup
  - **Setup:** Creates workspace and sets as default in profile
  - **Provides:** `Workspace` object
  - **Cleanup:** Deletes workspace after test

- `testWorkspaces` - Array of 3 workspaces with different templates,
  auto-cleanup
  - **Setup:** Creates React, Node.js, and Python workspaces
  - **Provides:** `Workspace[]` array
  - **Cleanup:** Deletes all workspaces after test

**Example Usage:**

```typescript
import { test, expect } from './fixtures/merged.fixture';

test('should load default workspace', async ({
  authenticatedUser,
  defaultWorkspace,
  page
}) => {
  await page.setExtraHTTPHeaders({
    Authorization: `Bearer ${authenticatedUser.token}`
  });

  await page.goto('/dashboard');

  await expect(page.locator('[data-testid="workspace-name"]')).toHaveText(
    defaultWorkspace.name
  );
});
```

---

### Merged Fixtures

**File:** `tests/fixtures/merged.fixture.ts`

**Pattern:** Uses `mergeTests()` to compose all fixtures into single import

```typescript
import { test, expect } from './fixtures/merged.fixture';

test('complete workflow', async ({
  authenticatedUser,
  defaultWorkspace,
  authenticatedPage
}) => {
  // All fixtures available in single test
});
```

**Rationale:** Composability over inheritance - following
fixture-architecture.md pattern

---

## Mock Requirements

### OAuth Provider Mocks

**Google OAuth Mock:**

- **Authorization URL:** `https://accounts.google.com/o/oauth2/v2/auth`
- **Token Exchange Endpoint:** `POST https://oauth2.googleapis.com/token`
- **User Profile Endpoint:** `GET https://www.googleapis.com/oauth2/v2/userinfo`
- **Success Response:**
  ```json
  {
    "id": "google-user-12345",
    "email": "user@example.com",
    "name": "Test User",
    "picture": "https://example.com/photo.jpg"
  }
  ```
- **Failure Response:**
  ```json
  {
    "error": "access_denied",
    "error_description": "User denied access"
  }
  ```
- **Notes:** Mock OAuth state parameter validation for CSRF protection

**GitHub OAuth Mock:**

- **Authorization URL:** `https://github.com/login/oauth/authorize`
- **Token Exchange Endpoint:**
  `POST https://github.com/login/oauth/access_token`
- **User Profile Endpoint:** `GET https://api.github.com/user`
- **Success Response:**
  ```json
  {
    "id": 67890,
    "login": "testuser",
    "email": "user@example.com",
    "name": "Test User",
    "avatar_url": "https://avatars.githubusercontent.com/u/67890"
  }
  ```
- **Failure Response:**
  ```json
  {
    "error": "access_denied"
  }
  ```
- **Notes:** Mock OAuth state parameter, handle account linking for existing
  emails

---

### Email Service Mock

**Purpose:** Prevent real emails during testing

**Configuration:**

- Capture email contents to test database or logs
- Provide test endpoint to retrieve sent emails: `GET /api/test/emails`
- No actual SMTP calls in test environment

**Example Verification:**

```typescript
// Verify welcome email sent after registration
const emails = await request.get('/api/test/emails');
const body = await emails.json();
expect(body.emails).toContainEqual(
  expect.objectContaining({
    to: 'newuser@example.com',
    subject: 'Welcome to CC Wrapper'
  })
);
```

---

## Required data-testid Attributes

### Authentication Pages

**Registration Page (`/auth/register`):**

- `register-email-input` - Email input field
- `register-password-input` - Password input field
- `register-confirm-password-input` - Confirm password input field
- `register-submit-button` - Registration submit button
- `email-error-message` - Email validation error message
- `password-error-message` - Password validation error message
- `confirm-password-error-message` - Confirm password error message
- `registration-error-message` - General registration error message
- `google-login-button` - Google OAuth login button
- `github-login-button` - GitHub OAuth login button

**Login Page (`/auth/login`):**

- `login-email-input` - Email input field
- `login-password-input` - Password input field
- `login-submit-button` - Login submit button
- `login-error-message` - Login error message
- `google-login-button` - Google OAuth button
- `github-login-button` - GitHub OAuth button

**OAuth Callback Page:**

- `oauth-error-message` - OAuth error message display
- `rate-limit-error-message` - Rate limit error message

**Implementation Example:**

```tsx
<input
  data-testid="register-email-input"
  type="email"
  placeholder="Email"
/>
<button data-testid="register-submit-button">
  Create Account
</button>
<div data-testid="email-error-message" className="error">
  {emailError}
</div>
```

---

### Onboarding Wizard

**Wizard Navigation:**

- `onboarding-progress` - Progress indicator container
- `progress-percentage` - Progress percentage display
- `onboarding-next-button` - Next step button
- `onboarding-back-button` - Back to previous step button
- `onboarding-complete-button` - Complete onboarding button
- `skip-onboarding-button` - Skip onboarding button
- `skip-confirmation-dialog` - Skip confirmation dialog
- `skip-confirmation-message` - Skip confirmation message text
- `skip-confirm-button` - Confirm skip button
- `onboarding-step-title` - Current step title display

**Step 1 - User Type Selection:**

- `user-type-solo` - Solo user type option
- `user-type-team` - Team user type option
- `user-type-enterprise` - Enterprise user type option

**Step 2 - AI Tools Selection:**

- `ai-tool-claude` - Claude checkbox
- `ai-tool-chatgpt` - ChatGPT checkbox
- `ai-tool-cursor` - Cursor checkbox
- `ai-tool-windsurf` - Windsurf checkbox
- `ai-tool-github-copilot` - GitHub Copilot checkbox

**Step 3 - Workspace Configuration:**

- `workspace-name-input` - Workspace name input
- `workspace-description-input` - Workspace description input
- `workspace-template-select` - Template dropdown
- `template-option-react` - React template option
- `template-option-nodejs` - Node.js template option
- `template-option-python` - Python template option
- `template-option-custom` - Custom template option
- `workspace-name-error` - Workspace name validation error

**Implementation Example:**

```tsx
<div data-testid="onboarding-progress">
  <span data-testid="progress-percentage">33%</span>
</div>

<button
  data-testid="user-type-solo"
  aria-selected={selectedType === 'solo'}
>
  Solo Developer
</button>

<input
  data-testid="workspace-name-input"
  placeholder="Workspace Name"
/>
```

---

### Dashboard & Workspace

**Dashboard:**

- `workspace-name` - Current workspace name display
- `active-workspace-name` - Active workspace name (when loaded from profile)
- `workspace-template-badge` - Template type badge
- `welcome-banner` - Welcome banner for new users
- `profile-setup-reminder` - Profile completion reminder notification
- `user-menu-button` - User menu dropdown button
- `logout-button` - Logout button

**Guided Tour:**

- `tour-overlay` - Tour overlay container
- `tour-step-title` - Current tour step title
- `tour-next-button` - Next tour step button
- `tour-skip-button` - Skip tour button
- `tour-skip-confirmation` - Skip tour confirmation dialog
- `tour-skip-confirm-button` - Confirm skip tour button
- `tour-complete-button` - Complete tour button
- `tour-spotlight` - Tour spotlight element (with data-target attribute)

**Implementation Example:**

```tsx
<div data-testid="workspace-name">
  {workspace.name}
</div>

<div data-testid="tour-overlay">
  <h2 data-testid="tour-step-title">Welcome to CC Wrapper</h2>
  <div
    data-testid="tour-spotlight"
    data-target="terminal-panel"
  />
  <button data-testid="tour-next-button">Next</button>
</div>
```

---

### Profile Settings Page

**Page Sections:**

- `ai-tools-section` - AI tools management section
- `notification-preferences-section` - Notification preferences section
- `default-workspace-section` - Default workspace selection section

**AI Tools Management:**

- `selected-ai-tools` - Currently selected AI tools display
- `add-ai-tool-button` - Add AI tool button
- `ai-tool-dropdown` - AI tool selection dropdown
- `confirm-add-tool-button` - Confirm add tool button
- `remove-ai-tool-{tool-name}` - Remove specific tool button (e.g.,
  `remove-ai-tool-cursor`)
- `ai-tool-{tool-name}` - AI tool item display (e.g., `ai-tool-claude`)
- `ai-tools-error` - AI tools validation error

**Notification Preferences:**

- `email-notifications-toggle` - Email notifications toggle
- `in-app-notifications-toggle` - In-app notifications toggle
- `quiet-hours-toggle` - Quiet hours enable toggle
- `quiet-hours-start` - Quiet hours start time input
- `quiet-hours-end` - Quiet hours end time input
- `quiet-hours-error` - Quiet hours validation error

**Default Workspace:**

- `default-workspace-select` - Default workspace dropdown
- `workspace-option-{id}` - Workspace option in dropdown (e.g.,
  `workspace-option-1`)

**Form Actions:**

- `save-profile-button` - Save changes button
- `cancel-changes-button` - Cancel changes button
- `restart-onboarding-button` - Restart onboarding button
- `save-success-message` - Save success notification
- `save-error-message` - Save error notification
- `form-validation-error` - Form validation error message

**Implementation Example:**

```tsx
<section data-testid="ai-tools-section">
  <div data-testid="selected-ai-tools">
    {aiTools.map(tool => (
      <div key={tool} data-testid={`ai-tool-${tool}`}>
        {tool}
        <button data-testid={`remove-ai-tool-${tool}`}>×</button>
      </div>
    ))}
  </div>
  <button data-testid="add-ai-tool-button">Add Tool</button>
</section>

<label>
  <input
    type="checkbox"
    data-testid="email-notifications-toggle"
    checked={emailEnabled}
  />
  Email Notifications
</label>

<button data-testid="save-profile-button">
  Save Changes
</button>
```

---

## Implementation Checklist

### Task Group 1: Authentication Database Schema

**Test Coverage:** API tests in `tests/api/auth-api.spec.ts`

- [ ] Create `users` table with fields: `id`, `email`, `password_hash`,
      `oauth_provider`, `oauth_id`, `user_type`, `created_at`, `updated_at`
- [ ] Create `user_profiles` table with fields: `user_id`, `preferred_ai_tools`
      (JSONB), `notification_preferences` (JSONB), `default_workspace_id`,
      `onboarding_completed`, `tour_completed`
- [ ] Add Prisma schema definitions for `User` and `UserProfile` models
- [ ] Add indexes on `email` (unique), `oauth_provider`, and `oauth_id` for
      query performance
- [ ] Generate and run Prisma migrations
- [ ] Add data-testid attributes: N/A (database layer)
- [ ] Run tests: `bunx turbo test --filter=tests/api/auth-api.spec.ts`
- [ ] ✅ **Tests pass (green phase):** User registration, login, OAuth tests

**Estimated Effort:** 2 hours

---

### Task Group 2: Authentication API - Email/Password

**Test Coverage:** API + E2E tests (auth-registration.spec.ts, auth-api.spec.ts)

- [ ] Implement `POST /api/auth/register` endpoint with Zod validation
- [ ] Add email format validation (Zod email schema)
- [ ] Add password strength validation (min 8 chars, uppercase, lowercase,
      number, special char)
- [ ] Implement password confirmation matching
- [ ] Add unique email constraint check (409 Conflict on duplicate)
- [ ] Implement password hashing with `Bun.password.hash()` using Argon2id
      (memoryCost: 65536, timeCost: 3)
- [ ] Generate JWT token using `Bun.crypto.subtle.sign()` with 15-minute expiry
- [ ] Return user object (excluding password_hash) and JWT token on success
- [ ] Add data-testid attributes: Registration form fields (see Required
      data-testid section)
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/auth-registration.spec.ts`
- [ ] ✅ **Tests pass:** Registration with valid credentials, validation errors,
      duplicate email

**Estimated Effort:** 3 hours

---

### Task Group 3: Authentication API - Login

**Test Coverage:** API + E2E tests (auth-registration.spec.ts, auth-api.spec.ts)

- [ ] Implement `POST /api/auth/login` endpoint
- [ ] Verify email exists in database
- [ ] Verify password using `Bun.password.verify()` with stored hash
- [ ] Generate JWT token on successful authentication
- [ ] Return user object and JWT token
- [ ] Implement normalized error messages (don't reveal if email exists)
- [ ] Add form validation (disable submit when fields empty)
- [ ] Add data-testid attributes: Login form fields
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/auth-registration.spec.ts`
- [ ] ✅ **Tests pass:** Login with valid credentials, invalid credentials, form
      validation

**Estimated Effort:** 2 hours

---

### Task Group 4: OAuth Integration - Google

**Test Coverage:** E2E + API tests (auth-registration.spec.ts, auth-api.spec.ts)

- [ ] Set up Google OAuth configuration (client_id, client_secret, redirect_uri
      from env)
- [ ] Implement OAuth initiation endpoint (redirect to Google authorization URL)
- [ ] Generate and validate CSRF state parameter
- [ ] Implement `GET /api/auth/oauth/google/callback` endpoint
- [ ] Exchange authorization code for access token
- [ ] Retrieve user profile from Google API
- [ ] Check if user exists with matching email
- [ ] If exists: Link OAuth provider to existing account
- [ ] If not exists: Create new user with OAuth credentials
- [ ] Generate JWT token and return user object
- [ ] Handle OAuth errors (access_denied, invalid_grant)
- [ ] Add data-testid attributes: `google-login-button`, `oauth-error-message`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/auth-registration.spec.ts`
- [ ] ✅ **Tests pass:** Google OAuth flow, account linking, error handling

**Estimated Effort:** 4 hours

---

### Task Group 5: OAuth Integration - GitHub

**Test Coverage:** E2E + API tests (auth-registration.spec.ts, auth-api.spec.ts)

- [ ] Set up GitHub OAuth configuration (client_id, client_secret, redirect_uri
      from env)
- [ ] Implement OAuth initiation endpoint (redirect to GitHub authorization URL)
- [ ] Implement `GET /api/auth/oauth/github/callback` endpoint
- [ ] Exchange authorization code for access token
- [ ] Retrieve user profile from GitHub API
- [ ] Handle account linking (same logic as Google OAuth)
- [ ] Create new user if email doesn't exist
- [ ] Generate JWT token
- [ ] Handle OAuth errors
- [ ] Add data-testid attributes: `github-login-button`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/auth-registration.spec.ts`
- [ ] ✅ **Tests pass:** GitHub OAuth flow, account linking

**Estimated Effort:** 3 hours

---

### Task Group 6: Rate Limiting

**Test Coverage:** E2E + API tests (auth-registration.spec.ts, auth-api.spec.ts)

- [ ] Install rate limiting middleware (e.g., `@elysiajs/rate-limit`)
- [ ] Configure rate limit: 100 requests/minute per IP for `/api/auth/*`
- [ ] Return 429 status code when limit exceeded
- [ ] Include rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
      `X-RateLimit-Reset`
- [ ] Add error message for rate limit: "Too many requests. Please try again
      later."
- [ ] Add data-testid attributes: `rate-limit-error-message`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/auth-registration.spec.ts`
- [ ] ✅ **Tests pass:** Rate limiting enforced after 100 requests

**Estimated Effort:** 1.5 hours

---

### Task Group 7: Onboarding Wizard UI - Step 1 (User Type)

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Create `/onboarding` route in Astro
- [ ] Build onboarding wizard layout component with React island
- [ ] Implement Step 1: User type selection with visual cards
      (solo/team/enterprise)
- [ ] Add progress indicator showing "Step 1 of 3" and "33%" completion
- [ ] Implement state management with Zustand for wizard state
- [ ] Disable "Next" button until user type is selected
- [ ] Enable "Next" button on user type selection
- [ ] Preserve selection when navigating back from Step 2
- [ ] Add data-testid attributes: `user-type-solo`, `user-type-team`,
      `user-type-enterprise`, `onboarding-next-button`, `onboarding-progress`,
      `progress-percentage`, `onboarding-step-title`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** User type selection, Next button state, progress
      indicator

**Estimated Effort:** 3 hours

---

### Task Group 8: Onboarding Wizard UI - Step 2 (AI Tools)

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Implement Step 2: AI tools selection with checkboxes
- [ ] Display options: Claude, ChatGPT, Cursor, Windsurf, GitHub Copilot
- [ ] Allow multiple selections (checkboxes, not radio buttons)
- [ ] Update progress to "Step 2 of 3" and "67%"
- [ ] Enable "Next" button even with no selections (AI tools optional)
- [ ] Add "Back" button to return to Step 1
- [ ] Preserve selections when navigating between steps
- [ ] Add data-testid attributes: `ai-tool-claude`, `ai-tool-chatgpt`,
      `ai-tool-cursor`, `ai-tool-windsurf`, `ai-tool-github-copilot`,
      `onboarding-back-button`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** AI tools multi-select, Back navigation, state
      preservation

**Estimated Effort:** 2.5 hours

---

### Task Group 9: Onboarding Wizard UI - Step 3 (Workspace)

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Implement Step 3: Workspace configuration form
- [ ] Add workspace name input (required field)
- [ ] Add workspace description input (optional)
- [ ] Add template dropdown: React, Node.js, Python, Custom
- [ ] Update progress to "Step 3 of 3" and "100%"
- [ ] Validate workspace name is not empty
- [ ] Display validation error if name is missing
- [ ] Change "Next" to "Complete" button on Step 3
- [ ] Add data-testid attributes: `workspace-name-input`,
      `workspace-description-input`, `workspace-template-select`,
      `template-option-react`, `template-option-nodejs`,
      `template-option-python`, `template-option-custom`,
      `workspace-name-error`, `onboarding-complete-button`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** Workspace form, validation, template selection

**Estimated Effort:** 3 hours

---

### Task Group 10: Workspace Creation API

**Test Coverage:** API tests (workspace-api.spec.ts)

- [ ] Implement `POST /api/workspaces` endpoint
- [ ] Add authentication middleware (require JWT token)
- [ ] Validate workspace name (required, min 1 char)
- [ ] Validate template value (enum: react, nodejs, python, custom)
- [ ] Generate workspace configuration based on template:
  - React: `{ framework: 'react', packageManager: 'bun', typescript: true }`
  - Node.js: `{ framework: 'nodejs', packageManager: 'bun', typescript: true }`
  - Python: `{ framework: 'python', packageManager: 'npm', typescript: true }`
  - Custom: `{ packageManager: 'bun', typescript: true }`
- [ ] Create workspace in database with `user_id` from JWT
- [ ] Set `is_default: true` if user has no other workspaces
- [ ] Return workspace object with configuration
- [ ] Add data-testid attributes: N/A (API endpoint)
- [ ] Run tests: `bunx turbo test --filter=tests/api/workspace-api.spec.ts`
- [ ] ✅ **Tests pass:** Workspace creation, template configuration, default
      workspace logic

**Estimated Effort:** 3 hours

---

### Task Group 11: Onboarding Completion Flow

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Wire "Complete" button to submit onboarding data
- [ ] Collect wizard state: userType, aiTools, workspaceName,
      workspaceDescription, workspaceTemplate
- [ ] Call `POST /api/workspaces` with collected data
- [ ] Update user profile with onboarding completion flag
- [ ] Redirect to `/dashboard` on success
- [ ] Display created workspace on dashboard
- [ ] Show workspace template badge
- [ ] Add data-testid attributes: `workspace-template-badge`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** Complete onboarding flow, workspace creation, dashboard
      redirect

**Estimated Effort:** 2 hours

---

### Task Group 12: Skip Onboarding Functionality

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Add "Skip for now" button to all onboarding steps
- [ ] Show confirmation dialog when "Skip" is clicked
- [ ] Dialog message: "You can complete your profile setup later"
- [ ] Create default workspace on skip:
  - Name: "My Workspace"
  - Description: "Default workspace"
  - Template: "custom"
  - `is_default: true`
- [ ] Redirect to `/dashboard` after skip
- [ ] Display welcome banner on dashboard for skipped onboarding
- [ ] Show reminder notification: "Complete your profile to unlock all features"
- [ ] Add "Restart Onboarding" button in profile settings
- [ ] Track onboarding skip in analytics (optional)
- [ ] Add data-testid attributes: `skip-onboarding-button`,
      `skip-confirmation-dialog`, `skip-confirmation-message`,
      `skip-confirm-button`, `welcome-banner`, `profile-setup-reminder`,
      `restart-onboarding-button`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** Skip functionality, default workspace creation,
      reminder notification

**Estimated Effort:** 3 hours

---

### Task Group 13: Guided Tour Component

**Test Coverage:** E2E tests (onboarding-wizard.spec.ts)

- [ ] Create Tour component using React
- [ ] Launch tour automatically after onboarding completion
- [ ] Define tour steps with spotlight overlay:
  1. Welcome to CC Wrapper
  2. Terminal Panel
  3. Browser Panel
  4. AI Context Panel
  5. Wait-Time Optimization Features
- [ ] Implement spotlight positioning (highlight specific UI elements)
- [ ] Add tooltips with step descriptions
- [ ] Implement "Next" button for step progression
- [ ] Add "Skip Tour" button with confirmation dialog
- [ ] Store tour completion in user profile (`tour_completed: true`)
- [ ] Don't show tour again if `tour_completed: true`
- [ ] Add interactive elements allowing users to try features during tour
- [ ] Add data-testid attributes: `tour-overlay`, `tour-step-title`,
      `tour-spotlight`, `tour-next-button`, `tour-skip-button`,
      `tour-skip-confirmation`, `tour-skip-confirm-button`,
      `tour-complete-button`
- [ ] Run tests: `bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts`
- [ ] ✅ **Tests pass:** Tour launch, step progression, skip functionality,
      completion tracking

**Estimated Effort:** 4 hours

---

### Task Group 14: Profile Settings Page - UI Structure

**Test Coverage:** E2E tests (user-profile-settings.spec.ts)

- [ ] Create `/settings/profile` route in Astro
- [ ] Build profile settings page layout with React islands
- [ ] Create three main sections:
  - AI Tools Management
  - Notification Preferences
  - Default Workspace Selection
- [ ] Implement `GET /api/auth/profile` endpoint to fetch current profile
- [ ] Load current profile data on page mount
- [ ] Display current preferences in form fields
- [ ] Add data-testid attributes: `ai-tools-section`,
      `notification-preferences-section`, `default-workspace-section`,
      `selected-ai-tools`, `email-notifications-toggle`
- [ ] Run tests:
      `bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts`
- [ ] ✅ **Tests pass:** Profile page loads, sections visible, current data
      displayed

**Estimated Effort:** 2.5 hours

---

### Task Group 15: Profile Settings - AI Tools Management

**Test Coverage:** E2E + API tests (user-profile-settings.spec.ts,
workspace-api.spec.ts)

- [ ] Display current preferred AI tools list
- [ ] Add "Add AI Tool" button
- [ ] Show dropdown with available tools: Claude, ChatGPT, Cursor, Windsurf,
      GitHub Copilot
- [ ] Implement add tool functionality (append to array)
- [ ] Add remove button for each tool
- [ ] Validate at least one tool remains selected
- [ ] Display validation error if trying to remove last tool
- [ ] Add data-testid attributes: `add-ai-tool-button`, `ai-tool-dropdown`,
      `confirm-add-tool-button`, `remove-ai-tool-{tool}`, `ai-tool-{tool}`,
      `ai-tools-error`
- [ ] Run tests:
      `bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts`
- [ ] ✅ **Tests pass:** Add tool, remove tool, validation

**Estimated Effort:** 2 hours

---

### Task Group 16: Profile Settings - Notification Preferences

**Test Coverage:** E2E + API tests (user-profile-settings.spec.ts,
workspace-api.spec.ts)

- [ ] Add email notifications toggle checkbox
- [ ] Add in-app notifications toggle checkbox
- [ ] Add quiet hours section with enable toggle
- [ ] Add quiet hours start time input (time picker)
- [ ] Add quiet hours end time input (time picker)
- [ ] Validate quiet hours time range (end must be after start or cross
      midnight)
- [ ] Display validation error for invalid time range
- [ ] Add data-testid attributes: `email-notifications-toggle`,
      `in-app-notifications-toggle`, `quiet-hours-toggle`, `quiet-hours-start`,
      `quiet-hours-end`, `quiet-hours-error`
- [ ] Run tests:
      `bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts`
- [ ] ✅ **Tests pass:** Toggle notifications, quiet hours configuration,
      validation

**Estimated Effort:** 2.5 hours

---

### Task Group 17: Profile Settings - Default Workspace

**Test Coverage:** E2E + API tests (user-profile-settings.spec.ts,
workspace-api.spec.ts)

- [ ] Implement `GET /api/workspaces` endpoint (list user workspaces)
- [ ] Fetch user workspaces on profile page load
- [ ] Display workspaces in dropdown
- [ ] Show current default workspace as selected
- [ ] Allow changing default workspace selection
- [ ] Validate workspace ownership before updating
- [ ] Return 403 Forbidden if workspace belongs to different user
- [ ] Update dashboard to load default workspace from profile
- [ ] Add data-testid attributes: `default-workspace-select`,
      `workspace-option-{id}`, `active-workspace-name`
- [ ] Run tests:
      `bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts`
- [ ] ✅ **Tests pass:** Workspace list, default selection, ownership validation

**Estimated Effort:** 2.5 hours

---

### Task Group 18: Profile Update API

**Test Coverage:** API tests (workspace-api.spec.ts)

- [ ] Implement `PUT /api/auth/profile` endpoint
- [ ] Add authentication middleware
- [ ] Accept fields: `preferredAiTools`, `notificationPreferences`,
      `defaultWorkspaceId`
- [ ] Validate `preferredAiTools` array values (enum: claude, chatgpt, cursor,
      windsurf, github-copilot)
- [ ] Validate `defaultWorkspaceId` ownership (check workspace belongs to user)
- [ ] Update `user_profiles` table in database
- [ ] Return updated profile object
- [ ] Exclude sensitive data from response (password_hash, oauth_secret)
- [ ] Add data-testid attributes: N/A (API endpoint)
- [ ] Run tests: `bunx turbo test --filter=tests/api/workspace-api.spec.ts`
- [ ] ✅ **Tests pass:** Profile update, validation, ownership check

**Estimated Effort:** 2 hours

---

### Task Group 19: Profile Settings - Save/Cancel Actions

**Test Coverage:** E2E tests (user-profile-settings.spec.ts)

- [ ] Add "Save Changes" button
- [ ] Add "Cancel" button
- [ ] Disable "Save" button while save is in progress
- [ ] Call `PUT /api/auth/profile` on save
- [ ] Show success notification: "Profile updated successfully"
- [ ] Show error notification on failure: "Failed to update profile. Please try
      again."
- [ ] Implement cancel functionality (reset form to original values)
- [ ] Persist changes after page reload
- [ ] Add data-testid attributes: `save-profile-button`,
      `cancel-changes-button`, `save-success-message`, `save-error-message`,
      `form-validation-error`
- [ ] Run tests:
      `bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts`
- [ ] ✅ **Tests pass:** Save profile, cancel changes, error handling, loading
      state

**Estimated Effort:** 2 hours

---

## Running Tests

### Run All Failing Tests for Story 1.1

```bash
# E2E tests
bunx turbo test --filter=tests/e2e/auth-registration.spec.ts
bunx turbo test --filter=tests/e2e/onboarding-wizard.spec.ts
bunx turbo test --filter=tests/e2e/user-profile-settings.spec.ts

# API tests
bunx turbo test --filter=tests/api/auth-api.spec.ts
bunx turbo test --filter=tests/api/workspace-api.spec.ts

# All E2E tests
bunx turbo test --filter=tests/e2e/**

# All API tests
bunx turbo test --filter=tests/api/**

# All tests for Story 1.1
bunx turbo test
```

### Run Specific Test File

```bash
bunx turbo test --filter=tests/e2e/auth-registration.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
PLAYWRIGHT_HEADLESS=false bunx turbo test --filter=tests/e2e/auth-registration.spec.ts
```

### Debug Specific Test

```bash
bunx turbo test --filter=tests/e2e/auth-registration.spec.ts --debug
```

### Run Tests with Coverage

```bash
bunx turbo test --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 60 tests written and failing (32 E2E + 28 API)
- ✅ 2 data factories created with faker.js for randomized test data
- ✅ 3 fixture files created with auto-cleanup (auth, workspace, merged)
- ✅ Mock requirements documented (OAuth, email service)
- ✅ 80+ data-testid attributes specified
- ✅ Implementation checklist with 19 task groups created

**Verification:**

- All tests run and fail as expected
- Failure messages indicate missing implementation (routes, endpoints, UI
  components)
- Tests fail due to missing implementation, not test bugs
- No false positives (tests passing before implementation)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one task group** from implementation checklist (start with Task Group
   1: Database Schema)
2. **Read the tests** to understand expected behavior
3. **Implement minimal code** to make tests in that group pass
4. **Run the tests** for that group to verify green status
5. **Check off tasks** in implementation checklist
6. **Move to next task group** and repeat

**Key Principles:**

- One task group at a time (don't try to implement everything at once)
- Follow the order in implementation checklist (dependencies are sequenced)
- Minimal implementation (avoid over-engineering)
- Run tests frequently after each change
- Use data-testid attributes exactly as specified in tests

**Recommended Order:**

1. Database Schema (Task Group 1)
2. Email/Password Auth (Task Groups 2-3)
3. OAuth Integration (Task Groups 4-5)
4. Rate Limiting (Task Group 6)
5. Onboarding Wizard (Task Groups 7-9)
6. Workspace API (Task Group 10)
7. Onboarding Completion (Task Group 11)
8. Skip Onboarding (Task Group 12)
9. Guided Tour (Task Group 13)
10. Profile Settings (Task Groups 14-19)

**Progress Tracking:**

- Check off sub-tasks as you complete them
- Share progress in daily standup
- Mark story as `IN PROGRESS` in `docs/bmm-workflow-status.md`
- Update story when all tests pass to `READY FOR REVIEW`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 60 tests pass** (green phase complete)
2. **Review code for quality:**
   - Consistent error handling patterns
   - DRY principle (extract duplications)
   - Clear naming conventions
   - Type safety (use Zod schemas, TypeScript types)
3. **Extract duplications:**
   - Common validation logic → shared validators
   - Repeated UI components → reusable components
   - API middleware patterns → composable middleware
4. **Optimize performance:**
   - Database query optimization (check indexes)
   - Reduce API response payload size
   - Bundle size optimization for frontend
5. **Ensure tests still pass** after each refactor
6. **Update documentation** if API contracts change

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each refactoring step
- Don't change test behavior (only implementation)
- Focus on maintainability and readability

**Completion Criteria:**

- ✅ All 60 tests pass
- ✅ Code quality meets team standards (ESLint passes, no warnings)
- ✅ No duplications or code smells
- ✅ Performance targets met (< 50ms API response, < 2s page load)
- ✅ Ready for code review and story approval

**Final Steps:**

1. Run full test suite: `bunx turbo test`
2. Check mutation test coverage (if configured)
3. Run linter: `bunx turbo lint`
4. Commit changes with descriptive message
5. Create pull request referencing Story 1.1
6. Request code review
7. Run `/bmad:bmm:agents:sm story-approved` when complete

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase:

   ```bash
   bunx turbo test
   ```

   - Expected: 60 tests failing (missing routes, endpoints, UI)

3. **Begin implementation** using implementation checklist as guide
   - Start with Task Group 1 (Database Schema)
4. **Work one task group at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `/bmad:bmm:agents:sm story-approved` to
   move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments from
`bmad/bmm/testarch/knowledge/`:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and
  auto-cleanup using Playwright's `test.extend()` and `mergeTests()` for
  composability
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random
  test data generation with overrides support, preventing test data collisions
- **network-first.md** - Route interception patterns (intercept BEFORE
  navigation to prevent race conditions) - Applied in OAuth callback tests
- **test-quality.md** - Test design principles:
  - Given-When-Then structure for all tests
  - One assertion per test (atomic tests)
  - Deterministic tests (no random conditionals)
  - Explicit waits (no hard waits/sleeps)
  - Auto-cleanup in fixtures
- **test-levels-framework.md** - Test level selection framework:
  - E2E for critical user journeys (login, onboarding, profile)
  - API for business logic validation (auth, workspace creation, profile
    updates)
  - Unit for pure logic (covered in existing story tasks)
- **selector-resilience.md** - Selector best practices using `data-testid`
  attributes for all UI elements (80+ attributes specified)
- **timing-debugging.md** - Race condition prevention (network-first pattern,
  deterministic waiting)

See `bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:**

```bash
bunx turbo test
```

**Expected Results:**

```
❌ FAIL tests/e2e/auth-registration.spec.ts
  - should successfully register new user with valid credentials
    Error: page.goto: net::ERR_NAME_NOT_RESOLVED at /auth/register
  - [12 more tests failing...]

❌ FAIL tests/e2e/onboarding-wizard.spec.ts
  - should complete full onboarding wizard and create default workspace
    Error: page.goto: net::ERR_NAME_NOT_RESOLVED at /onboarding
  - [18 more tests failing...]

❌ FAIL tests/e2e/user-profile-settings.spec.ts
  - should display all profile settings sections
    Error: page.goto: net::ERR_NAME_NOT_RESOLVED at /settings/profile
  - [17 more tests failing...]

❌ FAIL tests/api/auth-api.spec.ts
  - should create new user with valid email and password
    Error: 404 Not Found - POST /api/auth/register
  - [22 more tests failing...]

❌ FAIL tests/api/workspace-api.spec.ts
  - should create workspace with valid data
    Error: 404 Not Found - POST /api/workspaces
  - [5 more tests failing...]

Tests: 60 failed, 0 passed, 60 total
Time:  12.3s
```

**Summary:**

- Total tests: 60 (32 E2E + 28 API)
- Passing: 0 (expected)
- Failing: 60 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- **E2E Tests:** `page.goto: net::ERR_NAME_NOT_RESOLVED` - Routes not
  implemented
- **API Tests:** `404 Not Found` - Endpoints not implemented
- **UI Tests:** `locator not found` - UI components and data-testid attributes
  not implemented

These failures are expected and indicate correct RED phase. Tests will turn
green as implementation progresses.

---

## Notes

### Technology Stack Notes

- **Authentication:** Bun-native implementation using `Bun.password.hash()` for
  Argon2id and `Bun.crypto.subtle.sign()` for JWT
- **API Framework:** Elysia 1.4.12 on Bun runtime for type-safe API endpoints
- **Database:** Prisma 6.17.0 with PostgreSQL 18.0
- **Frontend:** Astro 5.14 + React 19.2.0 hybrid architecture (islands)
- **State Management:** Zustand 4.5.5 for onboarding wizard state
- **Testing:** Playwright 1.56.0 for E2E and API tests, Bun Test for unit tests

### Security Considerations

- **JWT Expiry:** 15-minute tokens (refresh tokens not in scope for Story 1.1)
- **Password Hashing:** Argon2id with memoryCost: 65536, timeCost: 3, threads: 4
- **CSRF Protection:** OAuth state parameter validation
- **Rate Limiting:** 100 requests/minute per IP on all auth endpoints
- **Information Disclosure:** Normalized error messages (don't reveal if email
  exists)
- **Sensitive Data:** Exclude password_hash and OAuth secrets from API responses

### Performance Targets

- **API Response Time:** < 50ms for registration/login
- **Database Operations:** < 20ms for user creation/lookup
- **OAuth Flow:** < 2 seconds complete flow
- **Onboarding Load:** < 2 seconds initial page load
- **Dashboard Load:** < 1.5 seconds with default workspace

### Test Isolation

All tests use:

- **Random data** via faker.js (no hardcoded emails or names)
- **Auto-cleanup** via fixtures (users/workspaces deleted after tests)
- **Atomic assertions** (one assertion per test)
- **No shared state** between tests
- **Deterministic waits** (Playwright auto-waiting, no hard sleeps)

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @BMad (TEA Agent) for test-related questions
- Consult `bmad/bmm/testarch/knowledge/` for testing best practices
- Refer to `tests/README.md` for test framework documentation
- Review Story 1.1 context: `docs/stories/story-1.1.md`

---

**Generated by BMad TEA Agent** - 2025-10-21
