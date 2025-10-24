# Stryker Mutation Testing

## Configuration

**File**: `stryker.config.json`

**Thresholds**:

- High: 80% (target)
- Low: 60% (warning)
- Break: 60% (minimum)

## Commands

```bash
bun run test:mutation  # Run mutation tests
```

## Best Practices

- NEVER lower thresholds - improve test quality instead
- Add tests for edge cases, error paths, boundary conditions
- Target 80%+ mutation score for production readiness
- Use mutation reports to identify test gaps

## Understanding Mutation Testing

Mutation testing introduces small changes (mutations) to your code and checks if
your tests catch these changes. If tests still pass after a mutation, it
indicates a gap in test coverage.

### Common Mutation Types

1. **Arithmetic Operators**: `+` → `-`, `*` → `/`
2. **Logical Operators**: `&&` → `||`, `!` → `(no change)`
3. **Conditional Statements**: `if (condition)` → `if (true)` or `if (false)`
4. **Return Values**: `return true` → `return false`
5. **Array Methods**: `push()` → `pop()`, `includes()` → `!includes()`

### Improving Mutation Score

When mutation score is low, add tests for:

1. **Edge Cases**: Empty arrays, null/undefined values, boundary conditions
2. **Error Paths**: Exception handling, validation failures
3. **Boolean Logic**: Both true and false branches
4. **Array/Object Operations**: Empty collections, single items, many items

### Example

```typescript
// Function to test
function isAdult(age: number): boolean {
  return age >= 18;
}

// Weak test (mutation survives)
test('isAdult returns true for 18', () => {
  expect(isAdult(18)).toBe(true);
});

// Strong tests (mutations killed)
test('isAdult handles edge cases', () => {
  expect(isAdult(18)).toBe(true); // boundary
  expect(isAdult(17)).toBe(false); // just below
  expect(isAdult(0)).toBe(false); // minimum
  expect(isAdult(100)).toBe(true); // high value
});
```

## Reports

After running mutation tests:

- HTML report: `reports/mutation/index.html`
- JSON report: `reports/mutation/mutation-report.json`

Review the HTML report to see:

- Which mutations survived (need more tests)
- Which tests killed which mutations
- Overall mutation score by file

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Run Mutation Tests
  run: bun run test:mutation
- name: Upload Mutation Report
  uses: actions/upload-artifact@v3
  with:
    name: mutation-report
    path: reports/mutation/
```
