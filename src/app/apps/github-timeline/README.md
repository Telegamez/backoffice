# GitHub Timeline Explorer

An interactive development timeline that visualizes GitHub issues and pull requests with AI-powered insights for project tracking and analysis.

## Overview

The GitHub Timeline Explorer transforms raw GitHub data into a visual, time-based interface that helps teams understand development patterns, track progress, and gain insights into project evolution. It combines GitHub issues and pull requests with AI analysis to provide actionable intelligence about development activities.

## Features

### Timeline Visualization
- **Zoomable Interface**: Switch between week, month, quarter, and year views
- **Compact Mode**: Remove empty date gaps for focused analysis
- **Lane Stacking**: Organize overlapping segments for better readability
- **Interactive Segments**: Click segments for detailed information

### GitHub Integration
- **Automated Sync**: Pull issues and PRs from Telegamez repositories
- **Smart Mapping**: Automatically organize data into weekly segments
- **Metadata Tracking**: Capture labels, assignees, and status changes
- **Real-time Updates**: Keep timeline current with repository changes

### AI-Powered Insights
- **Segment Analysis**: AI-generated summaries of development activities
- **Deliverable Tracking**: Identify and categorize completed work
- **Impact Assessment**: Analyze the significance of development efforts
- **Custom Queries**: Ask specific questions about development periods

## Getting Started

### Prerequisites
- Platform authentication (handled by backoffice)
- GitHub token with repository access
- OpenAI API access (configured at platform level)

### First-Time Setup

1. **Access the Application**
   - Navigate to the main backoffice platform
   - Select "GitHub Timeline Explorer" from the application grid

2. **Initial Data Sync**
   ```bash
   # Sync GitHub issues and PRs
   curl -X POST http://localhost:3100/api/github-sync \
     -H "Content-Type: application/json" \
     -d '{"repo":"Telegamez/telegamez","perPage":100,"maxPages":20}'
   
   # Generate timeline segments
   curl -X POST http://localhost:3100/api/map-timeline \
     -H "Content-Type: application/json" -d '{}'
   ```

3. **Explore the Timeline**
   - Use zoom controls to adjust time granularity
   - Click segments to view detailed information
   - Toggle compact mode for different viewing preferences

## User Interface

### Main Timeline
- **Time Navigation**: Zoom in/out with controls or mouse wheel
- **Segment Selection**: Click segments to see detailed analysis
- **View Options**: Toggle compact mode and lane stacking
- **Sync Controls**: Manual refresh and GitHub sync buttons

### Detail Panel
- **Segment Information**: Title, date range, and categories
- **Metrics Display**: Issue counts, PR counts, and impact scores
- **Deliverables List**: Key accomplishments and outputs
- **Key Work Summary**: Major activities and achievements

### AI Insights Panel
- **Cached Analysis**: Previously generated insights for quick access
- **Re-analysis**: Generate fresh insights with updated context
- **Custom Queries**: Ask specific questions about the selected segment
- **Streaming Responses**: Real-time AI analysis with progressive updates

## API Endpoints

### Data Synchronization
- `POST /api/github-sync` - Sync issues and PRs from GitHub
- `POST /api/map-timeline` - Generate weekly segments from synced data
- `GET /api/segments` - Retrieve timeline segments
- `GET /api/segments/search` - Search segments with filters

### AI Analysis
- `GET /api/segment-insights` - Get cached insights for a segment
- `POST /api/segment-insights/reanalyze` - Generate new analysis
- `POST /api/segment-insights/infer` - Custom AI queries
- `GET /api/model-status` - Current AI model information

### Application Health
- `GET /api/insights` - General insights endpoint
- `POST /api/seed-segments` - Seed demo data for testing

## Configuration

### Environment Variables
```bash
# GitHub Integration
GITHUB_TOKEN=ghp_your_token_here

# AI Integration (shared with platform)
OPENAI_API_KEY=sk-your_key_here
OPENAI_MODEL=gpt-4o

# Database (shared with platform)
DATABASE_URL=postgres://postgres:postgres@localhost:55432/telegamez
```

### GitHub Token Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a fine-grained personal access token
3. Grant permissions:
   - Repository read access
   - Issues read access
   - Pull requests read access
4. Add token to platform environment variables

## Database Schema

### Timeline Segments
```sql
CREATE TABLE timeline_segments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  categories TEXT[],
  issues INTEGER DEFAULT 0,
  prs INTEGER DEFAULT 0,
  customer_facing INTEGER DEFAULT 0,
  platform_work INTEGER DEFAULT 0,
  impact VARCHAR(50) DEFAULT 'medium',
  deliverables JSONB DEFAULT '[]',
  key_work TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### GitHub Data
```sql
CREATE TABLE github_issues (
  id SERIAL PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  labels JSONB DEFAULT '[]',
  assignees JSONB DEFAULT '[]'
);

CREATE TABLE github_pull_requests (
  id SERIAL PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  merged_at TIMESTAMP,
  labels JSONB DEFAULT '[]'
);
```

### AI Insights
```sql
CREATE TABLE segment_insights (
  id SERIAL PRIMARY KEY,
  segment_slug VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (segment_slug) REFERENCES timeline_segments(slug)
);
```

## Data Flow

1. **GitHub Sync**: `/api/github-sync` pulls issues and PRs from repositories
2. **Segment Mapping**: `/api/map-timeline` organizes data into weekly segments
3. **Timeline Display**: React components render interactive timeline
4. **User Interaction**: Segment selection triggers detail panel updates
5. **AI Analysis**: On-demand or cached insights provide context and summaries

## Troubleshooting

### Common Issues

**GitHub Sync Fails**
- Verify GitHub token has correct permissions
- Check rate limiting (GitHub API has request limits)
- Ensure repository name and organization are correct

**Timeline Shows No Data**
- Run GitHub sync followed by timeline mapping
- Check database connectivity
- Verify segments were created with `/api/segments`

**AI Insights Not Loading**
- Confirm OpenAI API key is configured
- Check model availability (GPT-4o)
- Review network connectivity and API quotas

### Debug Commands
```bash
# Check segment data
curl http://localhost:3100/api/segments

# Test GitHub token
source .env.local
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/Telegamez/telegamez

# Verify AI model
curl http://localhost:3100/api/model-status

# Check database connection
docker exec telegamez-postgres pg_isready -U postgres
```

## Development

### Local Development
```bash
# Start the platform (from project root)
npm run dev

# Access the app
open http://localhost:3100/apps/github-timeline
```

### Testing Data Flow
1. Seed demo segments: `POST /api/seed-segments`
2. Sync real GitHub data: `POST /api/github-sync`
3. Generate segments: `POST /api/map-timeline`
4. Test AI insights: Select a segment and click "Re-analyze"

### Contributing
- Follow platform-level TypeScript and ESLint configurations
- Use existing ShadCN UI components when possible
- Add new API endpoints under `/api/` with proper error handling
- Update this README when adding new features

## Known Limitations

- PR labels are not currently stored (title-based categorization only)
- Monthly aggregation views not yet implemented
- Mapping uses simple heuristics for category and impact assessment
- No automated testing coverage yet

## Future Enhancements

- Enhanced PR label storage and categorization
- Monthly and quarterly rollup views
- Configurable mapping rules for categories and impact
- Automated testing and CI integration
- Real-time GitHub webhook integration
- Advanced filtering and search capabilities

---

**Application Maintainer**: Telegamez Development Team  
**Issues**: Report in the main backoffice repository  
**Last Updated**: January 2025