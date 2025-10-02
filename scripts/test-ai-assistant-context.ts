#!/usr/bin/env tsx

/**
 * Test script to verify AI Assistant context injection
 * Simulates the queries you mentioned
 */

import { TelegamezContextManager } from '../src/lib/context/telegamez-context';

const testQueries = [
  {
    query: "list the first and last name of the candidates",
    expectedContext: false,
    description: "Document-specific query - should NOT include context"
  },
  {
    query: "what do you know about our startup company telegames?",
    expectedContext: true,
    description: "Company question - should include full Telegames context"
  },
  {
    query: "what is Telegamez mission?",
    expectedContext: true,
    description: "Direct company question - should include context"
  },
  {
    query: "tell me about our products",
    expectedContext: true,
    description: "Company products question - should include context"
  },
  {
    query: "how many candidates are in the document?",
    expectedContext: false,
    description: "Document-specific query - should NOT include context"
  }
];

console.log('\n=== AI Assistant Context Injection Test ===\n');

testQueries.forEach((test, index) => {
  const shouldInclude = TelegamezContextManager.shouldIncludeContext(test.query);
  const passed = shouldInclude === test.expectedContext;

  console.log(`${index + 1}. ${test.description}`);
  console.log(`   Query: "${test.query}"`);
  console.log(`   Expected: ${test.expectedContext ? 'Include' : 'Skip'} context`);
  console.log(`   Actual: ${shouldInclude ? 'Include' : 'Skip'} context`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (shouldInclude) {
    const basePrompt = `User query: ${test.query}`;
    const promptWithContext = TelegamezContextManager.buildPromptWithContext(basePrompt, {
      query: test.query,
      includeMinimal: false
    });
    console.log(`   Prompt size with context: ${promptWithContext.length} chars`);
  }
  console.log('');
});

// Show what the context looks like
console.log('\n=== Sample Context Preview ===\n');
const fullContext = TelegamezContextManager.getFullContext();
console.log(`Full context size: ${fullContext.length} chars`);
console.log('\nFirst 500 chars of context:');
console.log(fullContext.substring(0, 500));
console.log('...\n');
