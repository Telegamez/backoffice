# Autonomous Agent Scheduler: Quick Start Guide

**Version**: 1.0
**Date**: 2025-10-01
**Status**: Phase 1 Complete

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ pnpm package manager
- ✅ PostgreSQL database
- ✅ OpenAI API key
- ✅ Google OAuth credentials (Client ID, Client Secret)

---

## Step 1: Apply Database Migration

The autonomous agent requires two new database tables.

```bash
# Navigate to project directory
cd /opt/factory/backoffice

# Apply the migration
pnpm drizzle-kit push

# Or use migrate if you prefer
pnpm drizzle-kit migrate
```

**Expected Output**:
```
✓ Tables created: scheduled_tasks, task_executions
```

**Verify Migration**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('scheduled_tasks', 'task_executions');
```

---

## Step 2: Configure Environment Variables

Ensure these variables are set in your `.env.local` or environment:

### Required Variables

```bash
# OpenAI API (for task parsing and AI processing)
OPENAI_API_KEY=sk-proj-...

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Google OAuth (for Calendar, Gmail, YouTube)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Optional Variables (Phase 2+)

```bash
# Google Search API (optional - uses mock data if not set)
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=...

# Service Account (optional - for domain-wide delegation)
GOOGLE_PROJECT_ID=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CLIENT_EMAIL=...
```

---

## Step 3: Restart Development Server

The scheduler initializes automatically on server startup.

```bash
# Stop current server (Ctrl+C)

# Start development server
pnpm dev
```

**Expected Console Output**:
```
🚀 Server starting - initializing autonomous agent scheduler...
Loading X scheduled tasks
Task Y registered with schedule: 0 7 * * * (America/Los_Angeles)
✅ Autonomous agent scheduler initialized successfully
```

---

## Step 4: Verify Installation

### 4.1 Check Scheduler Status

Visit or curl:
```bash
curl http://localhost:3000/api/autonomous-agent/status
```

**Expected Response**:
```json
{
  "status": "healthy",
  "scheduler": {
    "initialized": true,
    "activeJobs": 0,
    "jobs": []
  },
  "timestamp": "2025-10-01T..."
}
```

### 4.2 Access Dashboard

Navigate to:
```
http://localhost:3000/apps/autonomous-agent
```

You should see:
- ✅ Empty task list (no tasks yet)
- ✅ "Create New Task" button
- ✅ No errors in browser console

---

## Step 5: Create Your First Task

### 5.1 Click "Create New Task"

### 5.2 Enter a Test Prompt

Try one of these example prompts:

```
Every day at 9am, email me trending AI news
```

```
Every Monday at 10am Pacific, send me a summary of YouTube videos about startups
```

```
Daily at 6pm EST, search for content about TypeScript and email me the top 5 results
```

### 5.3 Review the Preview

The system will show:
- ✅ Task name
- ✅ Schedule (cron expression + timezone)
- ✅ Actions to be performed
- ✅ Personalization settings
- ⚠️ Any warnings (e.g., API requirements)

### 5.4 Approve the Task

Click "Approve & Activate"

**Expected Result**:
- Task appears in task list
- Status: "approved" (green badge)
- Enabled: "enabled" (blue badge)
- Next run time is calculated

---

## Step 6: Test Manual Execution

### 6.1 Click "Run Now"

This triggers immediate execution without waiting for the schedule.

### 6.2 Click "History"

Navigate to the execution history page.

**Expected Result**:
- ✅ One execution record
- ✅ Status: "completed" or "running"
- ✅ Execution time displayed
- ✅ Results visible (if completed)

---

## Step 7: Verify Scheduled Execution

### 7.1 Create a Near-Term Task

For testing, create a task that runs soon:

```
In 5 minutes, email me a test message
```

**Note**: The parser might interpret this as a one-time task. For recurring tasks, use standard schedules.

### 7.2 Wait for Scheduled Time

### 7.3 Check Execution History

The task should execute automatically at the scheduled time.

**Verification**:
```bash
# Check console logs
# You should see:
Executing scheduled task X: [Task Name]
Starting execution Y for task X
Task X execution Y completed successfully in Zms
```

---

## Troubleshooting

### Problem: Scheduler Not Initializing

**Symptoms**:
- No console message: "initializing autonomous agent scheduler"
- Status endpoint returns error

**Solutions**:
1. Check `next.config.ts` has `instrumentationHook: true`
2. Verify `src/instrumentation.ts` exists
3. Restart dev server completely
4. Check for errors in console

### Problem: Task Parsing Fails

**Symptoms**:
- "Failed to create task" error
- Invalid cron expression error

**Solutions**:
1. Check `OPENAI_API_KEY` is set and valid
2. Be more specific in your prompt
3. Try one of the example prompts first
4. Check browser console for detailed error

### Problem: Search API Returns Mock Data

**Symptoms**:
- Search results look generic/fake
- Console shows "Google Search API not configured"

**Solutions**:
This is **expected behavior** if you haven't configured the Search API keys. The system gracefully degrades to mock data.

To enable real search:
1. Get API key from Google Cloud Console
2. Create Custom Search Engine at programmablesearchengine.google.com
3. Set environment variables
4. Restart server

### Problem: YouTube API Quota Exceeded

**Symptoms**:
- "Quota exceeded" error in execution history
- YouTube actions fail

**Solutions**:
1. Check quota at console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
2. Reduce frequency of YouTube-based tasks
3. Request quota increase from Google
4. Use search instead of trending for lower quota cost

### Problem: Database Connection Error

**Symptoms**:
- "Database not available" errors
- Tasks not loading

**Solutions**:
1. Check `DATABASE_URL` is set correctly
2. Verify database is running
3. Test connection: `psql $DATABASE_URL`
4. Check firewall/network settings

---

## Next Steps

### Phase 1 Complete ✅

You now have:
- Working scheduler
- Natural language task creation
- YouTube and Search integrations
- Basic task management UI

### Phase 2 (Weeks 3-4)

Next priorities:
1. Implement real Calendar API integration
2. Implement real Gmail API integration
3. Create HTML email templates
4. Add email preview functionality
5. Implement approval workflow emails

### Phase 3 (Weeks 5-6)

UI enhancements:
1. Task detail/edit view
2. Advanced execution history view
3. Email preview component
4. Filtering and search

### Phase 4 (Weeks 7-8)

Production readiness:
1. Rate limiting
2. Performance optimization
3. Monitoring and alerting
4. Security audit
5. Load testing

---

## Testing Checklist

Before moving to Phase 2, verify:

- [ ] Database migration applied successfully
- [ ] Scheduler initializes on server start
- [ ] Status endpoint returns "healthy"
- [ ] Can create task from natural language
- [ ] Task appears in task list
- [ ] Can approve pending task
- [ ] Can manually execute task
- [ ] Execution history records execution
- [ ] Can enable/disable task
- [ ] Can delete task
- [ ] Scheduled task executes automatically

---

## Configuration Examples

### Development (.env.local)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backoffice
OPENAI_API_KEY=sk-proj-...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-min-32-chars
```

### Production (.env.production)

```bash
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/backoffice
OPENAI_API_KEY=sk-proj-...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=...
NEXTAUTH_URL=https://backoffice.example.com
NEXTAUTH_SECRET=production-secret-random-string
```

---

## API Testing with curl

### Create Task

```bash
curl -X POST http://localhost:3000/api/autonomous-agent/tasks \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{
    "prompt": "Every day at 9am, email me trending AI news"
  }'
```

### List Tasks

```bash
curl http://localhost:3000/api/autonomous-agent/tasks \
  -b "next-auth.session-token=..."
```

### Execute Task

```bash
curl -X POST http://localhost:3000/api/autonomous-agent/tasks/1/execute \
  -b "next-auth.session-token=..."
```

### Get Execution History

```bash
curl http://localhost:3000/api/autonomous-agent/tasks/1/history \
  -b "next-auth.session-token=..."
```

---

## Support & Resources

- **Implementation Status**: [autonomous-agent-scheduler-status.md](../implementation-status/autonomous-agent-scheduler-status.md)
- **Project Plan**: [autonomous-agent-scheduler-project-plan.md](./autonomous-agent-scheduler-project-plan.md)
- **Functional Spec**: [autonomous-agent-scheduler-functional-spec.md](../implementationSpecs/autonomous-agent-scheduler-functional-spec.md)
- **PRD**: [autonomous-agent-scheduler-prd.md](../../prds/autonomous-agent-scheduler-prd.md)
- **Feature README**: [../../../src/app/apps/autonomous-agent/README.md](../../../src/app/apps/autonomous-agent/README.md)

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-10-01
