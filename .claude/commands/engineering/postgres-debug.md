# PostgreSQL Debug Command

# CRITICAL: This command MUST delegate to @database-operations agent
## DO NOT solve PostgreSQL issues directly. Always use the Task tool to invoke @database-operations.

**MANDATORY WORKFLOW**: 
1. Parse issue details from command args
2. Immediately delegate to @database-operations using Task tool
3. Monitor specialist progress and coordinate resolution

## ENFORCEMENT: Mandatory Delegation Protocol
This command serves ONLY as a routing mechanism. Any direct PostgreSQL troubleshooting violates the specialist architecture. The command executor MUST:

1. **IMMEDIATELY** delegate via Task tool to @database-operations
2. **NEVER** perform database analysis directly
3. **ONLY** coordinate between specialists when required

## Purpose
This command acts as the workflow orchestrator for PostgreSQL debugging tasks, routing issues to the appropriate specialist agent and ensuring proper escalation procedures are followed.

## Usage

This command delegates all PostgreSQL debugging tasks to the `@database-operations` agent. The command serves as the orchestration layer that:

1. **Triages Issues**: Categorizes the problem type and severity
2. **Routes to Specialist**: Delegates to `@database-operations` with context
3. **Manages Escalation**: Coordinates with other specialists when needed
4. **Tracks Resolution**: Ensures proper documentation and follow-up

**Basic database connection issues:**
```
/postgres-debug "Can't connect to PostgreSQL from web app"
```

**Production performance problems:**
```
/postgres-debug "
Environment: production
Issue: Slow query performance on users table
Symptoms: 5+ second response times, high CPU usage
Database: telegamez_prod
```

**Docker PostgreSQL container issues:**
```
/postgres-debug "
Context: local development
Issue: PostgreSQL container failing to start
Error: initdb: error: directory '/var/lib/postgresql/data' exists but is not empty
Container: telegamez-db-local
```

## Workflow Orchestration

### 1. Issue Triage & Classification
```markdown
This command will:
1. Parse the issue description and context
2. Classify the problem type (connection, performance, container, etc.)
3. Determine severity level (critical, high, medium, low)
4. Identify required tools and access levels
5. Route to @database-operations with structured context
```

### 2. Specialist Agent Delegation
```markdown
Delegates to @database-operations with:
- **Issue Context**: Environment, symptoms, error messages
- **Access Requirements**: Production/staging/local access needs
- **Tool Requirements**: Docker MCP, PostgreSQL MCP, monitoring tools
- **Escalation Matrix**: When to involve other specialists
- **Documentation Requirements**: Expected output format and detail level
```

### 3. Cross-Specialist Coordination
```markdown
Coordinates with other agents when issues span multiple domains:
- **@database-architect**: For schema/migration related problems
- **@account-auth-specialist**: For GoTrue authentication issues
- **@performance-optimizer**: For application-level optimizations
- **@testing-specialist**: For validation and regression testing
```

## Issue Classification Matrix

### Critical Issues (Immediate @database-operations engagement)
- **Database Unavailability**: Connection failures, container crashes
- **Data Corruption**: Checksum failures, inconsistent state
- **Performance Degradation**: >5 second query times, connection exhaustion
- **Security Incidents**: Unauthorized access, data breaches

### High Priority Issues
- **Replication Problems**: Lag >1GB, sync failures
- **Backup Failures**: Failed backups, recovery issues
- **Resource Exhaustion**: High CPU/memory, disk space issues
- **Migration Problems**: Failed migrations, constraint violations

### Medium Priority Issues
- **Performance Optimization**: Slow queries, index optimization
- **Configuration Issues**: Parameter tuning, connection pool sizing
- **Monitoring Setup**: Metrics collection, alerting configuration
- **Development Environment**: Local setup problems, container issues

## Delegation Validation
Before proceeding with ANY PostgreSQL work:
- [ ] Have you invoked @database-operations via Task tool?
- [ ] Have you provided structured issue context?
- [ ] Are you in coordination mode rather than execution mode?

**STOP**: If any checkbox is unchecked, delegate immediately.

## Required Delegation Format
When invoking @database-operations, use this exact structure:

**Task Description**: "PostgreSQL Database Operations"
**Prompt**: 
```
You are the @database-operations specialist. Handle this PostgreSQL issue:

**Environment**: [development/staging/production]
**Issue Type**: [connection/performance/credentials/container]
**Symptoms**: [user-reported symptoms]
**Context**: [relevant background]
**Expected Deliverables**:
- Root cause analysis
- Step-by-step resolution
- Prevention recommendations
- Validation steps
```

## Implementation Guidelines

### Command Execution Flow
```markdown
1. **Parse Input**: Extract issue details, environment context, symptoms
2. **Classify Issue**: Use classification matrix to determine priority/type  
3. **Delegate to Specialist**: Route to @database-operations with:
   - Structured issue context
   - Required access levels
   - Expected deliverables
   - Escalation criteria
4. **Monitor Progress**: Track specialist work and coordinate with other agents
5. **Validate Resolution**: Ensure issue is properly resolved and documented
```

### Expected Deliverables from @database-operations
```markdown
- **Root Cause Analysis**: Technical diagnosis of the issue
- **Resolution Steps**: Specific actions taken to resolve the problem  
- **Prevention Measures**: Recommendations to prevent recurrence
- **Performance Impact**: Assessment of any performance implications
- **Documentation**: Incident report and knowledge base updates
```

### Escalation Criteria
```markdown
Escalate to additional specialists when:
- **Schema Changes Required**: Involve @database-architect
- **Authentication Issues**: Coordinate with @account-auth-specialist  
- **Application Performance**: Engage @performance-optimizer
- **Infrastructure Issues**: Coordinate with DevOps/Infrastructure team
- **Security Concerns**: Involve Security team
```

## Success Criteria & Validation

### Issue Resolution Validation
```markdown
The command ensures resolution by validating:
- **Root Cause Identified**: Clear technical explanation of the issue
- **Problem Resolved**: Issue symptoms no longer present
- **Prevention Measures**: Recommendations implemented to prevent recurrence
- **Performance Restored**: Metrics returned to acceptable baselines
- **Documentation Complete**: Incident properly recorded and knowledge updated
```

### Quality Assurance Checkpoints
```markdown
Before marking issue as resolved:
1. **Functional Validation**: Affected services operating normally
2. **Performance Validation**: Response times within acceptable ranges
3. **Monitoring Validation**: Alerts cleared and metrics stable
4. **User Impact Assessment**: No ongoing user-facing issues
5. **Prevention Implementation**: Monitoring/alerting improvements in place
```

## Coordination Protocols

### Multi-Agent Collaboration
```markdown
When issues require multiple specialists:
1. **Primary Ownership**: @database-operations leads the effort
2. **Clear Handoffs**: Explicit communication of scope boundaries
3. **Status Updates**: Regular progress reports to command orchestrator
4. **Documentation Sharing**: Real-time sharing of findings and actions
5. **Unified Resolution**: Single coordinated response to the user
```

### Communication Standards
```markdown
All specialist agents must provide:
- **Status Updates**: Progress reports every 15 minutes for critical issues
- **Escalation Notices**: Immediate notification when additional help needed
- **Resolution Reports**: Comprehensive summary upon issue completion
- **Knowledge Capture**: Updates to documentation and runbooks
```

This command serves as the orchestration layer, ensuring that PostgreSQL debugging issues are properly triaged, routed to the appropriate specialist, and resolved following established protocols and quality standards.