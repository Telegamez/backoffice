# Create Agent - Universal Agent Creator Command

## Purpose
Orchestrates the complete agent creation workflow across all team domains (engineering, design, legal, marketing, product, project-management). This command guides users through the agent creation process, delegates to the meta-agent specialist, and automatically updates the Claude configuration documentation.

## Usage

```
/create-agent
```

## Command Workflow

### Phase 1: Team Domain Selection
First, identify the target team domain for the new agent:

**Available Team Domains:**
- `engineering` - Technical specialists (database, frontend, backend, testing, etc.)
- `design` - Design and UX specialists
- `legal` - Legal and compliance specialists  
- `marketing` - Marketing and growth specialists
- `product` - Product management and strategy specialists
- `project-management` - Project coordination and delivery specialists

**Interactive Selection:**
1. Present the available team domains to the user
2. Ask which domain the new agent should belong to
3. Validate the selection against available directories
4. For root-level agents (general purpose), use the main `/agents/` directory

### Phase 2: Agent Requirements Gathering
Collect comprehensive requirements from the user:

**Required Information:**
- **Agent Purpose**: What specific tasks/problems will this agent solve?
- **Domain Expertise**: What knowledge areas should the agent specialize in?
- **Key Capabilities**: What are the main functions the agent should perform?
- **Integration Points**: How will this agent work with existing specialists?
- **Tools Needed**: What Claude Code tools will the agent require?

**Guided Questions:**
1. "What specific problem or workflow should this agent address?"
2. "What domain expertise or knowledge should the agent have?"
3. "What are the key tasks the agent should be able to perform?"
4. "How should this agent integrate with existing workflows?"
5. "Are there specific tools or capabilities the agent will need?"

### Phase 3: Agent Creation Delegation
Delegate the technical agent creation to the meta-agent specialist:

**Task Delegation Process:**
1. **Prepare Context**: Compile user requirements into a structured prompt
2. **Set Target Path**: Determine the correct file path based on team domain selection
3. **Delegate to Meta-Agent**: Use the Task tool to engage the create-agent (meta-agent) specialist
4. **Monitor Creation**: Track the agent creation process and validate output

**Delegation Format:**
```markdown
Create a new Claude Code agent with the following specifications:

**Team Domain**: [selected domain]
**Target Path**: .claude/agents/[domain]/[agent-name].md (or .claude/agents/[agent-name].md for root level)

**Agent Requirements**:
- Purpose: [user-provided purpose]
- Domain: [user-provided domain expertise]  
- Key Capabilities: [user-provided capabilities]
- Integration: [user-provided integration requirements]
- Tools: [inferred from requirements]

**Additional Context**: [any additional user specifications]
```

### Phase 4: Validation and Review
After agent creation, validate the output:

**Validation Checklist:**
- [ ] Agent file created in correct team directory
- [ ] Frontmatter contains proper name, description, tools, and color
- [ ] System prompt is comprehensive and domain-appropriate
- [ ] Instructions are clear and actionable
- [ ] Best practices are included for the domain
- [ ] Output format is well-defined

**User Review Process:**
1. Present the created agent file path and key details
2. Ask user if they want to review the agent content
3. If requested, display the agent configuration summary
4. Confirm the agent is ready for integration

### Phase 5: Documentation Update
Automatically update the Claude configuration documentation:

**Documentation Update Process:**
1. **Confirmation**: Ask user if they're ready to update the documentation
2. **Auto-Update**: Execute the `/update-claude-agentic-readme` command
3. **Verification**: Confirm the README.md has been updated with the new agent
4. **Final Summary**: Provide completion summary with next steps

## Team Directory Mapping

### Engineering Domain (`/agents/engineering/`)
For technical specialists including:
- Database architecture and operations
- Frontend and backend development
- Testing and quality assurance
- Performance and optimization
- API and service specialists

### Design Domain (`/agents/design/`)
For design and user experience specialists including:
- UI/UX design
- Visual design systems
- User research and testing
- Accessibility and inclusive design
- Design system management

### Legal Domain (`/agents/legal/`)
For legal and compliance specialists including:
- Contract review and analysis
- Compliance and regulatory guidance
- Privacy and data protection
- Intellectual property management
- Legal documentation

### Marketing Domain (`/agents/marketing/`)
For marketing and growth specialists including:
- Content strategy and creation
- Marketing campaign analysis
- SEO and content optimization
- Social media strategy
- Growth and analytics

### Product Domain (`/agents/product/`)
For product management specialists including:
- Product strategy and roadmap
- Feature specification and analysis
- User story and requirement management
- Market research and competitive analysis
- Product metrics and analytics

### Project Management Domain (`/agents/project-management/`)
For project coordination specialists including:
- Project planning and execution
- Resource allocation and management
- Timeline and milestone management
- Risk assessment and mitigation
- Team coordination and communication

### Root Level (`/agents/`)
For general-purpose agents that serve all teams:
- Cross-functional workflow automation
- Universal utility agents
- Documentation and communication tools
- Integration and orchestration agents

## Error Handling

### Invalid Domain Selection
If user selects an invalid domain:
```
❌ Invalid team domain selected: [invalid-domain]

Available domains:
- engineering
- design  
- legal
- marketing
- product
- project-management
- root (for general-purpose agents)

Please select a valid domain.
```

### Agent Creation Failure
If the meta-agent fails to create the agent:
```
❌ Agent creation failed

Please review the requirements and try again. Common issues:
- Unclear or conflicting requirements
- Invalid tool selections
- Insufficient domain specification

Would you like to retry with revised requirements?
```

### Documentation Update Failure
If documentation update fails:
```
⚠️ Agent created successfully but documentation update failed

Agent created at: [file-path]
Please manually run: /update-claude-agentic-readme

Or contact support if the issue persists.
```

## Success Output Format

Upon successful completion:

```
✅ Agent Creation Complete!

**New Agent Details:**
- Name: [agent-name]
- Team Domain: [domain]
- File Path: .claude/agents/[domain]/[agent-name].md
- Tools: [tool-list]
- Color: [color]

**Integration Status:**
- ✅ Agent file created
- ✅ Configuration validated
- ✅ Documentation updated
- ✅ Ready for use

**Next Steps:**
1. The new agent is automatically available in Claude Code
2. Commands can now delegate to this agent using Task tool
3. Update specialist-mapping.md if domain routing is needed
4. Test the agent with relevant workflows

**Usage:**
The agent can be invoked by commands or triggered automatically based on its description criteria.
```

## Integration with Existing Systems

### Specialist Mapping Integration
After creating engineering domain agents, remind users to update the specialist mapping:

```
💡 Reminder: For engineering agents, consider updating the specialist mapping:
- File: .claude/includes/engineering/specialist-mapping.md
- Add appropriate triggers and domain mapping
- This enables automatic agent selection in workflows
```

### Command Integration
Provide guidance on integrating the new agent with existing commands:

```
💡 Integration Tips:
- Commands can delegate to your new agent using the Task tool
- Add agent-specific triggers to relevant workflow commands
- Consider creating dedicated slash commands for complex agent workflows
- Update documentation for any commands that should use this agent
```

## Quality Standards

### Agent Quality Requirements
- **Clear Purpose**: Agent must have a well-defined, specific purpose
- **Appropriate Tools**: Only include tools actually needed for agent tasks
- **Domain Expertise**: Agent should demonstrate clear expertise in its domain
- **Integration Patterns**: Agent should follow established patterns for its domain
- **Documentation Quality**: Comprehensive instructions and best practices

### Code Quality Validation
- **File Structure**: Proper frontmatter and markdown structure
- **Naming Conventions**: Kebab-case naming and appropriate file placement
- **Tool Selection**: Minimal but sufficient tool set for agent capabilities
- **Color Assignment**: Unique color selection for visual identification

This command ensures a streamlined, guided experience for creating agents across all team domains while maintaining quality standards and proper integration with the Claude Code ecosystem.