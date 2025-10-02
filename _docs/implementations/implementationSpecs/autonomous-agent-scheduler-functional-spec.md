# Functional Specification: Always-On Autonomous Agent with Dynamic Task Scheduling

## 1. System Overview

An autonomous agent system that enables users to create, schedule, and execute repeatable tasks through natural language prompts. The system integrates with Google services (Gmail, Calendar, Docs, Sheets, Drive, YouTube) and web search APIs, orchestrated by LLM-powered task interpretation and execution.

**Primary Architecture**: Event-driven task scheduler with LLM-based task compiler and stateful execution engine.

## 2. Core Components

### 2.1 Task Definition Engine
- **Input**: Natural language prompts describing desired tasks
- **Processing**: LLM (Gemini primary, abstracted for portability) parses intent, extracts:
  - Schedule/trigger (cron expression or natural language time)
  - Data sources (Calendar, Search, YouTube, Drive, etc.)
  - Processing instructions (filtering, summarization, formatting)
  - Output format and delivery method (email, doc, sheet)
  - Tone/personalization parameters
- **Output**: Structured task definition (JSON schema)

**Task Schema**:
```json
{
  "taskId": "uuid",
  "name": "string",
  "schedule": "cron_expression",
  "timezone": "string",
  "actions": [
    {
      "type": "data_collection|processing|delivery",
      "service": "gmail|calendar|search|youtube|drive|docs|sheets",
      "operation": "string",
      "parameters": {},
      "output_binding": "variable_name"
    }
  ],
  "personalization": {
    "tone": "motivational|professional|casual",
    "keywords": ["AI", "Telegames", "..."],
    "preferences": {}
  },
  "enabled": true,
  "created": "timestamp",
  "lastRun": "timestamp"
}
```

### 2.2 Scheduler Service
- **Engine**: APScheduler (Python) or node-cron (Node.js)
- **Capabilities**:
  - Cron-based scheduling with timezone support
  - One-time and recurring tasks
  - Task persistence across restarts
  - Concurrent execution with rate limiting
- **Storage**: SQLite for task definitions, PostgreSQL for production scale

### 2.3 Integration Layer

#### 2.3.1 Google Services
**Authentication**:
- OAuth2 flow with unified scope consent
- Scopes: `gmail.send`, `gmail.readonly`, `calendar.readonly`, `drive`, `docs`, `sheets`, `youtube.readonly`
- Token storage: Encrypted `token.json` or database with auto-refresh
- Implementation: `google-auth-oauthlib` + `google-auth-httplib2`

**APIs**:
- **Gmail**: `google-api-python-client` / `@googleapis/gmail`
  - Operations: read, send, search, label
- **Calendar**: Events API
  - Operations: list events by date range, get event details
- **Docs/Sheets**: Create, read, update documents
  - Template-based generation for reports
- **Drive**: Search, retrieve, upload files
  - Query DSL for filtering by type, date, ownership
- **YouTube**: Data API v3
  - Trending videos, channel stats, video transcripts (via youtube-transcript-api)

#### 2.3.2 Search & Discovery
- **Google Programmable Search**: Custom Search JSON API
  - 100 queries/day free tier, configurable rate limits
- **X (Twitter)**: Twitter API v2 (requires paid tier for trending)
  - Fallback: Apify Actor for public scraping
- **Trending aggregation**: Custom aggregator using multiple sources

#### 2.3.3 LLM Abstraction Layer
```python
class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt, context, parameters) -> str

class GeminiProvider(LLMProvider):
    # Vertex AI integration

class OpenAIProvider(LLMProvider):
    # OpenAI API integration
```

- **Primary**: Gemini 1.5 Pro via Vertex AI / Google AI Studio
- **Fallback**: OpenAI GPT-4 or Anthropic Claude
- **LangChain Integration**: Use LCEL chains for task orchestration

### 2.4 Execution Engine
**Workflow**:
1. Scheduler triggers task at specified time
2. Execution engine resolves task definition
3. For each action:
   - Authenticate with required service
   - Execute API call with retry logic
   - Store intermediate results in context
4. LLM processes collected data (filtering, summarization, formatting)
5. Delivery service sends output via specified channel
6. Log execution results and update task metadata

**Error Handling**:
- Exponential backoff for API failures
- Graceful degradation (skip failed data sources)
- User notification on critical failures
- Dead letter queue for failed tasks

### 2.5 Memory & Personalization
**Short-term**: In-memory context for single task execution
**Long-term**:
- File-based: JSON history of past executions
- Vector DB (Pinecone/Weaviate): Semantic search of user preferences, past results
- Schema: `{user_id, task_id, timestamp, input, output, feedback, embeddings}`

**Learning**:
- Track keywords user highlights or clicks
- Adjust tone based on explicit/implicit feedback
- Build user profile: interests, priority topics, preferred output formats

### 2.6 Task Management Interface

#### 2.6.1 Natural Language API
**Endpoint**: `POST /agent/tasks/create`
```json
{
  "prompt": "Every Monday at 9am, summarize my week's calendar and email me",
  "userId": "string"
}
```

**Response**:
```json
{
  "taskId": "uuid",
  "interpretation": "Human-readable task summary",
  "schedule": "0 9 * * MON",
  "actions": [...],
  "requiresApproval": true
}
```

#### 2.6.2 CRUD Operations
- `GET /tasks` - List all tasks
- `GET /tasks/{id}` - Get task details
- `PUT /tasks/{id}` - Update task (re-prompt or direct JSON edit)
- `DELETE /tasks/{id}` - Delete task
- `POST /tasks/{id}/execute` - Trigger immediate execution
- `GET /tasks/{id}/history` - View past executions

#### 2.6.3 Approval Workflow
- For new tasks, send preview email with "Approve" link
- Task remains disabled until approved
- Optional: auto-approve for low-risk operations

## 3. Example Use Case Implementation

**User Prompt**:
> "Every morning at 7am Pacific Time, send me an email summarizing my day based on my Google Calendar. Search the web for the top 10 trending items on Google Search, X (Twitter), and YouTube. Filter results to highlight posts and content with an AI context, and include anything relevant to my startup Telegames. Deliver the results in a motivational tone."

**System Interpretation**:
```json
{
  "schedule": "0 7 * * * America/Los_Angeles",
  "actions": [
    {
      "type": "data_collection",
      "service": "calendar",
      "operation": "list_events",
      "parameters": {"timeMin": "today", "timeMax": "today+24h"},
      "output_binding": "calendar_events"
    },
    {
      "type": "data_collection",
      "service": "search",
      "operation": "trending",
      "parameters": {"sources": ["google", "youtube"], "limit": 10},
      "output_binding": "trending_items"
    },
    {
      "type": "processing",
      "service": "llm",
      "operation": "filter_and_summarize",
      "parameters": {
        "inputs": ["calendar_events", "trending_items"],
        "filters": ["AI", "Telegames", "startups", "real-time", "multimodal"],
        "tone": "motivational",
        "format": "email_html"
      },
      "output_binding": "email_content"
    },
    {
      "type": "delivery",
      "service": "gmail",
      "operation": "send",
      "parameters": {
        "to": "user@example.com",
        "subject": "Your Daily Briefing - {{date}}",
        "body": "{{email_content}}"
      }
    }
  ]
}
```

## 4. Dynamic Task Creation Flow

1. **User submits prompt** via API, web UI, or email
2. **LLM parses prompt** into structured task definition
3. **System validates**:
   - Schedule is valid cron expression
   - Required API scopes are authorized
   - Rate limits won't be exceeded
4. **User reviews and approves** task (or auto-approve if configured)
5. **Scheduler registers task** and executes at next trigger time
6. **Execution results logged** and available for user review

## 5. Technical Stack Recommendations

### Backend (Python)
- **Framework**: FastAPI
- **Scheduler**: APScheduler
- **LLM**: LangChain + Vertex AI SDK
- **Database**: PostgreSQL + SQLAlchemy
- **Auth**: `google-auth` + OAuth2
- **Async**: asyncio for concurrent API calls

### Backend (Node.js Alternative)
- **Framework**: Nest.js
- **Scheduler**: node-cron
- **LLM**: LangChain.js + Google AI SDK
- **Database**: Prisma + PostgreSQL

### Infrastructure
- **Deployment**: Docker container on GCP Cloud Run / AWS ECS
- **Queue**: Cloud Tasks / AWS SQS for long-running jobs
- **Secrets**: Google Secret Manager / AWS Secrets Manager
- **Monitoring**: Cloud Logging + alerting on task failures

## 6. Security & Compliance

- **Credential Storage**: Encrypt tokens at rest (AES-256)
- **API Access**: User-scoped OAuth tokens, no shared credentials
- **Rate Limiting**: Respect API quotas, implement exponential backoff
- **Data Privacy**: Store minimal PII, allow user data export/deletion
- **Google API TOS**: Comply with restricted scope guidelines
- **Audit Logging**: Record all task executions and data access

## 7. Extensibility

### Adding New Integrations
1. Implement `ServiceAdapter` interface:
   ```python
   class ServiceAdapter(ABC):
       def authenticate(self, credentials) -> None
       def execute(self, operation, parameters) -> Any
   ```
2. Register adapter in integration registry
3. Update LLM prompt to recognize new service capabilities
4. Add to task schema validation

### Future Integrations
- Slack (messaging, channel posting)
- Notion (database queries, page creation)
- GitHub (issue tracking, PR summaries)
- Linear (sprint summaries)
- Custom webhooks (arbitrary HTTP endpoints)

## 8. Milestones

### Phase 1: Core Infrastructure (4 weeks)
- [ ] OAuth2 setup for Google services
- [ ] Basic scheduler with SQLite persistence
- [ ] LLM integration (Gemini)
- [ ] Single hardcoded task execution (daily email use case)

### Phase 2: Dynamic Task Creation (3 weeks)
- [ ] Natural language task parser
- [ ] Task CRUD API
- [ ] Approval workflow
- [ ] Web UI for task management

### Phase 3: Advanced Features (4 weeks)
- [ ] Multi-source search aggregation (Google, YouTube, X)
- [ ] Vector DB for memory
- [ ] Personalization engine
- [ ] Error recovery and retry logic

### Phase 4: Production Hardening (2 weeks)
- [ ] Rate limiting and quota management
- [ ] Monitoring and alerting
- [ ] User documentation
- [ ] Performance testing (100+ concurrent tasks)

## 9. Success Metrics

- **Task Reliability**: 99%+ successful execution rate
- **Latency**: <30s for data collection, <60s end-to-end for typical task
- **User Adoption**: 80%+ of created tasks remain active after 30 days
- **API Efficiency**: Stay within free tier limits for MVP
- **User Satisfaction**: NPS >40 after 3 months

## 10. Open Questions

1. **Email delivery**: Use user's Gmail or system sender? (Recommend: user's Gmail with delegated send)
2. **X (Twitter) trending**: Paid API required, fallback strategy? (Recommend: Apify Actor or community API)
3. **Task approval**: Default opt-in or opt-out? (Recommend: opt-in for first 3 tasks, then auto-approve)
4. **Timezone handling**: Store all times in UTC or user timezone? (Recommend: UTC storage, user timezone display)
5. **LLM costs**: Budget per task execution? (Recommend: $0.10 ceiling, use Gemini Flash for bulk operations)
