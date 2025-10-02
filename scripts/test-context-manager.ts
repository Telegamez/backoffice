#!/usr/bin/env tsx

/**
 * Test script for TelegamezContextManager
 *
 * Usage:
 *   npm run test:context
 *   or
 *   tsx scripts/test-context-manager.ts
 */

import { TelegamezContextManager } from '../src/lib/context/telegamez-context';

// Test scenarios
const testScenarios = [
  {
    name: 'Generic calendar query',
    query: 'What are my meetings today?',
    expectedContext: false,
    description: 'Should NOT include context - generic calendar query',
  },
  {
    name: 'Company mission query',
    query: 'What is Telegamez mission and how do our products align?',
    expectedContext: true,
    description: 'Should include context - explicitly mentions Telegamez',
  },
  {
    name: 'Trending AI news',
    query: 'Show me top 5 AI news from yesterday',
    expectedContext: false,
    description: 'Should NOT include context - trending topics query',
  },
  {
    name: 'Company culture',
    query: 'Tell me about our company culture and values',
    expectedContext: true,
    description: 'Should include context - asks about company',
  },
  {
    name: 'Professional email',
    query: 'Compose a professional email about my schedule',
    expectedContext: false,
    description: 'Should NOT include context - generic email composition',
  },
  {
    name: 'Company product email',
    query: 'Compose an email about Telegamez product updates',
    expectedContext: true,
    description: 'Should include context - mentions Telegamez products',
  },
  {
    name: 'YouTube trending',
    query: 'Find trending gaming videos from this week',
    expectedContext: false,
    description: 'Should NOT include context - generic content search',
  },
  {
    name: 'Company background',
    query: 'What does our startup do and who are we?',
    expectedContext: true,
    description: 'Should include context - asks about startup/company',
  },
  {
    name: 'Daily briefing generic',
    query: 'Send me my daily briefing',
    expectedContext: false,
    description: 'Should NOT include context - generic briefing',
  },
  {
    name: 'Daily briefing with company keyword',
    query: 'Send me my daily briefing',
    keywords: ['Telegamez', 'company updates'],
    expectedContext: true,
    description: 'Should include context - keywords mention company',
  },
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}=================================================`);
  console.log('  Telegamez Context Manager - Test Suite');
  console.log(`==================================================${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  testScenarios.forEach((scenario, index) => {
    const shouldInclude = TelegamezContextManager.shouldIncludeContext(scenario.query, {
      keywords: scenario.keywords,
    });

    const isPass = shouldInclude === scenario.expectedContext;
    if (isPass) passed++;
    else failed++;

    const statusIcon = isPass ? `${colors.green}✅` : `${colors.red}❌`;
    const statusText = isPass ? 'PASS' : 'FAIL';

    console.log(`${colors.bright}${index + 1}. ${scenario.name}${colors.reset}`);
    console.log(`   ${colors.blue}Query:${colors.reset} "${scenario.query}"`);
    if (scenario.keywords) {
      console.log(`   ${colors.blue}Keywords:${colors.reset} [${scenario.keywords.join(', ')}]`);
    }
    console.log(`   ${colors.yellow}Description:${colors.reset} ${scenario.description}`);
    console.log(`   Expected: ${scenario.expectedContext ? 'Include' : 'Skip'} context`);
    console.log(`   Actual: ${shouldInclude ? 'Include' : 'Skip'} context`);
    console.log(`   ${statusIcon} ${statusText}${colors.reset}\n`);
  });

  // Summary
  console.log(`${colors.bright}${colors.cyan}=================================================`);
  console.log('  Test Summary');
  console.log(`==================================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${testScenarios.length}\n`);

  // Context statistics
  console.log(`${colors.bright}${colors.cyan}=================================================`);
  console.log('  Context Statistics');
  console.log(`==================================================${colors.reset}`);

  const stats = TelegamezContextManager.getContextStats();
  console.log(`Context file exists: ${stats.hasFile ? colors.green + 'Yes' : colors.yellow + 'No (using inline)'}`);
  console.log(`${colors.reset}Full context: ${stats.fullContextLength} chars (~${stats.estimatedTokens.full} tokens)`);
  console.log(`Minimal context: ${stats.minimalContextLength} chars (~${stats.estimatedTokens.minimal} tokens)`);
  console.log(`\n${colors.bright}Token savings per non-company query: ~${stats.estimatedTokens.full} tokens${colors.reset}`);

  // Calculate expected savings
  const contextSkipRate = testScenarios.filter(s => !s.expectedContext).length / testScenarios.length;
  const expectedOptimization = Math.round(contextSkipRate * 100);
  console.log(`${colors.green}Expected optimization: ${expectedOptimization}% of queries skip context${colors.reset}\n`);

  // Example prompts
  console.log(`${colors.bright}${colors.cyan}=================================================`);
  console.log('  Example Prompt Generation');
  console.log(`==================================================${colors.reset}\n`);

  // Example 1: Generic query (no context)
  const genericPrompt = TelegamezContextManager.buildPromptWithContext(
    'Summarize my calendar events for today',
    { query: 'Summarize my calendar events for today' }
  );
  console.log(`${colors.bright}1. Generic Query (No Context)${colors.reset}`);
  console.log(`   Prompt length: ${genericPrompt.length} chars`);
  console.log(`   Contains context: ${genericPrompt.includes('Telegamez') ? 'Yes' : 'No'}\n`);

  // Example 2: Company query (with context)
  const companyPrompt = TelegamezContextManager.buildPromptWithContext(
    'What are Telegamez core products?',
    { query: 'What are Telegamez core products?' }
  );
  console.log(`${colors.bright}2. Company Query (With Context)${colors.reset}`);
  console.log(`   Prompt length: ${companyPrompt.length} chars`);
  console.log(`   Contains context: ${companyPrompt.includes('Telegamez') ? 'Yes' : 'No'}\n`);

  // Cache key examples
  console.log(`${colors.bright}${colors.cyan}=================================================`);
  console.log('  Cache Key Generation');
  console.log(`==================================================${colors.reset}\n`);

  const params = { query: 'test query', documentId: '123' };
  const keyWithContext = TelegamezContextManager.generateCacheKey('inference', params, true);
  const keyWithoutContext = TelegamezContextManager.generateCacheKey('inference', params, false);

  console.log(`${colors.bright}Cache Keys (ensures separate caching):${colors.reset}`);
  console.log(`With context:    ${keyWithContext}`);
  console.log(`Without context: ${keyWithoutContext}\n`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
