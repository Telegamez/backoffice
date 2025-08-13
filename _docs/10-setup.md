# Platform Development Setup

This guide covers setting up the development environment for the Telegamez Backoffice platform and its applications.

## Prerequisites
- Node.js (18+) and npm
- Docker (for local PostgreSQL)

## Environment Variables

Create `.env.local` in the project root:

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:55432/telegamez?sslmode=disable

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3100

# GitHub Integration (for Timeline Explorer app)
GITHUB_TOKEN=your_github_token

# AI Integration (for Timeline Explorer app)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

## Database Setup

### Start PostgreSQL (Docker)
```bash
docker run -d --name telegamez-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=telegamez \
  -p 55432:5432 \
  -v telegamez-pgdata:/var/lib/postgresql/data \
  postgres:16
```

### Run Migrations
```bash
npm run db:generate:local
npm run db:migrate:local
```

## Development Server

```bash
# Load environment variables and start dev server
set -a && source ./.env.local && set +a
npm run dev
```

The application will be available at `http://localhost:3100`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3100/api/auth/callback/google`
6. Restrict to your @telegamez.com domain in the OAuth consent screen

## GitHub Token Setup

For the GitHub Timeline Explorer application:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a fine-grained personal access token
3. Grant read access to repositories and issues
4. Add token to `.env.local` as `GITHUB_TOKEN`
