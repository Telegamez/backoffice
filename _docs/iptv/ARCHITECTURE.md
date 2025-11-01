# IPTV Channel Manager - Architecture

Technical architecture documentation for the IPTV Channel Manager application.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [API Architecture](#api-architecture)
5. [File Storage](#file-storage)
6. [Security](#security)
7. [Performance Considerations](#performance-considerations)
8. [Technology Stack](#technology-stack)

## System Overview

The IPTV Channel Manager is a full-stack application integrated into the Telegamez Backoffice, providing both GUI and CLI interfaces for managing IPTV channel lists.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    IPTV Channel Manager                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐              ┌──────────────┐         │
│  │   GUI        │              │   CLI        │         │
│  │ (React/Next) │              │ (Node.js)    │         │
│  └──────┬───────┘              └──────┬───────┘         │
│         │                              │                 │
│         └──────────────┬───────────────┘                 │
│                        │                                 │
│         ┌──────────────▼───────────────┐                │
│         │     API Routes (Next.js)      │                │
│         │  /api/iptv/*                 │                │
│         └──────────────┬───────────────┘                │
│                        │                                 │
│         ┌──────────────▼───────────────┐                │
│         │   Core Logic Layer           │                │
│         │   - Generator                │                │
│         │   - Validator (iptv-checker) │                │
│         │   - Merger                   │                │
│         └──────────────┬───────────────┘                │
│                        │                                 │
│         ┌──────────────▼───────────────┐                │
│         │   External Data Sources      │                │
│         │   - IPTV-org API             │                │
│         └──────────────────────────────┘                │
│                                                           │
│         ┌──────────────────────────────┐                │
│         │   File Storage               │                │
│         │   /public/iptv-output/       │                │
│         └──────────────────────────────┘                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. Page Component (`page.tsx`)
- **Type**: Server Component
- **Responsibility**: Authentication and session management
- **Location**: `src/app/apps/iptv-channels/page.tsx`

```typescript
export default async function IPTVChannelsPage() {
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');
  return <IPTVChannelsClient />;
}
```

#### 2. Client Component (`page-client.tsx`)
- **Type**: Client Component
- **Responsibility**: UI logic and state management
- **Location**: `src/app/apps/iptv-channels/page-client.tsx`

**Key Features**:
- Tab-based interface (5 tabs)
- Real-time job status tracking
- File management
- Form handling and validation

**State Management**:
```typescript
// Job tracking
const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
const [jobs, setJobs] = useState<GenerationJob[]>([]);

// File management
const [channelFiles, setChannelFiles] = useState<ChannelFile[]>([]);

// Form state
const [customCountries, setCustomCountries] = useState('US');
const [customCategories, setCustomCategories] = useState('sports,news');
// ... etc
```

### Backend Components

#### 1. Generator (`src/lib/iptv/generator.ts`)
- **Responsibility**: Channel generation and filtering
- **Key Functions**:
  - `generateMasterChannels(options)` - Main generation function
  - `fetchJSON(url)` - Fetch data from IPTV-org API
  - `shouldFilterChannel(channel, config)` - Apply filters
  - `mapCategory()` / `mapLanguage()` - Data transformation

#### 2. API Routes

##### Generate Route (`/api/iptv/generate`)
- **Method**: POST
- **Max Duration**: 300s (5 minutes)
- **Responsibility**: Generate channels from scratch

##### Validate Route (`/api/iptv/validate`)
- **Method**: POST
- **Max Duration**: 600s (10 minutes)
- **Responsibility**: Validate uploaded channel files
- **Dependencies**: `iptv-checker`

##### Merge Route (`/api/iptv/merge`)
- **Method**: POST
- **Max Duration**: 600s (10 minutes)
- **Responsibility**: Merge multiple channel files

##### Download Route (`/api/iptv/download`)
- **Method**: GET
- **Responsibility**: Serve generated files securely

##### Files Route (`/api/iptv/files`)
- **Methods**: GET, DELETE
- **Responsibility**: List and manage channel files

#### 3. CLI Scripts

##### Generate Script (`scripts/iptv/generate.js`)
- **Responsibility**: CLI wrapper for channel generation
- **Uses**: Core generator logic from `lib/iptv/generator.ts`

##### Validate Script (`scripts/iptv/validate.js`)
- **Responsibility**: CLI validation tool
- **Uses**: `iptv-checker` library directly

##### Merge Script (`scripts/iptv/merge.js`)
- **Responsibility**: CLI merge tool
- **Features**: Deduplication, optional validation

## Data Flow

### Channel Generation Flow

```
User Input (GUI/CLI)
    ↓
Parse Options & Validate
    ↓
Fetch Channels from IPTV-org
    ↓
Fetch Streams from IPTV-org
    ↓
Build Stream Map (key: channel name)
    ↓
Filter Channels by Criteria
    ├─ Country filter
    ├─ Category filter
    ├─ Local affiliate filter
    └─ Stream format filter
    ↓
Match Channels with Streams
    ├─ Exact name match
    ├─ Fuzzy name match
    └─ Select best quality
    ↓
Deduplicate by Stream URL
    ↓
[Optional] Validate Streams
    ├─ Test each URL with iptv-checker
    ├─ Parallel processing
    ├─ Retry failed streams
    └─ Filter to valid only
    ↓
Renumber Channels
    ↓
Build Metadata Object
    ↓
Save to JSON File
    ↓
Return Result to User
```

### Validation Flow

```
Upload Channel File (GUI) / Specify File (CLI)
    ↓
Parse JSON File
    ↓
Validate File Structure
    ↓
Extract Channel List
    ↓
Initialize iptv-checker
    ├─ Set timeout
    ├─ Set parallel workers
    └─ Set retry count
    ↓
Test Each Stream URL
    ├─ HTTP HEAD request
    ├─ Check response status
    ├─ Verify content type
    └─ Retry on failure
    ↓
Classify Results
    ├─ Valid: status.ok = true
    └─ Invalid: status.ok = false
    ↓
Filter to Valid Channels Only
    ↓
Renumber Channels
    ↓
Build Result with Validation Stats
    ↓
Save Validated File
    ↓
Return Result
```

### Merge Flow

```
Select Multiple Files (GUI/CLI)
    ↓
Read All Files
    ↓
Extract Channel Arrays
    ↓
Concatenate All Channels
    ↓
Apply Deduplication Logic
    ├─ streamURL: Remove duplicate URLs
    ├─ name: Remove duplicate names
    └─ both: Remove if either matches
    ↓
Build Unique Channel List
    ↓
[Optional] Validate Merged List
    ↓
Renumber Channels
    ↓
Build Merge Metadata
    ├─ Source files
    ├─ Original count
    ├─ Duplicates removed
    └─ Validation stats
    ↓
Save Merged File
    ↓
Return Result
```

## API Architecture

### Authentication Flow

All API routes use NextAuth.js authentication:

```typescript
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Request/Response Format

#### Generate Request
```json
{
  "profile": "us-sports",
  "countries": ["US", "CA"],
  "categories": ["sports", "news"],
  "excludeLocal": true,
  "m3u8Only": true,
  "skipValidation": false,
  "timeout": 10,
  "parallel": 15,
  "retry": 2
}
```

#### Success Response
```json
{
  "success": true,
  "filename": "channels-1698765432123.json",
  "metadata": {
    "source": "master-channels-workflow",
    "generated_at": "2025-11-01T10:30:00.000Z",
    "total_channels": 421,
    "configuration": { ... },
    "generation_stats": { ... },
    "validation": { ... }
  }
}
```

#### Error Response
```json
{
  "error": "Validation failed: Invalid file format"
}
```

### Rate Limiting

- **Current**: No rate limiting
- **Recommended**: Implement per-user rate limits for production
- **Suggested Limits**:
  - Generate: 10 requests/hour
  - Validate: 5 requests/hour
  - Merge: 20 requests/hour

## File Storage

### Directory Structure

```
/opt/factory/backoffice/
├── public/
│   └── iptv-output/                    # Generated channel files
│       ├── channels-1698765432123.json
│       ├── channels-validated-*.json
│       └── channels-merged-*.json
├── src/
│   ├── app/
│   │   ├── apps/
│   │   │   └── iptv-channels/
│   │   │       ├── page.tsx            # Server component
│   │   │       └── page-client.tsx     # Client component
│   │   └── api/
│   │       └── iptv/
│   │           ├── generate/route.ts
│   │           ├── validate/route.ts
│   │           ├── merge/route.ts
│   │           ├── download/route.ts
│   │           └── files/route.ts
│   └── lib/
│       └── iptv/
│           └── generator.ts            # Core logic
└── scripts/
    └── iptv/
        ├── generate.js                 # CLI tool
        ├── validate.js                 # CLI tool
        └── merge.js                    # CLI tool
```

### File Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Generated | `channels-{timestamp}.json` | `channels-1698765432123.json` |
| Validated | `channels-validated-{timestamp}.json` | `channels-validated-1698765432123.json` |
| Merged | `channels-merged-{timestamp}.json` | `channels-merged-1698765432123.json` |
| Custom | `{name}-{timestamp}.json` | `us-sports-1698765432123.json` |

### File Retention

- **Current**: Manual deletion only
- **Recommended**: Implement automatic cleanup
- **Suggested Policy**:
  - Keep files for 30 days
  - Automatically delete older files
  - Preserve explicitly named files

## Security

### Authentication & Authorization

```typescript
// All routes protected by NextAuth.js
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Input Validation

#### Filename Validation (Path Traversal Prevention)
```typescript
// Reject filenames with path traversal attempts
if (filename.includes('..') || filename.includes('/')) {
  return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
}
```

#### File Type Validation
```typescript
// Only allow JSON files
if (!filename.endsWith('.json')) {
  return NextResponse.json({ error: 'Only JSON files allowed' }, { status: 400 });
}
```

### Output Directory Restriction

All file operations restricted to:
```typescript
const outputDir = join(process.cwd(), 'public', 'iptv-output');
```

### Security Recommendations

1. **Implement CSRF Protection**: Add CSRF tokens to forms
2. **Rate Limiting**: Prevent abuse of generation endpoints
3. **File Size Limits**: Restrict upload size for validation
4. **Virus Scanning**: Scan uploaded files before processing
5. **Audit Logging**: Log all file operations and API calls

## Performance Considerations

### Channel Generation

**Bottlenecks**:
- API fetch time: ~2-5 seconds
- Channel matching: ~1-3 seconds
- Validation: ~30-300 seconds (depends on channel count)

**Optimizations**:
- Cache API responses (15-minute TTL)
- Parallel stream validation
- Skip validation for testing
- Use in-memory processing

### Validation Performance

| Channels | Parallel | Timeout | Est. Time |
|----------|----------|---------|-----------|
| 100 | 10 | 10s | ~1-2 min |
| 500 | 15 | 10s | ~5-8 min |
| 1000 | 20 | 10s | ~10-15 min |
| 5000 | 20 | 10s | ~45-60 min |

**Optimization Strategies**:
1. Increase parallel workers for faster validation
2. Reduce timeout for quicker results
3. Batch validation in chunks
4. Cache validation results

### Memory Usage

**Typical Memory Consumption**:
- Base application: ~100 MB
- Channel generation: +50 MB
- Validation (500 channels): +100-200 MB
- Merge (3 files, 1000 channels): +150 MB

**Memory Optimization**:
- Stream processing for large files
- Clear buffers after operations
- Limit parallel operations
- Monitor Node.js heap usage

### Network Considerations

**Bandwidth Usage**:
- IPTV-org API fetch: ~5-10 MB
- Stream validation: ~10-50 KB per stream
- File download: Varies by file size

**Optimization**:
- Compress API responses
- Cache IPTV-org data
- Use HEAD requests for validation
- Implement resume capability

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Shadcn/ui | Latest | UI components |
| Lucide React | Latest | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.x | REST API |
| Node.js | 20.x | Runtime |
| iptv-checker | 0.28.0 | Stream validation |
| NextAuth.js | Latest | Authentication |

### External Dependencies

| Service | Purpose | URL |
|---------|---------|-----|
| IPTV-org API | Channel data | https://iptv-org.github.io/api/ |
| IPTV-org Streams | Stream URLs | https://iptv-org.github.io/api/streams.json |

### Development Tools

- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Type Checking**: TypeScript compiler
- **Version Control**: Git

## Scalability Considerations

### Current Limitations

1. **Synchronous Processing**: Long-running operations block request
2. **In-Memory Processing**: Limited by available RAM
3. **Single Instance**: No horizontal scaling
4. **File Storage**: Local filesystem only

### Scaling Recommendations

#### Short-term Improvements
1. Add job queue (BullMQ, Redis)
2. Implement background workers
3. Use streaming for large files
4. Add response caching

#### Long-term Improvements
1. Move to object storage (S3, R2)
2. Implement distributed processing
3. Add database for job tracking
4. Use CDN for file delivery
5. Implement microservices architecture

### Proposed Queue Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   API Route  │──────▶│  Job Queue   │──────▶│   Worker     │
│              │       │   (Redis)    │       │   Process    │
└──────────────┘       └──────────────┘       └──────────────┘
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐       ┌──────────────┐
                       │  Job Status  │       │  File Store  │
                       │   Database   │       │     (S3)     │
                       └──────────────┘       └──────────────┘
```

---

**Last Updated**: November 1, 2025
**Architecture Version**: 2.0
