# Local Setup

## Prerequisites
- Node.js and npm
- Docker (for local Postgres)

## Ports
- Web: http://localhost:3100
- Postgres: host 55432 → container 5432

## Environment
Create `.env.local` in the project root (`telegamez-timeline-next`):

```
DATABASE_URL=postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable
GITHUB_TOKEN= # fine-grained PAT with read repo permissions
OPENAI_API_KEY= # required for /api/insights
OPENAI_MODEL=gpt-5
NEXT_PUBLIC_BASE_URL=http://localhost:3100
```

## Start Postgres (Docker)
```
docker run -d --name tg-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=telegamez \
  -p 55432:5432 postgres:16
```

## Migrations
```
npm run db:generate:local
npm run db:migrate:local
```

## Dev Server
```
set -a && source ./.env.local && set +a
npm run dev
```

The app will be available at http://localhost:3100
