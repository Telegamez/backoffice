# Fix-error Command

Systematically investigates and fixes errors using specialized agents based on error context and domain expertise.

## Purpose
This command analyzes error logs, stack traces, and context to determine the appropriate specialist agent and implement comprehensive fixes that address root causes rather than symptoms.

## Usage
This command accepts error context including logs, stack traces, reproduction steps, and environmental data:

**Basic error fix:**
```
/fix-error "TypeError: Cannot read property 'id' of undefined at UserService.getUser"
```

**Error with full context:**
```
/fix-error "
Error: Connection timeout
Stack trace:
  at Database.connect (/app/db.js:45:12)
  at UserController.getUser (/app/controllers/user.js:23:8)
Environment: production
Timestamp: 2025-01-15T10:30:00Z
User ID: 12345
"
```

**Error with logs and reproduction steps:**
```
/fix-error "
Error: Authentication failed
Logs: [ERROR] Supabase auth token expired
Reproduction: Login -> Navigate to profile -> Action fails
Browser: Chrome 120
Device: Desktop
"
```

## Specialist Agent Selection
Based on error analysis, the command automatically engages the appropriate specialist agent from the mapping defined in `claude/includes/engineering/specialist-mapping.md`.

## Error Analysis Process
This command will:
1. Parse and analyze the provided error context
2. Identify error patterns and classify the domain
3. Select the most appropriate specialist agent based on triggers
4. Engage the specialist for systematic investigation and fix
5. Ensure fixes follow quality standards and include proper testing
6. Validate the solution addresses the root cause

## Quality Standards Reference
All error fixes must adhere to the comprehensive quality standards defined in:
- `.claude/includes/engineering/quality-standards.md`

## Implementation Guidelines
- **Root Cause Analysis**: Go beyond surface symptoms to fix underlying issues
- **Evidence Collection**: Gather comprehensive context including logs, traces, and environment
- **Pattern Recognition**: Identify recurring issues and systemic problems
- **Reliable Solutions**: Implement fixes that address core problems, not just symptoms
- **Quality Assurance**: Ensure fixes don't introduce regressions
- **Testing Strategy**: Include comprehensive tests to prevent future occurrences
- **Documentation**: Document findings and solutions for knowledge transfer
