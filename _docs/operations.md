# Platform Operations Guide

Daily operations, maintenance, and troubleshooting for the Telegamez Backoffice platform.

> **Note**: For application-specific operations, see the individual application README.md files in `/src/app/apps/[app-name]/README.md`

## Daily Development Operations

### Starting the Application

```bash
# Start database
docker start telegamez-postgres

# Start application (from project root)
cd /opt/factory/backoffice
set -a && source ./.env.local && set +a
npm run dev
```

Access at: `http://localhost:3100`

### Stopping the Application

```bash
# Stop dev server
# Press Ctrl+C in the terminal running npm run dev

# Optionally stop database
docker stop telegamez-postgres
```

## Application-Specific Operations

Each application has its own operational procedures documented in its README.md:

- **GitHub Timeline Explorer**: `/src/app/apps/github-timeline/README.md`
- **AI Admin Assistant**: `/src/app/apps/ai-admin-assistant/README.md` (when implemented)

For application-specific troubleshooting, data synchronization, and feature operations, refer to the individual application documentation.

## Platform Health Checks

```bash
# Platform authentication
curl -s http://localhost:3100/api/auth/signin

# Database connectivity
docker exec telegamez-postgres pg_isready -U postgres

# Application selector (main platform page)
curl -s http://localhost:3100
```

## Troubleshooting

### Application Won't Start

```bash
# Check for port conflicts
lsof -i :3100 || ss -ltnp | grep 3100

# Kill existing processes
pkill -f "next dev"

# Verify environment variables
env | grep -E "(DATABASE_URL|GOOGLE_CLIENT|NEXTAUTH|GITHUB_TOKEN)"

# Start with verbose logging
npm run dev
```

### Database Issues

```bash
# Check database status
docker ps | grep telegamez-postgres

# View database logs
docker logs telegamez-postgres --tail 50

# Reconnect to database
export DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable"
npm run db:migrate:local
```

### Authentication Problems

```bash
# Verify Google OAuth configuration
echo $GOOGLE_CLIENT_ID
echo $NEXTAUTH_URL

# Check OAuth redirect URI matches:
# http://localhost:3100/api/auth/callback/google (dev)
# https://backoffice.telegames.ai/api/auth/callback/google (prod)
```

### Application-Specific Issues

For application-specific troubleshooting (GitHub integration, AI services, etc.), refer to the individual application documentation:

- **GitHub Timeline Explorer Issues**: See `/src/app/apps/github-timeline/README.md#troubleshooting`
- **AI Admin Assistant Issues**: See `/src/app/apps/ai-admin-assistant/README.md#troubleshooting` (when implemented)

## Data Persistence

Database data persists in the `telegamez-pgdata` Docker volume:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect telegamez-pgdata

# Remove volume (WARNING: deletes all data)
docker volume rm telegamez-pgdata
```

## Production Operations

For production deployment at `https://backoffice.telegames.ai`:

```bash
# Deploy new version
docker compose up -d --build

# View production logs
docker compose logs -f web

# Database backup
docker exec telegamez-postgres pg_dump -U postgres telegamez > backup.sql
```
