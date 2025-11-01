# IPTV Channel Manager - Backoffice Integration

## ✅ Integration Complete

The IPTV Channel Manager has been successfully integrated into the Telegamez Backoffice as a new app.

## 📍 Access

**URL**: `http://localhost:3100/apps/iptv-channels`

## 🎯 What Was Added

### 1. New App Directory
```
/src/app/apps/iptv-channels/
├── page.tsx           # Server component with auth
├── page-client.tsx    # Client UI with forms and status
└── README.md          # App documentation
```

### 2. API Routes
```
/src/app/api/iptv/
├── generate/
│   └── route.ts      # POST /api/iptv/generate
└── download/
    └── route.ts      # GET /api/iptv/download?file=...
```

### 3. Core Logic
```
/src/lib/iptv/
└── generator.ts      # Channel generation logic
```

### 4. Output Directory
```
/public/iptv-output/  # Generated JSON files stored here
```

## 🚀 Quick Start

### 1. Install Dependency

```bash
cd /opt/factory/backoffice
pnpm install iptv-checker
```

### 2. Start the Dev Server

```bash
pnpm dev
```

### 3. Access the App

Navigate to: `http://localhost:3100/apps/iptv-channels`

## 🎨 Features

### Quick Profiles Tab
- **US All**: All US channels (no local affiliates)
- **US Sports**: US sports channels only
- **US Entertainment**: Movies, music, comedy
- **US News**: News channels (no local)
- **US Family**: Kids, education, religious
- **North America**: US + Canada + Mexico

### Custom Filters Tab
- Filter by countries (comma-separated)
- Filter by categories (comma-separated)
- Exclude local affiliate channels
- M3U8 streams only option
- Skip validation toggle
- Validation settings sliders:
  - Timeout (5-30 seconds)
  - Parallel checks (1-20)
  - Retry attempts (1-5)

### Status Display
- Real-time generation progress
- Success/failure indicators
- Channel statistics
- Download button for results
- Recent jobs history

## 📊 How It Works

```
User clicks "Generate"
        ↓
POST /api/iptv/generate
        ↓
Generate channels from IPTV-org API
  - Fetch 37,000+ channels
  - Apply filters
  - Match with streams
  - Deduplicate
        ↓
Save to /public/iptv-output/channels-[timestamp].json
        ↓
Return results to UI
        ↓
User downloads JSON
```

## 🔐 Security

- ✅ Authentication required (uses backoffice auth)
- ✅ Filename validation (prevents path traversal)
- ✅ Output directory restricted to `/public/iptv-output/`
- ✅ User session validation on all routes

## ⚙️ Configuration

### API Timeout
Maximum generation time: 5 minutes (300 seconds)

```typescript
export const maxDuration = 300;
```

### Available Profiles

```typescript
'us-all': All US channels (no local affiliates)
'us-sports': US sports channels only
'us-entertainment': Entertainment, movies, music, comedy
'us-news': US news channels (no local affiliates)
'us-family': Kids, education, religious
'north-america': US + Canada + Mexico channels
```

### Default Settings
- Timeout: 10 seconds
- Parallel: 10 simultaneous checks
- Retry: 2 attempts per stream
- M3U8 Only: Enabled
- Skip Validation: Disabled

## 📝 Output Format

Generated JSON files include:

```json
{
  "metadata": {
    "source": "master-channels-workflow",
    "generated_at": "ISO timestamp",
    "profile": "us-sports",
    "total_channels": 421,
    "configuration": {
      "countries": ["US"],
      "categories": ["sports"],
      "exclude_local": false,
      "m3u8_only": true
    },
    "generation_stats": {
      "api_channels": 37908,
      "api_streams": 13962,
      "filtered_by_criteria": 37367,
      "matched_unique": 533
    },
    "validation": "skipped" | {
      "total": 533,
      "valid": 421,
      "invalid": 112
    }
  },
  "channels": [
    {
      "number": 1,
      "name": "ESPN",
      "current_program": "Live Programming",
      "logo": "/logos/default.png",
      "Language": "English (US)",
      "Category": "Sports",
      "streamURL": "https://example.com/stream.m3u8"
    }
  ]
}
```

## 🎯 Use Cases

### 1. Quick Sports Channels
1. Go to Quick Profiles tab
2. Click "Generate" on "US Sports"
3. Wait ~30-60 seconds
4. Download `channels-*.json`

### 2. Custom Multi-Category
1. Go to Custom Filters tab
2. Enter: Countries: `US`, Categories: `sports,news,cooking`
3. Enable "Exclude local affiliates"
4. Enable "M3U8 streams only"
5. Click "Generate Channels"
6. Download result

### 3. Fast Testing (No Validation)
1. Go to any tab
2. Check "Skip validation"
3. Generate (completes in ~5-10 seconds)
4. Download unvalidated list

## 🔧 Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged into the backoffice

### Issue: Generation takes too long
**Solution**: Enable "Skip validation" for faster results

### Issue: Too few channels
**Solution**:
- Check your filters aren't too restrictive
- Try removing "Exclude local" option
- Add more categories

### Issue: Can't download file
**Solution**: Check browser console for errors, ensure the generation completed successfully

## 📚 Related Documentation

- Original IPTV tools: `/opt/telegamez/livestream/`
- Complete docs: `/opt/telegamez/livestream/MASTER-CHANNELS.md`
- API reference: `/src/app/apps/iptv-channels/README.md`

## 🚀 Next Steps

1. **Install dependency**: `pnpm install iptv-checker`
2. **Test the app**: Navigate to `/apps/iptv-channels`
3. **Generate channels**: Try a quick profile
4. **Download and use**: Integrate the JSON in your application

## 💡 Tips

- Use "Skip validation" during testing to save time
- The "US Sports" profile is a good starting point
- Downloaded files are in `/public/iptv-output/`
- You can manually validate files using the CLI tools in `/opt/telegamez/livestream/`

---

**Integration Date**: November 1, 2025
**Location**: `/opt/factory/backoffice/src/app/apps/iptv-channels`
**Status**: ✅ Ready to use
