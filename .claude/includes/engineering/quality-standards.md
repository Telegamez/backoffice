## Quality Standards & Validation

## CRITICAL ENGINEERING PRINCIPLE
**NEVER GUESS OR ASSUME ANYTHING**: If you cannot find a definitive answer, then alert the user to help problem solve. This is the MOST IMPORTANT rule for engineering agents.

### Core Clean Code Principles
- **Simplicity**: Do not introduce complex patterns without clear need, "keep it simple" is usually best
- **DRY (Don't Repeat Yourself)**: Extract repeated code into reusable functions, share common logic through proper abstraction, and maintain single sources of truth
- **Separation of Concerns**: Clearly separate different aspects of functionality (business logic, presentation, data access) - ensure different parts of the code handle distinct responsibilities
- **Single Responsibility Principle**: Each module or class should have responsibility over a single part of the functionality
- **Platform vs Application Separation**: Follow the Telegamez Backoffice multi-application architecture (see `.claude/includes/engineering/backoffice-architecture.md`)

### Meaningful Names & Structure
- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood
- Replace hard-coded values with named Typescript constants or Typescript ENUMs
- Keep related code together and organize in logical hierarchy

### Smart Comments & Documentation
- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects
- Use JSDoc for JavaScript (skip for TypeScript)
- Use `TODO:` comments for unresolved issues or bugs in existing code

### Code Quality Guidelines
- **Stick to the Task**: Focus only on the specific task requested
- **Minimal Changes**: Make the fewest changes necessary to address the issue
- **Preserve Logic**: Do not alter or remove existing logic unless instructed
- **Single-Chunk Edits**: Deliver edits in a single complete code chunk per file
- **File-by-File Approach**: Make changes one file at a time
- **Early Returns**: Prevent nested conditionals by returning early
- **Functional & Immutable**: Favor pure functions and immutable data where possible

### JavaScript/TypeScript Best Practices
- Prioritize clarity over cleverness
- Use descriptive names and prefix handlers with `handle*`
- Constants over magic numbers - define types appropriately
- Function order: Place composed/caller functions above those they call
- Each function should do exactly one thing and be small and focused
- Default to using arrow function syntax (=>) for all new function definitions. This promotes code conciseness and correctly handles the lexical scope of this.

### Technical Standards
- Ensure TypeScript compilation with no errors
- Include comprehensive testing validation (unit, integration, e2e)
- Apply security best practices (authentication, validation, sanitization)
- Implement proper error handling and logging
- Follow established project patterns and conventions
- Update documentation (README, API docs, architecture docs)
- Define clear success criteria and validation frameworks
- Create Type definitions for ENUM type values

### Code Quality Maintenance
- Refactor continuously and fix technical debt early
- Leave code cleaner than you found it
- Test before making more changes
- Write tests before fixing bugs
- Keep tests readable and maintainable