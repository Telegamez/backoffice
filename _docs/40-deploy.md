## Containerized Deploy

### Prereqs
- Docker and Docker Compose
- `.env.local` with:
  - `DATABASE_URL` for local dev (overridden in compose)
  - `GITHUB_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL` (optional)

### Build and Run
```bash
# Build images and start services
docker compose up -d --build

# Tail logs
docker compose logs -f

# Stop
docker compose down
```

### Services
- `db` (Postgres 16) on `localhost:55432`
- `web` (Next.js standalone) on `http://localhost:3100`

### Notes
- The web service uses Next.js standalone output for minimal runtime image.
- Compose overrides `DATABASE_URL` to point to the `db` container.
- Persisted PG data lives in the `pgdata` named volume.


