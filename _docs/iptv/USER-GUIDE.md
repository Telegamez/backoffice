# IPTV Channel Manager - User Guide

A comprehensive guide to using the IPTV Channel Manager for generating, validating, and managing IPTV channel lists.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Using the GUI](#using-the-gui)
3. [Using the CLI](#using-the-cli)
4. [Understanding Channel Files](#understanding-channel-files)
5. [Best Practices](#best-practices)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Access to Telegamez Backoffice
- Valid authentication credentials
- (For CLI) Node.js installed

### Accessing the Application

**GUI Access:**
```
https://backoffice.telegames.ai/apps/iptv-channels
```

**CLI Access:**
```bash
cd /opt/factory/backoffice
node scripts/iptv/generate.js --help
```

## Using the GUI

The GUI provides five main tabs for different operations:

### 1. Profiles Tab

**Purpose**: Quick generation using pre-configured channel profiles.

**Available Profiles**:

| Profile | Description | Est. Channels |
|---------|-------------|---------------|
| **US All** | All US channels (no local affiliates) | 5,000-7,000 |
| **US Sports** | US sports channels only | 400-600 |
| **US Entertainment** | Movies, music, comedy | 800-1,200 |
| **US News** | News channels (no local) | 200-400 |
| **US Family** | Kids, education, religious | 300-500 |
| **North America** | US + Canada + Mexico | 8,000-10,000 |

**How to Use**:

1. Click on the **Profiles** tab
2. Choose a profile that matches your needs
3. Click **Generate** button
4. Wait for processing (30-60 seconds)
5. Download the generated JSON file

**Example**: Generate US Sports Channels
```
1. Click "Profiles" tab
2. Find "US Sports" profile
3. Click "Generate"
4. Wait for completion
5. Click "Download JSON"
```

### 2. Custom Tab

**Purpose**: Create custom channel lists with specific filters.

**Configuration Options**:

- **Countries**: Comma-separated country codes (e.g., `US,CA,GB`)
- **Categories**: Comma-separated categories (e.g., `sports,news,movies`)
- **Exclude Local**: Remove local affiliate channels
- **M3U8 Only**: Only include M3U8 format streams
- **Skip Validation**: Faster generation without stream testing

**Validation Settings** (when enabled):
- **Timeout**: 5-30 seconds per stream
- **Parallel Checks**: 1-20 simultaneous tests
- **Retry Attempts**: 1-5 retries per stream

**Example**: Generate UK Sports and News Channels
```
Countries: GB
Categories: sports,news
✓ Exclude local affiliate channels
✓ M3U8 streams only
☐ Skip validation
Timeout: 10s
Parallel: 15
Retry: 2
```

### 3. Validate Tab

**Purpose**: Test existing channel files and remove non-working streams.

**How to Use**:

1. Click the **Validate** tab
2. Click "Upload Channel File" and select a JSON file
3. Adjust validation settings:
   - **Timeout**: How long to wait per stream
   - **Parallel**: How many streams to test simultaneously
   - **Retry**: How many times to retry failed streams
4. Click **Validate Streams**
5. Wait for completion (varies by file size)
6. Download the validated file

**What Happens**:
- Each stream URL is tested
- Working streams → kept in output
- Dead streams → removed from output
- Channels renumbered sequentially

**Example**: Validate a 500-Channel File
```
Upload: my-channels.json (500 channels)
Timeout: 15s
Parallel: 20
Retry: 2

Expected Time: ~15-20 minutes
Expected Result: 300-400 working channels
```

### 4. Merge Tab

**Purpose**: Combine multiple channel files and remove duplicates.

**How to Use**:

1. Click the **Merge** tab
2. Select 2 or more files from the list
3. Choose deduplication method:
   - **Stream URL** (recommended): Removes duplicate URLs
   - **Channel Name**: Removes channels with same name
   - **Both**: Strictest deduplication
4. Optionally check "Skip validation after merge"
5. Click **Merge Files**
6. Download the merged result

**Deduplication Methods**:

| Method | Description | Use Case |
|--------|-------------|----------|
| **Stream URL** | Remove identical URLs | Most common, keeps unique streams |
| **Channel Name** | Remove identical names | Keep one version of each channel |
| **Both** | Must match URL AND name | Strictest, prevents any duplicates |

**Example**: Merge Sports and News Files
```
Select Files:
  ✓ us-sports.json (450 channels)
  ✓ us-news.json (300 channels)
  ✓ uk-sports.json (200 channels)

Deduplicate By: Stream URL
☐ Skip validation after merge

Result: ~850 unique channels (after removing ~100 duplicates)
```

### 5. Files Tab

**Purpose**: Manage all generated channel files.

**Features**:
- View all generated files
- See file details (size, channel count, date)
- Download any file
- Delete unwanted files
- Refresh file list

**File Information Displayed**:
- Filename
- Number of channels
- File size
- Creation date

**Actions**:
- 📥 **Download**: Download the JSON file
- 🗑️ **Delete**: Permanently remove the file

## Using the CLI

### Generate Command

**Purpose**: Generate channels from command line.

**Basic Usage**:
```bash
node scripts/iptv/generate.js --profile=PROFILE_NAME
```

**Available Options**:
```bash
--profile=NAME           # Use predefined profile
--countries=US,CA,GB     # Filter by countries
--categories=sports,news # Filter by categories
--exclude-local          # Exclude local affiliates
--m3u8-only             # Only M3U8 streams
--skip-validation       # Skip stream validation
--timeout=10            # Validation timeout (seconds)
--parallel=10           # Parallel validation checks
--retry=2               # Retry attempts per stream
--output=filename.json  # Custom output filename
```

**Examples**:

```bash
# Generate US sports channels
node scripts/iptv/generate.js --profile=us-sports

# Generate custom UK sports and news
node scripts/iptv/generate.js \
  --countries=GB \
  --categories=sports,news \
  --m3u8-only \
  --output=uk-sports-news.json

# Fast generation (no validation)
node scripts/iptv/generate.js \
  --profile=us-all \
  --skip-validation

# Thorough validation
node scripts/iptv/generate.js \
  --profile=us-sports \
  --timeout=20 \
  --parallel=15 \
  --retry=3
```

### Validate Command

**Purpose**: Validate existing channel files.

**Basic Usage**:
```bash
node scripts/iptv/validate.js INPUT_FILE.json
```

**Available Options**:
```bash
--output=filename.json  # Custom output filename
--timeout=10           # Timeout per stream (seconds)
--parallel=10          # Parallel checks
--retry=2              # Retry attempts
```

**Examples**:

```bash
# Basic validation
node scripts/iptv/validate.js channels.json

# Custom output and aggressive validation
node scripts/iptv/validate.js channels.json \
  --output=validated-channels.json \
  --timeout=20 \
  --parallel=20 \
  --retry=3

# Fast validation
node scripts/iptv/validate.js channels.json \
  --timeout=5 \
  --parallel=30 \
  --retry=1
```

### Merge Command

**Purpose**: Merge multiple channel files.

**Basic Usage**:
```bash
node scripts/iptv/merge.js file1.json file2.json file3.json
```

**Available Options**:
```bash
--output=filename.json     # Custom output filename
--dedupe-by=METHOD        # streamURL, name, or both
--skip-validation         # Skip validation after merge
--timeout=10              # Validation timeout (if enabled)
--parallel=10             # Parallel checks (if enabled)
--retry=2                 # Retry attempts (if enabled)
```

**Examples**:

```bash
# Basic merge
node scripts/iptv/merge.js us-sports.json us-news.json

# Merge all JSON files in directory
node scripts/iptv/merge.js *.json \
  --output=master-channels.json

# Merge with strict deduplication
node scripts/iptv/merge.js file1.json file2.json file3.json \
  --dedupe-by=both \
  --output=unique-channels.json

# Fast merge (no validation)
node scripts/iptv/merge.js file1.json file2.json \
  --skip-validation \
  --output=merged.json
```

## Understanding Channel Files

### File Structure

```json
{
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

### Metadata Fields

| Field | Description |
|-------|-------------|
| `source` | Generation method (profile, custom, merge, validate) |
| `generated_at` | ISO timestamp of generation |
| `profile` | Profile used (if applicable) |
| `total_channels` | Final channel count |
| `configuration` | Filters and settings used |
| `generation_stats` | Statistics from IPTV-org API |
| `validation` | Validation results (if performed) |

### Channel Fields

| Field | Description | Example |
|-------|-------------|---------|
| `number` | Channel number | `1` |
| `name` | Channel name | `"ESPN"` |
| `current_program` | Program info | `"Live Programming"` |
| `logo` | Logo path | `"/logos/default.png"` |
| `Language` | Language | `"English (US)"` |
| `Category` | Category | `"Sports"` |
| `streamURL` | Stream URL | `"https://.../.m3u8"` |

## Best Practices

### For Generation

1. **Start with Profiles**: Use predefined profiles for common needs
2. **Use M3U8 Only**: M3U8 format is most reliable
3. **Exclude Local Channels**: Unless specifically needed
4. **Skip Validation for Testing**: Speeds up initial generation
5. **Validate in Production**: Always validate for production use

### For Validation

1. **Adjust Timeout**: Increase for slow connections
2. **Balance Parallel Checks**: More parallel = faster, but higher load
3. **Use Retries**: Accounts for temporary failures
4. **Validate Periodically**: Streams go dead over time
5. **Save Validated Files**: Keep validated versions separate

### For Merging

1. **Use Stream URL Deduplication**: Most reliable method
2. **Validate After Merge**: Ensures final quality
3. **Organize Source Files**: Name files clearly before merging
4. **Check Channel Counts**: Verify expected totals
5. **Keep Source Files**: Don't delete originals immediately

### Performance Tips

| Scenario | Settings | Est. Time |
|----------|----------|-----------|
| Quick Test | skip-validation=true | 5-10s |
| Fast Validation | timeout=5, parallel=30 | 30-60s |
| Balanced | timeout=10, parallel=15 | 1-3 min |
| Thorough | timeout=20, parallel=10, retry=3 | 5-10 min |

## Common Workflows

### Workflow 1: Quick Sports Package

**Goal**: Generate a curated sports channel package.

```bash
# Step 1: Generate US sports
node scripts/iptv/generate.js --profile=us-sports --skip-validation

# Step 2: Validate thoroughly
node scripts/iptv/validate.js channels-*.json \
  --timeout=15 \
  --parallel=20 \
  --output=us-sports-validated.json

# Result: High-quality sports channel list
```

### Workflow 2: Multi-Country News Package

**Goal**: Combine news channels from multiple countries.

```bash
# Step 1: Generate US news
node scripts/iptv/generate.js \
  --countries=US \
  --categories=news \
  --exclude-local \
  --output=us-news.json

# Step 2: Generate UK news
node scripts/iptv/generate.js \
  --countries=GB \
  --categories=news \
  --output=uk-news.json

# Step 3: Generate CA news
node scripts/iptv/generate.js \
  --countries=CA \
  --categories=news \
  --output=ca-news.json

# Step 4: Merge all
node scripts/iptv/merge.js \
  us-news.json uk-news.json ca-news.json \
  --output=world-news.json

# Result: Comprehensive international news package
```

### Workflow 3: Complete Entertainment Package

**Goal**: Create a comprehensive entertainment package.

**Using GUI**:

1. Generate US Entertainment (Profiles tab)
2. Generate US Movies (Custom tab: countries=US, categories=movies)
3. Generate US Music (Custom tab: countries=US, categories=music)
4. Go to Merge tab
5. Select all three files
6. Choose "Stream URL" deduplication
7. Merge files
8. Download result

### Workflow 4: Periodic Validation

**Goal**: Keep channel lists updated.

```bash
# Weekly validation script
#!/bin/bash

# Validate all channel files
for file in *.json; do
  echo "Validating $file..."
  node scripts/iptv/validate.js "$file" \
    --timeout=15 \
    --parallel=20 \
    --output="validated-$file"
done

echo "Validation complete!"
```

## Troubleshooting

### Issue: Generation Takes Too Long

**Symptoms**: Generation doesn't complete or takes >10 minutes

**Solutions**:
1. Enable "Skip validation" for faster generation
2. Reduce parallel checks
3. Increase timeout value
4. Use smaller country/category filters

### Issue: Too Few Channels Generated

**Symptoms**: Expected more channels in result

**Solutions**:
1. Check your filters aren't too restrictive
2. Remove "Exclude local" option
3. Disable "M3U8 only" to include all formats
4. Try broader category selections
5. Verify country codes are correct

### Issue: High Invalid Channel Count

**Symptoms**: Many channels fail validation

**Possible Causes**:
- Timeout too short
- Network issues
- Upstream source problems
- Geographic restrictions

**Solutions**:
1. Increase timeout to 20-30 seconds
2. Add retry attempts (3-5)
3. Reduce parallel checks (5-10)
4. Try validation at different times

### Issue: Validation Fails

**Symptoms**: Validation errors or crashes

**Solutions**:
1. Check file format is valid JSON
2. Ensure channels array exists
3. Verify streamURL fields are present
4. Check available memory
5. Reduce parallel validation

### Issue: Merge Creates Too Many Duplicates

**Symptoms**: Merged file has duplicate channels

**Solutions**:
1. Use "Stream URL" deduplication (most reliable)
2. Check source files for quality
3. Use "Both" deduplication for strictest removal
4. Manually review file before merging

### Issue: Can't Access GUI

**Symptoms**: IPTV app not showing in backoffice

**Solutions**:
1. Verify you're logged in
2. Check app is enabled in applications.ts
3. Restart development server
4. Clear browser cache
5. Check console for errors

## Getting Help

If you encounter issues not covered here:

1. Check the [API Reference](./API-REFERENCE.md)
2. Review [Architecture Documentation](./ARCHITECTURE.md)
3. Consult [CLI Reference](./CLI-REFERENCE.md)
4. Contact the development team

---

**Last Updated**: November 1, 2025
