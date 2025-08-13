# Docker Debug Command

Expert Docker debugging assistant for local development and production environments with comprehensive container troubleshooting, context management, and multi-environment support.

## Purpose
This command provides expert-level Docker debugging capabilities across all environments using Docker contexts, with specialized knowledge of container orchestration, networking, volumes, and production deployment scenarios.

## Usage

**Basic container debugging:**
```
/docker-debug "Container telegamez-web-1 keeps restarting"
```

**Multi-environment context debugging:**
```
/docker-debug "
Context: production-server-1
Issue: High memory usage in signaling service
Container: telegamez-signaling-prod
Symptoms: Container OOMKilled, frequent restarts
"
```

**Local development troubleshooting:**
```
/docker-debug "
Environment: local
Issue: Hot reloading not working in Next.js container
Logs: ENOENT: no such file or directory
Container: telegamez-web-local
"
```

**Network connectivity issues:**
```
/docker-debug "
Context: staging-env
Issue: Service discovery failing between containers
Network: telegamez_default
Affected services: web, signaling, stt-api
"
```

**Volume and persistence problems:**
```
/docker-debug "
Issue: Database data not persisting after container restart
Volume: telegamez_postgres_data
Mount: /var/lib/postgresql/data
Context: production-db-server
"
```

## Docker Context Expertise

### Context Management
- **List available contexts**: `docker context ls`
- **Switch contexts**: `docker context use <context-name>`
- **Context inspection**: `docker context inspect <context-name>`
- **Remote Docker daemon connection**: TLS certificates, SSH tunneling
- **Multi-environment debugging**: dev, staging, production servers

### Environment-Specific Debugging
- **Local Development**: Docker Desktop, resource limits, file sharing
- **Staging/Production**: Remote contexts, resource constraints, security
- **Cloud Providers**: ECS, EKS, GKE, Azure Container Instances
- **VPS/Dedicated**: SSH-based contexts, firewall considerations

## Core Docker Debugging Capabilities

### Container Analysis
- **Lifecycle debugging**: Failed starts, unexpected exits, restart loops
- **Resource monitoring**: CPU, memory, disk I/O, network usage
- **Health check analysis**: Custom health checks, dependency validation
- **Log analysis**: Structured logging, log aggregation, trace correlation
- **Process inspection**: Running processes, zombie processes, signal handling

### Networking Diagnostics
- **Container networking**: Bridge, host, overlay, macvlan networks
- **Service discovery**: DNS resolution, load balancing, service mesh
- **Port mapping**: Exposure, conflicts, firewall rules
- **Inter-container communication**: Network policies, security groups
- **Load balancer integration**: Nginx, Traefik, cloud load balancers

### Volume and Storage Issues
- **Volume mounting**: Bind mounts, named volumes, tmpfs
- **Permission problems**: User mapping, file ownership, SELinux
- **Performance issues**: I/O bottlenecks, storage drivers
- **Data persistence**: Backup strategies, disaster recovery
- **Storage drivers**: overlay2, devicemapper, btrfs optimization

### Performance Optimization
- **Resource allocation**: CPU limits, memory constraints, swap usage
- **Image optimization**: Multi-stage builds, layer caching, size reduction
- **Runtime optimization**: Init systems, signal handling, graceful shutdown
- **Monitoring integration**: Prometheus, Grafana, custom metrics

## Monorepo-Specific Knowledge

### Service Architecture
- **Web App (Next.js)**: Turbopack hot reloading, SSR/SSG debugging
- **Signaling Service**: Socket.io connections, WebRTC signaling
- **STT-API Service**: Speech processing, model loading, GPU utilization
- **Database Services**: PostgreSQL, Redis clustering, replication

### Development Workflow
- **Hot reloading**: File watching, volume mounting, nodemon integration
- **Shared packages**: Workspace dependencies, build order, caching
- **Environment variables**: Multi-stage configs, secret management
- **Service dependencies**: Startup order, health checks, graceful degradation

### Container Orchestration
- **Docker Compose**: Service definitions, networks, volumes
- **Dependency management**: depends_on, health checks, restart policies
- **Scaling strategies**: Horizontal scaling, load distribution
- **Blue-green deployments**: Zero-downtime updates, rollback strategies

## Advanced Debugging Techniques

### System-Level Analysis
- **Host system resources**: Docker daemon health, system limits
- **Kernel-level debugging**: cgroups, namespaces, seccomp profiles
- **Container runtime**: containerd, runc, alternative runtimes
- **Security scanning**: CVE analysis, compliance checking

### Production Troubleshooting
- **Live debugging**: Non-intrusive inspection, minimal downtime
- **Log aggregation**: Centralized logging, structured formats
- **Metrics collection**: Real-time monitoring, alerting thresholds
- **Incident response**: Rapid diagnosis, rollback procedures

### Development Environment Issues
- **File synchronization**: Volume mounting, file watching limitations
- **Permission mapping**: User ID conflicts, file ownership
- **Platform differences**: macOS, Windows, Linux container behavior
- **Resource constraints**: Memory limits, CPU throttling

## Diagnostic Commands Reference

### Context Operations
```bash
# List and manage contexts
docker context ls
docker context use <context>
docker context inspect <context>

# Remote context debugging
docker --context <remote> ps
docker --context <remote> logs <container>
```

### Container Inspection
```bash
# Deep container analysis
docker inspect <container>
docker stats <container>
docker top <container>
docker exec -it <container> /bin/bash

# Resource usage
docker system df
docker system events
docker system prune
```

### Network Debugging
```bash
# Network inspection
docker network ls
docker network inspect <network>
docker exec <container> netstat -tulpn
docker exec <container> nslookup <service>

# Connectivity testing
docker exec <container> ping <target>
docker exec <container> curl -v <endpoint>
```

### Volume Analysis
```bash
# Volume management
docker volume ls
docker volume inspect <volume>
docker exec <container> df -h
docker exec <container> ls -la <mount_point>
```

## Integration with Telegamez Architecture

### Service-Specific Debugging
- **Web service**: Next.js build issues, client-side hydration
- **Signaling service**: WebSocket connections, AI model loading
- **STT service**: Audio processing, model inference performance
- **Database services**: Connection pooling, query performance

### Environment Configuration
- **Local development**: `.env.local` files, volume mounting
- **Production deployment**: Secret management, configuration injection
- **Multi-stage environments**: Context switching, environment isolation

### Monitoring and Observability
- **Grafana Faro integration**: Real user monitoring, error tracking
- **Structured logging**: Trace ID correlation across services
- **Prometheus metrics**: Container and application metrics
- **Health check endpoints**: Service availability monitoring

## Best Practices

### Debugging Methodology
1. **Context identification**: Determine environment and affected services
2. **Log analysis**: Structured log review, error pattern recognition
3. **Resource inspection**: CPU, memory, disk, network utilization
4. **Dependency validation**: Service connectivity, external dependencies
5. **Root cause analysis**: System-level vs application-level issues
6. **Solution implementation**: Minimal invasive fixes, testing validation

### Production Safety
- **Non-destructive debugging**: Read-only operations, minimal impact
- **Backup procedures**: State preservation, rollback capabilities
- **Change management**: Controlled updates, staged deployments
- **Documentation**: Issue tracking, solution recording

### Performance Optimization
- **Resource allocation**: Right-sizing containers, efficient resource usage
- **Caching strategies**: Layer caching, application-level caching
- **Network optimization**: Service mesh, load balancing
- **Storage optimization**: Volume drivers, I/O performance tuning