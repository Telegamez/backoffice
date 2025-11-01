# IPTV Channel Manager - Quick Start

Get up and running with the IPTV Channel Manager in 5 minutes.

## GUI Quick Start (2 minutes)

### Step 1: Access the Application

Navigate to:
```
https://backoffice.telegames.ai/apps/iptv-channels
```

### Step 2: Generate Channels

1. Click the **Profiles** tab
2. Find **US Sports** profile
3. Click **Generate** button
4. Wait 30-60 seconds

### Step 3: Download Results

1. Click **Download JSON** in the status card
2. Your channel file is ready to use!

**That's it!** You now have a validated list of 400-600 US sports channels.

---

## CLI Quick Start (3 minutes)

### Step 1: Navigate to Directory

```bash
cd /opt/factory/backoffice
```

### Step 2: Generate Channels

```bash
node scripts/iptv/generate.js --profile=us-sports
```

### Step 3: Find Your File

```bash
ls -lh public/iptv-output/channels-*.json
```

**Done!** Your channel list is in `public/iptv-output/`.

---

## What You Get

### Generated File Structure

```json
{
  "metadata": {
    "total_channels": 421,
    "validation": {
      "valid": 421,
      "invalid": 112
    }
  },
  "channels": [
    {
      "number": 1,
      "name": "ESPN",
      "Category": "Sports",
      "Language": "English (US)",
      "streamURL": "https://example.com/stream.m3u8"
    }
  ]
}
```

---

## Next Steps

### Try Different Profiles

**GUI**: Switch to different profiles on the Profiles tab

**CLI**:
```bash
# US News
node scripts/iptv/generate.js --profile=us-news

# US Entertainment
node scripts/iptv/generate.js --profile=us-entertainment

# All North America
node scripts/iptv/generate.js --profile=north-america
```

### Create Custom Filters

**GUI**: Use the **Custom** tab to specify:
- Countries (US, CA, GB, etc.)
- Categories (sports, news, movies, etc.)
- Validation settings

**CLI**:
```bash
node scripts/iptv/generate.js \
  --countries=US,CA \
  --categories=sports,news \
  --m3u8-only
```

### Validate Existing Files

**GUI**: Use the **Validate** tab to upload and test channel files

**CLI**:
```bash
node scripts/iptv/validate.js your-file.json
```

### Merge Multiple Files

**GUI**: Use the **Merge** tab to combine files

**CLI**:
```bash
node scripts/iptv/merge.js file1.json file2.json file3.json
```

---

## Common Use Cases

### Case 1: Get Started Quickly
```bash
# Generate without validation (5-10 seconds)
node scripts/iptv/generate.js --profile=us-sports --skip-validation
```

### Case 2: Production Quality
```bash
# Generate with thorough validation
node scripts/iptv/generate.js \
  --profile=us-sports \
  --timeout=20 \
  --parallel=15 \
  --retry=3
```

### Case 3: Custom Package
```bash
# Multi-country sports package
node scripts/iptv/generate.js \
  --countries=US,CA,GB \
  --categories=sports \
  --exclude-local \
  --output=world-sports.json
```

---

## Troubleshooting

### Problem: Generation is slow

**Solution**: Add `--skip-validation` for quick testing
```bash
node scripts/iptv/generate.js --profile=us-sports --skip-validation
```

### Problem: Too few channels

**Solution**:
- Remove `--exclude-local` option
- Add more categories
- Include more countries

### Problem: Can't find GUI

**Solution**:
- Ensure you're logged in
- Check URL: `/apps/iptv-channels`
- Restart dev server

---

## Learn More

- [Full User Guide](./USER-GUIDE.md) - Complete documentation
- [API Reference](./API-REFERENCE.md) - REST API details
- [CLI Reference](./CLI-REFERENCE.md) - All CLI options
- [Architecture](./ARCHITECTURE.md) - Technical details

---

**Ready to go! 🚀**

For questions, check the [User Guide](./USER-GUIDE.md) or contact support.
