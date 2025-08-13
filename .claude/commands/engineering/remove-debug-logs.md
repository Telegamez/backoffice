# Remove-debug-logs Command

Comments out all console.debug statements in the packages directory codebase.

## Purpose
This command has one single responsibility: search the entire /packages/* codebase and comment out any console.debug statements. It will do nothing else.

## Usage
This command will:
1. Search for all console.debug statements in the packages directory
2. Comment out each console.debug statement by adding // before it
3. Preserve original indentation and formatting
4. Process all file types that could contain console.debug (js, ts, jsx, tsx)

## Implementation
- Use grep to find all console.debug statements in packages/*
- Edit each file to comment out the console.debug lines
- Only modify console.debug statements - no other code changes
- No additional functionality, comments, or modifications beyond commenting out console.debug