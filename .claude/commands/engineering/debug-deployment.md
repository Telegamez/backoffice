# Debug-Deployment Command

Systematically investigates and resolves deployment failures, CI/CD pipeline issues, GitHub Actions problems, and infrastructure-related deployment obstacles using specialized DevOps expertise.

## Purpose
This command analyzes deployment failures, GitHub workflow errors, container issues, and infrastructure problems to implement comprehensive fixes through the DevOps specialist agent. It focuses on deployment automation, CI/CD pipeline optimization, and infrastructure reliability.

## Usage
This command accepts deployment failure context including workflow logs, error messages, environment details, and infrastructure symptoms:

**Basic deployment failure:**
```
/debug-deployment "GitHub Actions workflow failing at deploy step"
```

**Detailed workflow failure:**
```
/debug-deployment "
Workflow: .github/workflows/deploy-web.yml
Error: Container build failed - exit code 125
Step: Build and push Docker image
Branch: main
Commit: abc123def
Environment: production
"
```

**Infrastructure deployment issue:**
```
/debug-deployment "
Issue: Production deployment timing out
Service: web-next
Container: telegamez-web-production
Error: Health check failing after 5 minutes
Logs: Connection refused on port 3000
Infrastructure: VPS deployment via Docker context
"
```

**CI/CD pipeline debugging:**
```
/debug-deployment "
Pipeline: GitHub Actions build-and-test
Failure: Tests passing locally but failing in CI
Environment variables: Missing or incorrect values
Services: Database connection issues
Branch: feature/user-auth
"
```

**Container orchestration problems:**
```
/debug-deployment "
Issue: Docker Compose services failing to start
Environment: staging
Services: web, signaling, database
Error: Network connectivity between containers
Docker context: staging-server
"
```

## Specialist Agent Selection
This command automatically engages the **DevOps Specialist** agent (`@devops-specialist`) which has specialized expertise in:
- GitHub Actions workflow debugging and optimization
- Docker containerization and orchestration troubleshooting
- CI/CD pipeline analysis and repair
- Infrastructure connectivity and configuration issues
- Deployment automation and rollback procedures
- System administration and server management

## Deployment Investigation Process
This command will:
1. **Initial Assessment**: Analyze reported deployment failure symptoms and context
2. **Configuration Analysis**: Review GitHub workflows, Docker files, and deployment scripts
3. **Log Investigation**: Examine CI/CD logs, container logs, and system metrics
4. **Infrastructure Health**: Validate environment configuration, networking, and dependencies
5. **Root Cause Analysis**: Identify specific failure points and contributing factors
6. **Solution Implementation**: Fix configuration errors, update workflows, resolve infrastructure issues
7. **Validation**: Test fixes and verify deployment success across environments
8. **Prevention**: Implement monitoring, alerting, and improved error handling

## GitHub Actions & CI/CD Expertise
The DevOps specialist provides expert-level capabilities for:
- **Workflow Debugging**: YAML syntax validation, secret management, trigger analysis
- **Build Optimization**: Faster build times, caching strategies, dependency management
- **Environment Management**: Dev/staging/production deployment coordination
- **Security**: Credential handling, access control, vulnerability scanning
- **Monitoring**: Health checks, rollback procedures, incident response

## Docker & Container Troubleshooting
Advanced container debugging including:
- **Build Failures**: Dockerfile optimization, base image issues, multi-stage builds
- **Runtime Issues**: Container startup, resource constraints, networking problems
- **Orchestration**: Docker Compose, service dependencies, volume mounting
- **Registry Operations**: Image pushing/pulling, authentication, storage optimization

## Infrastructure & System Administration
Comprehensive infrastructure support:
- **Server Management**: Process monitoring, resource utilization, system diagnostics
- **Network Connectivity**: DNS resolution, port accessibility, firewall configuration
- **Performance Tuning**: Load balancing, auto-scaling, resource optimization
- **Security Hardening**: SSL/TLS, access control, compliance validation

## Integration with Telegamez Architecture
This command understands the specific deployment architecture and workflow patterns used in the Telegamez monorepo:
- **Monorepo Structure**: pnpm workspaces, shared packages, build dependencies
- **Service Orchestration**: Web app, signaling service, STT-API, database coordination
- **Environment Configuration**: Local development vs production deployment patterns
- **Container Management**: Docker contexts, multi-environment deployment strategies

## Quality Standards Reference
All deployment fixes must adhere to the comprehensive quality standards defined in:
- `.claude/includes/engineering/quality-standards.md`

## Implementation Guidelines
- **Systematic Approach**: Follow structured troubleshooting methodology from symptoms to root cause
- **Infrastructure Safety**: Use non-destructive debugging, proper change management
- **Performance Focus**: Optimize for build speed, deployment efficiency, resource utilization
- **Security First**: Protect credentials, follow principle of least privilege
- **Monitoring Integration**: Add alerting and health checks to prevent future issues
- **Documentation**: Update runbooks and create rollback procedures
- **Testing Strategy**: Validate fixes in staging before production deployment
- **Rollback Planning**: Always have tested rollback procedures before changes