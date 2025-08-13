# Create Slash Command

Creates new Claude slash commands based on established patterns and templates from the codebase.

## Purpose
This command generates properly structured slash commands that follow the project's conventions and patterns, automatically placing them in the appropriate directory structure.

## Usage
This command accepts a command name, category, and description to generate a new slash command:

**Basic command creation:**
```
/create-slash-command "fix-typescript-errors" "engineering" "Systematically fixes TypeScript compilation errors"
```

**Command with detailed specification:**
```
/create-slash-command "deploy-staging" "engineering" "
Purpose: Deploys application to staging environment with proper validation
Usage: Accepts branch name and environment variables
Process: Build -> Test -> Deploy -> Validate
"
```

**Command with custom parameters:**
```
/create-slash-command "analyze-performance" "engineering" "
Analyzes application performance and identifies bottlenecks
Accepts: component name, metrics type, timeframe
Outputs: performance report with recommendations
"
```

## Command Generation Process
This command will:
1. Validate the command name and category
2. Analyze existing commands in the target category for patterns  
3. Generate command structure following established conventions
4. Create proper directory structure if needed
5. Generate markdown file with standard sections:
   - Purpose/Description
   - Usage examples
   - Implementation process
   - Quality standards references
6. Validate the generated command follows project patterns
7. Place the command in `.claude/commands/{category}/{command-name}.md`

## Available Categories
- `engineering` - Development, debugging, deployment commands
- `design` - UI/UX, styling, component design commands  
- `product` - Product management, requirements, specifications
- `project-management` - Planning, tracking, coordination
- `marketing` - Content, campaigns, analytics
- `legal` - Compliance, contracts, policies

## Command Structure Template
Generated commands follow this structure:
```markdown
# {Command Name}

{Brief description of command purpose}

## Purpose
{Detailed explanation of what the command does and why}

## Usage
{Examples of how to use the command with different parameters}

## Process
This command will:
1. {Step 1}
2. {Step 2}
3. {etc...}

## Implementation Guidelines
- {Guideline 1}
- {Guideline 2}
- {etc...}
```

## Quality Standards
All generated commands must:
- Follow consistent naming conventions (kebab-case)
- Include clear purpose and usage sections
- Provide concrete examples
- Reference relevant quality standards and includes
- Maintain consistency with existing command patterns
- Include proper error handling and validation steps

## Implementation Notes
- Commands are placed in `.claude/commands/{category}/` directory
- Command names use kebab-case formatting
- Generated commands reference existing includes and quality standards
- Pattern analysis ensures consistency with existing commands in the category