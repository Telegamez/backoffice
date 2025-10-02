import { db } from '@/db/index';
import { adminAssistantAudit } from '@/db/db-schema';

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
  source: string;
}

export interface SearchParams {
  query: string;
  limit?: number;
  dateRestrict?: string; // e.g., 'd7' for last 7 days, 'm1' for last month
}

/**
 * SearchService integrates with Google Programmable Search API
 * Note: Free tier has 100 queries/day limit
 */
export class SearchService {
  private userEmail: string;
  private apiKey: string;
  private searchEngineId: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';

    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID');
    }
  }

  /**
   * Search using Google Programmable Search API
   */
  async search(params: SearchParams): Promise<SearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API not configured');
    }

    

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('cx', this.searchEngineId);
      url.searchParams.set('q', params.query);
      url.searchParams.set('num', String(Math.min(params.limit || 10, 10))); // Max 10 per request

      if (params.dateRestrict) {
        url.searchParams.set('dateRestrict', params.dateRestrict);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Search API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      const results: SearchResult[] = (data.items || []).map((item: Record<string, unknown>) => ({
        title: (item.title as string) || '',
        snippet: (item.snippet as string) || '',
        link: (item.link as string) || '',
        displayLink: (item.displayLink as string) || '',
        source: 'Google Search',
      }));

      // Log successful search
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'search_read', operation: 'query', success: true,
          details: {
            query: params.query,
            resultCount: results.length,
            source: 'google_search',
          },
        });
      }

      return results;
    } catch (error) {
      console.error('Google Search API error:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'search_read',
          operation: 'query',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            query: params.query,
          },
        });
      }

      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get trending topics (simulated by searching for popular keywords)
   * This is a simplified implementation - for real trending, you'd need additional APIs
   */
  async getTrendingTopics(keywords: string[], limit: number = 10): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    for (const keyword of keywords) {
      try {
        const results = await this.search({
          query: keyword,
          limit: Math.ceil(limit / keywords.length),
          dateRestrict: 'd1', // Last 24 hours
        });

        allResults.push(...results);
      } catch (error) {
        console.error(`Failed to search for keyword "${keyword}":`, error);
        // Continue with other keywords
      }
    }

    // Sort by relevance (simplified - just return in order)
    return allResults.slice(0, limit);
  }

  /**
   * Search for news from the last N days
   */
  async searchRecent(query: string, daysAgo: number, limit: number = 10): Promise<SearchResult[]> {
    return this.search({
      query,
      limit,
      dateRestrict: `d${daysAgo}`,
    });
  }

  /**
   * Get inspirational quotes
   */
  async getQuotes(params?: { limit?: number; category?: string }): Promise<Array<{ text: string; author: string; category?: string }>> {
    const limit = params?.limit || 1;
    const category = params?.category || 'inspirational';

    try {
      // Search for quotes using Google Search API
      const searchQuery = `${category} quotes motivational`;
      const results = await this.search({
        query: searchQuery,
        limit: Math.min(limit * 2, 10), // Get more results to filter
      });

      // Simple fallback quotes if API is not configured or fails
      const fallbackQuotes = [
        {
          text: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          category: "motivation"
        },
        {
          text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          author: "Winston Churchill",
          category: "perseverance"
        },
        {
          text: "Believe you can and you're halfway there.",
          author: "Theodore Roosevelt",
          category: "confidence"
        },
        {
          text: "The future belongs to those who believe in the beauty of their dreams.",
          author: "Eleanor Roosevelt",
          category: "inspiration"
        },
        {
          text: "It does not matter how slowly you go as long as you do not stop.",
          author: "Confucius",
          category: "persistence"
        }
      ];

      // Return fallback quotes if no results
      if (results.length === 0) {
        return fallbackQuotes.slice(0, limit);
      }

      // For now, return fallback quotes (could enhance to parse from search results)
      return fallbackQuotes.slice(0, limit);
    } catch (error) {
      console.error('Error fetching quotes:', error);

      // Return fallback quotes on error
      return [
        {
          text: "The only way to do great work is to love what you do.",
          author: "Steve Jobs",
          category: "motivation"
        }
      ].slice(0, limit);
    }
  }

  /**
   * Fetch top stories from Hacker News
   */
  async getHackerNewsTop(params?: { limit?: number; includeFields?: string[] }): Promise<Array<{
    id: number;
    title: string;
    url?: string;
    score: number;
    time: number;
    rank: number;
  }>> {
    const limit = params?.limit || 30;

    try {
      // Fetch top story IDs from Hacker News API
      const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!topStoriesResponse.ok) {
        throw new Error(`Hacker News API error: ${topStoriesResponse.status}`);
      }

      const storyIds: number[] = await topStoriesResponse.json();
      const topStoryIds = storyIds.slice(0, limit);

      // Fetch details for each story
      const stories = await Promise.all(
        topStoryIds.map(async (id, index) => {
          try {
            const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            if (!storyResponse.ok) {
              return null;
            }
            const story = await storyResponse.json();

            return {
              id: story.id,
              title: story.title,
              url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
              score: story.score || 0,
              time: story.time,
              rank: index + 1,
            };
          } catch (error) {
            console.error(`Failed to fetch HN story ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed fetches
      const validStories = stories.filter((s): s is NonNullable<typeof s> => s !== null);

      // Log successful fetch
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'search_read',
          operation: 'hacker_news_top',
          success: true,
          details: {
            storyCount: validStories.length,
            source: 'hacker_news',
          },
        });
      }

      return validStories;
    } catch (error) {
      console.error('Hacker News API error:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'search_read',
          operation: 'hacker_news_top',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            limit,
          },
        });
      }

      throw new Error(`Hacker News fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetch content from web URLs
   */
  async fetchContent(params: {
    items: string | Array<{ url?: string; [key: string]: unknown }>;
    fields?: string[];
    timeoutSec?: number;
  }): Promise<Array<{ url: string; title?: string; content?: string; error?: string }>> {
    const timeout = (params.timeoutSec || 10) * 1000;
    const items = typeof params.items === 'string' ? [] : params.items;

    const results = await Promise.all(
      items.map(async (item) => {
        const url = item.url;
        if (!url) {
          return { url: '', error: 'No URL provided' };
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TelegamezBot/1.0)',
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            return { url, error: `HTTP ${response.status}` };
          }

          const html = await response.text();

          // Simple HTML parsing - extract title and meta description
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : item.title || '';

          // Extract text content (very basic - just get text between body tags)
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          let content = '';

          if (bodyMatch) {
            // Remove scripts and styles
            content = bodyMatch[1]
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 5000); // Limit to 5000 chars
          }

          return { url, title, content };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return { url, error: errorMsg };
        }
      })
    );

    // Log the fetch operation
    if (db) {
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'search_read',
        operation: 'fetch_content',
        success: true,
        details: {
          urlCount: items.length,
          successCount: results.filter(r => !r.error).length,
        },
      });
    }

    return results;
  }

  /**
   * Check if Search API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.searchEngineId);
  }
}
