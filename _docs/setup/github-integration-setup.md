# GitHub Integration Setup Guide

## Overview

The GitHub integration allows the AI Admin Assistant to access your GitHub issues and include them in daily summaries. This guide covers setting up GitHub token storage for users.

## Features Implemented

✅ **Secure Token Storage** - GitHub tokens are encrypted and stored in the database  
✅ **Cross-App Integration** - GitHub data can be shared across backoffice applications  
✅ **User-Level Authentication** - Each user manages their own GitHub integration  
✅ **Multiple Connection Methods** - Support for both Personal Access Tokens and OAuth  
✅ **Real-time Status** - Live integration status checking and display  

## Database Setup

### 1. User Integrations Table

The `user_integrations` table stores encrypted tokens for each user-provider combination:

```sql
CREATE TABLE "user_integrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_email" text NOT NULL,
  "provider_id" text NOT NULL,
  "credentials_encrypted" text NOT NULL,
  "scopes" text[] NOT NULL,
  "expires_at" timestamp,
  "last_used" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_provider_unique" UNIQUE("user_email","provider_id")
);
```

### 2. Running Migrations

```bash
# Generate migration
npm run db:generate:local

# Apply migration
DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez" npm run db:migrate:local
```

## Token Security

### Encryption

Tokens are encrypted using AES-256-GCM before storage:

- **Development**: Uses mock encryption (base64) for testing
- **Production**: Uses proper AES encryption with initialization vectors

### Environment Variables

Set these environment variables for production:

```bash
# Required for token encryption
INTEGRATION_ENCRYPTION_KEY=your-32-character-secret-key!!

# Optional: GitHub OAuth (for OAuth flow)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://yourapp.com/api/integrations/github/oauth/callback
```

## Connection Methods

### Method 1: Personal Access Token

Users can create a GitHub Personal Access Token with these permissions:
- `repo:read` - Read repository data
- `user:read` - Read user profile data

**Steps:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with required scopes
3. Copy token and paste in the integration setup UI

### Method 2: GitHub OAuth (Optional)

For a more seamless experience, set up GitHub OAuth:

1. **Create GitHub OAuth App:**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Create new OAuth App with callback URL: `https://yourapp.com/api/integrations/github/oauth/callback`

2. **Configure Environment:**
   ```bash
   GITHUB_CLIENT_ID=your_app_client_id
   GITHUB_CLIENT_SECRET=your_app_client_secret
   ```

3. **Users can then connect via OAuth flow**

## API Endpoints

### Token Setup
- `POST /api/integrations/github/setup` - Save GitHub token
- `DELETE /api/integrations/github/setup` - Remove GitHub integration

### OAuth Flow
- `GET /api/integrations/github/oauth/authorize` - Start OAuth flow
- `GET /api/integrations/github/oauth/callback` - Handle OAuth callback

### Data Access
- `GET /api/integrations/github/user-issues` - Get user's assigned issues
- `GET /api/integrations/status?app=ai-admin-assistant` - Check integration status

## User Interface

### Integration Setup
Visit `/integrations/github/test` to:
- Connect GitHub account (token or OAuth)
- Test integration functionality
- View connection status
- Run diagnostic tests

### AI Admin Assistant
The main AI Admin Assistant dashboard includes:
- Integration status display
- GitHub issues in daily summary
- Setup button for GitHub connection

## Testing

### Manual Testing

1. **Visit Test Page:** `/integrations/github/test`
2. **Connect GitHub:** Use either token or OAuth method
3. **Run Tests:** Click "Run Integration Test" to verify:
   - Integration status check
   - Token retrieval and decryption
   - GitHub API calls
   - Issue fetching

### Test Results

The test page verifies:
- ✅ Integration status is properly detected
- ✅ Token is securely stored and retrieved
- ✅ GitHub API calls work with stored token
- ✅ User issues are successfully fetched

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Setup    │    │  Token Storage  │    │   Data Access   │
│                 │    │                 │    │                 │
│ • GitHub Setup  │───▶│ • Encrypted DB  │───▶│ • GitHub API    │
│ • OAuth Flow    │    │ • User-Provider │    │ • Cross-App     │
│ • Token Input   │    │ • Unique Constraint│ │ • Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Security Best Practices

1. **Token Encryption:** Always encrypt tokens before database storage
2. **Scope Limitation:** Request minimal required GitHub permissions
3. **Unique Constraints:** Prevent duplicate integrations per user
4. **Secure Environment:** Store encryption keys securely
5. **HTTPS Only:** Always use HTTPS for OAuth callbacks

## Troubleshooting

### Common Issues

1. **Migration Fails:**
   ```bash
   # Ensure database is running
   docker-compose up -d db
   
   # Check connection
   DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez" npm run db:migrate:local
   ```

2. **Token Decryption Fails:**
   - Verify `INTEGRATION_ENCRYPTION_KEY` is set consistently
   - Check if running in development mode (uses mock encryption)

3. **GitHub API Errors:**
   - Verify token has correct permissions (`repo:read`, `user:read`)
   - Check token hasn't expired
   - Ensure rate limits aren't exceeded

4. **OAuth Not Working:**
   - Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
   - Check redirect URI matches GitHub app configuration
   - Ensure HTTPS is used for production callbacks

## Next Steps

1. **Google Workspace Integration:** Similar setup for Google OAuth
2. **Additional Providers:** Extend to other services (Slack, Jira, etc.)
3. **Webhooks:** Real-time updates from GitHub
4. **Advanced Permissions:** Fine-grained access control
5. **Integration Analytics:** Usage metrics and monitoring