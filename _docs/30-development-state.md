# Development State & TODOs

## Current State
- DB populated from GitHub (2024-10 → 2025-08). Example counts (local):
  - 2025 Jan–Aug: 289 issues, 262 PRs
  - Mapped weekly segments: 45 total currently
- UI supports compact/time modes, lane stacking, and AI streaming.

## Known Gaps
- PR labels not stored; category derivation from PR title only
- Monthly overview not rendered (labels on time mode are minimal)
- Mapping uses simple heuristics for category and impact
- No docker-compose (manual Docker run)
- No tests/CI yet

## TODOs
- Data
  - Store PR labels; extend schema and sync to capture them
  - Add monthly aggregation and labels; UI toggle between weekly/monthly rollups
  - Configurable mapping rules for categories/impact
  - Idempotent deep-sync with since/until date window
- UI/UX
  - Add month dividers and density bar in time mode
  - Expand shadcn component set (badge/progress) for richer detail panel
  - Improve accessibility and keyboard navigation
- AI
  - Surface model selection in UI; retry/logging
  - Add structured insights endpoint (JSON) alongside text stream
- DevOps
  - docker-compose for web+db, healthchecks
  - CI: lint, typecheck, e2e smoke (dev server up, APIs 200)
  - Secrets handling guidance for PAT/OPENAI key

## Troubleshooting
- If `/api/github-sync` returns 500, check PAT scopes (repo read) and ensure Next.js server logs show GitHub error JSON.
- If DB tables are missing, re-run migrations with the correct `DATABASE_URL` (port 55432).
- For long gaps in time mode, switch to `compact` mode.

## References
- AI SDK Streaming docs: https://ai-sdk.dev/docs/foundations/streaming
