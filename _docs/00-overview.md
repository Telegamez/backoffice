# Telegamez Timeline (Next.js) - Project Overview

This project reimagines the Telegamez development timeline as a modern Next.js 15 + TypeScript app with Tailwind v4, shadcn-style UI components, Drizzle ORM, Postgres, and AI SDK streaming for GPT‑5 insights.

## Architecture
- Next.js 15 (App Router) + React 19 (strict TS)
- Tailwind v4 + shadcn-style components (card, tabs, separator, button)
- Drizzle ORM (Postgres)
- AI SDK: streaming insights with default model `gpt-5` (configurable)
- Non-standard ports: Web 3100, Postgres 55432

## Key Features
- Zoomable timeline: week → year
- Compact mode (removes large empty gaps) + lane stacking to reduce overlap
- GitHub sync (issues/PRs) → DB via REST, then mapped into weekly `timeline_segments`
- Streaming insights using AI SDK

## Data Flow
1) Sync GitHub issues/PRs → `github_issues`, `github_pull_requests`
2) Map into weekly `timeline_segments` with derived metrics and deliverables
3) UI fetches and renders DB-backed timeline; detail panel shows KPIs + AI insights

## Important Endpoints
- `POST /api/github-sync` → sync issues/PRs (uses `GITHUB_TOKEN`)
- `POST /api/map-timeline` → build weekly segments from synced data
- `GET /api/segments` → fetch `timeline_segments`
- `POST /api/insights` → AI streamed analysis
- `GET /api/model-status` → current AI model

## References
- AI SDK Streaming: https://ai-sdk.dev/docs/foundations/streaming
