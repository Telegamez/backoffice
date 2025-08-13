# Fix Regression Bug

## Purpose
Address regression bugs caused by recent changes with specialist agent routing and thorough impact analysis.

## Command Logic
1. **Analyze Recent Changes**: Review recent commits and identify potentially problematic changes
2. **Bug Context Analysis**: Examine the specific bug/issue and its symptoms
3. **Agent Mapping**: Use specialist mapping to identify relevant domain experts
4. **Regression Focus**: Emphasize how recent changes may have caused the issue
5. **Specialist Routing**: Route to appropriate specialist or alert if no specialist exists

## Usage
```
/fix-regression-bug [description of the regression] [optional: specific files/areas affected]
```

## Implementation
- Create a Todo list for the following and verify that the agent(s) has completed all of the steps berore returning to the user.

### Step 1: Recent Changes Analysis
- Examine the last 5-10 commits using git log
- Identify changed files and their modification patterns
- Cross-reference with the reported regression timeline

### Step 2: Specialist Domain Mapping
Reference `.claude/includes/engineering/specialist-mapping.md` to determine relevant agents based on:
- **File patterns** (e.g., `/api/` → nodejs-specialist, `/components/` → frontend-specialist)
- **Technology keywords** (e.g., auth/login → account-auth-specialist, database → database-architect)
- **Functionality areas** (e.g., realtime/socket → signaling-api-specialist)

### Step 3: Regression Context Briefing
Create a context brief for the specialist that includes:
- **Regression symptoms**: What specifically broke or changed behavior
- **Timeline**: When the regression was introduced
- **Recent changes**: Specific commits/changes that may have caused it
- **Affected areas**: Files, functions, or systems impacted
- **Focus directive**: Emphasize investigating how their recent work contributed to the issue

### Step 4: Specialist Assignment or Alert
- **If specialist found**: Route to appropriate specialist with regression context
- **If no specialist found**: Alert user about the gap and recommend creating a specialist

### Specialist Context Template
When routing to a specialist, provide this context:
```
REGRESSION BUG ANALYSIS REQUIRED

**Regression Description**: [user provided description]
**Affected Areas**: [identified files/systems]
**Recent Changes That May Have Caused This**:
- [list of relevant recent commits with SHA and description]
- [focus on changes in specialist's domain]

**Your Task**: 
1. Analyze how the recent changes in your domain may have introduced this regression
2. Identify the root cause focusing on your recent modifications and provide back to the user. If the most recent code changes do not apply, that is fine, and continue with the root cause analysis.
3. Implement a targeted fix that addresses the regression without introducing new issues
4. Ensure the fix is minimal and surgical to avoid additional regressions
5. Report back to the main agent exactly in detial whtat the root cause is so that the main agent can preovide the detials to the user

**Critical**: This is a regression caused by recent changes. Focus on how YOUR recent work may have contributed to this issue.
```

## Domain-Specific Routing Logic

Refer to `.claude/includes/engineering/specialist-mapping.md` for the complete and up-to-date specialist routing mappings. The centralized mapping file contains:
- Trigger keywords for each domain
- Appropriate specialist agents to route to
- Focus areas for regression investigation

## Error Handling
If no specialist can be mapped:
```
⚠️ SPECIALIST MAPPING GAP DETECTED

No specialist agent found for this regression context:
- **Affected areas**: [list identified areas]
- **Technology stack**: [identified technologies]
- **File patterns**: [identified file patterns]

**Recommendation**: Create a specialist agent for this domain or extend an existing specialist's scope.

**Immediate action**: The bug-fixer agent will handle this regression, but consider adding specialist coverage for this area.
```

## Success Criteria
- Specialist receives comprehensive regression context
- Recent changes are clearly identified and analyzed
- Root cause investigation focuses on recent modifications
- Fix is targeted and surgical to prevent additional regressions
- User is alerted if specialist coverage gaps exist

## Notes
- Always emphasize that this is a regression caused by recent changes
- Provide specific git commit context to the specialist
- Focus on "how did we break this" rather than "what is broken"
- Route to the most specific specialist available
- Alert user about gaps in specialist coverage to improve future routing