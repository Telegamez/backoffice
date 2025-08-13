# Document Code

Orchestrates comprehensive JSDoc documentation for TypeScript/JavaScript files or directories.

## Usage

```
/document-code <file-or-directory-path>
```

## Examples

```bash
# Document a single file
/document-code packages/shared/db/src/auth.ts

# Document all files in a directory
/document-code packages/shared/db/src/

# Document entire package
/document-code packages/web-next/src/lib/
```

## Implementation

1. **Path Analysis**: Determine if input is file or directory
2. **File Discovery**: For directories, recursively find all .ts/.js/.tsx/.jsx files
3. **Todo Management**: Create comprehensive todo list for tracking
4. **Documentation**: Add JSDoc to all functions, classes, interfaces, and exports
5. **Quality Validation**: Ensure documentation meets project standards

```typescript
// This command executes the following logic:

async function documentCode(inputPath: string) {
  // 1. Validate and resolve the input path
  const resolvedPath = path.resolve(inputPath);
  const isDirectory = await isDir(resolvedPath);
  
  // 2. Create todo list for tracking progress
  const todoItems = [];
  
  if (isDirectory) {
    // 3. Find all TypeScript/JavaScript files recursively
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
      cwd: resolvedPath,
      ignore: [
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
      ]
    });
    
    // 4. Create todo item for each file
    for (const file of files) {
      todoItems.push({
        id: generateId(),
        content: `Document ${file}`,
        status: 'pending',
        priority: 'high'
      });
    }
  } else {
    // Single file documentation
    todoItems.push({
      id: generateId(),
      content: `Document ${path.basename(inputPath)}`,
      status: 'pending',
      priority: 'high'
    });
  }
  
  // 5. Execute documentation for each file
  for (const todo of todoItems) {
    await documentSingleFile(filePath);
    // Update todo status to completed
  }
}

async function documentSingleFile(filePath: string) {
  // 1. Read file content
  const content = await readFile(filePath);
  
  // 2. Analyze code structure (functions, classes, interfaces, exports)
  const codeElements = analyzeCode(content);
  
  // 3. Add JSDoc documentation using MultiEdit
  const edits = generateJSDocEdits(codeElements);
  await applyEdits(filePath, edits);
  
  // 4. Validate documentation completeness
  await validateDocumentation(filePath);
}
```

## Documentation Standards

- **Functions**: Parameter types, return types, error conditions, usage examples
- **Classes**: Constructor parameters, methods, properties, inheritance
- **Interfaces/Types**: Purpose, property descriptions, usage context
- **Constants/Exports**: Purpose, type information, usage guidelines
- **Async Functions**: Promise resolution/rejection details
- **Deprecated Items**: Clear deprecation notices with alternatives

## Files Included

- `.ts` - TypeScript files
- `.js` - JavaScript files
- `.tsx` - TypeScript React components
- `.jsx` - JavaScript React components

## Files Excluded

- `.test.ts/.js` - Test files (have separate documentation needs)
- `.spec.ts/.js` - Specification files
- `.d.ts` - Type definition files (already documented)
- `node_modules/` - Dependencies
- `dist/`, `build/` - Built files

## Quality Checks

- Ensures all public functions have documentation
- Validates parameter and return type documentation
- Checks for proper JSDoc syntax
- Verifies deprecation notices include alternatives
- Confirms error conditions are documented

## Agent Orchestration

This command uses the following workflow:

1. **General Purpose Agent**: File discovery and path analysis
2. **Documentation Specialist**: JSDoc generation and quality standards
3. **Code Archaeologist**: Complex code structure analysis (when needed)
4. **Frontend/Backend Specialists**: Framework-specific documentation patterns

## Output

- Comprehensive JSDoc documentation for all discovered files
- Todo list tracking showing progress
- Summary of files documented and changes made
- Validation report confirming documentation completeness