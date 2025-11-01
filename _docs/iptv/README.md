# IPTV Channel Manager Documentation

Complete documentation for the IPTV Channel Manager application integrated into the Telegamez Backoffice.

## 📚 Documentation Index

### Getting Started
- [User Guide](./USER-GUIDE.md) - Complete guide for using the IPTV Channel Manager
- [Quick Start](./QUICK-START.md) - Get up and running in 5 minutes

### Technical Documentation
- [Architecture](./ARCHITECTURE.md) - System architecture and design
- [API Reference](./API-REFERENCE.md) - REST API endpoints documentation
- [CLI Reference](./CLI-REFERENCE.md) - Command-line interface documentation
- [AI Features](./AI-FEATURES.md) - ✨ AI-powered analysis and editing

### Advanced Topics
- [Channel Validation](./VALIDATION.md) - Stream validation and quality checking
- [Merging Strategies](./MERGING.md) - Deduplication and file merging
- [Performance Tuning](./PERFORMANCE.md) - Optimization tips and best practices

### Development
- [Contributing](./CONTRIBUTING.md) - Guidelines for contributing
- [Migration Guide](./MIGRATION.md) - Migrating from /opt/telegamez/livestream

## 🎯 What is IPTV Channel Manager?

The IPTV Channel Manager is a comprehensive tool for generating, validating, merging, and managing IPTV channel lists from the IPTV-org database containing 37,000+ live TV channels worldwide.

### Key Features

- **Generate Channels** - Create channel lists with advanced filtering
- **Validate Streams** - Test stream URLs and remove dead links
- **Merge Files** - Combine multiple channel lists with deduplication
- **AI Analysis** - ✨ Use GPT-4 to analyze, filter, and edit channels with natural language
- **File Management** - Browse, download, and manage generated files
- **Dual Interface** - Full-featured GUI and powerful CLI tools

### Use Cases

1. **IPTV Service Providers** - Generate curated channel packages
2. **Media Applications** - Integrate live TV channels
3. **Research & Testing** - Test stream availability and quality
4. **Content Aggregation** - Build comprehensive channel databases

## 🚀 Quick Links

### GUI Access
```
https://backoffice.telegames.ai/apps/iptv-channels
```

### CLI Scripts
```bash
# Generate channels
node scripts/iptv/generate.js --profile=us-sports

# Validate streams
node scripts/iptv/validate.js channels.json

# Merge files
node scripts/iptv/merge.js file1.json file2.json
```

## 📊 Data Source

All channel data is sourced from [IPTV-org](https://github.com/iptv-org/iptv), a community-driven collection of publicly available IPTV channels.

- **Channels**: 37,000+ worldwide
- **Countries**: 195+ countries
- **Categories**: Sports, News, Entertainment, Movies, Kids, and more
- **Update Frequency**: Daily updates from upstream

## 🔧 Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Validation**: iptv-checker library
- **Storage**: File-based JSON storage
- **Authentication**: NextAuth.js integration

## 📝 File Format

Generated channel files use a standardized JSON format:

```json
{
  "metadata": {
    "source": "master-channels-workflow",
    "generated_at": "2025-11-01T10:30:00.000Z",
    "total_channels": 421,
    "configuration": { ... },
    "validation": { ... }
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

## 🆘 Support

For questions, issues, or feature requests:

1. Check the [User Guide](./USER-GUIDE.md)
2. Review [Common Issues](./TROUBLESHOOTING.md)
3. Consult [API Reference](./API-REFERENCE.md)
4. Contact the development team

## 📜 License

This application integrates with IPTV-org data, which is publicly available. Please review the [IPTV-org license](https://github.com/iptv-org/iptv/blob/master/LICENSE) for terms of use.

## 🔄 Version History

- **v2.1.0** (2025-11-01) - ✨ Added AI-powered channel analysis with GPT-4
- **v2.0.0** (2025-11-01) - Full backoffice integration with GUI + CLI
- **v1.0.0** (2024) - Original CLI tools in /opt/telegamez/livestream

---

**Last Updated**: November 1, 2025
**Maintained By**: Telegamez Development Team
