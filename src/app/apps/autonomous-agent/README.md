# Autonomous Agent Scheduler

An intelligent task automation system that allows users to create, schedule, and execute recurring tasks using natural language.

## Features

- **Natural Language Task Creation**: Describe tasks in plain English
- **Flexible Scheduling**: Cron-based scheduling with timezone support
- **Multi-Service Integration**: Calendar, Gmail, YouTube, Google Search
- **AI-Powered Processing**: Content filtering and summarization
- **Execution History**: Track all task executions with detailed logs
- **Approval Workflow**: Review and approve tasks before activation

## Quick Start

### 1. Navigate to the Dashboard

Visit `/apps/autonomous-agent` to access the task management dashboard.

### 2. Create Your First Task

Click "Create New Task" and enter a description like:

```
Every morning at 7am Pacific, email me my calendar and trending AI news
```

### 3. Review and Approve

The system will parse your request and show you:
- Schedule interpretation
- Actions to be performed
- Personalization settings
- Any warnings or requirements

Click "Approve & Activate" to start the task.

## Example Task Prompts

### Daily Briefing
```
Every morning at 7am Pacific, email me my calendar and trending AI news
```

### Weekly Report
```
Every Monday at 9am, send me a summary of last week's YouTube videos about LangChain
```

### Daily Research
```
Daily at 6pm, search for new content about startups and email me the top 5 results
```

### Custom Schedule
```
Every weekday at 8:30am EST, collect trending tech news and send me a professional summary
```

## Task Components

### Schedule
Tasks use cron expressions with timezone support:
- `0 7 * * *` - Daily at 7:00 AM
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 18 * * 1-5` - Weekdays at 6:00 PM

### Actions
Tasks consist of sequential actions:
1. **Data Collection**: Gather from Calendar, Search, YouTube
2. **Processing**: AI filtering and summarization
3. **Delivery**: Email or document storage

### Personalization
- **Tone**: Motivational, Professional, or Casual
- **Keywords**: Topics to highlight
- **Filters**: Content to prioritize

## API Endpoints

### Task Management
- `GET /api/autonomous-agent/tasks` - List all tasks
- `POST /api/autonomous-agent/tasks` - Create task
- `GET /api/autonomous-agent/tasks/[id]` - Get task details
- `PUT /api/autonomous-agent/tasks/[id]` - Update task
- `DELETE /api/autonomous-agent/tasks/[id]` - Delete task

### Task Execution
- `POST /api/autonomous-agent/tasks/[id]/execute` - Run now
- `POST /api/autonomous-agent/tasks/[id]/approve` - Approve task
- `GET /api/autonomous-agent/tasks/[id]/history` - View history

### System
- `GET /api/autonomous-agent/status` - Scheduler health check

## Configuration

### Required Environment Variables

```bash
# OpenAI API (required for task parsing and filtering)
OPENAI_API_KEY=sk-...

# Database (required)
DATABASE_URL=postgresql://...

# Google OAuth (required for Calendar, Gmail, YouTube)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Optional Environment Variables

```bash
# Google Search API (optional - uses mock data if not configured)
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
```

## Task Lifecycle

1. **Creation**: User submits natural language prompt
2. **Parsing**: AI interprets and structures the task
3. **Approval**: User reviews and approves task
4. **Activation**: Task is scheduled with cron
5. **Execution**: Task runs at scheduled time
6. **Logging**: Results are stored in execution history

## Task States

- **pending_approval**: Waiting for user approval
- **approved**: Approved and ready to run
- **disabled**: Manually disabled by user

## Troubleshooting

### Task Not Executing

1. Check task status is "approved" and "enabled"
2. Verify scheduler is running: `GET /api/autonomous-agent/status`
3. Check execution history for errors
4. Review server logs for scheduler initialization

### Natural Language Parsing Issues

If the parser doesn't understand your prompt:
- Be more specific about timing ("7am" vs "morning")
- Specify timezone if not using default
- Break complex tasks into smaller tasks
- Use example prompts as templates

### API Quota Limits

- **YouTube**: 10,000 units/day
- **Google Search**: 100 queries/day (free tier)
- **Gmail**: Effectively unlimited

## Development

### Database Schema

```sql
-- Scheduled tasks
CREATE TABLE scheduled_tasks (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  schedule_cron VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  actions JSONB NOT NULL,
  personalization JSONB,
  enabled BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'pending_approval',
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task execution history
CREATE TABLE task_executions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  result JSONB,
  error_message TEXT,
  execution_time_ms INTEGER
);
```

### Key Services

- **TaskScheduler**: Manages cron scheduling and execution
- **TaskExecutor**: Orchestrates action execution
- **TaskParser**: Converts natural language to structured tasks
- **YouTubeService**: YouTube Data API integration
- **SearchService**: Google Programmable Search API integration

## Support

For issues or questions:
1. Check the [Implementation Status](../../../../_docs/implementations/implementation-status/autonomous-agent-scheduler-status.md)
2. Review the [Project Plan](../../../../_docs/implementations/implementation-guides/autonomous-agent-scheduler-project-plan.md)
3. See the [Functional Specification](../../../../_docs/implementations/implementationSpecs/autonomous-agent-scheduler-functional-spec.md)

## License

Internal use only - part of the Factory backoffice application.
