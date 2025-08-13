# Write-Tests Command

Orchestration command that delegates test creation and maintenance to the testing-specialist agent, ensuring proper test coverage across all technologies in the monorepo.

## Purpose
This command serves as the orchestrator for test-related tasks, analyzing requirements and delegating all test implementation work to the testing-specialist agent who has expertise across the entire tech stack including Vitest, Jest, and other testing frameworks.

## Usage

**Test recent changes (default when no target specified):**
```
/write-tests
```

**Test specific file:**
```
/write-tests "src/components/AuthForm.tsx"
```

**Test modified service:**
```
/write-tests "packages/signaling/src/services/ConversationalAgent.ts"
```

**Test entire package:**
```
/write-tests "packages/web-next"
```

**Test with specific scenarios:**
```
/write-tests "
Target: src/utils/validators.ts
Scenarios: edge cases, error handling, input sanitization
Coverage: security validation, boundary conditions
"
```

**Test integration flow:**
```
/write-tests "
Type: integration
Components: SignalingService, ConversationalAgent, TTSService
Flow: User speech -> processing -> AI response -> TTS output
"
```

## Command Orchestration Role

This command acts as the **orchestrator** and delegates all technical implementation to the testing-specialist agent:

### Command Responsibilities
- **Requirement Analysis**: Parse user input and testing requirements
- **Context Gathering**: Identify target files, packages, and testing scope (including git diff analysis for recent changes)
- **Agent Delegation**: Route all test implementation work to testing-specialist
- **Progress Coordination**: Manage test creation workflow and validation

### Testing-Specialist Agent Expertise
The testing-specialist agent handles all technical aspects:
- **Framework Selection**: Choose appropriate testing tools (Vitest, Jest, etc.)
- **Test Implementation**: Write actual test code following best practices
- **Mock Strategies**: Create and manage mocks for external dependencies
- **Coverage Analysis**: Ensure comprehensive test coverage
- **Quality Assurance**: Validate test quality and execution

## Agent Delegation Process

This command **ALWAYS** delegates to the testing-specialist agent using the Task tool:

1. **Parse Requirements**: Analyze user input for testing scope and context
2. **Gather Context**: Identify target files, packages, and testing requirements (use git diff when no specific target provided)
3. **Delegate to Agent**: Use Task tool to engage testing-specialist with detailed requirements
4. **Monitor Progress**: Track agent progress and provide coordination if needed
5. **Validate Results**: Ensure agent deliverables meet requirements and quality standards

### Delegation Pattern
```markdown
Task: "Create comprehensive tests for [target]"
Agent: testing-specialist
Context: [File paths, testing requirements, coverage needs, specific scenarios]
```

The testing-specialist agent handles all technical implementation including framework selection, test writing, mock creation, and quality validation.

## Requirements Passed to Testing-Specialist

### Coverage Requirements (Delegated)
The command passes these requirements to the testing-specialist agent:
- **New Functions/Methods**: 100% coverage required
- **Modified Code**: Update existing tests + new scenarios
- **API Endpoints**: Success paths, validation, error responses  
- **Database Operations**: CRUD operations and transactions
- **Authentication/Authorization**: All security scenarios
- **Real-time Features**: WebSocket connections and event handling

### Test Scenarios (Agent Implemented)
The testing-specialist agent implements these scenarios:
- **Happy Path**: Normal operation with valid inputs
- **Edge Cases**: Boundary conditions, empty inputs, maximum values
- **Error Handling**: Invalid inputs, network failures, service unavailability
- **Integration**: Service-to-service communication, database interactions
- **Security**: Authentication failures, authorization checks, input sanitization

## Supported Test Types

### Unit Tests
- Individual functions and methods
- Component behavior and rendering
- Service class methods
- Utility functions and helpers

### Integration Tests
- API endpoint testing
- Database operations
- Service-to-service communication
- WebSocket connection handling

### Component Tests  
- React component rendering
- User interaction handling
- Form validation and submission
- State management and effects

### End-to-End Tests
- Complete user workflows
- Cross-service integration flows
- Authentication and authorization flows
- Real-time communication scenarios

## Quality Standards

### Test Quality Requirements
- **Independence**: Each test runs independently
- **Clarity**: Descriptive test names and clear scenarios
- **Completeness**: Cover success paths, edge cases, and errors
- **Maintainability**: Use arrange-act-assert patterns
- **Performance**: Fast execution without external dependencies

### Mock Management Standards
- **Consistent Patterns**: Follow established mocking strategies
- **Proper Cleanup**: Clear mocks between tests
- **Realistic Behavior**: Mocks reflect real service behavior
- **Type Safety**: Use TypeScript for mock definitions
- **Shared Utilities**: Reusable mock factories for common scenarios

## Command Implementation Process

This orchestration command follows this workflow:

1. **Requirement Parsing**: Analyze user input and extract testing requirements
2. **Context Analysis**: Identify target files, packages, and scope of testing needed
   - **Default behavior (no target specified)**: Use `git diff` to identify changed .ts/.js/.tsx files
   - **Specific targets provided**: Use the specified files/directories for testing scope
   - Filter out non-testable files (config, build files, etc.)
   - Focus on code files that require test coverage
3. **Agent Task Creation**: Formulate detailed task description for testing-specialist
4. **Agent Delegation**: Use Task tool to engage testing-specialist with requirements
5. **Progress Monitoring**: Track agent work and provide guidance if needed
6. **Result Validation**: Confirm deliverables meet requirements and quality standards

### No Direct Implementation
This command does **NOT** implement tests directly - all technical work is delegated to the testing-specialist agent who has the expertise across all testing frameworks and technologies.

## Output and Validation

### Success Criteria
- All new tests pass successfully
- Existing tests continue to pass (no regressions)
- Coverage requirements met for new/modified code
- Tests follow established patterns (Vitest/Jest)
- Proper mock cleanup and test independence
- External dependencies appropriately mocked

### Quality Checkpoints
- [ ] Tests are independent and isolated
- [ ] Descriptive test names and clear scenarios  
- [ ] Comprehensive coverage of functionality
- [ ] Proper async testing patterns used
- [ ] Mock strategies implemented correctly
- [ ] Integration points tested appropriately

## Clear Role Separation

### Write-Tests Command (Orchestrator)
- **Role**: Requirements analysis and agent delegation
- **Responsibilities**: Parse input, gather context, delegate to testing-specialist
- **Does NOT**: Write test code, choose frameworks, implement mocks, or execute tests

### Testing-Specialist Agent (Expert Implementation)
- **Role**: Technical test implementation across all technologies
- **Responsibilities**: Framework selection, test writing, mock creation, coverage validation
- **Expertise**: Vitest, Jest, React Testing Library, integration testing, all tech stack testing

This clear separation ensures the command focuses on orchestration while the testing-specialist agent provides deep expertise in test implementation across the entire technology stack.