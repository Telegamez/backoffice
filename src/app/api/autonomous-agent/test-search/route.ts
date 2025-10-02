import { NextResponse } from 'next/server';
import { SearchService } from '@/lib/services/search-service';

/**
 * GET /api/autonomous-agent/test-search
 * Test endpoint to verify Google Search API configuration
 */
export async function GET() {
  try {
    const searchService = new SearchService('test@example.com');

    // Check if configured
    if (!searchService.isConfigured()) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'Google Search API is not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID',
      }, { status: 400 });
    }

    // Test search
    const results = await searchService.search({
      query: 'artificial intelligence news',
      limit: 5,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Google Search API is working!',
      configured: true,
      resultCount: results.length,
      sampleResults: results.slice(0, 2).map(r => ({
        title: r.title,
        snippet: r.snippet.substring(0, 100) + '...',
        source: r.displayLink,
      })),
    });
  } catch (error) {
    console.error('Search API test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      configured: true,
      working: false,
    }, { status: 500 });
  }
}
