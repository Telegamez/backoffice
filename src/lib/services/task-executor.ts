import { scheduledTasks } from '@/db/db-schema';
import type { InferSelectModel } from 'drizzle-orm';
import { YouTubeService } from './youtube-service';
import { SearchService } from './search-service';
import { CalendarService } from './calendar-service';
import { GmailService } from './gmail-service';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  generateDailyBriefing,
} from './email-templates';
import { parseSmartDate, extractDataArray, detectContentType, autoFormatAsHtml } from './smart-resolver';

type ScheduledTask = InferSelectModel<typeof scheduledTasks>;

interface ActionResult {
  service: string;
  operation: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * TaskExecutor executes the actions defined in a scheduled task
 * Orchestrates data collection, processing, and delivery steps
 */
export class TaskExecutor {
  /**
   * Execute all actions in a scheduled task
   * Returns the execution result
   */
  async execute(task: ScheduledTask): Promise<Record<string, unknown>> {
    console.log(`Executing task: ${task.name}`);

    // Context to store intermediate results from actions
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timezone = task.timezone || 'America/Los_Angeles';

    const context: Record<string, unknown> = {
      // Add built-in variables
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone }),
      today_long: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone }),
      today_short: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone }),
      today: now.toLocaleDateString('en-US', { timeZone: timezone }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone }),
      weekday: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
      month: now.toLocaleDateString('en-US', { month: 'long', timeZone: timezone }),
      year: now.getFullYear(),
      yesterday_date: yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone }),
      yesterday_short: yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone }),
      yesterday: yesterday.toLocaleDateString('en-US', { timeZone: timezone }),
    };
    const results: ActionResult[] = [];

    try {
      // Execute each action sequentially
      for (const action of task.actions) {
        console.log(`Executing action: ${action.type} - ${action.service}.${action.operation}`);

        try {
          const actionResult = await this.executeAction(action, context, task);

          // Store result in context if output binding is specified
          if (action.outputBinding) {
            context[action.outputBinding] = actionResult;
          }

          results.push({
            action: `${action.service}.${action.operation}`,
            status: 'success',
            data: actionResult,
          });
        } catch (actionError) {
          const errorMessage = actionError instanceof Error ? actionError.message : String(actionError);

          console.error(`Action failed: ${action.service}.${action.operation}`, actionError);

          results.push({
            action: `${action.service}.${action.operation}`,
            status: 'failed',
            error: errorMessage,
          });

          // Graceful degradation: continue with next action
          // unless it's a delivery action (critical)
          if (action.type === 'delivery') {
            throw new Error(`Critical delivery action failed: ${errorMessage}`);
          }
        }
      }

      return {
        status: 'success',
        results,
        context,
        completedActions: results.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        status: 'failed',
        error: errorMessage,
        results,
        completedActions: results.filter(r => r.status === 'success').length,
      };
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: ScheduledTask['actions'][0],
    context: Record<string, unknown>,
    task: ScheduledTask
  ): Promise<unknown> {
    // Replace template variables in parameters with values from context
    const parameters = this.resolveParameters(action.parameters, context);

    switch (action.service) {
      case 'calendar':
        return this.executeCalendarAction(action.operation, parameters, task.userEmail);

      case 'gmail':
        return this.executeGmailAction(action.operation, parameters, task.userEmail);

      case 'search':
        return this.executeSearchAction(action.operation, parameters, task.userEmail);

      case 'youtube':
        return this.executeYouTubeAction(action.operation, parameters, task.userEmail, task);

      case 'llm':
        return this.executeLLMAction(action.operation, parameters, context, task);

      default:
        throw new Error(`Unknown service: ${action.service}`);
    }
  }

  /**
   * Resolve template variables in parameters
   * Example: {body: "{{calendar_events}}"} -> {body: "...actual events..."}
   */
  private resolveParameters(
    parameters: Record<string, unknown>,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        // Replace {{variable}} with context value
        resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          const contextValue = context[varName];
          if (contextValue === undefined) {
            return match; // Keep placeholder if not found
          }

          // Handle different types properly
          if (typeof contextValue === 'string') {
            return contextValue;
          } else if (typeof contextValue === 'object' && contextValue !== null) {
            // For objects, check if it has a 'content' property (from LLM actions)
            if ('content' in contextValue) {
              return String(contextValue.content);
            }
            // Otherwise stringify the object nicely
            return JSON.stringify(contextValue, null, 2);
          }
          return String(contextValue);
        });
      } else if (Array.isArray(value) && value.includes('calendar_events')) {
        // Handle array references to context variables
        resolved[key] = value.map(v =>
          typeof v === 'string' && context[v] ? context[v] : v
        );
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Execute Calendar action
   */
  private async executeCalendarAction(
    operation: string,
    parameters: Record<string, unknown>,
    userEmail: string
  ): Promise<unknown> {
    const calendarService = new CalendarService(userEmail);

    if (operation === 'list_events') {
      let timeMin: Date | undefined;
      let timeMax: Date | undefined;

      // Parse timeMin
      if (parameters.timeMin === 'today') {
        timeMin = new Date();
        timeMin.setHours(0, 0, 0, 0);
      } else if (parameters.timeMin === 'now') {
        timeMin = new Date();
      } else if (parameters.timeMin && typeof parameters.timeMin === 'string') {
        timeMin = new Date(parameters.timeMin as string);
        if (isNaN(timeMin.getTime())) {
          timeMin = new Date(); // Fallback to now
        }
      }

      // Parse timeMax
      if (parameters.timeMax === 'today+24h' || parameters.timeMax === 'tomorrow') {
        timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 1);
        timeMax.setHours(23, 59, 59, 999);
      } else if (parameters.timeMax === 'end_of_day') {
        timeMax = new Date();
        timeMax.setHours(23, 59, 59, 999);
      } else if (parameters.timeMax && typeof parameters.timeMax === 'string') {
        timeMax = new Date(parameters.timeMax as string);
        if (isNaN(timeMax.getTime())) {
          timeMax = new Date();
          timeMax.setDate(timeMax.getDate() + 1); // Fallback to tomorrow
        }
      }

      const events = await calendarService.listEvents({
        timeMin,
        timeMax,
        maxResults: parameters.maxResults || 250,
      });

      // Get timezone from parameters or default to UTC
      const timezone = parameters.timeZone || parameters.timezone || 'America/Los_Angeles';

      return {
        events: events.map(e => ({
          title: e.summary,
          time: e.start.dateTime
            ? new Date(e.start.dateTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: timezone
              })
            : 'All day',
          location: e.location,
          description: e.description,
          attendees: e.attendees?.map(a => a.displayName || a.email),
        })),
      };
    }

    if (operation === 'get_today') {
      const events = await calendarService.getTodayEvents();
      return { events };
    }

    throw new Error(`Unknown calendar operation: ${operation}`);
  }

  /**
   * Execute Gmail action
   */
  private async executeGmailAction(
    operation: string,
    parameters: Record<string, unknown>,
    userEmail: string
  ): Promise<unknown> {
    const gmailService = new GmailService(userEmail);

    if (operation === 'send') {
      const to = parameters.to || userEmail;
      const subject = parameters.subject || 'Automated Task Result';
      const html = parameters.html || parameters.body || '';

      const result = await gmailService.sendHtmlEmail(to, subject, html);

      return {
        sent: true,
        to,
        subject,
        messageId: result.id,
      };
    }

    throw new Error(`Unknown gmail operation: ${operation}`);
  }

  /**
   * Execute Search action
   */
  private async executeSearchAction(
    operation: string,
    parameters: Record<string, unknown>,
    userEmail: string
  ): Promise<unknown> {
    const searchService = new SearchService(userEmail);

    if (!searchService.isConfigured()) {
      console.warn('Google Search API not configured, using mock data');
      return {
        results: [
          {
            title: 'AI breakthrough in natural language processing',
            source: 'Google Search',
            link: 'https://example.com/ai-news',
          },
        ],
      };
    }

    if (operation === 'search') {
      const query = parameters.query || '';
      const limit = parameters.limit || 10;
      const results = await searchService.search({ query, limit });
      return { results };
    }

    if (operation === 'trending') {
      const keywords = parameters.keywords || ['AI', 'technology'];
      const limit = parameters.limit || 10;
      const results = await searchService.getTrendingTopics(keywords, limit);
      return { results };
    }

    if (operation === 'web_search') {
      // Alias for search
      const query = parameters.query || '';
      const limit = parameters.limit || 10;
      const results = await searchService.search({ query, limit });
      return { results };
    }

    if (operation === 'quotes') {
      const limit = parameters.limit || 1;
      const category = parameters.category || 'inspirational';
      const quotes = await searchService.getQuotes({ limit, category });
      return { quotes };
    }

    throw new Error(`Unknown search operation: ${operation}`);
  }

  /**
   * Execute YouTube action
   */
  private async executeYouTubeAction(
    operation: string,
    parameters: Record<string, unknown>,
    userEmail: string,
    task: ScheduledTask
  ): Promise<unknown> {
    const youtubeService = new YouTubeService(userEmail);

    if (operation === 'trending') {
      const maxResults = parameters.maxResults || parameters.limit || 10;
      const regionCode = parameters.regionCode || 'US';
      const videos = await youtubeService.getTrendingVideos(maxResults, regionCode);
      return { videos };
    }

    if (operation === 'search') {
      const query = parameters.query || '';
      const maxResults = parameters.maxResults || parameters.limit || 10;
      const order = parameters.order || 'relevance';

      // Use smart date parser for publishedAfter
      const publishedAfter = parseSmartDate(parameters.publishedAfter as any, {
        timezone: task.timezone || 'America/Los_Angeles'
      });

      const videos = await youtubeService.searchVideos({
        query,
        maxResults,
        order: order as any,
        publishedAfter
      });
      return { videos };
    }

    if (operation === 'recent') {
      const query = parameters.query || '';
      const daysAgo = parameters.daysAgo || 7;
      const maxResults = parameters.maxResults || parameters.limit || 10;
      const videos = await youtubeService.getRecentVideos(query, daysAgo, maxResults);
      return { videos };
    }

    throw new Error(`Unknown youtube operation: ${operation}`);
  }

  /**
   * Execute LLM action (filtering, summarization, etc.)
   */
  private async executeLLMAction(
    operation: string,
    parameters: Record<string, unknown>,
    context: Record<string, unknown>,
    task: ScheduledTask
  ): Promise<unknown> {
    console.log(`LLM.${operation}`, parameters);

    if (operation === 'filter_events') {
      // Filter calendar events based on criteria
      const inputs = parameters.inputs || [];
      const filters = parameters.filters || {};
      const timezone = parameters.timezone || 'UTC';

      // Extract events from inputs or context
      let events: unknown[] = [];
      for (const input of inputs as unknown[]) {
        if (Array.isArray(input)) {
          events = input;
        } else if (typeof input === 'object' && input !== null && 'events' in input) {
          events = (input as { events: unknown[] }).events;
        }
      }

      // Also check context for calendar_events
      if (events.length === 0 && context.calendar_events) {
        const calData = context.calendar_events;
        if (typeof calData === 'object' && calData !== null && 'events' in calData) {
          events = (calData as { events: unknown[] }).events;
        }
      }

      // For now, just return all events - AI can handle filtering
      // In future, we could add more sophisticated filtering here
      return {
        events,
        count: events.length,
        timezone,
      };
    }

    if (operation === 'summarize_schedule') {
      // Summarize calendar schedule
      const inputs = parameters.inputs || [];
      const tone = parameters.tone || 'professional';
      const timezone = parameters.timezone || 'UTC';

      // Extract calendar events from inputs or context
      let events: unknown[] = [];
      for (const input of inputs as unknown[]) {
        if (Array.isArray(input)) {
          events = input;
        } else if (typeof input === 'object' && input !== null && 'events' in input) {
          events = (input as { events: unknown[] }).events;
        }
      }

      // Also check context for calendar_events
      if (events.length === 0 && context.calendar_events) {
        const calData = context.calendar_events;
        if (typeof calData === 'object' && calData !== null && 'events' in calData) {
          events = (calData as { events: unknown[] }).events;
        }
      }

      if (events.length === 0) {
        return {
          content: `<div class="calendar-summary"><p>No events scheduled for today. Perfect time to focus on your priorities!</p></div>`,
          tone,
        };
      }

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `Summarize the following calendar events in a ${tone} tone:

${JSON.stringify(events, null, 2)}

Create a brief, actionable HTML summary highlighting:
- Key meetings and their purpose
- Time blocks and schedule structure
- Any preparation needed
- Motivational insights for the day

Return ONLY clean HTML (div/p/ul/li tags), no markdown.`,
        temperature: 0.7,
      });

      return {
        content: text.trim(),
        tone,
        format: 'html',
      };
    }

    if (operation === 'compose') {
      // Generic compose operation - similar to compose_email but more flexible
      const inputs = parameters.inputs || [];
      const tone = parameters.tone || 'professional';
      const format = parameters.format || 'email_html';
      const layout = parameters.layout || {};
      const instructions = parameters.instructions || '';

      // Gather all input data from context
      const contextData: Record<string, unknown> = {};
      for (const inputName of inputs as string[]) {
        if (context[inputName]) {
          contextData[inputName] = context[inputName];
        }
      }

      // Check if there are meetings/events in the context data
      let hasMeetings = false;
      let meetingsList = [];
      for (const [key, value] of Object.entries(contextData)) {
        if (typeof value === 'object' && value !== null) {
          if ('events' in value && Array.isArray((value as any).events)) {
            meetingsList = (value as any).events;
            hasMeetings = meetingsList.length > 0;
          } else if (Array.isArray(value) && value.length > 0 && value[0]?.title) {
            meetingsList = value;
            hasMeetings = true;
          }
        }
      }

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `You are composing content in a ${tone} tone. Create ${format === 'email_html' ? 'an HTML email' : 'formatted content'} using the following data:

Current Date: ${context.today_long || context.date}
Current Time: ${context.time}

Data:
${JSON.stringify(contextData, null, 2)}

Layout requirements: ${JSON.stringify(layout)}

${instructions ? `Special instructions: ${instructions}` : ''}

CRITICAL REQUIREMENTS:
${hasMeetings ? `
- There are ${meetingsList.length} calendar meeting(s) in the data above
- YOU MUST list EVERY meeting with: title, time, location (if any), attendees (if any), and description
- DO NOT generate generic motivational content INSTEAD of showing meetings
- DO NOT say "no meetings" when there are meetings in the data
- Start with the meetings list FIRST, then add other content
` : `
- There are NO meetings in the calendar data
- Clearly state "No meetings scheduled for today"
- Then provide motivational content
`}
- Use a ${tone} tone
- Format as clean, professional HTML
- Use proper HTML tags (no markdown)
- Use the actual current date provided above, NOT template variables like {{today_long}}

Return ONLY the HTML content, no markdown code blocks.`,
        temperature: 0.3, // Lower temperature for more deterministic output
      });

      return {
        content: text.trim(),
        tone,
        format,
      };
    }

    if (operation === 'generate_quote') {
      // Generate a motivational quote
      const category = parameters.category || 'motivational';
      const limit = parameters.limit || 1;

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `Generate ${limit} inspiring ${category} quote(s) for startup founders and entrepreneurs.

Make it energetic, actionable, and focused on perseverance, innovation, and growth.
Keep it concise (1-2 sentences max per quote).
Do not include attribution or quotes marks, just the raw motivational message.`,
        temperature: 0.8,
      });

      return {
        content: text.trim(),
        category,
      };
    }

    if (operation === 'filter_and_rank') {
      // Filter and rank results by relevance
      const inputs = parameters.inputs || [];
      const keywords = parameters.keywords || parameters.highlight_keywords || [];
      const limit = parameters.limit || 10;

      // Use smart extractor to get data from any format
      const allResults: unknown[] = [];
      for (const inputName of inputs as string[]) {
        if (context[inputName]) {
          const extracted = extractDataArray(context[inputName]);
          allResults.push(...extracted);
        }
      }

      if (allResults.length === 0) {
        return { results: [], count: 0 };
      }

      // Use AI to filter and rank
      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `You are analyzing search results and trends. Filter and rank the following items by relevance to these keywords: ${keywords.join(', ')}

Data:
${JSON.stringify(allResults, null, 2)}

Return ONLY a JSON array of the top ${limit} most relevant items, maintaining their original structure but sorted by relevance. Focus on items related to: ${keywords.join(', ')}`,
        temperature: 0.3,
      });

      // Parse JSON response
      try {
        const ranked = JSON.parse(text.trim());
        return {
          results: Array.isArray(ranked) ? ranked : [ranked],
          count: Array.isArray(ranked) ? ranked.length : 1,
        };
      } catch {
        // Fallback: return first N items
        return {
          results: allResults.slice(0, limit),
          count: Math.min(allResults.length, limit),
        };
      }
    }

    if (operation === 'compose_email') {
      // Compose an HTML email from context data
      const inputs = parameters.inputs || [];
      const tone = parameters.tone || 'professional';
      const format = parameters.format || 'email_html';
      const keywords = parameters.highlight_keywords || [];

      // Gather all input data from context
      const contextData: Record<string, unknown> = {};
      for (const inputName of inputs as string[]) {
        if (context[inputName]) {
          contextData[inputName] = context[inputName];
        }
      }

      // Check if there are meetings/events in the context data
      let hasMeetings = false;
      let meetingsList = [];
      for (const [key, value] of Object.entries(contextData)) {
        if (typeof value === 'object' && value !== null) {
          if ('events' in value && Array.isArray((value as any).events)) {
            meetingsList = (value as any).events;
            hasMeetings = meetingsList.length > 0;
          } else if (Array.isArray(value) && value.length > 0 && value[0]?.title) {
            meetingsList = value;
            hasMeetings = true;
          }
        }
      }

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `You are composing a ${tone} email briefing. Create an HTML email using the following data:

Current Date: ${context.today_long || context.date}
Current Day: ${context.weekday}
Current Time: ${context.time}

Data:
${JSON.stringify(contextData, null, 2)}

CRITICAL REQUIREMENTS:
${hasMeetings ? `
- There are ${meetingsList.length} calendar meeting(s) in the data above
- YOU MUST list EVERY meeting with: title, time, location (if any), attendees (if any), and description
- DO NOT generate generic motivational content INSTEAD of showing meetings
- DO NOT say "no meetings" when there are meetings in the data
- Start with the meetings list FIRST, then add other content
` : `
- There are NO meetings in the calendar data
- Clearly state "No meetings scheduled for today"
`}
- Use a ${tone} tone
- Highlight these topics: ${keywords.join(', ')}
- Format as clean, professional HTML email
- Include clear sections with headings
- Make it actionable and insightful
- Use the actual current date provided above in your content
- DO NOT use template variables like {{today_long}} - use the actual date string provided

Return ONLY the HTML content, no markdown code blocks.`,
        temperature: 0.3, // Lower temperature for more deterministic output
      });

      return {
        content: text.trim(),
        tone,
        format,
      };
    }

    if (operation === 'rank_and_select') {
      // Alias for filter_and_rank
      return this.executeLLMAction('filter_and_rank', parameters, context, task);
    }

    if (operation === 'summarize') {
      // Summarize content from inputs
      const inputs = parameters.inputs || [];
      const tone = parameters.tone || 'professional';
      const style = parameters.style || 'concise';
      const summaryLength = parameters.summary_length || '2-3 sentences';

      // Gather input data
      const contextData: Record<string, unknown> = {};
      for (const inputName of inputs as string[]) {
        if (context[inputName]) {
          contextData[inputName] = context[inputName];
        }
      }

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `Summarize the following content in a ${tone} tone using ${style} style.
Length: ${summaryLength}

Data:
${JSON.stringify(contextData, null, 2)}

Create concise, informative summaries. Return only the summarized content.`,
        temperature: 0.5,
      });

      return {
        content: text.trim(),
        tone,
        style,
      };
    }

    if (operation === 'format') {
      // Format content as HTML email or other format
      const inputs = parameters.inputs || [];
      const format = parameters.format || 'email_html';
      const title = parameters.title || 'Summary';
      const tone = parameters.tone || 'professional';
      const template = parameters.template || '';
      const includeLinks = parameters.include_links !== false;

      // Use smart extractor to get all data
      const allData: unknown[] = [];
      for (const inputName of inputs as string[]) {
        if (context[inputName]) {
          const extracted = extractDataArray(context[inputName]);
          allData.push(...extracted);
        }
      }

      // Auto-detect content type and format
      if (format === 'email_html' && !template) {
        // Use smart auto-formatter
        const html = autoFormatAsHtml(allData, { title, includeLinks });
        return {
          content: html,
          format,
          contentType: detectContentType(allData),
        };
      }

      // Use AI for custom formatting with template
      const contentType = detectContentType(allData);

      const { text } = await generateText({
        model: openai('gpt-5'),
        prompt: `Format the following ${contentType} as ${format} using a ${tone} tone:

Current Date: ${context.yesterday_date || context.today_long || context.date}
${template ? `Template: ${template}` : ''}

Data (${allData.length} items):
${JSON.stringify(allData, null, 2)}

CRITICAL REQUIREMENTS:
${allData.length > 0 ? `
- There are ${allData.length} items in the data above
- YOU MUST list EVERY item with appropriate details
- Format as a numbered or bulleted list
- Include clickable links where available
- DO NOT say "no items" when there are ${allData.length} items in the data
` : `
- There are NO items in the data
- Clearly state "No items found"
`}

Requirements:
- Title: ${title}
- Content Type: ${contentType}
- Include links: ${includeLinks}
- Use clean HTML formatting with proper headings
- Make it visually appealing and easy to read
- Use a ${tone} tone
- Use the actual current date provided above, not template variables
${template ? `- Follow this template structure: ${template}` : ''}

Return ONLY the HTML content (no markdown code blocks).`,
        temperature: 0.3,
      });

      return {
        content: text.trim(),
        format,
        contentType,
      };
    }

    if (operation === 'filter_and_summarize') {
      // Gather inputs from context
      const inputs = parameters.inputs || [];
      const tone = parameters.tone || task.personalization?.tone || 'professional';
      const keywords = parameters.filters || task.personalization?.keywords || [];
      const format = parameters.format || 'email_html';

      // Extract data from context - properly handle nested structure
      const calendarEventsData = context.calendar_events;
      const calendarEvents = (typeof calendarEventsData === 'object' && calendarEventsData !== null && 'events' in calendarEventsData)
        ? (calendarEventsData as any).events
        : [];

      const searchResultsData = context.trending_items;
      const searchResults = (typeof searchResultsData === 'object' && searchResultsData !== null && 'results' in searchResultsData)
        ? (searchResultsData as any).results
        : [];

      const youtubeVideosData = context.youtube_videos;
      const youtubeVideos = (typeof youtubeVideosData === 'object' && youtubeVideosData !== null && 'videos' in youtubeVideosData)
        ? (youtubeVideosData as any).videos
        : [];

      console.log('filter_and_summarize: calendar events count:', calendarEvents.length);
      console.log('filter_and_summarize: calendar events data:', JSON.stringify(calendarEvents, null, 2));

      if (format === 'email_html') {
        // Generate HTML email using templates
        const html = generateDailyBriefing({
          calendarEvents,
          searchResults,
          youtubeVideos,
          tone: tone as any,
          keywords,
        });

        return {
          content: html,
          tone,
          format,
          filtered: true,
        };
      } else {
        // Use AI for custom filtering and summarization
        // Build comprehensive data from all inputs
        const allData: Record<string, unknown> = {};

        for (const inputName of inputs as string[]) {
          if (context[inputName]) {
            allData[inputName] = context[inputName];
          }
        }

        // Include calendar events if present
        if (calendarEvents.length > 0) {
          allData.calendar_events = calendarEvents;
        }

        const now = new Date();
        const { text } = await generateText({
          model: openai('gpt-5'),
          prompt: `You are creating a ${tone} ${format} briefing for the user.

Current Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current Time: ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}

Data:
${JSON.stringify(allData, null, 2)}

${calendarEvents.length > 0 ? `
CRITICAL: There are ${calendarEvents.length} calendar events in the data above.
YOU MUST list EVERY calendar event with:
- Time
- Title
- Location (if any)
- Attendees (if any)
DO NOT say "no meetings" when there are ${calendarEvents.length} events in the data.
` : 'There are no calendar events.'}

Create a ${tone} summary that:
1. ${calendarEvents.length > 0 ? 'Starts with the calendar events list' : 'Mentions no events scheduled'}
2. Uses a ${tone} tone
3. Is formatted as ${format}
4. ${keywords.length > 0 ? `Focuses on: ${JSON.stringify(keywords)}` : ''}
5. Uses the actual current date/time provided above (NOT template variables)

Return ONLY the formatted content.`,
          temperature: 0.3,
        });

        return {
          content: text.trim(),
          tone,
          format,
          filtered: true,
        };
      }
    }

    throw new Error(`Unknown LLM operation: ${operation}`);
  }

  /**
   * Build prompt for filtering and summarizing content
   */
  private buildFilterPrompt(
    data: unknown[],
    filters: string[],
    tone: string,
    personalization: Record<string, unknown>
  ): string {
    const keywords = (personalization?.keywords as string[]) || filters;

    return `You are a personal assistant summarizing information for your user.

Data to process:
${JSON.stringify(data, null, 2)}

Your task:
1. Filter this data to focus on topics related to: ${keywords.join(', ')}
2. Create a concise, well-organized summary
3. Use a ${tone} tone
4. Highlight key points and actionable information
5. Format the output as clean, readable text

Guidelines for tone:
- motivational: Energetic, inspiring, action-oriented language
- professional: Formal, concise, business-focused
- casual: Friendly, conversational, relaxed

Generate the summary:`;
  }
}
