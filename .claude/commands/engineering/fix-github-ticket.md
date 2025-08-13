# Fix GitHub Ticket

Systematically fixes GitHub issues by creating appropriate branches and engaging specialized agents: $ARGUMENTS

## Mandatory Prerequisites - EXECUTE FIRST
**BEFORE proceeding with any fix implementation, MUST complete these steps in order:**

1. **Engage GitHub Ticket Branch Manager** to handle branch operations:
   - Use `@engineering/github-ticket-branch-manager` agent
   - Provide the GitHub ticket URL for branch management
   - Wait for branch management completion before proceeding
2. **Analyze ticket content** from branch manager results to determine domain expertise required
3. **Validate ticket has sufficient detail** for implementation from branch manager analysis

## Usage
**Basic ticket fix:**
```
/fix-github-ticket https://github.com/user/repo/issues/123
```

**Ticket with context:**
```
/fix-github-ticket "https://github.com/user/repo/issues/456 - urgent production issue"
```

## Branch Management Process
**Branch operations are handled by the specialized agent:**

The `@engineering/github-ticket-branch-manager` agent will:
1. Extract ticket information using gh CLI
2. Generate proper branch name: `[ticket-number]-[git-safe-title]`
3. Fetch latest from origin
4. Create or checkout the appropriate branch
5. Return branch status and ticket analysis

**WAIT for branch manager completion before proceeding to specialist selection.**

## Specialist Agent Selection
**Based on ticket analysis, automatically engage appropriate specialist:**
- The command automatically engages the appropriate specialist agent from the mapping defined in `claude/includes/engineering/specialist-mapping.md`.

## Implementation Process
**ONLY proceed after GitHub Ticket Branch Manager completes branch setup. Execute in sequence:**

1. **Receive ticket analysis** from branch manager (title, description, labels)
2. **Identify domain triggers** from specialist mapping based on ticket content
3. **Select appropriate specialist agent** based on content patterns  
4. **Engage specialist** for systematic implementation on the prepared branch
5. **Follow quality standards** and testing requirements
6. **Validate solution** addresses all ticket requirements

## Critical Stop Conditions
**STOP and ask for clarification if:**
- GitHub Ticket Branch Manager reports errors or incomplete ticket information
- Ticket requirements are ambiguous or incomplete (after branch manager analysis)
- Multiple specialist domains are needed (ask which to prioritize)
- Ticket lacks acceptance criteria or success metrics
- Implementation approach is unclear from ticket description

## Quality Standards Reference
All implementations must follow:
- `.claude/includes/engineering/quality-standards.md`
- Specialist mapping: `.claude/includes/engineering/specialist-mapping.md`

## Success Validation
Before marking complete, ensure:
- [x] GitHub Ticket Branch Manager successfully completed branch operations
- [x] Specialist agent engaged based on ticket analysis from branch manager
- [x] Implementation addresses all ticket requirements
- [x] Code follows established patterns and passes tests
- [x] Solution ready for pull request on the correct branch