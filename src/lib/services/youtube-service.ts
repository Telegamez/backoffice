import { GoogleAPIClient } from '../google-api';
import { db } from '@/db/index';
import { adminAssistantAudit } from '@/db/db-schema';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl?: string;
  viewCount?: string;
  likeCount?: string;
  url: string;
}

export interface YouTubeSearchParams {
  query?: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: Date;
  publishedBefore?: Date;
}

/**
 * YouTubeService integrates with YouTube Data API v3
 * Provides access to trending videos, search, and video details
 */
export class YouTubeService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  /**
   * Get trending videos (most popular)
   * Note: This uses the videos.list API with chart=mostPopular
   */
  async getTrendingVideos(
    maxResults: number = 10,
    regionCode: string = 'US'
  ): Promise<YouTubeVideo[]> {
    

    try {
      const youtube = await this.googleClient.getYouTubeClient();

      const response = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults,
      });

      const videos = response.data.items || [];

      // Log successful access
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_read', operation: 'read', success: true,
          details: {
            operation: 'get_trending_videos',
            videoCount: videos.length,
            regionCode,
          },
        });
      }

      return videos.map(video => this.mapVideoToInterface(video));
    } catch (error) {
      console.error('Failed to get trending videos:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_read',
          operation: 'get_trending_videos',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {},
        });
      }

      throw new Error(`Failed to get trending videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos by query
   */
  async searchVideos(params: YouTubeSearchParams): Promise<YouTubeVideo[]> {
    

    try {
      const youtube = await this.googleClient.getYouTubeClient();

      const searchParams: any = {
        part: ['snippet'],
        type: ['video'],
        maxResults: params.maxResults || 10,
        order: params.order || 'relevance',
      };

      if (params.query) {
        searchParams.q = params.query;
      }

      if (params.publishedAfter) {
        searchParams.publishedAfter = params.publishedAfter.toISOString();
      }

      if (params.publishedBefore) {
        searchParams.publishedBefore = params.publishedBefore.toISOString();
      }

      const response = await youtube.search.list(searchParams);

      const items = response.data.items || [];

      // Get video IDs to fetch statistics
      const videoIds = items
        .map(item => item.id?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        return [];
      }

      // Fetch video details including statistics
      const videosResponse = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds,
      });

      const videos = videosResponse.data.items || [];

      // Log successful access
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_search', operation: 'search', success: true,
          details: {
            operation: 'search_videos',
            query: params.query,
            videoCount: videos.length,
          },
        });
      }

      return videos.map(video => this.mapVideoToInterface(video));
    } catch (error) {
      console.error('Failed to search videos:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_search',
          operation: 'search_videos',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            query: params.query,
          },
        });
      }

      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get videos from a specific date range (useful for "videos from last week")
   */
  async getRecentVideos(
    query: string,
    daysAgo: number,
    maxResults: number = 10
  ): Promise<YouTubeVideo[]> {
    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - daysAgo);

    return this.searchVideos({
      query,
      maxResults,
      order: 'date',
      publishedAfter,
    });
  }

  /**
   * Map YouTube API video object to our interface
   */
  private mapVideoToInterface(video: Record<string, unknown>): YouTubeVideo {
    const snippet = (video.snippet as Record<string, unknown>) || {};
    const statistics = (video.statistics as Record<string, unknown>) || {};
    const thumbnails = (snippet.thumbnails as Record<string, Record<string, unknown>>) || {};

    return {
      id: (video.id as string) || '',
      title: (snippet.title as string) || 'Untitled',
      description: (snippet.description as string) || '',
      channelId: (snippet.channelId as string) || '',
      channelTitle: (snippet.channelTitle as string) || 'Unknown Channel',
      publishedAt: (snippet.publishedAt as string) || new Date().toISOString(),
      thumbnailUrl: (thumbnails.medium?.url as string) || (thumbnails.default?.url as string),
      viewCount: statistics.viewCount as number,
      likeCount: statistics.likeCount as number,
      url: `https://www.youtube.com/watch?v=${video.id}`,
    };
  }
}
