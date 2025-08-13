# Contributing to Telegamez Backoffice Platform

This guide outlines how to contribute to the Telegamez Backoffice platform, whether you're adding new applications, enhancing shared services, or improving existing functionality.

## Platform Architecture Overview

The backoffice is designed as a **multi-application platform** with clear separation of concerns:

### Platform Level (Shared)
- Authentication and session management
- Application registry and routing
- Shared UI components and design system
- Database schema and shared services
- Deployment and infrastructure

### Application Level (Modular)
- Individual application features and logic
- App-specific APIs and database tables
- Application-specific documentation
- Custom UI components (when needed)

## Adding New Applications

### 1. Plan Your Application

**Before coding, consider:**
- What unique value does this app provide?
- How does it integrate with shared platform services?
- What external APIs or services will it use?
- What data will it store and how?

**Create a PRD first:**
- Add PRD to `_docs/prds/your-app.md`
- Follow the template established in existing PRDs
- Get approval before starting development

### 2. Register the Application

Add your application to the registry in `/src/lib/applications.ts`:

```typescript
{
  id: 'your-app-id',
  name: 'Your Application Name',
  description: 'Brief description of what this app does',
  icon: 'LucideIconName', // Must exist in ApplicationSelector.tsx iconMap
  path: '/apps/your-app-id',
  category: 'development', // or 'analytics', 'operations', 'ai'
  enabled: true,
  services: {
    api: ['list-of-api-routes'],
    mcp: ['mcp-server-names'],
    external: ['external-services']
  }
}
```

### 3. Create Application Structure

```bash
# Create application directory
mkdir -p src/app/apps/your-app-id

# Required files
touch src/app/apps/your-app-id/page.tsx        # Main application page
touch src/app/apps/your-app-id/README.md       # Application documentation

# Optional directories
mkdir src/app/apps/your-app-id/components       # App-specific components
mkdir src/app/apps/your-app-id/lib             # App-specific utilities
```

### 4. Implement Application Page

Create `src/app/apps/your-app-id/page.tsx`:

```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function YourAppPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Your application implementation
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Your Application</h1>
      {/* Application content */}
    </div>
  );
}
```

### 5. Add API Routes (if needed)

Create API routes under `/src/app/api/your-endpoints/`:

```typescript
// src/app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your API logic
  return NextResponse.json({ data: 'your-data' });
}
```

### 6. Update Database Schema (if needed)

If your application needs database tables:

1. **Create migration**:
   ```bash
   npm run db:generate:local
   ```

2. **Follow naming conventions**:
   ```sql
   -- Prefix tables with app name for clarity
   CREATE TABLE your_app_table_name (
     id SERIAL PRIMARY KEY,
     user_email VARCHAR(255) NOT NULL,
     -- other fields
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Update shared schema documentation** in platform README.md

### 7. Create Application Documentation

Create comprehensive documentation in `src/app/apps/your-app-id/README.md`:

```markdown
# Your Application Name

Brief description of what the application does.

## Features
- List key features

## Getting Started
- Setup instructions
- Configuration requirements

## API Endpoints
- Document your APIs

## Database Schema
- Document your tables

## Troubleshooting
- Common issues and solutions
```

### 8. Add Icon Support

If using a new Lucide icon, add it to `/src/components/ApplicationSelector.tsx`:

```typescript
import { YourNewIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  // ... existing icons
  YourNewIcon,
};
```

## Working with Shared Services

### Authentication
```typescript
import { auth } from '@/lib/auth';

// In server components
const session = await auth();

// In API routes
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Database
```typescript
import { db } from '@/lib/db';

// Use the shared database connection
const results = await db.select().from(yourTable);
```

### AI Services
```typescript
import { openai } from '@/lib/ai'; // When we create shared AI utilities

// Use shared AI configuration
const response = await openai.chat.completions.create({
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  messages: [...],
});
```

### UI Components
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Use shared ShadCN components
<Card>
  <Button onClick={handleClick}>Action</Button>
</Card>
```

## Platform-Level Contributions

### Shared UI Components
- Add components to `/src/components/ui/`
- Follow ShadCN patterns and naming conventions
- Update component documentation
- Ensure TypeScript compatibility

### Authentication Enhancements
- Modify `/src/lib/auth.ts` carefully
- Test with all existing applications
- Update OAuth scopes only when necessary
- Document breaking changes

### Database Migrations
- Create migrations that don't break existing apps
- Use backward-compatible schema changes
- Test migration rollback procedures
- Document schema changes in platform README

## Code Quality Guidelines

### TypeScript
- Enable strict mode for all new code
- Define proper interfaces for all data structures
- Use type guards for external API responses
- Document complex types with JSDoc comments

### React/Next.js
- Use Server Components by default
- Add "use client" only when necessary
- Follow Next.js 15 App Router patterns
- Implement proper error boundaries

### Styling
- Use Tailwind utility classes
- Follow existing design patterns
- Use CSS variables for theme consistency
- Avoid custom CSS unless absolutely necessary

### Error Handling
- Implement graceful error handling in all components
- Provide meaningful error messages to users
- Log errors appropriately for debugging
- Use try/catch blocks in API routes

## Testing

### Application Testing
- Test your application independently
- Verify integration with shared services
- Test authentication flows
- Validate API endpoints

### Platform Testing
- Run full platform build: `npm run build`
- Test application selector functionality
- Verify shared service compatibility
- Check for TypeScript errors: `npm run lint`

## Documentation Standards

### Application READMEs
- **Overview**: What the application does
- **Features**: Key capabilities
- **Getting Started**: Setup and usage
- **API Endpoints**: Complete API documentation
- **Database Schema**: Table definitions
- **Troubleshooting**: Common issues

### Code Documentation
- Document complex functions with JSDoc
- Add inline comments for business logic
- Explain API integrations and data flows
- Document environment variables

## Review Process

### Before Submitting
1. **Test locally**: Ensure your application works in development
2. **Check platform integration**: Verify shared services work correctly
3. **Update documentation**: Keep README.md and code comments current
4. **Run linting**: Fix all TypeScript and ESLint errors

### Pull Request Requirements
- **Clear description**: Explain what your changes do and why
- **Testing instructions**: How to test your changes
- **Breaking changes**: Call out any platform-level impacts
- **Documentation updates**: Include README.md and doc changes

### Review Criteria
- **Functionality**: Does it work as intended?
- **Integration**: Does it work well with the platform?
- **Code Quality**: Follows established patterns and standards?
- **Documentation**: Is it properly documented?
- **Security**: No security vulnerabilities introduced?

## Getting Help

### Resources
- **Platform README**: `/README.md` - Platform overview and setup
- **Setup Guide**: `/_docs/10-setup.md` - Development environment
- **Operations Guide**: `/_docs/operations.md` - Troubleshooting
- **Application Examples**: Existing apps for reference patterns

### Contact
- **Questions**: Contact the development team
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use team communication channels for design discussions

---

**Remember**: The goal is to create a cohesive platform where applications work together seamlessly while maintaining clear boundaries and modularity.