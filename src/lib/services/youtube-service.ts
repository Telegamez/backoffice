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

export interface YouTubePlaylist {
  id: string;
  title: string;
  description: string;
  privacyStatus: 'private' | 'public' | 'unlisted';
  itemCount?: number;
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
   * Create a new playlist
   */
  async createPlaylist(
    title: string,
    description: string = '',
    privacyStatus: 'private' | 'public' | 'unlisted' = 'private'
  ): Promise<YouTubePlaylist> {
    try {
      const youtube = await this.googleClient.getYouTubeClient();

      const response = await youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        },
      });

      const playlist = response.data;

      // Log successful creation
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_write',
          operation: 'create_playlist',
          success: true,
          details: {
            playlistId: playlist.id,
            title,
            privacyStatus,
          },
        });
      }

      return {
        id: playlist.id || '',
        title: (playlist.snippet?.title as string) || title,
        description: (playlist.snippet?.description as string) || description,
        privacyStatus: (playlist.status?.privacyStatus as 'private' | 'public' | 'unlisted') || privacyStatus,
      };
    } catch (error) {
      console.error('Failed to create playlist:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_write',
          operation: 'create_playlist',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: { title },
        });
      }

      throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add videos to a playlist
   */
  async addVideosToPlaylist(playlistId: string, videoIds: string[]): Promise<void> {
    try {
      const youtube = await this.googleClient.getYouTubeClient();

      // Add each video to the playlist
      for (const videoId of videoIds) {
        await youtube.playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId,
              },
            },
          },
        });
      }

      // Log successful addition
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_write',
          operation: 'add_videos_to_playlist',
          success: true,
          details: {
            playlistId,
            videoCount: videoIds.length,
            videoIds,
          },
        });
      }
    } catch (error) {
      console.error('Failed to add videos to playlist:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'youtube_write',
          operation: 'add_videos_to_playlist',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            playlistId,
            videoCount: videoIds.length,
          },
        });
      }

      throw new Error(`Failed to add videos to playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search videos and create a private playlist with results
   */
  async searchAndCreatePlaylist(
    query: string,
    playlistTitle: string,
    playlistDescription: string = '',
    maxResults: number = 10
  ): Promise<{ playlist: YouTubePlaylist; videos: YouTubeVideo[] }> {
    try {
      // Search for videos
      const videos = await this.searchVideos({ query, maxResults });

      if (videos.length === 0) {
        throw new Error('No videos found for the search query');
      }

      // Create playlist
      const playlist = await this.createPlaylist(
        playlistTitle,
        playlistDescription,
        'private'
      );

      // Add videos to playlist
      const videoIds = videos.map(v => v.id);
      await this.addVideosToPlaylist(playlist.id, videoIds);

      return { playlist, videos };
    } catch (error) {
      throw new Error(`Failed to search and create playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
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
