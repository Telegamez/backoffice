# AI Admin Assistant - Phase 1 Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
1. **Development Server Running**: 
   ```bash
   npm run dev -- -p 3101
   ```
   Server should be accessible at: http://localhost:3101

2. **Redis Running**: 
   ```bash
   docker-compose up -d redis
   ```

3. **Database Migrated**: 
   ```bash
   DATABASE_URL="postgres://postgres:postgres@localhost:55432/telegamez" npm run db:migrate:local
   ```

## 🧪 Phase 1 Testing Scenarios

### Test 1: Infrastructure Health Check

**What to Test**: Core infrastructure components
**Expected Result**: All systems operational

```bash
# Test Redis connectivity
docker exec telegamez_redis redis-cli ping
# Should return: PONG

# Check environment variables
echo "OpenAI API Key: ${OPENAI_API_KEY:+CONFIGURED}"
echo "Google OAuth: ${GOOGLE_CLIENT_ID:+CONFIGURED}"
# Should show: CONFIGURED for both
```

**✅ Success Criteria**: Redis responds with PONG, environment variables are set

---

### Test 2: Authentication & Access

**What to Test**: Google OAuth integration and app access
**Steps**:
1. Open browser to: http://localhost:3101
2. Click "Sign In" or visit: http://localhost:3101/api/auth/signin
3. Sign in with your @telegamez.com Google account
4. Navigate to: http://localhost:3101/apps/ai-admin-assistant

**✅ Success Criteria**: 
- Successful Google OAuth flow
- Redirected to AI Admin Assistant dashboard
- No authentication errors

---

### Test 3: Google Drive Integration

**What to Test**: Document listing from Google Drive
**Steps**:
1. Ensure you're signed in (Test 2)
2. On the AI Admin Assistant dashboard, look at the "Select Document from Google Drive" section
3. Documents should load automatically
4. Try searching for documents using the search bar
5. Click on different documents to select them

**✅ Success Criteria**:
- Documents load from your Google Drive
- Search functionality works
- Document selection changes the selected state
- File icons and metadata display correctly

**❌ Troubleshooting**:
- If you see "Please sign in to access Google Drive" → Complete Test 2
- If you see "No documents found" → Ensure you have Google Docs/Sheets in your Drive
- If you see "Failed to connect to Google Drive" → Check OAuth scopes in console

---

### Test 4: AI Document Analysis (Mock)

**What to Test**: AI analysis workflow with simulated results
**Steps**:
1. Select a document from Google Drive (Test 3)
2. Click "Analyze with AI" button
3. Watch the analysis panel for:
   - Status changes to "Analyzing document with GPT-5..."
   - Progress indicators
   - Completion with mock results after ~3 seconds

**✅ Success Criteria**:
- Analysis starts successfully
- Progress indicators work
- Mock results appear with:
  - Document summary
  - Key points list
  - Contact information
  - Action items
  - Confidence score

**Note**: This test uses simulated results since we're not processing real documents yet.

---

### Test 5: API Endpoints Testing

**What to Test**: Backend API functionality
**Steps**:

```bash
# Test document listing (requires authentication token)
curl -X GET "http://localhost:3101/api/ai-admin-assistant/documents" \
     -H "Cookie: [your-session-cookie]"

# Test analysis job creation
curl -X POST "http://localhost:3101/api/ai-admin-assistant/analyze" \
     -H "Content-Type: application/json" \
     -H "Cookie: [your-session-cookie]" \
     -d '{
       "documentId": "test-doc-id",
       "analysisTypes": ["summary", "key_points"]
     }'
```

**✅ Success Criteria**:
- Documents API returns JSON with document list
- Analysis API returns job ID and success message
- Proper error handling for invalid requests

---

### Test 6: Background Job Processing

**What to Test**: Bull Queue job system
**Steps**:
1. Open browser developer tools → Network tab
2. Select a document and click "Analyze with AI"
3. Monitor network requests to see:
   - POST to `/api/ai-admin-assistant/analyze`
   - Potential polling to `/api/ai-admin-assistant/jobs/[jobId]`

**✅ Success Criteria**:
- Analysis job is created successfully
- Job ID is returned
- Background processing workflow initiates

---

### Test 7: Error Handling & Edge Cases

**What to Test**: Graceful error handling
**Steps**:
1. **Network Errors**: Disconnect internet, try to load documents
2. **Invalid Documents**: Try to analyze a document that doesn't exist
3. **Authentication Expiry**: Wait for session timeout, try operations
4. **Redis Connectivity**: Stop Redis container, try operations

```bash
# Stop Redis to test error handling
docker stop telegamez_redis

# Try to use the app - should show graceful errors

# Restart Redis
docker start telegamez_redis
```

**✅ Success Criteria**:
- Clear error messages displayed to users
- No application crashes
- Graceful recovery when services restore

---

## 🔍 Advanced Testing

### Test 8: Database Audit Logging

**What to Test**: Comprehensive audit trail
**Steps**:
1. Perform various actions in the UI (document selection, analysis)
2. Check the database for audit records:

```sql
-- Connect to database
psql postgres://postgres:postgres@localhost:55432/telegamez

-- Check audit logs
SELECT 
    action_type, 
    resource_id, 
    success, 
    details,
    timestamp 
FROM admin_assistant_audit 
ORDER BY timestamp DESC 
LIMIT 10;
```

**✅ Success Criteria**:
- All user actions are logged in `admin_assistant_audit` table
- Logs include timestamps, user email, action details
- Both successful and failed operations are recorded

---

### Test 9: AI Caching System

**What to Test**: Redis-based AI result caching
**Steps**:
1. Analyze the same document twice
2. Second analysis should be faster (cached result)
3. Check Redis for cached data:

```bash
# Connect to Redis
docker exec -it telegamez_redis redis-cli

# Check for AI cache keys
KEYS admin_assistant_ai_cache:*

# View cache content
GET admin_assistant_ai_cache:[some-key]
```

**✅ Success Criteria**:
- Second analysis of same document returns cached results
- Cache keys exist in Redis
- Cache contains structured analysis data

---

### Test 10: Performance Testing

**What to Test**: System performance under load
**Steps**:
1. Open multiple browser tabs to the app
2. Perform document loading and analysis in parallel
3. Monitor system resources:

```bash
# Check Redis memory usage
docker exec telegamez_redis redis-cli INFO memory

# Check database connections
docker exec telegamez_db psql -U postgres -d telegamez -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor application logs
docker logs telegamez_web --tail 50 -f
```

**✅ Success Criteria**:
- App handles multiple concurrent users
- Redis memory usage stays reasonable
- Database connections are managed properly
- No memory leaks or performance degradation

---

## 🚨 Expected Limitations (Phase 1)

### What WILL Work:
- ✅ Google Drive document listing and selection
- ✅ Mock AI analysis with simulated results
- ✅ UI components and workflow
- ✅ Background job creation and status tracking
- ✅ Audit logging and caching infrastructure
- ✅ OAuth authentication and authorization

### What WON'T Work Yet:
- ❌ **Real AI Analysis**: GPT-5 integration requires actual document content processing
- ❌ **Email Generation**: Email campaigns are not implemented yet
- ❌ **Multi-document Workflows**: Only single document analysis
- ❌ **Production Service Account**: Currently using OAuth tokens only

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution**: Complete OAuth sign-in flow at `/api/auth/signin`

### Issue: "No documents found"
**Solution**: Ensure you have Google Docs/Sheets in your Google Drive

### Issue: Redis connection failed
**Solution**: Ensure Redis container is running: `docker-compose up -d redis`

### Issue: Database errors
**Solution**: Run migrations: `DATABASE_URL="..." npm run db:migrate:local`

### Issue: Port already in use
**Solution**: Use different port: `npm run dev -- -p 3102`

---

## 📊 Success Metrics

### Phase 1 Completion Checklist:
- [ ] Infrastructure components operational (Redis, Database, APIs)
- [ ] Google OAuth authentication working
- [ ] Google Drive document listing functional
- [ ] UI components connected to backend services
- [ ] Background job system creating and tracking jobs
- [ ] Audit logging capturing all operations
- [ ] AI caching infrastructure ready
- [ ] Error handling graceful and informative
- [ ] Development environment stable and responsive

### Ready for Phase 2 When:
- [ ] All Phase 1 tests pass
- [ ] OpenAI API integration working with real documents
- [ ] Service Account delegation (optional enhancement)
- [ ] Performance monitoring established

---

## 🎯 Next Steps After Testing

1. **Report Issues**: Document any failures or unexpected behavior
2. **Performance Baseline**: Note response times and resource usage
3. **User Experience**: Evaluate UI/UX flow and suggest improvements
4. **Infrastructure Validation**: Confirm all components are production-ready
5. **Phase 2 Planning**: Validate readiness for email generation features

**Testing completed successfully means the AI Admin Assistant infrastructure is solid and ready for the next development phase!**