# Doc-It.md Command

Automatically updates all READMEs, documentation files, and CLAUDE.md based on recent code changes.

## Purpose
This command analyzes recent code changes and automatically updates:
- Project README files
- Documentation in `_docs/` directories
- CLAUDE.md with new workflow memories and guidelines
- Package-specific README files
- API documentation

## Usage
When you run this command, it will:
1. Analyze git diff to identify all code changes since last commit
2. Determine which documentation files need updates based on the changes
3. Update relevant sections in documentation files
4. Update CLAUDE.md with any new patterns, dependencies, or workflows discovered
5. Generate documentation within the edited files for new functions, classes, or modules
6. Update package README files if package.json or core functionality changed
7. Ensure all documentation is consistent and up-to-date

## Implementation Steps
1. **Analyze Changes**
   - Run `git diff` and `git status` to identify modified files
   - Parse changes to understand what was added, modified, or removed
   - Identify affected packages and components

2. **Determine Documentation Scope**
   - Map code changes to relevant documentation files
   - Identify which README files need updates
   - Check if CLAUDE.md needs new workflow memories or guidelines

3. **Update Documentation**
   - Update project-level README if architecture or setup changed
   - Update package README files for affected packages
   - Add new API documentation for new endpoints or functions
   - Update CLAUDE.md with new development patterns or dependencies
   - Ensure examples and code snippets reflect current implementation

4. **Validation**
   - Verify all file paths and imports in documentation are correct
   - Ensure code examples in docs match actual implementation
   - Check that setup instructions are accurate

## Documentation Update Rules
- Preserve existing documentation structure and formatting
- Only update sections directly affected by code changes
- Add new sections for new features or components
- Update examples to reflect current code patterns
- Keep CLAUDE.md workflow memories concise and actionable
- Ensure all technical details are accurate
- Update dependency lists if package.json changed
- Add migration notes for breaking changes

## Files to Monitor
- `README.md` files at all levels
- `CLAUDE.md` for workflow memories and guidelines
- `_docs/Architecture/**/*.md` for detailed architecture documentation
- `_docs/ImplementationSpecs/**/*.md` for detailed implementation documentation
- `_docs/ImplementationSpecs/TechDebt/*.md` for detailed changes that will be deferred to a future work effort
- `packages/*/README.md` for package-specific docs
- API documentation files
- Architecture documentation
- Setup and installation guides