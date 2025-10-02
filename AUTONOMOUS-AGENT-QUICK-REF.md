# Autonomous Agent Scheduler - Quick Reference Card

**Status**: ✅ **PRODUCTION READY** | **Verification**: 35/35 Checks Passed

---

## 🚀 Quick Deploy (5 Steps)

**Development:**
```bash
# 1. Verify (optional)
./scripts/verify-autonomous-agent.sh

# 2. Setup database
./scripts/setup-autonomous-agent.sh

# 3. Start server
pnpm dev

# 4. Test Search API
curl http://localhost:3000/api/autonomous-agent/test-search

# 5. Open dashboard
open http://localhost:3000/apps/autonomous-agent
```

**Docker (Production):**
```bash
# 1. Verify (optional)
./scripts/verify-autonomous-agent.sh

# 2. Setup database
docker-compose up -d db
docker-compose exec db psql -U postgres -d telegamez < drizzle/0008_worried_randall_flagg.sql

# 3. Start all services
docker-compose up -d

# 4. Test Search API
curl http://localhost:3100/api/autonomous-agent/test-search

# 5. Open dashboard
open http://localhost:3100/apps/autonomous-agent
```

---

## 📋 Key URLs

| Service | Development | Docker |
|---------|-------------|--------|
| **Dashboard** | http://localhost:3000/apps/autonomous-agent | http://localhost:3100/apps/autonomous-agent |
| **Create Task** | http://localhost:3000/apps/autonomous-agent | http://localhost:3100/apps/autonomous-agent |
| **Status API** | http://localhost:3000/api/autonomous-agent/status | http://localhost:3100/api/autonomous-agent/status |
| **Test Search** | http://localhost:3000/api/autonomous-agent/test-search | http://localhost:3100/api/autonomous-agent/test-search |

---

## 🎯 Example Tasks

### Daily Briefing
```
Every morning at 7am Pacific, email me:
- My Google Calendar for today
- Trending AI news from Google Search
- Top 3 YouTube videos about technology
Use a motivational tone
```

### Weekly Summary
```
Every Monday at 9am, send me:
- This week's calendar events
- YouTube videos about startups from last week
- Search results about LangChain
Use a professional tone
```

### Research Digest
```
Daily at 6pm EST, search for:
- TypeScript best practices
- React 19 updates
Email me the top 5 results in casual tone
```

---

## 🔧 Common Commands

```bash
# Health check (use port 3000 for dev, 3100 for Docker)
curl http://localhost:3100/api/autonomous-agent/status

# List all tasks
curl http://localhost:3100/api/autonomous-agent/tasks

# View task history
curl http://localhost:3100/api/autonomous-agent/tasks/{id}/history

# Manual execution
curl -X POST http://localhost:3100/api/autonomous-agent/tasks/{id}/execute

# Approve task
curl -X POST http://localhost:3100/api/autonomous-agent/tasks/{id}/approve
```

---

## 📁 Important Files

### Services
- `src/lib/services/task-scheduler.ts` - Cron scheduling
- `src/lib/services/task-executor.ts` - Action orchestration
- `src/lib/services/task-parser.ts` - Natural language parsing
- `src/lib/services/calendar-service.ts` - Google Calendar
- `src/lib/services/gmail-service.ts` - Gmail sending
- `src/lib/services/email-templates.ts` - HTML templates
- `src/lib/services/youtube-service.ts` - YouTube Data API
- `src/lib/services/search-service.ts` - Google Search

### UI Components
- `src/app/apps/autonomous-agent/page.tsx` - Dashboard
- `src/app/apps/autonomous-agent/components/TaskCreator.tsx`
- `src/app/apps/autonomous-agent/components/TaskList.tsx`

### Configuration
- `src/instrumentation.ts` - Auto-initialization
- `src/db/db-schema.ts` - Database schema
- `next.config.ts` - Instrumentation hook

---

## 🔑 Environment Variables

Required:
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
```

Optional:
```bash
GOOGLE_SEARCH_API_KEY=...        # For web search
GOOGLE_SEARCH_ENGINE_ID=...      # For web search
```

OAuth Scopes (authorize at `/apps/mail-assistant`):
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/youtube.readonly`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [AUTONOMOUS-AGENT-READY.md](AUTONOMOUS-AGENT-READY.md) | Quick start guide |
| [DEPLOYMENT-CHECKLIST.md](_docs/implementations/DEPLOYMENT-CHECKLIST.md) | Pre-deployment checklist |
| [IMPLEMENTATION-COMPLETE.md](_docs/implementations/IMPLEMENTATION-COMPLETE.md) | Full implementation summary |
| [autonomous-agent-quick-start.md](_docs/implementations/implementation-guides/autonomous-agent-quick-start.md) | Detailed guide |

---

## 🆘 Troubleshooting

### Database not available
```bash
# Check DATABASE_URL in .env.local
# Run migration
./scripts/setup-autonomous-agent.sh
```

### Search API not configured
```bash
# Add to .env.local:
GOOGLE_SEARCH_API_KEY=your_key
GOOGLE_SEARCH_ENGINE_ID=your_engine_id

# Test it:
curl http://localhost:3000/api/autonomous-agent/test-search
```

### Failed to send email
```bash
# Re-authorize Gmail at (use port 3000 for dev, 3100 for Docker):
open http://localhost:3100/apps/mail-assistant
# Grant "Send email" permission
```

### Scheduler not initializing
```bash
# Restart server
pnpm dev

# Check logs for:
# "✅ Autonomous agent scheduler initialized successfully"
```

---

## ✅ Verification Checklist

Run the automated verification:
```bash
./scripts/verify-autonomous-agent.sh
```

Should show:
- ✅ Database Schema (3/3)
- ✅ Core Services (4/4)
- ✅ API Integration Services (5/5)
- ✅ API Endpoints (7/7)
- ✅ UI Components (3/3)
- ✅ Infrastructure Config (3/3)
- ✅ Environment Variables (4/4)
- ✅ Documentation Files (6/6)

**Total: 35/35 checks passed** ✅

---

## 🎉 What You Can Do

✅ Create tasks in natural language
✅ Schedule recurring execution with cron
✅ Fetch Google Calendar events
✅ Search the web for information
✅ Find YouTube videos
✅ Filter and summarize with AI
✅ Send beautiful HTML emails
✅ Run tasks automatically on schedule
✅ Track execution history
✅ Monitor task performance

---

**Last Updated**: 2025-10-01
**Status**: Production Ready 🚀
