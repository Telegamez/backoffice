# Specialist Agent Domain Mapping

## CRITICAL RULE: NO AUTO-COMMIT
**⚠️ ABSOLUTELY FORBIDDEN: NO SPECIALIST AGENT MAY EVER AUTO-COMMIT CODE CHANGES**
- Specialists implement fixes and changes ONLY
- User maintains full control over git commits
- NEVER run git commit, git add, or any git commands that modify repository state
- Code changes must be left staged/unstaged for user to commit manually

## Authentication & Security
- **Domain**: Authentication, OAuth, session management, security patterns, RLS policies
- **Agent**: `@engineering/account-auth-specialist`
- **Triggers**: auth, login, signup, oauth, session, security, permissions, RLS

## Backend Development
- **Domain**: Node.js, Express.js, API endpoints, server-side logic, middleware
- **Agent**: `@engineering/nodejs-specialist`
- **Triggers**: api, endpoint, server, backend, express, middleware, nodejs

## Frontend Development
- **Domain**: React, Next.js, components, client-side state, UI/UX
- **Agent**: `@engineering/frontend-specialist`
- **Triggers**: react, nextjs, component, frontend, ui, tailwind, radix, shadcn, client, state

## Database Architecture
- **Domain**: Database design, schema architecture, migrations, Drizzle ORM development patterns
- **Agent**: `@engineering/database-architect`
- **Triggers**: schema, migration, drizzle, database design, architecture, development

## Database Operations  
- **Domain**: Production troubleshooting, PostgreSQL debugging, Docker containers, performance issues, deployment pipeline
- **Agent**: `@engineering/database-operations`
- **Triggers**: postgres debug, production issue, database performance, container issue, incident, deployment failure, github actions, ci/cd

## Real-time Features
- **Domain**: Socket.io, WebRTC, signaling, real-time communication
- **Agent**: `@engineering/signaling-api-specialist`
- **Triggers**: socket, webrtc, realtime, signaling, websocket

## Testing & Quality
- **Domain**: Unit tests, integration tests, code quality, testing frameworks
- **Agent**: `@engineering/testing-specialist`
- **Triggers**: test, testing, quality, coverage, jest, cypress, unit test, integration test

## Manual Test Planning
- **Domain**: Manual test plans, user acceptance testing, feature validation, test case design
- **Agent**: `@engineering/manual-test-plan-specialist`
- **Triggers**: manual test plan, test plan, manual testing, user acceptance, feature testing, test case, validation plan

## Documentation
- **Domain**: Technical writing, API docs, architecture docs, specifications
- **Agent**: `@engineering/documentation-specialist`
- **Triggers**: docs, documentation, readme, spec, architecture

## Performance & Optimization
- **Domain**: Performance analysis, optimization, monitoring, caching
- **Agent**: `@engineering/performance-optimizer`
- **Triggers**: performance, optimization, cache, monitoring, metrics

## Speech-to-Text API
- **Domain**: WebSocket management, STT provider integration, audio processing, real-time transcription
- **Agent**: `@engineering/stt-api-specialist`
- **Triggers**: stt, speech, transcription, audio, websocket, streaming, voice

## Bug Investigation & Quality Assurance
- **Domain**: Systematic bug investigation, root cause analysis, quality detective work
- **Agent**: `@engineering/bug-fixer`
- **Triggers**: bug, error, issue, investigation, root cause, systematic fix, quality assurance

## Code Analysis & Exploration
- **Domain**: Legacy code exploration, codebase structure analysis, architecture documentation
- **Agent**: `@engineering/code-archaeologist`
- **Triggers**: explore codebase, legacy code, architecture analysis, code structure, refactor preparation

## Code Review & Quality Gate
- **Domain**: Security-aware code reviews, quality gate enforcement, merge validation
- **Agent**: `@engineering/code-reviewer`
- **Triggers**: code review, pull request, merge validation, security review, quality gate

## Requirements & Technical Planning
- **Domain**: Functional specifications, requirements analysis, technical planning, implementation plans
- **Agent**: `@engineering/functional-spec-writer`
- **Triggers**: specification, requirements, technical planning, implementation plan, feature design

## React Component Architecture
- **Domain**: React component design, modern React patterns, accessibility, shadcn/ui
- **Agent**: `@engineering/react-component-architect`
- **Triggers**: react component, component design, accessibility, shadcn, ui components, react patterns

## Next.js Framework Expertise
- **Domain**: Next.js SSR/SSG/ISR, App Router, full-stack React applications
- **Agent**: `@engineering/react-nextjs-expert`
- **Triggers**: nextjs, next.js, app router, ssr, ssg, isr, server components

## GitHub Workflow Management
- **Domain**: GitHub issue branch management, ticket-based workflow automation
- **Agent**: `@engineering/github-ticket-branch-manager`
- **Triggers**: github branch, ticket branch, issue branch, branch management, github workflow

## DevOps & Infrastructure
- **Domain**: Deployment automation, CI/CD pipelines, GitHub Actions, Docker containers, infrastructure troubleshooting
- **Agent**: `@devops-specialist`
- **Triggers**: deployment, ci/cd, github actions, workflow, docker, infrastructure, build failure, deployment failure, container, devops