# IPTV Channel Manager App

## Overview

Integrated IPTV channel management tool within the Telegamez backoffice. Generate, filter, and validate IPTV channels from the IPTV-org database (37,000+ channels).

## Features

- **Quick Profiles**: Pre-configured channel sets for common use cases
  - All US Channels
  - US Sports
  - US Entertainment
  - US News
  - US Family
  - North America (US + CA + MX)

- **Custom Filters**: Build your own channel sets
  - Filter by countries
  - Filter by categories
  - Exclude local affiliates
  - M3U8 only option
  - Skip validation for faster generation

- **Real-time Status**: Monitor generation progress
- **Download Results**: Get JSON files with validated channels

## Access

Navigate to: `/apps/iptv-channels`

## Usage

### Quick Profile Generation

1. Go to the "Quick Profiles" tab
2. Click "Generate" on any profile
3. Wait for completion
4. Download the JSON file

### Custom Filter Generation

1. Go to the "Custom Filters" tab
2. Enter countries (comma-separated): `US,CA,GB`
3. Enter categories (comma-separated): `sports,news,movies`
4. Configure options:
   - Exclude local affiliates
   - M3U8 only
   - Skip validation (for faster results)
5. Adjust validation settings if needed
6. Click "Generate Channels"
7. Download the result

## API Endpoints

### Generate Channels

```
POST /api/iptv/generate
```

**Body:**
```json
{
  "profile": "us-sports",
  "skipValidation": false,
  "timeout": 10,
  "parallel": 10,
  "retry": 2
}
```

Or custom:
```json
{
  "countries": ["US", "CA"],
  "categories": ["sports", "news"],
  "excludeLocal": true,
  "m3u8Only": true,
  "skipValidation": false
}
```

### Download File

```
GET /api/iptv/download?file=channels-1234567890.json
```

## Output Format

```json
{
  "metadata": {
    "source": "master-channels-workflow",
    "generated_at": "2025-11-01T...",
    "profile": "us-sports",
    "total_channels": 421,
    "generation_stats": {
      "api_channels": 37908,
      "matched_unique": 533
    }
  },
  "channels": [
    {
      "number": 1,
      "name": "ESPN",
      "streamURL": "https://...",
      "Category": "Sports",
      "Language": "English (US)"
    }
  ]
}
```

## Notes

- Authentication required (uses backoffice auth)
- Generated files stored in `/public/iptv-output/`
- Maximum generation time: 5 minutes
- Validation is skipped in web UI for performance
- Download files and validate separately if needed

## Development

Files:
- `/src/app/apps/iptv-channels/page.tsx` - Server component
- `/src/app/apps/iptv-channels/page-client.tsx` - Client UI
- `/src/app/api/iptv/generate/route.ts` - Generation API
- `/src/app/api/iptv/download/route.ts` - Download API
- `/src/lib/iptv/generator.ts` - Core generation logic
