# IPTV Channel Manager - Docker Setup Complete

## ✅ Configuration Complete

The IPTV Channel Manager app has been fully integrated into the Telegamez Backoffice Docker setup.

## 🔧 Changes Made

### 1. Package Dependencies
**File**: `package.json`
- Added `"iptv-checker": "^0.28.0"` to dependencies (line 36)
- Successfully installed with `npm install` (350 packages added)

### 2. Dockerfile Updates
**File**: `Dockerfile`
- Added lines 49-50:
```dockerfile
# Create IPTV output directory with proper permissions
RUN mkdir -p /app/public/iptv-output && chown -R nextjs:nextjs /app/public/iptv-output
```

### 3. Docker Compose Updates
**File**: `docker-compose.yml`
- Added volume mount to web service (line 58-59):
```yaml
volumes:
  - iptv_output:/app/public/iptv-output
```
- Added named volume definition (line 65):
```yaml
volumes:
  pgdata:
  redis_data:
  iptv_output:
```

## 🚀 Deployment

### Build and Start Containers

```bash
cd /opt/factory/backoffice
docker-compose up --build
```

### Access the IPTV App

Once the containers are running, navigate to:

```
http://localhost:3100/apps/iptv-channels
```

## 📦 What This Provides

### Persistent Storage
- Generated IPTV channel JSON files are stored in a Docker volume
- Files persist across container restarts
- Volume name: `iptv_output`
- Mount path: `/app/public/iptv-output`

### Permissions
- Directory owned by `nextjs` user (non-root)
- Proper write permissions for channel generation
- Secure file access

### Integration
- Runs alongside PostgreSQL (port 55432) and Redis (port 6380)
- Uses backoffice authentication
- Shares environment variables and secrets

## 🎯 Features Available

1. **Quick Profiles**:
   - US All Channels
   - US Sports
   - US Entertainment
   - US News
   - US Family
   - North America

2. **Custom Filters**:
   - Filter by countries
   - Filter by categories
   - Exclude local affiliates
   - M3U8 streams only
   - Skip validation option

3. **Real-time Generation**:
   - Progress tracking
   - Channel statistics
   - Download generated JSON files

## 📊 Architecture

```
Docker Compose Stack:
├── db (PostgreSQL 16)
│   └── Port: 55432
├── redis (Redis 7)
│   └── Port: 6380
└── web (Next.js 15)
    ├── Port: 3100
    ├── Volume: iptv_output → /app/public/iptv-output
    └── Apps:
        └── /apps/iptv-channels (IPTV Channel Manager)
```

## 🔐 Security

- ✅ Non-root user execution
- ✅ Authentication required for all IPTV endpoints
- ✅ Filename validation on downloads
- ✅ Restricted output directory
- ✅ Volume isolation

## 📝 Generated Files

Files are saved with timestamp naming:
```
/app/public/iptv-output/channels-1730491234567.json
```

Access via download endpoint:
```
GET /api/iptv/download?file=channels-1730491234567.json
```

## 🛠️ Maintenance

### View Volume Contents
```bash
docker volume inspect telegamez_iptv_output
```

### Clear Generated Files
```bash
docker-compose exec web rm -rf /app/public/iptv-output/*.json
```

### Rebuild After Changes
```bash
docker-compose down
docker-compose up --build
```

## 📚 Related Documentation

- Main Integration Guide: [IPTV-APP-INTEGRATION.md](./IPTV-APP-INTEGRATION.md)
- App Documentation: [src/app/apps/iptv-channels/README.md](./src/app/apps/iptv-channels/README.md)
- Original IPTV Tools: `/opt/telegamez/livestream/`
- Complete Workflow Docs: `/opt/telegamez/livestream/MASTER-CHANNELS.md`

## ✅ Ready to Deploy

All configuration is complete. You can now:

1. Build and start: `docker-compose up --build`
2. Access app: `http://localhost:3100/apps/iptv-channels`
3. Generate channels using Quick Profiles or Custom Filters
4. Download generated JSON files

---

**Setup Date**: November 1, 2025
**Status**: ✅ Ready for Production
**Docker Configuration**: Complete
