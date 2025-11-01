# IPTV Channel Manager - CLI Reference

Complete command-line interface documentation for the IPTV Channel Manager CLI tools.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Generate Command](#generate-command)
4. [Validate Command](#validate-command)
5. [Merge Command](#merge-command)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

## Overview

The IPTV Channel Manager provides three CLI tools that use the same backend logic as the GUI:

| Script | Purpose | Location |
|--------|---------|----------|
| `generate.js` | Generate channel lists | `scripts/iptv/generate.js` |
| `validate.js` | Validate stream URLs | `scripts/iptv/validate.js` |
| `merge.js` | Merge multiple files | `scripts/iptv/merge.js` |

### Why Use CLI?

- **Automation**: Integrate into scripts and cron jobs
- **Batch Processing**: Process multiple files at once
- **CI/CD**: Use in build pipelines
- **Remote Execution**: Run on servers without GUI
- **Scripting**: Combine with other tools

## Installation

### Prerequisites

```bash
# Node.js 20.x or higher
node --version

# Navigate to backoffice directory
cd /opt/factory/backoffice

# Ensure dependencies are installed
pnpm install
```

### Verify Installation

```bash
# Test each script
node scripts/iptv/generate.js --help
node scripts/iptv/validate.js --help
node scripts/iptv/merge.js --help
```

---

## Generate Command

Generate IPTV channel lists with custom filters or predefined profiles.

### Synopsis

```bash
node scripts/iptv/generate.js [OPTIONS]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--profile=NAME` | string | - | Use predefined profile |
| `--countries=LIST` | string | - | Comma-separated country codes |
| `--categories=LIST` | string | - | Comma-separated categories |
| `--exclude-local` | flag | false | Exclude local affiliate channels |
| `--m3u8-only` | flag | false | Only include M3U8 streams |
| `--skip-validation` | flag | false | Skip stream validation (faster) |
| `--timeout=N` | number | 10 | Validation timeout (seconds) |
| `--parallel=N` | number | 10 | Parallel validation checks |
| `--retry=N` | number | 2 | Retry attempts per stream |
| `--output=FILE` | string | auto | Custom output filename |

### Available Profiles

| Profile | Description | Est. Channels |
|---------|-------------|---------------|
| `us-all` | All US channels (no local affiliates) | 5,000-7,000 |
| `us-sports` | US sports channels only | 400-600 |
| `us-entertainment` | Entertainment, movies, music | 800-1,200 |
| `us-news` | News channels (no local) | 200-400 |
| `us-family` | Kids, education, religious | 300-500 |
| `north-america` | US + Canada + Mexico | 8,000-10,000 |

### Examples

#### Use a Profile

```bash
# Generate US sports channels
node scripts/iptv/generate.js --profile=us-sports

# Generate with custom filename
node scripts/iptv/generate.js \
  --profile=us-sports \
  --output=my-sports-channels.json
```

#### Custom Filters

```bash
# US sports and news
node scripts/iptv/generate.js \
  --countries=US \
  --categories=sports,news \
  --m3u8-only

# Multi-country sports
node scripts/iptv/generate.js \
  --countries=US,CA,GB \
  --categories=sports \
  --exclude-local \
  --m3u8-only
```

#### Fast Generation (No Validation)

```bash
# Skip validation for quick results
node scripts/iptv/generate.js \
  --profile=us-all \
  --skip-validation
```

#### Thorough Validation

```bash
# Aggressive validation settings
node scripts/iptv/generate.js \
  --profile=us-sports \
  --timeout=20 \
  --parallel=15 \
  --retry=3
```

### Output

```
🎬 IPTV Channel Generator

Configuration: {
  "profile": "us-sports",
  "countries": ["US"],
  "categories": ["sports"],
  "excludeLocal": false,
  "m3u8Only": true,
  "skipValidation": false,
  "timeout": 10,
  "parallel": 10,
  "retry": 2
}

[IPTV] Starting channel generation: {...}
[IPTV] Fetching channels...
[IPTV] Found 37908 channels
[IPTV] Fetching streams...
[IPTV] Found 13962 streams
[IPTV] Filtering and matching channels...
[IPTV] Filtered: 37367, No stream: 8, Matched: 533

✅ Generation complete!
📊 Statistics:
   - Total channels: 421
   - Duration: 52s
   - Output: /opt/factory/backoffice/public/iptv-output/channels-1698765432123.json
   - Valid: 421
   - Invalid: 112
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (missing parameters, API failure, etc.) |

---

## Validate Command

Validate stream URLs in an existing channel file.

### Synopsis

```bash
node scripts/iptv/validate.js <INPUT_FILE> [OPTIONS]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `INPUT_FILE` | Yes | Path to channel JSON file |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--output=FILE` | string | auto | Custom output filename |
| `--timeout=N` | number | 10 | Timeout per stream (seconds) |
| `--parallel=N` | number | 10 | Parallel checks |
| `--retry=N` | number | 2 | Retry attempts |

### Examples

#### Basic Validation

```bash
# Validate with defaults
node scripts/iptv/validate.js channels.json

# Custom output
node scripts/iptv/validate.js channels.json \
  --output=validated-channels.json
```

#### Fast Validation

```bash
# Quick validation (may miss some valid streams)
node scripts/iptv/validate.js channels.json \
  --timeout=5 \
  --parallel=30 \
  --retry=1
```

#### Thorough Validation

```bash
# Comprehensive validation
node scripts/iptv/validate.js channels.json \
  --timeout=20 \
  --parallel=15 \
  --retry=3 \
  --output=thoroughly-validated.json
```

#### Validate Multiple Files

```bash
# Bash script to validate all JSON files
for file in *.json; do
  echo "Validating $file..."
  node scripts/iptv/validate.js "$file" \
    --timeout=15 \
    --output="validated-$file"
done
```

### Output

```
🔍 IPTV Stream Validator

📋 Loaded 533 channels from channels.json
⚙️  Config: timeout=10s, parallel=10, retry=2

🚀 Starting validation...

⏳ Progress: 100% (533/533) - Valid: 421, Invalid: 112

✅ Validation complete!
📊 Results:
   - Total tested: 533
   - Valid: 421
   - Invalid: 112
   - Duration: 120s
   - Output: /opt/factory/backoffice/public/iptv-output/channels-validated-1698765432123.json
```

### Validation Process

1. Parse input JSON file
2. Extract channel list
3. Test each stream URL via HTTP HEAD request
4. Retry failed streams (per retry setting)
5. Filter to valid channels only
6. Renumber channels sequentially
7. Save validated file

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (invalid file, no channels, etc.) |

---

## Merge Command

Merge multiple channel files with deduplication.

### Synopsis

```bash
node scripts/iptv/merge.js <FILE1> <FILE2> [FILE3...] [OPTIONS]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `FILE1, FILE2, ...` | Yes (min 2) | Channel JSON files to merge |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--output=FILE` | string | auto | Custom output filename |
| `--dedupe-by=METHOD` | string | streamURL | Deduplication method |
| `--skip-validation` | flag | false | Skip validation after merge |
| `--timeout=N` | number | 10 | Validation timeout (if enabled) |
| `--parallel=N` | number | 10 | Parallel checks (if enabled) |
| `--retry=N` | number | 2 | Retry attempts (if enabled) |

### Deduplication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `streamURL` | Remove duplicate URLs (recommended) | Most common |
| `name` | Remove duplicate channel names | Keep one per channel |
| `both` | Remove if URL OR name matches | Strictest |

### Examples

#### Basic Merge

```bash
# Merge two files
node scripts/iptv/merge.js us-sports.json us-news.json

# Merge with custom output
node scripts/iptv/merge.js file1.json file2.json \
  --output=combined.json
```

#### Merge All JSON Files

```bash
# Merge all JSON files in current directory
node scripts/iptv/merge.js *.json \
  --output=master-channels.json
```

#### Strict Deduplication

```bash
# Use both name and URL for deduplication
node scripts/iptv/merge.js file1.json file2.json file3.json \
  --dedupe-by=both \
  --output=unique-channels.json
```

#### Fast Merge (No Validation)

```bash
# Skip validation for quick merge
node scripts/iptv/merge.js file1.json file2.json \
  --skip-validation \
  --output=merged.json
```

#### Merge with Thorough Validation

```bash
# Merge and validate thoroughly
node scripts/iptv/merge.js \
  us-sports.json \
  us-news.json \
  us-entertainment.json \
  --timeout=20 \
  --parallel=20 \
  --retry=3 \
  --output=master-us.json
```

### Output

```
🔀 IPTV Channel Merger

📋 Loading 3 files...
   ✓ us-sports.json: 450 channels
   ✓ us-news.json: 300 channels
   ✓ us-entertainment.json: 400 channels

📊 Total loaded: 1150 channels
🔨 Deduplicating by: streamURL...
   ✓ Unique channels: 1050
   ✓ Duplicates removed: 100

🔍 Validating streams...
⏳ Progress: 100% (1050/1050) - Valid: 950

✅ Merge complete!
📊 Results:
   - Files merged: 3
   - Final channels: 950
   - Duration: 195s
   - Output: /opt/factory/backoffice/public/iptv-output/channels-merged-1698765432123.json
   - Valid: 950
   - Invalid: 100
```

### Merge Process

1. Read all specified files
2. Extract and concatenate channel arrays
3. Apply deduplication logic
4. Optionally validate merged channels
5. Renumber channels sequentially
6. Save merged file with metadata

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (< 2 files, invalid files, etc.) |

---

## Common Workflows

### Workflow 1: Daily Channel Update

Automate daily channel generation and validation:

```bash
#!/bin/bash
# daily-update.sh

DATE=$(date +%Y%m%d)
OUTPUT_DIR="/opt/factory/backoffice/public/iptv-output"

# Generate US sports channels
node scripts/iptv/generate.js \
  --profile=us-sports \
  --skip-validation \
  --output="us-sports-$DATE.json"

# Validate the generated file
node scripts/iptv/validate.js \
  "$OUTPUT_DIR/us-sports-$DATE.json" \
  --timeout=15 \
  --parallel=20 \
  --output="us-sports-validated-$DATE.json"

echo "Daily update complete: us-sports-validated-$DATE.json"
```

Schedule with cron:
```cron
0 2 * * * /path/to/daily-update.sh
```

### Workflow 2: Multi-Category Package

Create a comprehensive channel package:

```bash
#!/bin/bash
# build-package.sh

# Generate different categories
node scripts/iptv/generate.js \
  --countries=US \
  --categories=sports \
  --output=us-sports.json

node scripts/iptv/generate.js \
  --countries=US \
  --categories=news \
  --output=us-news.json

node scripts/iptv/generate.js \
  --countries=US \
  --categories=movies,entertainment \
  --output=us-entertainment.json

# Merge all categories
node scripts/iptv/merge.js \
  us-sports.json \
  us-news.json \
  us-entertainment.json \
  --timeout=15 \
  --parallel=20 \
  --output=us-complete-package.json

echo "Package built: us-complete-package.json"
```

### Workflow 3: Weekly Validation

Validate existing channel lists weekly:

```bash
#!/bin/bash
# weekly-validation.sh

OUTPUT_DIR="/opt/factory/backoffice/public/iptv-output"
DATE=$(date +%Y%m%d)

# Find all non-validated channel files
for file in $OUTPUT_DIR/channels-*.json; do
  # Skip already validated files
  if [[ ! "$file" =~ "validated" ]]; then
    echo "Validating $file..."

    node scripts/iptv/validate.js "$file" \
      --timeout=15 \
      --parallel=20 \
      --retry=3 \
      --output="validated-$DATE-$(basename $file)"
  fi
done

echo "Weekly validation complete!"
```

### Workflow 4: International Sports Package

Build a global sports package:

```bash
#!/bin/bash
# international-sports.sh

# US sports
node scripts/iptv/generate.js \
  --countries=US \
  --categories=sports \
  --exclude-local \
  --output=us-sports.json

# UK sports
node scripts/iptv/generate.js \
  --countries=GB \
  --categories=sports \
  --output=uk-sports.json

# CA sports
node scripts/iptv/generate.js \
  --countries=CA \
  --categories=sports \
  --output=ca-sports.json

# Merge and validate
node scripts/iptv/merge.js \
  us-sports.json \
  uk-sports.json \
  ca-sports.json \
  --dedupe-by=streamURL \
  --timeout=20 \
  --parallel=20 \
  --output=international-sports.json

echo "International sports package ready!"
```

### Workflow 5: Pipeline Integration

Use in CI/CD pipeline:

```yaml
# .github/workflows/update-channels.yml
name: Update IPTV Channels

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Generate channels
        run: |
          node scripts/iptv/generate.js \
            --profile=us-sports \
            --output=channels.json

      - name: Validate channels
        run: |
          node scripts/iptv/validate.js channels.json \
            --timeout=15 \
            --parallel=20

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: channel-list
          path: public/iptv-output/*.json
```

---

## Troubleshooting

### Command Not Found

**Problem**: `node: command not found`

**Solution**:
```bash
# Check Node.js installation
which node

# Install Node.js if missing
# On Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# On macOS
brew install node
```

### Permission Denied

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Make script executable
chmod +x scripts/iptv/*.js

# Or run with explicit node
node scripts/iptv/generate.js
```

### Module Not Found

**Problem**: `Error: Cannot find module 'iptv-checker'`

**Solution**:
```bash
# Install dependencies
cd /opt/factory/backoffice
pnpm install

# Verify iptv-checker is installed
pnpm list iptv-checker
```

### Timeout Errors

**Problem**: Validation times out frequently

**Solution**:
```bash
# Increase timeout and reduce parallel checks
node scripts/iptv/validate.js channels.json \
  --timeout=30 \
  --parallel=5 \
  --retry=3
```

### Out of Memory

**Problem**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" \
  node scripts/iptv/generate.js --profile=us-all

# Or split the operation
node scripts/iptv/generate.js --profile=us-sports --skip-validation
node scripts/iptv/validate.js channels-*.json --parallel=5
```

### File Not Found

**Problem**: `ENOENT: no such file or directory`

**Solution**:
```bash
# Ensure output directory exists
mkdir -p public/iptv-output

# Use absolute paths
node scripts/iptv/validate.js \
  /opt/factory/backoffice/public/iptv-output/channels.json
```

### Network Errors

**Problem**: `ECONNREFUSED` or `ETIMEDOUT`

**Solution**:
```bash
# Check internet connection
ping iptv-org.github.io

# Retry with increased timeout
node scripts/iptv/generate.js \
  --profile=us-sports \
  --timeout=30

# Use a proxy if needed
export HTTP_PROXY=http://proxy.example.com:8080
node scripts/iptv/generate.js --profile=us-sports
```

---

## Performance Tips

### Generation Performance

| Scenario | Settings | Est. Time |
|----------|----------|-----------|
| Quick test | `--skip-validation` | 5-10s |
| Fast validation | `--timeout=5 --parallel=30` | 30-60s |
| Balanced | `--timeout=10 --parallel=15` | 1-3 min |
| Thorough | `--timeout=20 --parallel=10 --retry=3` | 5-10 min |

### Memory Usage

```bash
# Monitor memory usage
/usr/bin/time -v node scripts/iptv/generate.js --profile=us-all

# Reduce memory usage
node scripts/iptv/generate.js --skip-validation
node scripts/iptv/validate.js channels-*.json --parallel=5
```

### Disk Space

```bash
# Check available space
df -h public/iptv-output/

# Clean old files
find public/iptv-output/ -name "*.json" -mtime +30 -delete
```

---

**Last Updated**: November 1, 2025
**CLI Version**: 2.0
