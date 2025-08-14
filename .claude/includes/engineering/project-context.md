# Telegamez Backoffice Project Context

## Quick Reference for All Agents

This document provides essential context about the Telegamez Backoffice project structure for all specialist agents.

## Project Type: Multi-Application Platform

This is **NOT** a single application. It's a **platform** that hosts multiple applications with shared infrastructure.

### Current Applications
1. **GitHub Timeline Explorer** (`/apps/github-timeline`) - Development analytics with AI insights
2. **AI Admin Assistant** (`/apps/ai-admin-assistant`) - Google Workspace automation (planned)

## Code Organization Rules

### ✅ Platform Files (Shared Infrastructure)
```
src/
├── lib/                    # Shared services (auth.ts, db.ts, applications.ts)
├── components/ui/          # Shared UI components  
├── app/page.tsx           # Application selector
├── app/layout.tsx         # Root layout
├── app/api/auth/          # Platform authentication
└── middleware.ts          # Route protection
```

### ✅ Application Files (App-Specific)
```
src/app/apps/[app-name]/
├── README.md              # App documentation
├── page.tsx              # App main page
├── components/           # App-specific components
├── lib/                  # App-specific utilities
└── ...

src/app/api/[app-routes]/  # App-specific API endpoints
```

### ❌ Never Mix These
- **DON'T** put app-specific code in platform files
- **DON'T** put platform code in application directories
- **DON'T** create app features outside the app directory

## Database Organization

### Platform Tables
```sql
users                    -- User management
application_permissions  -- App access control  
audit_logs              -- Cross-app activity
```

### Application Tables (Namespaced)
```sql
-- GitHub Timeline Explorer
timeline_segments
github_issues
github_pull_requests
segment_insights

-- AI Admin Assistant (planned)
admin_assistant_workflows
admin_assistant_audit
```

## Documentation Structure

### Platform Documentation
- `README.md` - Platform overview
- `_docs/` - Platform setup, deployment, operations
- `_docs/implementations/` - Implementation guides, specs, and status tracking
  - `implementation-guides/` - How-to guides for major features
  - `implementationSpecs/` - Detailed technical specifications
  - `implementation-Status/` - Project status and progress tracking

### Application Documentation  
- `/src/app/apps/[app]/README.md` - App-specific docs
- `_docs/prds/[app].md` - Product requirements

## Agent Guidelines

### When Working on Platform Features
- Modify shared services in `/src/lib/`
- Update platform documentation in `/_docs/`
- Consider impact on ALL applications

### When Working on Application Features
- Work within `/src/app/apps/[app-name]/` directory
- Create app-specific APIs under `/src/app/api/[app-routes]/`
- Update app-specific README.md
- Use platform shared services (auth, database, UI components)

### When Adding New Applications
1. Register in `/src/lib/applications.ts`
2. Create `/src/app/apps/[new-app]/` directory
3. Add app-specific documentation
4. Follow existing patterns

## Integration Patterns

### Authentication (All Apps)
```typescript
import { auth } from '@/lib/auth';

export default async function AppPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  // App logic here
}
```

### Database Access (All Apps)
```typescript
import { db } from '@/lib/db';
// App-specific operations
```

### UI Components (All Apps)
```typescript
import { Button } from '@/components/ui/button';
// Use shared components
```

## Key Architecture Reference

For complete architectural details, see: `.claude/includes/engineering/backoffice-architecture.md`

## Validation Checklist

Before implementing changes:
- [ ] Is this platform or application code?
- [ ] Am I placing files in the correct directories?
- [ ] Am I using shared services appropriately?
- [ ] Will this change affect other applications?
- [ ] Is my documentation in the right place?

This structure ensures maintainability and scalability as the platform grows.