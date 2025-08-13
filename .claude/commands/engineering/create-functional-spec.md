# Create Functional Specification

Create a comprehensive functional specification from GitHub ticket: $ARGUMENTS

## Prerequisites Validation - MANDATORY FIRST STEP
**BEFORE proceeding with specification creation, MUST complete all prerequisites validation:**

See `.claude/includes/engineering/prerequisites-validation.md` for complete validation requirements:

1. **Extract and analyze GitHub ticket information** using WebFetch or gh command
2. **Verify branch exists** with naming convention: [ticket-number]-[github-safe-title]
3. **Validate ticket has clear description and requirements**
4. **Ask clarifying questions** if ticket requirements are unclear, ambiguous, or incomplete
5. **Ensure current working directory** matches the branch context
6. **Ensure MCP servers are available** for documentation research
7. **Confirm comprehensive understanding** of requirements before proceeding

**CRITICAL STOP CONDITION:**
- **IF ANY clarifying questions are identified**: IMMEDIATELY STOP the process
- **DO NOT proceed to functional-spec-writer agent**
- **DO NOT attempt to create any specification**
- **WAIT for user responses** to all clarifying questions
- **ONLY after all questions are answered**: resume with specialist agent selection

**ENFORCEMENT RULE**: If you have questions about requirements, scope, technical details, or implementation approach - you MUST stop and ask them. Do not make assumptions or proceed with incomplete understanding.

## Requirement Understanding Validation
After extracting ticket information, MUST verify understanding by:
- **Summarizing the problem statement** in clear terms
- **Identifying key requirements** and success criteria
- **Listing any clarifying questions** that need answers before proceeding
- **Confirming scope boundaries** - what is included/excluded
- **Identifying stakeholders and affected systems**

**MANDATORY CHECKPOINT**: 
- **IF you have ANY clarifying questions**: STOP immediately and present them to the user
- **DO NOT proceed past this point** until all questions are answered
- **DO NOT invoke functional-spec-writer agent** with incomplete understanding
- **WAIT for user clarification** before continuing

**AFTER receiving clarifications from user:**
1. **Update the original GitHub ticket** with the clarified requirements
2. **Add a comment to the ticket** summarizing the clarifications provided
3. **Ensure the ticket now contains complete, unambiguous requirements**
4. **Confirm the ticket is updated** before proceeding to specification creation

**Only proceed to specialist selection after ALL clarifying questions have been answered, ticket is updated with clarifications, and complete understanding is confirmed.**

## Specialist Agent Selection
See `.claude/includes/engineering/specialist-mapping.md` for complete domain-to-agent mapping.

Based on validated ticket analysis, identify required domain expertise and select appropriate specialist agents from the mapping.

## Process
1. **COMPLETE prerequisites validation** (see above - MANDATORY first step)
2. **Use the functional-spec-writer agent** to analyze the validated GitHub ticket and create the specification
3. **Consult domain specialist agents** based on feature requirements (see specialist mapping above)
4. **Research current documentation** using MCP servers for relevant technologies and best practices
5. **Follow the established structure** defined in `.claude/includes/engineering/functional-spec-template.md`
6. **Save specification** as `_docs/Implementation/FunctionalSpecs/[branch-name].md`
7. **Include parallel work streams** organized by specialist agent expertise
8. **Define comprehensive validation criteria** and quality gates

## Quality Standards & Validation
See `.claude/includes/engineering/quality-standards.md` for complete quality standards and validation requirements.

## Output Requirements
- Complete functional specification document with documentation references
- Parallel work streams designed for concurrent execution by appropriate specialist agents
- Clear agent assignments for each work stream based on domain expertise
- Integration points and interface contracts defined
- Validation framework with measurable success criteria
- Links to relevant official documentation and examples

## Specialist Coordination Strategy
The functional-spec-writer agent will:
1. **Work with validated requirements** from prerequisites phase
2. **Coordinate with appropriate specialists** for domain-specific analysis and requirements
3. **Design parallel work streams** that maximize concurrent execution by specialist agents
4. **Define clear integration points** between different specialist work streams
5. **Create comprehensive validation framework** with specialist-specific quality gates

**IMPORTANT**: The functional-spec-writer agent should only be invoked AFTER prerequisites validation is complete and requirements are fully understood. Do not delegate the prerequisites validation to the agent - complete it first in this command context.