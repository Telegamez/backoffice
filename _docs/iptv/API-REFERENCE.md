# IPTV Channel Manager - API Reference

Complete API documentation for the IPTV Channel Manager REST endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Generate Channels](#generate-channels)
3. [Validate Channels](#validate-channels)
4. [Merge Channels](#merge-channels)
5. [Download File](#download-file)
6. [List Files](#list-files)
7. [Delete File](#delete-file)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)

## Authentication

All API endpoints require authentication via NextAuth.js session.

### Headers

```http
Cookie: next-auth.session-token=<token>
```

### Unauthorized Response

```json
{
  "error": "Unauthorized"
}
```

**Status Code**: `401`

---

## Generate Channels

Generate a new channel list with custom filters or predefined profiles.

### Endpoint

```
POST /api/iptv/generate
```

### Request Body

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

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `profile` | string | No | - | Predefined profile (us-all, us-sports, etc.) |
| `countries` | string[] | No | - | Array of country codes (e.g., ["US", "CA"]) |
| `categories` | string[] | No | - | Array of categories (e.g., ["sports", "news"]) |
| `excludeLocal` | boolean | No | false | Exclude local affiliate channels |
| `m3u8Only` | boolean | No | false | Only include M3U8 format streams |
| `skipValidation` | boolean | No | false | Skip stream validation for faster generation |
| `timeout` | number | No | 10 | Validation timeout per stream (seconds) |
| `parallel` | number | No | 10 | Number of parallel validation checks |
| `retry` | number | No | 2 | Number of retry attempts per stream |

### Available Profiles

| Profile ID | Description |
|------------|-------------|
| `us-all` | All US channels (no local affiliates) |
| `us-sports` | US sports channels only |
| `us-entertainment` | Movies, music, comedy |
| `us-news` | News channels (no local) |
| `us-family` | Kids, education, religious |
| `north-america` | US + Canada + Mexico |

### Response

**Success (200)**:

```json
{
  "success": true,
  "filename": "channels-1698765432123.json",
  "metadata": {
    "source": "master-channels-workflow",
    "generated_at": "2025-11-01T10:30:00.000Z",
    "profile": "us-sports",
    "total_channels": 421,
    "configuration": {
      "countries": ["US"],
      "categories": ["sports"],
      "exclude_local": true,
      "m3u8_only": true
    },
    "generation_stats": {
      "api_channels": 37908,
      "api_streams": 13962,
      "filtered_by_criteria": 37367,
      "matched_unique": 533
    },
    "validation": {
      "total": 533,
      "valid": 421,
      "invalid": 112,
      "duration_seconds": 45
    },
    "duration_seconds": 52
  }
}
```

**Error (500)**:

```json
{
  "error": "Generation failed: Unable to fetch channel data"
}
```

### Example Requests

#### Using a Profile

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/generate \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "us-sports",
    "skipValidation": false
  }'
```

#### Custom Filters

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/generate \
  -H "Content-Type: application/json" \
  -d '{
    "countries": ["US", "CA"],
    "categories": ["sports", "news"],
    "excludeLocal": true,
    "m3u8Only": true,
    "timeout": 15,
    "parallel": 20
  }'
```

#### Fast Generation (No Validation)

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/generate \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "us-all",
    "skipValidation": true
  }'
```

### Timeout

**Max Duration**: 300 seconds (5 minutes)

If validation is enabled and the channel list is large, the request may timeout. Use `skipValidation: true` for faster results, then validate separately.

---

## Validate Channels

Validate an existing channel file by testing all stream URLs.

### Endpoint

```
POST /api/iptv/validate
```

### Request

**Content-Type**: `multipart/form-data`

### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Channel JSON file to validate |
| `timeout` | number | No | Timeout per stream (seconds), default: 10 |
| `parallel` | number | No | Parallel checks, default: 10 |
| `retry` | number | No | Retry attempts, default: 2 |

### Response

**Success (200)**:

```json
{
  "success": true,
  "filename": "channels-validated-1698765432123.json",
  "metadata": {
    "source": "validation-workflow",
    "generated_at": "2025-11-01T10:45:00.000Z",
    "original_file": "channels.json",
    "total_channels": 320,
    "validation": {
      "total": 500,
      "valid": 320,
      "invalid": 180,
      "duration_seconds": 120
    },
    "validation_config": {
      "timeout": 10,
      "parallel": 10,
      "retry": 2
    }
  }
}
```

**Error (400)**:

```json
{
  "error": "No file uploaded"
}
```

**Error (400)**:

```json
{
  "error": "Invalid channel file format"
}
```

### Example Request

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/validate \
  -F "file=@channels.json" \
  -F "timeout=15" \
  -F "parallel=20" \
  -F "retry=3"
```

### File Requirements

The uploaded JSON file must have this structure:

```json
{
  "channels": [
    {
      "name": "Channel Name",
      "streamURL": "https://example.com/stream.m3u8"
    }
  ]
}
```

### Timeout

**Max Duration**: 600 seconds (10 minutes)

---

## Merge Channels

Merge multiple channel files with deduplication.

### Endpoint

```
POST /api/iptv/merge
```

### Request Body

```json
{
  "files": [
    "channels-1.json",
    "channels-2.json",
    "channels-3.json"
  ],
  "dedupeBy": "streamURL",
  "skipValidation": false,
  "timeout": 10,
  "parallel": 10,
  "retry": 2
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `files` | string[] | Yes | - | Array of filenames to merge (min: 2) |
| `dedupeBy` | string | No | "streamURL" | Deduplication method: "streamURL", "name", or "both" |
| `skipValidation` | boolean | No | false | Skip validation after merge |
| `timeout` | number | No | 10 | Validation timeout (if enabled) |
| `parallel` | number | No | 10 | Parallel validation checks (if enabled) |
| `retry` | number | No | 2 | Retry attempts (if enabled) |

### Deduplication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `streamURL` | Remove channels with duplicate stream URLs | Recommended for most cases |
| `name` | Remove channels with duplicate names | Keep one version of each channel |
| `both` | Remove if either URL or name matches | Strictest deduplication |

### Response

**Success (200)**:

```json
{
  "success": true,
  "filename": "channels-merged-1698765432123.json",
  "metadata": {
    "source": "merge-workflow",
    "generated_at": "2025-11-01T11:00:00.000Z",
    "total_channels": 850,
    "merge_stats": {
      "source_files": [
        "channels-1.json",
        "channels-2.json",
        "channels-3.json"
      ],
      "total_loaded": 1050,
      "after_deduplication": 950,
      "duplicates_removed": 100,
      "dedupe_method": "streamURL"
    },
    "validation": {
      "total": 950,
      "valid": 850,
      "invalid": 100,
      "duration_seconds": 180
    },
    "duration_seconds": 195
  }
}
```

**Error (400)**:

```json
{
  "error": "At least 2 files are required for merging"
}
```

**Error (400)**:

```json
{
  "error": "Invalid filename"
}
```

### Example Requests

#### Basic Merge

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/merge \
  -H "Content-Type: application/json" \
  -d '{
    "files": ["us-sports.json", "us-news.json"],
    "dedupeBy": "streamURL"
  }'
```

#### Merge Without Validation

```bash
curl -X POST https://backoffice.telegames.ai/api/iptv/merge \
  -H "Content-Type: application/json" \
  -d '{
    "files": ["file1.json", "file2.json", "file3.json"],
    "dedupeBy": "both",
    "skipValidation": true
  }'
```

### Timeout

**Max Duration**: 600 seconds (10 minutes)

---

## Download File

Download a generated channel file.

### Endpoint

```
GET /api/iptv/download?file=<filename>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | string | Yes | Filename to download |

### Response

**Success (200)**:

Returns the JSON file with appropriate headers:

```http
Content-Type: application/json
Content-Disposition: attachment; filename="channels.json"
```

**Error (400)**:

```json
{
  "error": "Filename is required"
}
```

**Error (400)**:

```json
{
  "error": "Invalid filename"
}
```

**Error (404)**:

```json
{
  "error": "File not found"
}
```

### Example Request

```bash
curl -O https://backoffice.telegames.ai/api/iptv/download?file=channels-1698765432123.json
```

### Security

- Filenames are validated to prevent path traversal attacks
- Only `.json` files can be downloaded
- Files must exist in `/public/iptv-output/`

---

## List Files

Get a list of all generated channel files.

### Endpoint

```
GET /api/iptv/files
```

### Response

**Success (200)**:

```json
[
  {
    "filename": "channels-1698765432123.json",
    "size": 2458432,
    "created": "2025-11-01T10:30:00.000Z",
    "channelCount": 421
  },
  {
    "filename": "channels-validated-1698765455555.json",
    "size": 1923456,
    "created": "2025-11-01T10:45:00.000Z",
    "channelCount": 320
  },
  {
    "filename": "channels-merged-1698765499999.json",
    "size": 3876543,
    "created": "2025-11-01T11:00:00.000Z",
    "channelCount": 850
  }
]
```

**Error (500)**:

```json
{
  "error": "Failed to list files"
}
```

### Example Request

```bash
curl https://backoffice.telegames.ai/api/iptv/files
```

### File Object

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Name of the file |
| `size` | number | File size in bytes |
| `created` | string | ISO 8601 timestamp |
| `channelCount` | number | Number of channels in file |

### Sorting

Files are sorted by creation date, newest first.

---

## Delete File

Delete a generated channel file.

### Endpoint

```
DELETE /api/iptv/files?file=<filename>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | string | Yes | Filename to delete |

### Response

**Success (200)**:

```json
{
  "success": true
}
```

**Error (400)**:

```json
{
  "error": "Filename required"
}
```

**Error (400)**:

```json
{
  "error": "Invalid filename"
}
```

**Error (400)**:

```json
{
  "error": "Only JSON files can be deleted"
}
```

**Error (500)**:

```json
{
  "error": "Failed to delete file"
}
```

### Example Request

```bash
curl -X DELETE https://backoffice.telegames.ai/api/iptv/files?file=channels-1698765432123.json
```

### Security

- Filenames are validated to prevent path traversal
- Only `.json` files can be deleted
- Files must exist in `/public/iptv-output/`
- Deletion is permanent and cannot be undone

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or request body |
| 401 | Unauthorized | Authentication required |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error during processing |

### Error Response Format

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### Common Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Unauthorized" | No valid session | Log in to the application |
| "Invalid filename" | Filename contains `..` or `/` | Use valid filename |
| "File not found" | File doesn't exist | Check filename and try again |
| "No file uploaded" | Missing file in validation | Include file in form data |
| "Invalid channel file format" | Missing `channels` array | Ensure file has correct structure |
| "At least 2 files are required" | Merge with < 2 files | Select at least 2 files |
| "Generation failed" | API error or timeout | Retry or adjust parameters |

---

## Rate Limits

### Current Implementation

**No rate limiting is currently implemented.**

### Recommended Limits

For production deployment, implement these rate limits:

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/iptv/generate` | 10 requests | 1 hour | Resource-intensive operation |
| `/api/iptv/validate` | 5 requests | 1 hour | Very resource-intensive |
| `/api/iptv/merge` | 20 requests | 1 hour | Moderate resource usage |
| `/api/iptv/download` | 100 requests | 1 hour | Low resource usage |
| `/api/iptv/files` | 100 requests | 1 hour | Low resource usage |

### Implementation Suggestion

Use a Redis-based rate limiter:

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many requests, please try again later' }
});
```

---

## Best Practices

### 1. Use Appropriate Timeouts

```javascript
// For quick testing
{ "timeout": 5, "parallel": 30, "skipValidation": true }

// For production
{ "timeout": 15, "parallel": 15, "retry": 3 }
```

### 2. Handle Long-Running Operations

```javascript
// Generate without validation first
const response = await fetch('/api/iptv/generate', {
  method: 'POST',
  body: JSON.stringify({ profile: 'us-all', skipValidation: true })
});

// Then validate separately
const validateResponse = await fetch('/api/iptv/validate', {
  method: 'POST',
  body: formData // with the generated file
});
```

### 3. Error Handling

```javascript
try {
  const response = await fetch('/api/iptv/generate', { ... });

  if (!response.ok) {
    const error = await response.json();
    console.error('Generation failed:', error.error);
    return;
  }

  const result = await response.json();
  console.log('Success:', result.filename);
} catch (error) {
  console.error('Network error:', error);
}
```

### 4. Progress Tracking

For long-running operations, implement polling:

```javascript
// Start generation
const { jobId } = await startGeneration();

// Poll for status
const interval = setInterval(async () => {
  const status = await checkStatus(jobId);

  if (status.complete) {
    clearInterval(interval);
    console.log('Complete:', status.result);
  }
}, 5000);
```

---

**Last Updated**: November 1, 2025
**API Version**: 2.0
