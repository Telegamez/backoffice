### Quick Ops: Start, Stop, Troubleshoot

#### One-time setup (if not done yet)
```bash
# Option A) Using Docker Compose (recommended and persistent)
cd /opt/factory/telegamez-timeline-next
docker compose up -d db

# Option B) Using plain Docker (also persistent if you avoid -v flags)
docker run -d --name tg-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=telegamez \
  -p 55432:5432 \
  -v tg-pgdata:/var/lib/postgresql/data \
  postgres:16

# Migrate DB
cd /opt/factory/telegamez-timeline-next
export DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable"
npm run db:migrate:local
```

#### Start (every day)
```bash
# Start DB (Compose)
cd /opt/factory/telegamez-timeline-next
docker compose start db

# or Start DB (plain Docker)
docker start tg-postgres

# Start web app (port 3100)
cd /opt/factory/telegamez-timeline-next
set -a && source ./.env.local && set +a
npm run dev
# Open http://localhost:3100
```

#### Stop
```bash
# Stop the web app
# Press Ctrl+C in the terminal running "npm run dev"

# Optionally stop DB
docker compose stop db   # if using Compose
docker stop tg-postgres  # if using plain Docker
```

#### Quick health checks
```bash
# Is the server up?
curl -s http://localhost:3100/api/model-status
curl -s http://localhost:3100/api/segments

# Is Postgres up?
docker ps | grep tg-postgres
```

#### Seed, Sync, Map (data load)
```bash
# Seed demo segments (optional)
curl -X POST http://localhost:3100/api/seed-segments

# Deep sync GitHub issues/PRs (requires GITHUB_TOKEN in .env.local)
curl -X POST http://localhost:3100/api/github-sync \
  -H "Content-Type: application/json" \
  -d '{"repo":"Telegamez/telegamez","perPage":100,"maxPages":20}'

# Map weekly timeline segments from synced data
curl -X POST http://localhost:3100/api/map-timeline \
  -H "Content-Type: application/json" -d '{}'
```

#### AI Insights (cached first, re-analyze on demand)
```bash
# Get latest cached insight for a segment slug (use the segment slug/id from /api/segments)
curl "http://localhost:3100/api/segment-insights?slug=<SEGMENT_SLUG>"

# Re-analyze and save (sends previous content to augment/edit)
curl -X POST http://localhost:3100/api/segment-insights/reanalyze \
  -H "Content-Type: application/json" \
  -d '{"slug":"<SEGMENT_SLUG>","segment":{ /* minimal segment object */ }}'
```

#### Troubleshooting
```bash
# 1) Server not starting or Internal Server Error?
cd /opt/factory/telegamez-timeline-next
pkill -f "next dev" || true
set -a && source ./.env.local && set +a
npm run dev   # run in foreground to see error logs

# 2) DB connection issues (tables missing)
export DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable"
npm run db:migrate:local

# 3) Verify env vars loaded
env | egrep "DATABASE_URL|GITHUB_TOKEN|OPENAI_API_KEY|OPENAI_MODEL|NEXT_PUBLIC_BASE_URL"

# 4) Check DB container logs
docker logs tg-postgres --tail 50

# 5) Test GitHub PAT access (must return 200s)
source ./.env.local
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/Telegamez/telegamez
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/Telegamez/telegamez/issues?per_page=1"
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/Telegamez/telegamez/pulls?per_page=1"

# 6) Ports in use?
# Web (3100):
lsof -i :3100 || ss -ltnp | grep 3100
# DB host port (55432):
lsof -i :55432 || ss -ltnp | grep 55432
```

#### Notes
- Web app runs at http://localhost:3100
- DB connection: `postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable`
- `.env.local` must define: `DATABASE_URL`, `GITHUB_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_BASE_URL`

#### Persisting Postgres data during development
- Using Compose: data is stored in the named volume `pgdata` declared in `docker-compose.yml`. It survives `stop`/`start` and `down`. Avoid `docker compose down -v` which deletes volumes.
- Using plain Docker: we mount a named volume `tg-pgdata` to `/var/lib/postgresql/data`. Avoid `docker rm -v tg-postgres` which deletes the volume.
- To inspect volumes:
  - List: `docker volume ls`
  - Inspect: `docker volume inspect pgdata`
  - Remove (DANGEROUS): `docker volume rm pgdata`
# Deep sync GitHub issues/PRs (requires GITHUB_TOKEN in .env.local)
curl -X POST http://localhost:3100/api/github-sync \
  -H "Content-Type: application/json" \
  -d '{"repo":"Telegamez/telegamez","perPage":100,"maxPages":20}'

# Map weekly timeline segments from synced data
curl -X POST http://localhost:3100/api/map-timeline \
  -H "Content-Type: application/json" -d '{}'
```

#### AI Insights (cached first, re-analyze on demand)
```bash
# Get latest cached insight for a segment slug (use the segment slug/id from /api/segments)
curl "http://localhost:3100/api/segment-insights?slug=<SEGMENT_SLUG>"

# Re-analyze and save (sends previous content to augment/edit)
curl -X POST http://localhost:3100/api/segment-insights/reanalyze \
  -H "Content-Type: application/json" \
  -d '{"slug":"<SEGMENT_SLUG>","segment":{ /* minimal segment object */ }}'
```

#### Troubleshooting
```bash
# 1) Server not starting or Internal Server Error?
cd /opt/factory/telegamez-timeline-next
pkill -f "next dev" || true
set -a && source ./.env.local && set +a
npm run dev   # run in foreground to see error logs

# 2) DB connection issues (tables missing)
export DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable"
npm run db:migrate:local

# 3) Verify env vars loaded
env | egrep "DATABASE_URL|GITHUB_TOKEN|OPENAI_API_KEY|OPENAI_MODEL|NEXT_PUBLIC_BASE_URL"

# 4) Check DB container logs
docker logs tg-postgres --tail 50

# 5) Test GitHub PAT access (must return 200s)
source ./.env.local
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/Telegamez/telegamez
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/Telegamez/telegamez/issues?per_page=1"
curl -I -H "Authorization: Bearer $GITHUB_TOKEN" "https://api.github.com/repos/Telegamez/telegamez/pulls?per_page=1"

# 6) Ports in use?
# Web (3100):
lsof -i :3100 || ss -ltnp | grep 3100
# DB host port (55432):
lsof -i :55432 || ss -ltnp | grep 55432
```

#### Notes
- Web app runs at http://localhost:3100
- DB connection: `postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable`
- `.env.local` must define: `DATABASE_URL`, `GITHUB_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_BASE_URL`
