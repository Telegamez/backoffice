# Telegamez Backoffice Platform

A unified authentication and multi-app management system for Telegamez operations, featuring seamless cross-app integration sharing and scalable OAuth provider architecture.

## 🚀 Features

### Multi-Provider Authentication
- **Primary Authentication**: Google OAuth with @telegamez.com domain restriction
- **Secondary Integrations**: GitHub, Discord, Slack, and unlimited OAuth providers
- **Zero Redundancy**: Single authentication per provider across all applications
- **Cross-App Data Sharing**: GitHub issues in AI Admin, Google Drive access across tools

### Applications
- **🤖 AI Admin Assistant**: Document analysis and email automation with Google Workspace integration
- **⚡ Autonomous Agent Scheduler**: Natural language cron scheduler for automated data collection and email delivery
- **📊 GitHub Timeline**: Development timeline visualization with repository and issue tracking
- **🔧 Integration Management**: Centralized OAuth provider management at `/integrations`

### Security & Architecture
- **AES-256-GCM Token Encryption**: Secure storage with authentication tags
- **Unified Token Management**: Central TokenManager for all provider operations
- **Cross-App Access Control**: Strict validation for data sharing between applications
- **Audit Logging**: Complete tracking of integration usage and access patterns

## 🏗️ Architecture

```typescript
// Primary Authentication (Required)
Google OAuth → Login + Google Workspace access
├── Domain restriction: @telegamez.com only
├── Managed through NextAuth.js
└── Provides: Drive, Gmail, Calendar access

// Secondary Integrations (Optional)
GitHub OAuth → Repository and issue access
Discord OAuth → Server and channel access
Slack OAuth → Workspace access
├── Independent OAuth flows
├── Can connect/disconnect without affecting primary auth
└── Optional enhancements to functionality
```

### Core Technologies
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with multi-provider OAuth
- **Security**: AES-256-GCM token encryption with unified token management
- **Integration**: Cross-app data sharing with audit logging
- **Deployment**: Docker + nginx proxy at `https://backoffice.telegamez.com`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google OAuth app with Workspace APIs enabled
- GitHub OAuth app (for secondary integration)

### Installation

1. **Clone and install dependencies**:
```bash
git clone https://github.com/Telegamez/backoffice.git
cd backoffice
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env.local
# Fill in your OAuth credentials and database URL
```

3. **Database setup**:
```bash
npm run db:migrate
```

4. **Development server**:
```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your @telegamez.com Google account.

## 🔧 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/backoffice"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (Primary Authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (Secondary Integration)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Token Encryption
TOKEN_ENCRYPTION_KEY="64-character-hex-string"
```

### Optional Variables (Autonomous Agent Scheduler)
```env
# OpenAI API (Required for natural language parsing)
OPENAI_API_KEY="sk-your-openai-api-key"

# Google Search API (Optional - for web search)
GOOGLE_SEARCH_API_KEY="your-search-api-key"
GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
```

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📱 Applications

### AI Admin Assistant (`/apps/ai-admin-assistant`)
- **Purpose**: Document analysis and email automation
- **Required**: Google Workspace (Drive, Gmail)
- **Optional**: GitHub (includes development tasks in summaries)
- **Features**: Document analysis, email generation, daily summaries

### Autonomous Agent Scheduler (`/apps/autonomous-agent`)
- **Purpose**: Automated recurring tasks with natural language scheduling
- **Required**: Google Workspace (Calendar, Gmail)
- **Optional**: Google Search API, YouTube Data API
- **Features**: Natural language task creation, multi-source data collection (Calendar + Search + YouTube), AI-powered filtering and summarization, professional HTML email delivery, cron-based scheduling with timezone support
- **Documentation**: [Quick Start Guide](AUTONOMOUS-AGENT-READY.md) | [Implementation Status](_docs/implementations/IMPLEMENTATION-COMPLETE.md)

### GitHub Timeline (`/apps/github-timeline`)
- **Purpose**: Development timeline visualization
- **Required**: GitHub (repository and issue access)
- **Features**: Timeline view, issue tracking, development insights

### Integration Management (`/integrations`)
- **Purpose**: Centralized OAuth provider management
- **Features**: Connect/disconnect providers, view integration status, manage permissions

## 🔐 OAuth Provider Setup

### Google OAuth (Primary)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Enable APIs: Drive, Gmail, Calendar
5. Configure domain restriction for @telegamez.com

### GitHub OAuth (Secondary)
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://yourdomain.com/api/integrations/connect/github/callback`
4. Approve app in organization settings (for repository access)

## 🔌 Adding New OAuth Providers

The system supports unlimited secondary OAuth providers. See the complete guide:

📋 **[Adding New OAuth Providers Guide](_docs/implementations/implementation-guides/adding-new-oauth-providers.md)**

### Quick Steps for Discord, Slack, etc.
1. Add provider to integration registry
2. Create OAuth connection endpoints
3. Implement data access APIs
4. Add to application requirements
5. Provider automatically appears in UI

## 📚 Documentation

### Implementation Guides
- 📖 [Unified Authentication Implementation](_docs/implementations/implementation-guides/unified-authentication-implementation.md)
- 🏗️ [Architecture Guide](_docs/implementations/implementation-guides/unified-authentication-architecture.md)
- 🔌 [Adding New OAuth Providers](_docs/implementations/implementation-guides/adding-new-oauth-providers.md)

### Status & Specifications
- 📊 [Implementation Status](_docs/implementations/implementation-Status/unified-authentication-status.md)
- 📋 [Technical Specifications](_docs/implementations/implementationSpecs/unified-authentication-spec.md)
- 📝 [Latest Changelog](_docs/setup/CHANGELOG-unified-auth.md)

### Platform Documentation
- 🚀 [Platform Setup](_docs/10-setup.md) - Development environment setup
- 🔧 [Deployment Guide](_docs/40-deploy.md) - Production deployment
- 📋 [Contributing Guide](_docs/contributing.md) - Adding new applications

## 🛡️ Security

### Token Management
- **AES-256-GCM Encryption**: All tokens encrypted with authentication tags
- **Automatic Cleanup**: Corrupted tokens detected and removed
- **Cross-App Validation**: Apps can only access declared capabilities
- **Audit Logging**: Complete trail of integration usage

### Access Control
- **Domain Restriction**: Primary authentication limited to @telegamez.com
- **Scope Validation**: Real-time checking of OAuth permissions
- **Provider Isolation**: Secondary providers don't affect primary authentication
- **Secure Callbacks**: State validation and CSRF protection

## 🚀 Deployment

### Environment Setup
```bash
# Production environment variables
NEXTAUTH_URL="https://backoffice.telegamez.com"
DATABASE_URL="your-production-database-url"
# ... other production configs
```

### Docker Deployment
```bash
docker-compose up -d
```

### Vercel Deployment
```bash
vercel deploy
```

## 📊 API Endpoints

### Integration Management
- `GET /api/integrations/status?app={appId}` - Get integration status
- `GET /api/integrations/connect/{provider}` - Initiate OAuth connection
- `POST /api/integrations/disconnect/{provider}` - Disconnect provider

### Cross-App Data Access
- `GET /api/integrations/github/user-issues` - Get user's GitHub issues
- `GET /api/integrations/discord/guilds` - Get Discord servers (when implemented)
- `GET /api/integrations/slack/channels` - Get Slack channels (when implemented)

### Core Platform APIs
- `GET /api/auth/signin` - OAuth authentication
- `GET /api/auth/callback/google` - OAuth callback
- `GET /api/applications` - Application registry
- `GET /api/user/profile` - User profile information

## 🔄 Migration from Legacy Systems

### Token Encryption Fix (August 14, 2025)
- System automatically detects and removes corrupted legacy tokens
- Users may need to reconnect secondary providers (GitHub, etc.)
- Primary Google authentication continues working unchanged

### Adding Integrations
- Existing applications enhanced with integration capabilities
- Backward compatible - no breaking changes for core functionality
- Clear migration path documented for each component

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Follow the OAuth provider patterns for new integrations
4. Add comprehensive tests
5. Update documentation
6. Submit pull request

### Platform-Level Changes
- Authentication and session management
- Shared UI components and design system
- Application registry and routing
- Integration system and OAuth providers

### Application-Level Changes
- Individual application features
- App-specific APIs and database schemas
- Application-specific documentation

## 📋 Troubleshooting

### Common Issues

#### "GitHub integration not connected"
- Check GitHub organization OAuth app approval
- Reconnect via "Manage Auth" if token was corrupted
- Verify callback URLs match OAuth app settings

#### "Failed to decrypt token"
- Legacy token detected - system will auto-cleanup
- Reconnect affected provider via `/integrations` page
- Ensure TOKEN_ENCRYPTION_KEY is properly set

#### "Insufficient scopes"
- Re-authenticate with enhanced permissions
- Check provider-specific scope requirements
- Verify app integration requirements

### Getting Help
- Check the [implementation guides](_docs/implementations/implementation-guides/)
- Review [troubleshooting documentation](_docs/implementations/implementation-guides/unified-authentication-implementation.md#troubleshooting)
- Open an issue with detailed error information

## 📞 Support

- **Documentation**: Comprehensive guides in `_docs/` directory
- **Issues**: GitHub Issues for bug reports and feature requests
- **Security**: Email security@telegamez.com for security issues

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🏆 Architecture Highlights

- ✅ **Zero Authentication Redundancy**: Single OAuth per provider across all apps
- ✅ **Enhanced Security**: AES-256-GCM token encryption with authentication tags  
- ✅ **Unlimited Scalability**: Clear patterns for adding any OAuth provider
- ✅ **Cross-App Integration**: GitHub issues in AI Admin, shared Google Drive access
- ✅ **Centralized Management**: Single `/integrations` page for all providers
- ✅ **Production Ready**: Comprehensive security, monitoring, and deployment guides

**Built with**: Next.js 15, NextAuth.js, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM

**Powered by**: [Claude Code](https://claude.ai/code) for AI-assisted development