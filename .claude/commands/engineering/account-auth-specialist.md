# AccountAuth Command

## Purpose
Manages all aspects of Supabase/GoTrue authentication including OAuth providers and native email/password authentication. This command enforces best practices, proper separation of concerns, and adherence to official Supabase documentation patterns.

## Documentation Requirements

### Reference Architecture Documentation
Before implementing any auth features, **ALWAYS** review the existing authentication architecture:

- **Main Architecture**: `_docs/Architecture/Auth/README.md` - Comprehensive system overview, dual-layer architecture, security considerations
- **System Diagram**: `_docs/Architecture/Auth/diagram-system-architecture.md` - Visual system architecture with GoTrue integration
- **Flow Diagrams**: `_docs/Architecture/Auth/diagram-flow-*.md` - Detailed sequence diagrams for specific auth flows:
  - `diagram-flow-email-login.md` - Email/password login via API Gateway Pattern
  - `diagram-flow-email-logout.md` - Email/password logout with complete session cleanup
  - `diagram-flow-email-registration.md` - Email/password registration with automatic login
  - `diagram-flow-email-update.md` - Email address updates with session maintenance
  - `diagram-flow-login.md` - Email/password login (legacy)
  - `diagram-flow-oauth-login.md` - OAuth authentication via API Gateway
  - `diagram-flow-password-reset.md` - Password reset flow
  - `diagram-flow-password-update.md` - Password update process
  - `diagram-flow-registration.md` - User registration (legacy)

### Documentation Update Requirements
When implementing auth changes, **MUST** update relevant documentation:

1. **`_docs/Architecture/Auth/README.md`** - Update high-level system architecture sections if:
   - Adding new auth providers or methods
   - Changing security patterns or session management
   - Modifying database schema or data flow
   - **NO CODE** - Only architectural concepts and patterns

2. **`_docs/Architecture/Auth/diagram-flow-[feature].md`** - Create or update flow diagrams that:
   - Demonstrate detailed sequence of events for the feature
   - Show all service interactions and data flow
   - Include error handling paths and edge cases
   - Use Mermaid sequence diagram format for consistency

3. **Implementation Specs** - Document specific implementation details in:
   - `_docs/ImplementationSpecs/Features/Auth/` for new features
   - `_docs/ImplementationSpecs/BugFixes/` for auth-related fixes

4. **Update This Command** - When creating new `diagram-flow-*.md` files, **MUST** update this AccountAuth command to:
   - Add the new flow diagram to the "Flow Diagrams" reference list above
   - Include a brief description of what the diagram covers
   - Maintain alphabetical ordering for consistency

## Core Principles

### 1. Supabase Documentation Priority
- **ALWAYS** consult official Supabase documentation before implementing auth features
- Prefer documented patterns over custom solutions or web search results
- Reference specific Supabase guides for OAuth, email/password, and security best practices

### 2. Separation of Concerns
- **Supabase/GoTrue is the SOLE authority** for user account authentication
- Application code should never directly manage user credentials, sessions, or auth state
- All auth operations must go through Supabase client methods
- Never store auth tokens or sensitive data in application state/localStorage directly

### 3. Best Practice Enforcement
- Alert users when proposed patterns deviate from Supabase best practices
- Recommend secure, documented approaches over convenience shortcuts
- Ensure proper error handling and user experience patterns

## Implementation Guidelines

### Authentication Flow Patterns
```typescript
// ✅ CORRECT: Use Supabase auth methods
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${origin}/auth/callback`
  }
})

// ❌ WRONG: Direct credential management
const user = { email, password }
localStorage.setItem('user', JSON.stringify(user))
```

### Session Management
```typescript
// ✅ CORRECT: Use Supabase session handling
const { data: { session } } = await supabase.auth.getSession()

// ✅ CORRECT: Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle session changes
})

// ❌ WRONG: Manual session storage
const token = response.access_token
localStorage.setItem('token', token)
```

### OAuth Integration
```typescript
// ✅ CORRECT: Use Supabase OAuth providers
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`
  }
})

// ❌ WRONG: Direct OAuth implementation
window.location.href = 'https://accounts.google.com/oauth/authorize...'
```

## Required Architecture Patterns

### 1. Auth Callback Handling
- Implement proper `/auth/callback` route for OAuth flows
- Use `supabase.auth.exchangeCodeForSession()` for PKCE flow
- Handle both success and error states appropriately

### 2. Route Protection
- Use middleware or guards that check Supabase session state
- Implement proper redirects for unauthenticated users
- Never rely on client-side auth checks alone

### 3. User Profile Management
- Store additional user data in separate tables linked by `auth.users.id`
- Use Row Level Security (RLS) policies for data access control
- Follow Supabase's user management patterns

## Security Requirements

### 1. Environment Configuration
- Store Supabase keys in proper environment variables
- Use public anon key for client-side operations
- Protect service role key (server-side only)

### 2. PKCE Flow Implementation
- Always use PKCE for OAuth flows in web applications
- Implement proper code exchange in callback handlers
- Never expose authorization codes in URLs longer than necessary

### 3. Row Level Security
- Enable RLS on all user-related database tables
- Write policies that check `auth.uid()` for access control
- Test policies thoroughly to prevent unauthorized access

## Error Handling Patterns

```typescript
// ✅ CORRECT: Proper error handling
const { data, error } = await supabase.auth.signIn(credentials)
if (error) {
  // Handle specific error types
  switch (error.message) {
    case 'Invalid login credentials':
      // Show user-friendly message
      break
    case 'Email not confirmed':
      // Prompt for email confirmation
      break
    default:
      // Generic error handling
  }
}

// ❌ WRONG: Ignoring errors or generic handling
const user = await supabase.auth.signIn(credentials)
// No error checking
```

## Integration Checklist

When implementing auth features, verify:

- [ ] Using official Supabase client methods
- [ ] Proper error handling for all auth operations
- [ ] Secure redirect URLs configured
- [ ] RLS policies in place for user data
- [ ] Environment variables properly configured
- [ ] Auth state properly managed in application
- [ ] Logout functionality clears all auth state
- [ ] Password reset flow follows Supabase patterns

## Anti-Patterns to Avoid

### ❌ Direct Database Auth Queries
Never query `auth.users` table directly or implement custom auth logic

### ❌ Client-Side Token Storage
Avoid storing tokens in localStorage or sessionStorage manually

### ❌ Custom Session Management
Don't implement custom session expiry or refresh logic

### ❌ Bypassing Supabase Methods
Never use external auth libraries when Supabase provides the functionality

## Command Usage

When users request auth-related changes, this command should:

1. **Review Architecture** - Read existing `_docs/Architecture/Auth/` documentation to understand current patterns
2. **Analyze** the request against Supabase best practices and existing architecture
3. **Alert** if proposed approach deviates from documented patterns or Supabase best practices
4. **Recommend** proper Supabase-native solutions that align with existing architecture
5. **Implement** using official Supabase client methods while following established patterns
6. **Document** all changes by updating relevant files:
   - Update `_docs/Architecture/Auth/README.md` for architectural changes (NO CODE)
   - Create/update `_docs/Architecture/Auth/diagram-flow-[feature].md` with detailed sequence diagrams
   - Add implementation specs in `_docs/ImplementationSpecs/Features/Auth/` as needed
   - **Update this AccountAuth command** when adding new flow diagrams to maintain current reference list
7. **Verify** security, separation of concerns, and documentation completeness

### Documentation Standards
- **Architecture README**: High-level concepts, patterns, security considerations - NO implementation code
- **Flow Diagrams**: Mermaid sequence diagrams showing detailed event sequences, error handling, and service interactions
- **Implementation Specs**: Technical implementation details, code patterns, and specific feature requirements

Always prioritize security, user experience, maintainability, and comprehensive documentation over convenience or custom implementations.