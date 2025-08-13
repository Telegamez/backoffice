# Fix-lint-errors Command

Automatically identifies and fixes ESLint and TypeScript errors across the codebase while maintaining quality standards.

## Purpose
This command systematically identifies and resolves both ESLint and TypeScript errors throughout the codebase, ensuring code quality and consistency according to project standards.

## Usage
This command accepts optional file path(s) to target specific files, otherwise lints the entire codebase:

**Lint entire codebase:**
```
/fix-lint-errors
```

**Lint specific file(s):**
```
/fix-lint-errors packages/web-next/src/components/Settings.tsx
/fix-lint-errors packages/shared/types/src/User.ts packages/web-next/src/lib/user.ts
```

This command will:
1. Run the project's lint and type-check commands on specified files or entire codebase
2. Analyze each ESLint and TypeScript error type and determine appropriate fixes
3. Apply fixes automatically where safe and deterministic
4. Report any errors that require manual intervention
5. Re-run linting and type-checking to verify all fixes were successful

## Quality Standards Reference
All fixes must adhere to the comprehensive quality standards defined in:
- `.claude/includes/engineering/quality-standards.md`

## Implementation Guidelines
- Use `pnpm lint` and `pnpm type-check` for entire codebase or target specific files
- Focus on common fixable issues like:
  
  **ESLint Errors:**
  - Unused imports/variables
  - Missing semicolons
  - Formatting inconsistencies
  - Prefer const assertions
  - Missing return types
  
  **TypeScript Errors:**
  - Type annotation issues
  - Missing type imports
  - Incorrect type definitions
  - Generic type constraints
  - Interface vs type usage
  - Optional property handling

- **CRITICAL: Preserve existing code logic and functionality** - Do not alter business logic, change algorithms, or modify behavior
- **No opinionated changes** - Only fix syntax, types, and linting issues without changing code intent
- **Minimal modifications** - Make the smallest possible changes to resolve errors
- Follow established project patterns and conventions
- Only make changes that maintain or improve code quality
- Report complex errors that need human review

## Validation
After applying fixes:
- Run `pnpm lint` to ensure no new ESLint errors introduced
- Run `pnpm type-check` to verify TypeScript compilation with no errors
- Verify that all existing functionality and behavior is maintained
- Confirm that fixes address root causes, not just surface symptoms