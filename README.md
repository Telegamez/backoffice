# Telegamez Backoffice Platform

A multi-application backoffice platform for Telegamez internal tools, providing secure access to specialized applications through a unified interface.

## Platform Overview

The Telegamez Backoffice is a **platform** that hosts multiple internal applications behind a single authentication layer. Users authenticate once with Google OAuth (@telegamez.com domain) and can access various tools for development, analytics, operations, and AI automation.

**Key Platform Features:**
- 🔐 **Unified Authentication** - Single sign-on with Google OAuth
- 🏗️ **Application Registry** - Centralized app management and routing
- 🎨 **Shared UI Components** - Consistent design system across all apps
- 🗄️ **Shared Infrastructure** - Database, AI services, and deployment pipeline
- 📊 **Cross-App Analytics** - Usage tracking and audit trails

## Platform Architecture

### Core Technologies
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind v4 + ShadCN UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth via NextAuth.js
- **AI Integration**: OpenAI GPT-5 via Next.js AI SDK
- **Deployment**: Docker + nginx proxy at `https://backoffice.telegamez.com`

### Application Structure
```
src/
├── app/
│   ├── page.tsx                    # Application selector (landing page)
│   ├── layout.tsx                  # Root layout with authentication
│   ├── apps/                       # Individual applications
│   │   ├── layout.tsx              # Shared app layout with navigation
│   │   ├── github-timeline/        # GitHub Timeline Explorer
│   │   └── [future-apps]/          # Additional applications
│   └── api/                        # Shared and app-specific APIs
├── components/
│   ├── ApplicationSelector.tsx     # Main app selection interface
│   └── ui/                         # Shared UI component library
├── lib/
│   ├── applications.ts             # Application registry
│   ├── auth.ts                     # Authentication configuration
│   └── [shared-services]/          # Shared utilities and services
└── _docs/                          # Platform and app documentation
```

## Current Applications

| Application | Path | Category | Description |
|-------------|------|----------|-------------|
| **GitHub Timeline Explorer** | `/apps/github-timeline` | Development | Interactive timeline with GitHub data and AI insights |
| **AI Admin Assistant** | `/apps/ai-admin-assistant` | AI | Google Workspace automation (planned) |

*Each application has its own README.md with specific documentation*

## Quick Start

### Platform Setup

```bash
# Install dependencies
npm install

# Set up environment variables (see _docs/10-setup.md)
cp .env.example .env.local

# Start database
docker run -d --name telegamez-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=telegamez \
  -p 55432:5432 postgres:16

# Run migrations
npm run db:migrate:local

# Start development server
npm run dev
```

Access the platform at `http://localhost:3100`

### Adding New Applications

1. **Register the application** in `/src/lib/applications.ts`
2. **Create app directory** under `/src/app/apps/your-app/`
3. **Add application README.md** with app-specific documentation
4. **Create API routes** under `/src/app/api/` if needed

See `_docs/contributing.md` for detailed guidelines.

## Shared Services

### Authentication
- Google OAuth with @telegamez.com domain restriction
- JWT-based session management
- Route protection middleware

### Database
- PostgreSQL with Drizzle ORM
- Shared schema for user management and audit trails
- App-specific tables namespaced by application

### AI Services
- OpenAI GPT-5 integration configured
- Shared AI utilities and prompt management
- Usage tracking and rate limiting

### UI Components
- ShadCN UI component library
- Consistent design tokens and themes
- Shared application navigation patterns

## Platform APIs

### Core Platform APIs
- `GET /api/auth/signin` - OAuth authentication
- `GET /api/auth/callback/google` - OAuth callback
- `GET /api/applications` - Application registry
- `GET /api/user/profile` - User profile information

*Application-specific APIs are documented in each app's README.md*

## Deployment

The platform is containerized and deployed as a single unit:

```bash
# Build and deploy
docker compose up -d --build

# View logs
docker compose logs -f
```

**Production Environment**: `https://backoffice.telegamez.com`

## Platform Documentation

| Document | Description |
|----------|-------------|
| `_docs/10-setup.md` | Development environment setup |
| `_docs/40-deploy.md` | Production deployment guide |
| `_docs/operations.md` | Daily operations and troubleshooting |
| `_docs/contributing.md` | Guidelines for adding new applications |
| `_docs/prds/` | Product Requirements Documents |

## Application Documentation

Each application maintains its own documentation:
- `src/app/apps/[app-name]/README.md` - Application-specific guide
- `_docs/prds/[app-name].md` - Product requirements (if applicable)

## Contributing

### Platform-Level Changes
- Authentication and session management
- Shared UI components and design system
- Application registry and routing
- Shared services and utilities

### Application-Level Changes
- Individual application features
- App-specific APIs and database schemas
- Application-specific documentation

See `_docs/contributing.md` for detailed guidelines and review processes.

---

**Platform Maintainers**: Telegamez Development Team  
**Questions**: Contact the development team or create an issue
