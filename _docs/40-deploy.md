# Platform Deployment Guide

Production deployment procedures for the Telegamez Backoffice platform and all its applications.

## Docker Compose Deployment

### Prerequisites
- Docker and Docker Compose
- Environment variables configured

### Environment Setup

Create `.env.local` with all required variables:

```bash
# Database (overridden in Docker Compose)
DATABASE_URL=postgres://postgres:postgres@db:5432/telegamez

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://backoffice.telegamez.com

# Application-specific
GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
```

### Build and Deploy

```bash
# Build images and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services

- **Database**: PostgreSQL 16 on port 55432
- **Web**: Next.js application on port 3100
- **Nginx Proxy**: Handles SSL termination and routing

### Production Considerations

1. **SSL/HTTPS**: Configure nginx proxy with proper SSL certificates
2. **Environment Variables**: Use Docker secrets or secure environment variable management
3. **Database Backups**: Set up regular PostgreSQL backups
4. **Monitoring**: Implement health checks and monitoring
5. **Scaling**: Configure horizontal scaling for the web service

### Health Checks

```bash
# Check service health
curl -f http://localhost:3100/api/auth/signin || exit 1

# Check database connectivity
docker exec telegamez-postgres pg_isready -U postgres
```

## Production Deployment

The application is deployed at `https://backoffice.telegamez.com` behind an nginx reverse proxy that handles:

- SSL termination with Let's Encrypt certificates
- Request routing to the Next.js application
- Static asset serving
- Security headers

### Nginx Configuration

Ensure your nginx configuration includes:

```nginx
server {
    listen 443 ssl;
    server_name backoffice.telegamez.com;
    
    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```


