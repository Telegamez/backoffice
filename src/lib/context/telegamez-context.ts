import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * TelegamezContextManager - Smart context injection for LLM interactions
 *
 * Only includes company context when:
 * 1. User explicitly mentions Telegamez/company topics
 * 2. Task personalization includes company keywords
 * 3. User has opted-in to always include context
 *
 * This minimizes token usage while ensuring relevant context is available.
 */
export class TelegamezContextManager {
  // Keywords that trigger context inclusion
  private static readonly TRIGGER_KEYWORDS = [
    'telegamez',
    'telegames',
    'our company',
    'our startup',
    'our mission',
    'our product',
    'our team',
    'company context',
    'company background',
    'about us',
    'who we are',
    'what we do',
  ];

  // Cache for loaded context to avoid repeated file reads
  private static contextCache: string | null = null;
  private static minimalContextCache: string | null = null;

  /**
   * Determine if Telegamez context should be included based on query analysis
   */
  static shouldIncludeContext(
    query: string,
    options?: {
      keywords?: string[];
      userPreference?: boolean;
      contextData?: Record<string, unknown>;
    }
  ): boolean {
    // User has explicitly opted-in
    if (options?.userPreference === true) {
      return true;
    }

    const lowerQuery = query.toLowerCase();

    // Check if query explicitly mentions company
    const hasCompanyMention = this.TRIGGER_KEYWORDS.some(keyword =>
      lowerQuery.includes(keyword.toLowerCase())
    );

    if (hasCompanyMention) {
      return true;
    }

    // Check if personalization keywords suggest company focus
    if (options?.keywords && options.keywords.length > 0) {
      const hasCompanyKeywords = options.keywords.some(keyword =>
        this.TRIGGER_KEYWORDS.some(trigger =>
          keyword.toLowerCase().includes(trigger.toLowerCase())
        )
      );

      if (hasCompanyKeywords) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get full Telegamez context from markdown file
   */
  static getFullContext(): string {
    if (this.contextCache) {
      return this.contextCache;
    }

    try {
      const contextPath = path.join(process.cwd(), '_docs', 'company', 'telegamez-context.md');

      if (fs.existsSync(contextPath)) {
        this.contextCache = fs.readFileSync(contextPath, 'utf-8');
        return this.contextCache;
      }
    } catch (error) {
      console.warn('Failed to load Telegamez context from file:', error);
    }

    // Fallback to embedded minimal context
    return this.getInlineContext();
  }

  /**
   * Get a minimal context snippet (for when full context isn't in file)
   */
  static getMinimalContext(): string {
    if (this.minimalContextCache) {
      return this.minimalContextCache;
    }

    this.minimalContextCache = `# Telegamez - Company Context

**Telegamez** is a gaming platform startup focused on creating innovative gaming experiences.

For detailed company information, users can ask: "Tell me about Telegamez" or "What is our company's mission?"
`;

    return this.minimalContextCache;
  }

  /**
   * Get inline context (fallback when file doesn't exist)
   */
  private static getInlineContext(): string {
    return `# Telegamez - Company Context

**Telegamez** is a gaming platform startup building the next generation of interactive gaming experiences.

## Our Mission
To revolutionize how people connect and play games together.

## Our Products
We are building a comprehensive backoffice platform that includes:
- AI Admin Assistant: Document analysis and email automation
- Autonomous Agent Scheduler: Automated task scheduling and execution
- GitHub Timeline: Development activity visualization
- Multi-provider authentication and integration management

## Technology Stack
- Next.js 15 with React 19
- TypeScript for type safety
- PostgreSQL with Drizzle ORM
- NextAuth.js for authentication
- OpenAI GPT models for AI capabilities

## Team Culture
We value innovation, automation, and building powerful tools that enhance productivity.

---
*For more details, please refer to company documentation or ask specific questions about Telegamez.*
`;
  }

  /**
   * Build prompt with conditional context injection
   */
  static buildPromptWithContext(
    basePrompt: string,
    options?: {
      query?: string;
      keywords?: string[];
      userPreference?: boolean;
      contextData?: Record<string, unknown>;
      includeMinimal?: boolean;
    }
  ): string {
    const shouldInclude = this.shouldIncludeContext(
      options?.query || basePrompt,
      {
        keywords: options?.keywords,
        userPreference: options?.userPreference,
        contextData: options?.contextData,
      }
    );

    if (!shouldInclude) {
      return basePrompt;
    }

    // Include minimal or full context based on option
    const context = options?.includeMinimal
      ? this.getMinimalContext()
      : this.getFullContext();

    return `${context}

---

${basePrompt}`;
  }

  /**
   * Generate a cache key that includes context flag
   * Useful for Redis caching with context-aware keys
   */
  static generateCacheKey(
    operation: string,
    parameters: Record<string, unknown>,
    includeContext: boolean
  ): string {
    const paramsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(parameters))
      .digest('hex');

    return `llm:${operation}:${paramsHash}:ctx:${includeContext ? '1' : '0'}`;
  }

  /**
   * Clear cached context (useful if context file is updated)
   */
  static clearCache(): void {
    this.contextCache = null;
    this.minimalContextCache = null;
  }

  /**
   * Check if context file exists
   */
  static hasContextFile(): boolean {
    try {
      const contextPath = path.join(process.cwd(), '_docs', 'company', 'telegamez-context.md');
      return fs.existsSync(contextPath);
    } catch {
      return false;
    }
  }

  /**
   * Get context statistics (for monitoring)
   */
  static getContextStats(): {
    hasFile: boolean;
    fullContextLength: number;
    minimalContextLength: number;
    estimatedTokens: {
      full: number;
      minimal: number;
    };
  } {
    const fullContext = this.getFullContext();
    const minimalContext = this.getMinimalContext();

    // Rough token estimation (1 token ≈ 4 characters)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    return {
      hasFile: this.hasContextFile(),
      fullContextLength: fullContext.length,
      minimalContextLength: minimalContext.length,
      estimatedTokens: {
        full: estimateTokens(fullContext),
        minimal: estimateTokens(minimalContext),
      },
    };
  }
}
