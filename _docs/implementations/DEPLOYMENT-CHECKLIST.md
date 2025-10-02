# Autonomous Agent Scheduler - Deployment Checklist

**Date**: 2025-10-01
**Status**: Ready for Deployment

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

Check your `.env.local` file has all required variables:

**Required Variables** ✅
- [ ] `OPENAI_API_KEY` - For task parsing and AI processing
- [ ] `DATABASE_URL` - PostgreSQL database connection
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth
- [ ] `NEXTAUTH_URL` - Your application URL
- [ ] `NEXTAUTH_SECRET` - Random secret (min 32 chars)

**New Variables (Phase 2)** ✅
- [ ] `GOOGLE_SEARCH_API_KEY` - ✅ You just added this!
- [ ] `GOOGLE_SEARCH_ENGINE_ID` - ✅ You just added this!

**Optional Variables**
- [ ] `GOOGLE_PROJECT_ID` - Service account (optional)
- [ ] `GOOGLE_PRIVATE_KEY` - Service account (optional)
- [ ] `GOOGLE_CLIENT_EMAIL` - Service account (optional)

---

### 2. Database Migration

**Step 1**: Verify DATABASE_URL is set
```bash
echo $DATABASE_URL
```

**Step 2**: Apply migration
```bash
pnpm drizzle-kit push
```

**Expected Output**:
```
✓ Tables created: scheduled_tasks, task_executions
```

**Step 3**: Verify tables exist
```bash
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('scheduled_tasks', 'task_executions');"
```

**Expected Output**:
```
     table_name
---------------------
 scheduled_tasks
 task_executions
```

---

### 3. Google OAuth Scopes

Ensure your Google OAuth consent screen includes these scopes:

**Required**:
- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/youtube.readonly` - Access YouTube

**Optional**:
- `https://www.googleapis.com/auth/drive.readonly` - Read Google Drive (for future use)

**How to verify**:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > OAuth consent screen
3. Check "Scopes for Google APIs"
4. Add any missing scopes

---

### 4. Test API Integrations

**Test Search API** (you just configured this!):
```bash
curl http://localhost:3000/api/autonomous-agent/test-search
```

**Expected Response**:
```json
{
  "status": "success",
  "message": "Google Search API is working!",
  "configured": true,
  "resultCount": 5,
  "sampleResults": [...]
}
```

**If you get an error**:
- Check GOOGLE_SEARCH_API_KEY is correct
- Check GOOGLE_SEARCH_ENGINE_ID is correct
- Verify Custom Search API is enabled in Google Cloud Console

---

### 5. Restart Development Server

**Stop current server**: Press `Ctrl+C`

**Start fresh**:
```bash
pnpm dev
```

**Look for these messages**:
```
🚀 Server starting - initializing autonomous agent scheduler...
Loading X scheduled tasks
✅ Autonomous agent scheduler initialized successfully
```

**If you see errors**:
- Check DATABASE_URL is accessible
- Verify tables exist
- Check console for specific error messages

---

### 6. Verify Scheduler Status

**Test health endpoint**:
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

---

### 7. Access Dashboard

**Navigate to**:
```
http://localhost:3000/apps/autonomous-agent
```

**You should see**:
- ✅ "Autonomous Agent Scheduler" header
- ✅ "Create New Task" button
- ✅ Empty task list (no errors)
- ✅ No console errors in browser

---

### 8. Create Test Task

**Click "Create New Task"**

**Enter this prompt**:
```
Every day at 10am, search for "AI news" and email me the top 3 results
```

**Expected behavior**:
1. System parses the prompt
2. Shows preview with:
   - Schedule: "0 10 * * *" (UTC) or similar
   - Actions: Search > LLM > Gmail
   - Status: "pending_approval"
3. Click "Approve & Activate"
4. Task appears in list with:
   - Status: "approved" (green)
   - Enabled: "enabled" (blue)

---

### 9. Test Manual Execution

**From task list**:
1. Click "Run Now" on your test task
2. Click "History"
3. Wait 5-10 seconds
4. Refresh page

**Expected result**:
- ✅ Execution record appears
- ✅ Status: "completed" or "running"
- ✅ Execution time shown
- ✅ Results visible (if completed)

---

### 10. Verify Email Delivery

**Check your email** (the one associated with your Google account):
- ✅ Email received from your Gmail address
- ✅ Subject line appropriate
- ✅ HTML formatting looks good
- ✅ Search results included
- ✅ Mobile responsive (check on phone)

**If no email received**:
- Check Gmail spam folder
- Verify Gmail API scope is authorized
- Check execution history for error message
- Review server logs for Gmail API errors

---

## 🧪 Full Integration Test

### Create Daily Briefing Task

**Prompt**:
```
Every morning at 7am Pacific, email me:
- My Google Calendar for today
- Trending AI news from Google Search
- Top 3 YouTube videos about technology
Use a motivational tone
```

**Expected parsing**:
```
Schedule: 0 7 * * * America/Los_Angeles
Actions:
  1. calendar.list_events → calendar_events
  2. search.trending → trending_items
  3. youtube.trending → youtube_videos
  4. llm.filter_and_summarize → email_content
  5. gmail.send
Personalization:
  tone: motivational
  keywords: ["AI", "technology"]
```

**Manual execution**:
1. Click "Run Now"
2. Wait 10-30 seconds
3. Check email

**Verify email contains**:
- ✅ Purple gradient header
- ✅ Motivational greeting
- ✅ Calendar events section
- ✅ Search results section
- ✅ YouTube videos section
- ✅ Source badges
- ✅ Professional formatting
- ✅ Footer with metadata

---

## 🐛 Troubleshooting

### Error: "Database not available"

**Solution**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify tables exist
pnpm drizzle-kit push
```

### Error: "Google Search API not configured"

**Solution**:
```bash
# Check .env.local has:
GOOGLE_SEARCH_API_KEY=AIza...
GOOGLE_SEARCH_ENGINE_ID=...

# Restart server
# Test endpoint
curl http://localhost:3000/api/autonomous-agent/test-search
```

### Error: "Failed to send email"

**Possible causes**:
1. Gmail API scope not authorized
2. OAuth token expired
3. User email not verified

**Solution**:
```bash
# Re-authenticate with Google
# Visit: http://localhost:3000/apps/mail-assistant
# Grant Gmail send permission
# Try task execution again
```

### Error: "Task not executing"

**Check**:
1. Task status is "approved"
2. Task is "enabled"
3. Scheduler is initialized (check /api/autonomous-agent/status)
4. No errors in server console
5. Database connection working

### Error: "Natural language parsing failed"

**Solution**:
1. Check OPENAI_API_KEY is valid
2. Try simpler prompt first
3. Use example prompts from Quick Start
4. Check browser console for specific error

---

## 📋 Final Verification

Before considering deployment complete, verify:

**Infrastructure**:
- [ ] Database migration applied successfully
- [ ] Scheduler initializes on server start
- [ ] Health endpoint returns "healthy"
- [ ] All environment variables set

**API Integrations**:
- [ ] Search API working (test endpoint returns success)
- [ ] Calendar API accessible (user authorized)
- [ ] Gmail API accessible (user authorized)
- [ ] YouTube API accessible (OAuth configured)

**Functionality**:
- [ ] Can create task from natural language
- [ ] Task appears in task list
- [ ] Can approve pending task
- [ ] Can manually execute task
- [ ] Execution history records results
- [ ] Can enable/disable task
- [ ] Can delete task

**Email Delivery**:
- [ ] Emails sent from user's Gmail
- [ ] HTML formatting renders correctly
- [ ] Mobile responsive
- [ ] Search results included
- [ ] Calendar events included (if requested)
- [ ] YouTube videos included (if requested)

**Scheduled Execution** (if testing):
- [ ] Task executes at scheduled time
- [ ] Results logged in execution history
- [ ] Email delivered automatically

---

## 🎉 Success Criteria

You're ready for production when:

✅ All environment variables configured
✅ Database migration successful
✅ Scheduler initializing on startup
✅ All API integrations working
✅ Can create and execute tasks
✅ Emails delivered successfully
✅ No errors in console or logs

---

## 📞 Next Steps After Deployment

1. **Create Your First Real Task**
   - Use a practical schedule (daily briefing, weekly summary)
   - Test with real calendar events
   - Verify emails arrive on time

2. **Monitor Performance**
   - Check /api/autonomous-agent/status regularly
   - Review execution history for failures
   - Monitor server logs for errors

3. **Optimize Settings**
   - Adjust task schedules based on usage
   - Fine-tune keywords and filters
   - Customize email tone preferences

4. **Plan Phase 3**
   - Task detail/edit UI
   - Email preview before approval
   - Advanced filtering

---

**🚀 Ready to Deploy!**

If all checklist items pass, your autonomous agent scheduler is fully operational and ready for real-world use.

**Last Updated**: 2025-10-01
