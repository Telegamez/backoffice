/**
 * Smart Parameter Resolver
 * Handles intelligent parsing of dates, extraction of data from various formats,
 * and automatic detection of content types
 */

export interface SmartDateOptions {
  timezone?: string;
  baseDate?: Date;
}

/**
 * Parse smart date strings like "yesterday", "last week", "3 days ago", etc.
 */
export function parseSmartDate(dateString: string | Date, options: SmartDateOptions = {}): Date | undefined {
  if (dateString instanceof Date) {
    return dateString;
  }

  if (typeof dateString !== 'string') {
    return undefined;
  }

  const timezone = options.timezone || 'UTC';
  const base = options.baseDate || new Date();

  // Create date in the specified timezone
  const date = new Date(base.toLocaleString('en-US', { timeZone: timezone }));

  const lower = dateString.toLowerCase().trim();

  // Handle "now"
  if (lower === 'now') {
    return date;
  }

  // Handle "today"
  if (lower === 'today') {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "yesterday"
  if (lower === 'yesterday') {
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "tomorrow"
  if (lower === 'tomorrow') {
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "last week"
  if (lower === 'last week') {
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "last month"
  if (lower === 'last month') {
    date.setMonth(date.getMonth() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "N days ago"
  const daysAgoMatch = lower.match(/^(\d+)\s+days?\s+ago$/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1]);
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "N weeks ago"
  const weeksAgoMatch = lower.match(/^(\d+)\s+weeks?\s+ago$/);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1]);
    date.setDate(date.getDate() - (weeks * 7));
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Handle "N months ago"
  const monthsAgoMatch = lower.match(/^(\d+)\s+months?\s+ago$/);
  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1]);
    date.setMonth(date.getMonth() - months);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Try parsing as ISO date
  try {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Invalid date string
  }

  return undefined;
}

/**
 * Extract data from various result formats
 * Handles: { videos: [] }, { events: [] }, { results: [] }, [ ... ], etc.
 */
export function extractDataArray(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    // Try common property names
    const obj = data as Record<string, unknown>;

    if ('videos' in obj && Array.isArray(obj.videos)) {
      return obj.videos;
    }

    if ('events' in obj && Array.isArray(obj.events)) {
      return obj.events;
    }

    if ('results' in obj && Array.isArray(obj.results)) {
      return obj.results;
    }

    if ('items' in obj && Array.isArray(obj.items)) {
      return obj.items;
    }

    if ('data' in obj && Array.isArray(obj.data)) {
      return obj.data;
    }

    if ('emails' in obj && Array.isArray(obj.emails)) {
      return obj.emails;
    }

    if ('messages' in obj && Array.isArray(obj.messages)) {
      return obj.messages;
    }

    // If it has a content property that's an object, try extracting from that
    if ('content' in obj && typeof obj.content === 'object' && obj.content !== null) {
      return extractDataArray(obj.content);
    }
  }

  return [];
}

/**
 * Detect content type from data structure
 */
export function detectContentType(data: unknown[]): string {
  if (data.length === 0) {
    return 'unknown';
  }

  const sample = data[0] as Record<string, unknown>;

  // YouTube videos
  if ('channelTitle' in sample || 'viewCount' in sample || ('url' in sample && typeof sample.url === 'string' && sample.url.includes('youtube'))) {
    return 'youtube_videos';
  }

  // Calendar events
  if ('start' in sample || ('time' in sample && 'location' in sample)) {
    return 'calendar_events';
  }

  // Emails/messages
  if ('from' in sample || 'subject' in sample || 'messageId' in sample) {
    return 'emails';
  }

  // Search results
  if ('link' in sample && 'snippet' in sample) {
    return 'search_results';
  }

  // Generic list items
  if ('title' in sample || 'name' in sample) {
    return 'list_items';
  }

  return 'unknown';
}

/**
 * Format data into HTML based on detected content type
 */
export function autoFormatAsHtml(data: unknown[], options: { title?: string; includeLinks?: boolean } = {}): string {
  const contentType = detectContentType(data);
  const title = options.title || 'Summary';
  const includeLinks = options.includeLinks !== false;

  if (data.length === 0) {
    return `<p>No items found.</p>`;
  }

  switch (contentType) {
    case 'youtube_videos':
      return formatYouTubeVideos(data, title, includeLinks);

    case 'calendar_events':
      return formatCalendarEvents(data, title);

    case 'emails':
      return formatEmails(data, title);

    case 'search_results':
      return formatSearchResults(data, title, includeLinks);

    default:
      return formatGenericList(data, title, includeLinks);
  }
}

function formatYouTubeVideos(videos: unknown[], title: string, includeLinks: boolean): string {
  const items = videos.map((video, index) => {
    const v = video as Record<string, unknown>;
    const videoTitle = String(v.title || 'Untitled');
    const channel = String(v.channelTitle || v.channel || 'Unknown Channel');
    const url = String(v.url || `https://www.youtube.com/watch?v=${v.id}`);
    const viewCount = v.viewCount ? ` • ${formatNumber(v.viewCount)} views` : '';

    if (includeLinks) {
      return `
        <li>
          <strong>${index + 1}. <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(videoTitle)}</a></strong>
          <br><small>${escapeHtml(channel)}${viewCount}</small>
        </li>
      `;
    } else {
      return `
        <li>
          <strong>${index + 1}. ${escapeHtml(videoTitle)}</strong>
          <br><small>${escapeHtml(channel)}${viewCount}</small>
        </li>
      `;
    }
  }).join('');

  return `
    <h2>🎥 ${escapeHtml(title)}</h2>
    <ul>${items}</ul>
  `;
}

function formatCalendarEvents(events: unknown[], title: string): string {
  const items = events.map(event => {
    const e = event as Record<string, unknown>;
    const time = String(e.time || 'All day');
    const eventTitle = String(e.title || e.summary || 'Untitled');
    const location = e.location ? `<br><small>📍 ${escapeHtml(String(e.location))}</small>` : '';

    return `<li><strong>${escapeHtml(time)}</strong> - ${escapeHtml(eventTitle)}${location}</li>`;
  }).join('');

  return `
    <h2>📅 ${escapeHtml(title)}</h2>
    <ul>${items}</ul>
  `;
}

function formatEmails(emails: unknown[], title: string): string {
  const items = emails.map(email => {
    const e = email as Record<string, unknown>;
    const from = String(e.from || 'Unknown');
    const subject = String(e.subject || 'No subject');
    const snippet = e.snippet ? `<br><small>${escapeHtml(String(e.snippet))}</small>` : '';

    return `<li><strong>${escapeHtml(subject)}</strong> from ${escapeHtml(from)}${snippet}</li>`;
  }).join('');

  return `
    <h2>📧 ${escapeHtml(title)}</h2>
    <ul>${items}</ul>
  `;
}

function formatSearchResults(results: unknown[], title: string, includeLinks: boolean): string {
  const items = results.map(result => {
    const r = result as Record<string, unknown>;
    const resultTitle = String(r.title || 'Untitled');
    const snippet = r.snippet ? `<br><small>${escapeHtml(String(r.snippet))}</small>` : '';
    const link = String(r.link || r.url || '#');

    if (includeLinks) {
      return `
        <li>
          <a href="${escapeHtml(link)}" target="_blank"><strong>${escapeHtml(resultTitle)}</strong></a>
          ${snippet}
        </li>
      `;
    } else {
      return `<li><strong>${escapeHtml(resultTitle)}</strong>${snippet}</li>`;
    }
  }).join('');

  return `
    <h2>🔍 ${escapeHtml(title)}</h2>
    <ul>${items}</ul>
  `;
}

function formatGenericList(items: unknown[], title: string, includeLinks: boolean): string {
  const listItems = items.map(item => {
    const i = item as Record<string, unknown>;
    const itemTitle = String(i.title || i.name || JSON.stringify(item));
    const link = i.link || i.url;

    if (includeLinks && link) {
      return `<li><a href="${escapeHtml(String(link))}" target="_blank">${escapeHtml(itemTitle)}</a></li>`;
    } else {
      return `<li>${escapeHtml(itemTitle)}</li>`;
    }
  }).join('');

  return `
    <h2>${escapeHtml(title)}</h2>
    <ul>${listItems}</ul>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  return n.toLocaleString();
}
