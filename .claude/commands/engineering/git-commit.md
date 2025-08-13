# GitCommit Command

Creates a git commit with standardized formatting that extracts the ticket number from the current branch name.

## Format
```
[#TICKET-NUMBER} brief commit title

- change 1
- change 2
- etc...

```

## Usage
This command will:
1. Extract ticket number from current branch name (format: `123-description`)
2. Check git status and diff to understand changes
3. Add untracked files to staging area if applicable
4. Generate a commit message in the required format
5. Attempt to create the commit with proper formatting
  - NEVER use `--no-verify` to bypass failing hooks unless the user explicitly passes `--no-verify` as a parameter
6. Monitor commit execution for pre-commit hook errors and fix them if they occur
7. Ask user whether to push to origin
8. If yes, execute `git push` and monitor for pre-push hook errors
9. If push was successful, ask user whether to create a GitHub PR
10. If yes to PR, create a pull request using `gh pr create` with appropriate title and description
11. If no to push or PR, return to prompt

## Pre-commit Hook Monitoring
- **CRITICAL**: Monitor git commit execution for pre-commit hook failures
- If pre-commit hooks fail, analyze the error output and fix the issues automatically
- Common hook failures to handle:
  - Linting errors (ESLint, Prettier formatting)
  - Type checking errors (TypeScript compilation issues)
  - Test failures (if tests are run in pre-commit hooks)
  - Code formatting issues
- After fixing hook errors, retry the commit automatically
- Display clear error messages and fixes applied to the user
  
## Implementation
- Automatically parses branch name to extract ticket number
- Analyzes staged and unstaged changes
- Adds untracked files to staging area when needed
- Creates bulleted list of changes
- Follows project's commit message conventions. ***Do not add any other content or text than what is specified in the format provided***
- ***IMPORTANT: DO NOT EVER add Claude Code attribution, "Generated with Claude Code", "Co-Authored-By: Claude", or any similar attribution text to the Git message***
- ***The commit message must ONLY contain the ticket number, title, and bulleted changes - nothing else***
- Show the user the final commit message used for the commit
- Prompts user for push confirmation after successful commit
- After successful push, prompts user for PR creation
- Uses ticket number from branch name and commit history to generate PR title and description
- Creates PR against the rc6 branch with proper formatting