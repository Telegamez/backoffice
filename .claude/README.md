# Claude Code Configuration Directory

This directory contains configurations for Claude Code to enhance development workflows on the Telegamez monorepo. The configurations are organized into three main categories: Slash Commands, Agents, and Includes.

## 📁 Directory Structure

```
.claude/
├── commands/              # Slash commands for specific workflows
│   ├── engineering/       # Engineering-specific commands
│   ├── design/           # Design commands (empty - future use)
│   ├── legal/            # Legal commands (empty - future use)
│   ├── marketing/        # Marketing commands (empty - future use)
│   ├── product/          # Product commands (empty - future use)
│   └── project-management/ # PM commands (empty - future use)
├── agents/                # Specialized agent configurations
│   ├── engineering/       # Engineering domain specialists
│   ├── design/           # Design domain specialists (empty - future use)
│   ├── legal/            # Legal domain specialists (empty - future use)
│   ├── marketing/        # Marketing domain specialists (empty - future use)
│   ├── product/          # Product domain specialists (empty - future use)
│   └── project-management/ # PM domain specialists (empty - future use)
├── includes/              # Reusable content and mappings
│   ├── engineering/       # Engineering includes
│   ├── design/           # Design includes (empty - future use)
│   ├── legal/            # Legal includes (empty - future use)
│   ├── marketing/        # Marketing includes (empty - future use)
│   ├── product/          # Product includes (empty - future use)
│   └── project-management/ # PM includes (empty - future use)
└── README.md             # This file
```

## 🚀 Slash Commands

Slash commands are pre-configured workflows that transform Claude Code into specific modes or execute particular tasks.

### Main Commands (`/commands/`)

| Command | Purpose | Key Features |
|---------|---------|--------------|
| **all-tools** | Tool Listing | Displays all available Claude Code tools with TypeScript signatures |
| **create-agent** | Universal Agent Creator | Orchestrates complete agent creation workflow across all team domains with meta-agent delegation |
| **create-slash-command** | Command Generation | Creates properly structured slash commands following project patterns and templates |
| **update-claude-agentic-readme** | Claude Config Documentation | Scans .claude/ directory and updates this README with current commands/agents/includes |

### Engineering Commands (`/commands/engineering/`)

| Command | Purpose | Key Features |
|---------|---------|--------------|
| **account-auth-specialist** | Auth Management | Supabase/GoTrue best practices, separation of concerns |
| **BestPractices** | Principal Engineer & Standards Architect | Industry best practices, design patterns, architectural guidance, trade-off analysis |
| **code-pr-review** | Code Review Mode | GitHub PR integration, thorough reviews, security focus |
| **create-functional-spec** | Spec Creation | Prerequisites validation, specialist coordination |
| **CreateGitWorktree** | Git Worktree Management | Creates parallel development branches with separate worktrees |
| **debug-deployment** | Deployment Debugging | Systematic deployment failure investigation, CI/CD troubleshooting, DevOps specialist routing |
| **docker-debug** | Docker Debugging | Expert container troubleshooting, multi-environment support, networking analysis |
| **Doc-It** | Documentation Auto-Update | Updates README, _docs/, CLAUDE.md based on code changes |
| **document-code** | Code Documentation | Orchestrates comprehensive JSDoc documentation for TypeScript/JavaScript files |
| **fix-error** | Error Investigation | Systematic error analysis using specialized agents, root cause fixes |
| **fix-github-ticket** | GitHub Issue Resolution | Systematic GitHub issue fixes with branch management and specialist coordination |
| **fix-lint-errors** | Code Quality | ESLint and TypeScript error resolution, quality standards enforcement |
| **fix-regression-bug** | Regression Analysis | Address regression bugs with specialist routing and impact analysis |
| **git-commit** | Git Commit Helper | Standardized commits with ticket numbers, automated workflow, test validation |
| **postgres-debug** | PostgreSQL Debugging | Database troubleshooting workflow orchestration, production issue coordination |
| **ReactDev** | React/Next.js Development Mode | Modern React 19+, Next.js 15+, TypeScript, Tailwind CSS, performance optimization |
| **remove-debug-logs** | Debug Cleanup | Comments out all console.debug statements |
| **technical-prd-review** | PRD Technical Review | Gap analysis, feasibility assessment, specialist consultation |
| **write-tests** | Test Orchestration | Comprehensive test creation and maintenance using testing-specialist agent |

## 🤖 Agents

Agents are specialized AI personas with specific domain expertise and capabilities.

### General Purpose Agents (`/agents/`)

| Agent | Specialty | Use Cases |
|-------|-----------|-----------|
| **command-builder-specialist** | Command Architecture | Design and build robust Claude Code slash commands, workflow automation guidance |
| **create-agent** | Agent Architect | Design new Claude Code agents with proper tools and prompts |
| **work-completion-summary** | Audio Summaries | TTS generation for task completion summaries |

### Engineering Specialists (`/agents/engineering/`)

| Agent | Domain | Expertise |
|-------|--------|-----------|
| **account-auth-specialist** | Authentication | Supabase/GoTrue, OAuth, session management, security |
| **bug-fixer** | QA Detective & Engineer | Bug investigation, root cause analysis, systematic fixes |
| **code-archaeologist** | Legacy Code Explorer | Codebase structure analysis, pattern detection, quality assessment |
| **code-reviewer** | Quality Gate | Security-aware reviews, automated checks, severity tagging |
| **database-architect** | Database Architecture | Schema design, Drizzle ORM, migrations, development patterns |
| **database-operations** | Database Operations | Production debugging, PostgreSQL, Docker, CI/CD, incident response |
| **devops-specialist** | DevOps & Infrastructure | Deployment failures, CI/CD pipelines, GitHub Actions, Docker, system administration |
| **documentation-specialist** | Technical Writer | READMEs, API docs, architecture guides, gap analysis |
| **frontend-specialist** | Frontend | React/Next.js, components, state management, UI/UX |
| **functional-spec-writer** | Requirements | Technical planning, multi-phase implementation |
| **github-ticket-branch-manager** | Branch Management | GitHub issue branch creation and checkout, ticket-based workflow automation |
| **manual-test-plan-specialist** | Manual Testing | Comprehensive manual test plans, user acceptance testing, feature validation |
| **nodejs-specialist** | Backend | Express.js, APIs, middleware, server architecture |
| **performance-optimizer** | Performance | Bottleneck analysis, optimization, metrics |
| **react-component-architect** | React Expert | Component design, React 19 patterns, accessibility, shadcn/ui |
| **react-nextjs-expert** | Next.js Specialist | SSR/SSG/ISR, App Router, data patterns, performance |
| **signaling-api-specialist** | Real-time Comms | Socket.io, WebRTC signaling, room management |
| **stt-api-specialist** | Speech-to-Text | WebSocket management, STT providers, audio processing |
| **testing-specialist** | Test Engineer | Comprehensive test coverage, Vitest/Jest patterns |

## 📄 Includes

Reusable content and mappings for consistent patterns across commands and agents.

### Engineering Includes (`/includes/engineering/`)

| Include | Purpose |
|---------|---------|
| **functional-spec-template.md** | Template structure for creating technical specifications |
| **prerequisites-validation.md** | Standard validation steps for ticket-based work |
| **quality-standards.md** | Quality checklist for code delivery |
| **specialist-mapping.md** | Domain-to-agent mapping for automatic specialist selection |

### Root Level Includes (`/includes/`)

| Include | Purpose |
|---------|---------|
| **slash-command-template.md** | Template structure for creating new slash commands |

## 🎯 Usage Examples

### Using Slash Commands
```
# Transform Claude into a React developer
/ReactDev

# Create a functional spec from a GitHub ticket
/create-functional-spec https://github.com/org/repo/issues/123

# Debug deployment failures and CI/CD issues
/debug-deployment "GitHub Actions workflow failing at deploy step"

# Fix a GitHub ticket systematically  
/fix-github-ticket https://github.com/org/repo/issues/123

# Document code with comprehensive JSDoc
/document-code packages/shared/db/src/auth.ts

# Create comprehensive tests for a component
/write-tests "src/components/AuthForm.tsx"

# Create a standardized git commit
/git-commit

# Perform a code review
/code-pr-review https://github.com/org/repo/pull/456
```

### Working with Agents
Agents are typically invoked by commands or by Claude Code when specific expertise is needed. They work collaboratively, often in parallel, to provide comprehensive analysis and implementation.

### Best Practices

1. **Use commands for workflows** - Start with a slash command when you have a specific task or need a particular mode
2. **Leverage specialists** - Commands automatically coordinate with relevant specialist agents
3. **Follow the patterns** - Commands and agents enforce consistent patterns and quality standards
4. **Update documentation** - Use `/Doc-It` after significant changes to keep docs current

## 🔧 Maintenance

- Commands and agents should be updated when new patterns emerge
- Use `/create-agent` (via the create-agent agent) to design new specialists
- Keep specialist-mapping.md current with new agents
- Regular review of includes ensures consistency

## 📝 Note on Empty Directories

The following directories exist for future expansion:
- `/commands/design/`, `/commands/legal/`, `/commands/marketing/`, `/commands/product/`, `/commands/project-management/`
- `/agents/design/`, `/agents/legal/`, `/agents/marketing/`, `/agents/product/`, `/agents/project-management/`
- `/includes/design/`, `/includes/legal/`, `/includes/marketing/`, `/includes/product/`, `/includes/project-management/`

These contain placeholder files and will be populated as domain-specific configurations are developed.