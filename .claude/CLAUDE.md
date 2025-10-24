# Claude Code User Preferences - Eduardo

## Code and Documentation Standards

**CRITICAL**: All code, code comments, and technical documentation MUST be
written in **English**.

- **Code**: English only
- **Code comments**: English only
- **Technical documentation** (README files, API docs, inline docs, etc.):
  English only
- **Commit messages**: English only
- **Pull request descriptions**: English only

## Communication

- **User communication language**: Portuguese (as configured in project
  bmad/bmm/config.yaml)
- **Technical artifacts**: English (as specified above)

## Quality Standards

### ESLint Rules

**CRITICAL RULE**: NEVER disable ESLint rules via inline comments
(eslint-disable, eslint-disable-next-line, etc.).

1. ❌ **NEVER USE** `// eslint-disable-next-line`
2. ❌ **NEVER USE** `/* eslint-disable */`
3. ✅ **ALWAYS FIX** the underlying code issue

**Rationale**: Disabling rules masks code quality issues and creates technical
debt. Code must comply with all ESLint rules without exceptions.

**No Exceptions**: If ESLint flags an issue, refactor the code to fix it
properly.

### Mutation Testing Thresholds

**CRITICAL RULE**: NEVER reduce mutation testing thresholds to make tests pass.
If mutation score is below threshold:

1. ✅ **ADD MORE TESTS** to kill surviving mutants
2. ✅ **IMPROVE TEST QUALITY** to cover edge cases
3. ❌ **NEVER LOWER THRESHOLDS** as a shortcut

**Rationale**: Lowering thresholds masks quality issues and creates technical
debt. Always improve test coverage instead.

**Exception**: Only adjust thresholds when mutants are legitimately untestable
(e.g., stub code awaiting implementation, logging strings with no behavioral
impact). Document all threshold adjustments with clear justification.

### Testing Commands

**PROJECT-SPECIFIC RULE**: Always use `bunx turbo test` for running tests in
this project.

1. ✅ **USE** `bunx turbo test` for running all tests
2. ✅ **USE** `bunx turbo test --filter=[package-name]` for specific package
   tests
3. ❌ **DO NOT USE** `bun test packages/` directly (use turbo instead)
4. ❌ **DO NOT USE** individual package test commands without proper context

**Rationale**: The project is configured to use turbo for test execution with
proper dependency management and parallel execution across packages.

**Alternative**: If direct bun testing is needed for debugging, use
`bun test packages/` but prefer turbo for standard test execution.

## Debugging and Problem Solving (User Lessons)

### CSS/Value Search Strategy

**CRITICAL LESSON LEARNED (2025-10-23)**: When fixing UI sizing issues, search
for the specific value directly instead of analyzing structures.

1. ✅ **DIRECT VALUE SEARCH**: Use grep to search for specific pixel values
   (e.g., "300px", "400px")
2. ✅ **CHECK MULTIPLE LOCATIONS**: CSS files can be in different directories
   (e.g., `public/styles/` vs `src/styles/`)
3. ✅ **VERIFY ACTIVE FILE**: Ensure you're editing the CSS file that's actually
   being loaded by the application
4. ❌ **AVOID STRUCTURAL ANALYSIS**: Don't spend time analyzing complex CSS
   rules when a simple value change is needed

**Real Example**: User fixed tour tooltip modal width in 3 minutes by:

- Searching for "300px" in codebase
- Finding correct file `apps/web/public/styles/global.css` (not
  `src/styles/global.css`)
- Changing `width: 300px` to `width: 400px` directly

**Rationale**: Direct value searches are significantly faster than analyzing CSS
architecture and component structures for simple sizing fixes.

---

_Last updated: 2025-10-23_
