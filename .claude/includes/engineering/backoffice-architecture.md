# Telegamez Backoffice Platform Architecture

## Overview

The Telegamez Backoffice is a **multi-application platform** with strict separation of concerns between platform-level infrastructure and individual applications. All agents MUST understand and follow this architecture when implementing features.

## Architecture Principles

### 1. Platform vs Application Separation

**Platform Level (Shared Infrastructure)**:
- Authentication and session management
- Application registry and routing
- Shared UI components and design system
- Database schema and shared services
- Deployment and infrastructure

**Application Level (Modular)**:
- Individual application features and logic
- App-specific APIs and database tables
- Application-specific documentation
- Custom UI components (when needed)

### 2. Repository Structure

```
/opt/factory/backoffice/
├── README.md                           # Platform overview (NOT app-specific)
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Application selector (platform)
│   │   ├── layout.tsx                  # Root layout (platform)
│   │   ├── apps/                       # Individual applications
│   │   │   ├── layout.tsx              # Shared app layout (platform)
│   │   │   ├── github-timeline/        # GitHub Timeline Explorer app
│   │   │   │   ├── README.md           # App-specific documentation
│   │   │   │   ├── page.tsx            # App main page
│   │   │   │   ├── components/         # App-specific components
│   │   │   │   └── lib/                # App-specific utilities
│   │   │   └── ai-admin-assistant/     # AI Admin Assistant app (planned)
│   │   └── api/                        # API routes (mixed platform/app)
│   │       ├── auth/                   # Platform: Authentication
│   │       ├── applications/           # Platform: App registry
│   │       ├── github-sync/            # App: GitHub Timeline Explorer
│   │       ├── segment-insights/       # App: GitHub Timeline Explorer
│   │       └── [app-specific]/         # App: Other application APIs
│   ├── components/
│   │   ├── ApplicationSelector.tsx     # Platform: App selection
│   │   └── ui/                         # Platform: Shared UI components
│   ├── lib/
│   │   ├── applications.ts             # Platform: Application registry
│   │   ├── auth.ts                     # Platform: Authentication
│   │   ├── db.ts                       # Platform: Database connection
│   │   └── [shared-services]/          # Platform: Shared utilities
│   └── middleware.ts                   # Platform: Route protection
├── _docs/                              # Platform documentation
│   ├── README.md                       # Documentation index
│   ├── 10-setup.md                     # Platform setup
│   ├── 40-deploy.md                    # Platform deployment
│   ├── operations.md                   # Platform operations
│   ├── contributing.md                 # Platform guidelines
│   └── prds/                           # Product Requirements Documents
└── drizzle/                            # Platform: Database migrations
```

## Implementation Rules for Agents

### ❌ DON'T: Mix Platform and Application Code

**Wrong Approach**:
```typescript
// DON'T: Put app-specific logic in platform files
// src/lib/utils.ts
export function analyzeGitHubSegment() { ... }  // App-specific!

// DON'T: Put platform logic in app files  
// src/app/apps/github-timeline/auth.ts
export function configureOAuth() { ... }        // Platform-specific!
```

### ✅ DO: Maintain Clear Separation

**Correct Approach**:
```typescript
// Platform: src/lib/auth.ts
export function auth() { ... }                  // Shared authentication

// Application: src/app/apps/github-timeline/lib/segments.ts
export function analyzeSegment() { ... }        // App-specific logic
```

### File Placement Rules

#### Platform Files (Shared Across Apps)
- **Authentication**: `/src/lib/auth.ts`
- **Database Connection**: `/src/lib/db.ts`
- **Application Registry**: `/src/lib/applications.ts`
- **Shared Components**: `/src/components/ui/`
- **Platform APIs**: `/src/app/api/auth/`, `/src/app/api/applications/`
- **Platform Documentation**: `/_docs/`
- **Root Layout**: `/src/app/layout.tsx`
- **Application Selector**: `/src/app/page.tsx`

#### Application Files (App-Specific)
- **App Main Page**: `/src/app/apps/[app-id]/page.tsx`
- **App Components**: `/src/app/apps/[app-id]/components/`
- **App Utilities**: `/src/app/apps/[app-id]/lib/`
- **App APIs**: `/src/app/api/[app-specific-routes]/`
- **App Documentation**: `/src/app/apps/[app-id]/README.md`

### Database Schema Organization

#### Platform Tables
```sql
-- User management and platform features
users                    -- Platform: User profiles
application_permissions   -- Platform: App access control
audit_logs               -- Platform: Cross-app activity tracking
```

#### Application Tables
```sql
-- GitHub Timeline Explorer
timeline_segments        -- App: GitHub Timeline Explorer
github_issues            -- App: GitHub Timeline Explorer  
github_pull_requests     -- App: GitHub Timeline Explorer
segment_insights         -- App: GitHub Timeline Explorer

-- AI Admin Assistant (planned)
admin_assistant_workflows -- App: AI Admin Assistant
admin_assistant_audit     -- App: AI Admin Assistant
```

**Naming Convention**: Prefix application tables with app identifier when possible.

## Application Development Workflow

### 1. Planning Phase
1. **Create PRD**: Add to `/_docs/prds/[app-name].md`
2. **Register Application**: Update `/src/lib/applications.ts`
3. **Plan Database Schema**: Design app-specific tables
4. **Define API Routes**: Plan app-specific endpoints

### 2. Implementation Phase
1. **Create App Directory**: `/src/app/apps/[app-id]/`
2. **Implement App Page**: Main application interface
3. **Add App Components**: In app-specific directory
4. **Create API Routes**: Under `/src/app/api/[app-routes]/`
5. **Database Migrations**: Add app-specific tables
6. **App Documentation**: Create app-specific README.md

### 3. Integration Phase
1. **Test Platform Integration**: Authentication, navigation
2. **Verify Shared Services**: Database, UI components
3. **Update Platform Docs**: If platform changes needed
4. **Quality Assurance**: Follow platform testing standards

## Shared Services Usage

### Authentication
```typescript
// Use platform authentication in apps
import { auth } from '@/lib/auth';

export default async function AppPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  // App logic here
}
```

### Database Access
```typescript
// Use platform database connection
import { db } from '@/lib/db';
import { appSpecificTable } from './schema';

// App-specific database operations
const results = await db.select().from(appSpecificTable);
```

### UI Components
```typescript
// Use platform UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// App-specific components can extend platform components
export function AppSpecificComponent() {
  return (
    <Card>
      <Button>Platform Button in App</Button>
    </Card>
  );
}
```

### Application Registry
```typescript
// Register new applications in platform registry
// src/lib/applications.ts
export const applications: BackofficeApp[] = [
  {
    id: 'github-timeline',
    name: 'GitHub Timeline Explorer',
    description: 'Interactive timeline with GitHub data and AI insights',
    icon: 'GitBranch',
    path: '/apps/github-timeline',
    category: 'development',
    enabled: true,
    services: {
      api: ['github-sync', 'segments', 'segment-insights'],
    }
  },
  {
    id: 'ai-admin-assistant',
    name: 'AI Admin Assistant', 
    description: 'Google Workspace automation for documents and email',
    icon: 'Bot',
    path: '/apps/ai-admin-assistant',
    category: 'ai',
    enabled: true,
    services: {
      api: ['google-drive-integration', 'gmail-integration'],
      external: ['google-workspace-apis', 'openai-gpt5']
    }
  }
];
```

## Agent Responsibilities by Domain

### Platform-Level Agents
**When working on platform infrastructure:**
- **Authentication changes**: Use `@engineering/account-auth-specialist`
- **Shared UI components**: Use `@engineering/frontend-specialist`
- **Database platform changes**: Use `@engineering/database-architect`
- **Platform documentation**: Use `@engineering/documentation-specialist`

### Application-Level Agents
**When working on specific applications:**
- **GitHub Timeline Explorer**: Work within `/src/app/apps/github-timeline/`
- **AI Admin Assistant**: Work within `/src/app/apps/ai-admin-assistant/`
- **App-specific APIs**: Create under `/src/app/api/[app-routes]/`
- **App documentation**: Maintain `/src/app/apps/[app]/README.md`

### Cross-Cutting Agents
**When working on features that span platform and apps:**
- **Functional Spec Writer**: Must understand both platform and app boundaries
- **Code Reviewer**: Verify proper separation of concerns
- **Testing Specialist**: Test both platform and app integration

## Common Anti-Patterns to Avoid

### ❌ Incorrect Code Organization
```typescript
// DON'T: App logic in platform files
// src/lib/githubAnalysis.ts - WRONG LOCATION
export function analyzeCommits() { ... }

// DON'T: Platform logic in app files
// src/app/apps/github-timeline/auth.ts - WRONG LOCATION
export function setupOAuth() { ... }
```

### ❌ Incorrect Database Usage
```sql
-- DON'T: Platform tables with app-specific columns
ALTER TABLE users ADD github_segment_preferences TEXT; -- WRONG

-- DON'T: App tables without proper namespacing
CREATE TABLE insights (...); -- WRONG, too generic
```

### ❌ Incorrect Documentation Placement
```markdown
<!-- DON'T: App-specific docs in platform README -->
/README.md: "GitHub Timeline Explorer has these features..." -- WRONG

<!-- DON'T: Platform docs in app README -->
/src/app/apps/github-timeline/README.md: "Platform authentication setup..." -- WRONG
```

## Validation Checklist for Agents

Before implementing any changes, agents should verify:

### Platform Changes
- [ ] Changes affect shared infrastructure, not specific applications
- [ ] Updates benefit multiple applications or the platform itself
- [ ] Documentation updates go to `/_docs/` directory
- [ ] Database changes are in shared/platform tables
- [ ] API changes are in platform routes (`/api/auth/`, `/api/applications/`)

### Application Changes  
- [ ] Changes are contained within application directory
- [ ] App-specific documentation goes in app README.md
- [ ] Database changes use app-specific tables or namespaced names
- [ ] API routes are under app-specific paths
- [ ] Integration uses platform shared services correctly

### Cross-Application Changes
- [ ] Identify what's platform vs app-specific
- [ ] Update both platform and relevant app documentation
- [ ] Test integration between platform and apps
- [ ] Maintain separation of concerns throughout

## Success Criteria

A well-implemented change should:
1. **Clear Boundaries**: Platform and application code are clearly separated
2. **Proper Integration**: Applications use shared services correctly
3. **Maintainable**: New developers can understand the structure quickly
4. **Scalable**: Adding new applications doesn't require platform changes
5. **Documented**: Both platform and application documentation are current

This architecture ensures that the Telegamez Backoffice remains maintainable and scalable as new applications are added, while providing a consistent user experience across all tools.