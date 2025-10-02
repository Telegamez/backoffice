import { TelegamezContextManager } from '../telegamez-context';

describe('TelegamezContextManager', () => {
  beforeEach(() => {
    // Clear cache between tests
    TelegamezContextManager.clearCache();
  });

  describe('shouldIncludeContext', () => {
    it('should include context when query mentions Telegamez', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'What does Telegamez do?'
      );
      expect(result).toBe(true);
    });

    it('should include context when query mentions company', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'Tell me about our company mission'
      );
      expect(result).toBe(true);
    });

    it('should NOT include context for generic queries', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'What are my meetings today?'
      );
      expect(result).toBe(false);
    });

    it('should NOT include context for trending topics', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'Show me trending AI news'
      );
      expect(result).toBe(false);
    });

    it('should include context when user preference is true', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'Random query',
        { userPreference: true }
      );
      expect(result).toBe(true);
    });

    it('should include context when keywords match', () => {
      const result = TelegamezContextManager.shouldIncludeContext(
        'Daily briefing',
        { keywords: ['Telegamez', 'company updates'] }
      );
      expect(result).toBe(true);
    });
  });

  describe('buildPromptWithContext', () => {
    it('should return base prompt when context not needed', () => {
      const basePrompt = 'What are my calendar events?';
      const result = TelegamezContextManager.buildPromptWithContext(basePrompt, {
        query: basePrompt,
      });
      expect(result).toBe(basePrompt);
    });

    it('should add context when query mentions company', () => {
      const basePrompt = 'Summarize our company mission';
      const result = TelegamezContextManager.buildPromptWithContext(basePrompt, {
        query: basePrompt,
      });
      expect(result).toContain('Telegamez');
      expect(result).toContain('---');
      expect(result).toContain(basePrompt);
    });

    it('should add minimal context when specified', () => {
      const basePrompt = 'Tell me about Telegamez products';
      const result = TelegamezContextManager.buildPromptWithContext(basePrompt, {
        query: basePrompt,
        includeMinimal: true,
      });
      expect(result.length).toBeLessThan(1000); // Minimal should be small
      expect(result).toContain(basePrompt);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate different keys for different context flags', () => {
      const params = { query: 'test', documentId: '123' };
      const key1 = TelegamezContextManager.generateCacheKey('inference', params, true);
      const key2 = TelegamezContextManager.generateCacheKey('inference', params, false);
      expect(key1).not.toBe(key2);
      expect(key1).toContain(':ctx:1');
      expect(key2).toContain(':ctx:0');
    });

    it('should generate same key for same params and context', () => {
      const params = { query: 'test', documentId: '123' };
      const key1 = TelegamezContextManager.generateCacheKey('inference', params, true);
      const key2 = TelegamezContextManager.generateCacheKey('inference', params, true);
      expect(key1).toBe(key2);
    });
  });

  describe('getContextStats', () => {
    it('should return context statistics', () => {
      const stats = TelegamezContextManager.getContextStats();
      expect(stats).toHaveProperty('hasFile');
      expect(stats).toHaveProperty('fullContextLength');
      expect(stats).toHaveProperty('minimalContextLength');
      expect(stats).toHaveProperty('estimatedTokens');
      expect(stats.estimatedTokens).toHaveProperty('full');
      expect(stats.estimatedTokens).toHaveProperty('minimal');
    });

    it('should show token estimates', () => {
      const stats = TelegamezContextManager.getContextStats();
      expect(stats.estimatedTokens.full).toBeGreaterThan(0);
      expect(stats.estimatedTokens.minimal).toBeGreaterThan(0);
      expect(stats.estimatedTokens.full).toBeGreaterThan(stats.estimatedTokens.minimal);
    });
  });
});

// Manual test scenarios
export const testScenarios = [
  {
    name: 'Generic calendar query',
    query: 'What are my meetings today?',
    expectedContext: false,
    expectedTokenSavings: '~500 tokens',
  },
  {
    name: 'Company-specific query',
    query: 'What is Telegamez mission and how do our products align?',
    expectedContext: true,
    expectedTokenSavings: '0 tokens (context needed)',
  },
  {
    name: 'Trending topics query',
    query: 'Show me top 5 AI news from yesterday',
    expectedContext: false,
    expectedTokenSavings: '~500 tokens',
  },
  {
    name: 'Company culture query',
    query: 'Tell me about our company culture and values',
    expectedContext: true,
    expectedTokenSavings: '0 tokens (context needed)',
  },
  {
    name: 'Email composition',
    query: 'Compose a professional email about my schedule',
    expectedContext: false,
    expectedTokenSavings: '~500 tokens',
  },
  {
    name: 'Company email composition',
    query: 'Compose an email about Telegamez product updates',
    expectedContext: true,
    expectedTokenSavings: '0 tokens (context needed)',
  },
];

// Run test scenarios
export function runTestScenarios() {
  console.log('\n=== Telegamez Context Manager Test Scenarios ===\n');

  testScenarios.forEach((scenario, index) => {
    const shouldInclude = TelegamezContextManager.shouldIncludeContext(scenario.query);
    const passed = shouldInclude === scenario.expectedContext;

    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Query: "${scenario.query}"`);
    console.log(`   Expected context: ${scenario.expectedContext}`);
    console.log(`   Actual context: ${shouldInclude}`);
    console.log(`   Token savings: ${scenario.expectedTokenSavings}`);
    console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
  });

  // Show statistics
  const stats = TelegamezContextManager.getContextStats();
  console.log('=== Context Statistics ===');
  console.log(`Context file exists: ${stats.hasFile}`);
  console.log(`Full context: ${stats.fullContextLength} chars (~${stats.estimatedTokens.full} tokens)`);
  console.log(`Minimal context: ${stats.minimalContextLength} chars (~${stats.estimatedTokens.minimal} tokens)`);
  console.log(`\nToken savings per non-company query: ~${stats.estimatedTokens.full} tokens`);
  console.log(`Expected optimization: 95%+ of queries skip context\n`);
}
