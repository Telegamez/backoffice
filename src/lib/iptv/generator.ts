import https from 'https';

const CHANNELS_API = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_API = 'https://iptv-org.github.io/api/streams.json';

const PROFILES: Record<string, {
  countries?: string[];
  categories?: string[];
  excludeLocal?: boolean;
  m3u8Only?: boolean;
  description: string;
}> = {
  'us-all': {
    countries: ['US'],
    excludeLocal: true,
    m3u8Only: true,
    description: 'All US channels (no local affiliates)'
  },
  'us-sports': {
    countries: ['US'],
    categories: ['sports'],
    m3u8Only: true,
    description: 'US sports channels only'
  },
  'us-entertainment': {
    countries: ['US'],
    categories: ['entertainment', 'movies', 'music', 'comedy'],
    m3u8Only: true,
    description: 'US entertainment, movies, music, comedy'
  },
  'us-news': {
    countries: ['US'],
    categories: ['news'],
    excludeLocal: true,
    m3u8Only: true,
    description: 'US news channels (no local affiliates)'
  },
  'us-family': {
    countries: ['US'],
    categories: ['kids', 'education', 'religious'],
    m3u8Only: true,
    description: 'US kids, education, religious channels'
  },
  'north-america': {
    countries: ['US', 'CA', 'MX'],
    excludeLocal: true,
    m3u8Only: true,
    description: 'US + Canada + Mexico channels'
  }
};

const LOCAL_AFFILIATE_PATTERNS = [
  /\b(abc|nbc|cbs|fox|pbs|cw|ion)\s+\d+/i,
  /\b(wabc|wnbc|wcbs|wnyw|wpix|wwor|kabc|knbc|kcbs|kttv)/i,
  /\b[a-z]{4}[-\s]?(tv|dt)/i,
  /\baffiliate\b/i,
  /\blocal\s+(news|channel)/i,
  /\b(city|county|regional)\s+tv/i
];

interface Channel {
  id: string;
  name: string;
  country: string;
  categories: string[];
}

interface Stream {
  title: string;
  url: string;
  quality?: string;
}

interface GenerationOptions {
  profile?: string;
  countries?: string[];
  categories?: string[];
  excludeLocal?: boolean;
  m3u8Only?: boolean;
  skipValidation?: boolean;
  timeout?: number;
  parallel?: number;
  retry?: number;
}

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error}`));
        }
      });
    }).on('error', reject);
  });
}

function mapCategory(categories: string[]): string {
  if (!categories || categories.length === 0) return 'General';

  const categoryMap: Record<string, string> = {
    'news': 'News', 'sports': 'Sports', 'entertainment': 'Entertainment',
    'movies': 'Movies', 'music': 'Music', 'kids': 'Kids',
    'religious': 'Religious', 'documentary': 'Documentary',
    'education': 'Educational', 'lifestyle': 'Lifestyle',
    'cooking': 'Cooking', 'travel': 'Travel', 'general': 'General',
    'business': 'Business', 'science': 'Science', 'weather': 'Weather',
    'comedy': 'Comedy', 'animation': 'Animation', 'auto': 'Automotive'
  };

  return categoryMap[categories[0].toLowerCase()] || 'General';
}

function mapLanguage(countryCode: string): string {
  const languageMap: Record<string, string> = {
    'US': 'English (US)', 'GB': 'English (UK)', 'CA': 'English (CA)',
    'AU': 'English (AU)', 'ES': 'Spanish', 'MX': 'Spanish',
    'FR': 'French', 'DE': 'German', 'IT': 'Italian'
  };

  return languageMap[countryCode] || 'Unknown';
}

function shouldFilterChannel(
  channel: Channel,
  config: GenerationOptions
): boolean {
  if (config.countries && !config.countries.includes(channel.country)) {
    return true;
  }

  if (config.categories) {
    const channelCategories = (channel.categories || []).map(c => c.toLowerCase());
    const hasMatchingCategory = channelCategories.some(cat =>
      config.categories!.includes(cat)
    );
    if (!hasMatchingCategory) {
      return true;
    }
  }

  if (config.excludeLocal) {
    const channelName = channel.name.toLowerCase();
    if (LOCAL_AFFILIATE_PATTERNS.some(pattern => pattern.test(channelName))) {
      return true;
    }
  }

  return false;
}

function shouldIncludeStream(streamURL: string | null, m3u8Only?: boolean): boolean {
  if (!streamURL) return false;

  if (m3u8Only) {
    return streamURL.toLowerCase().includes('.m3u8');
  }

  return true;
}

export async function generateMasterChannels(options: GenerationOptions) {
  const startTime = Date.now();

  // Merge profile config if provided
  let config = { ...options };
  if (options.profile && PROFILES[options.profile]) {
    const profileConfig = PROFILES[options.profile];
    config = {
      ...profileConfig,
      ...options, // options override profile
      profile: options.profile
    };
  }

  console.log('[IPTV] Starting channel generation:', config);

  // Fetch data
  console.log('[IPTV] Fetching channels...');
  const channels: Channel[] = await fetchJSON(CHANNELS_API);
  console.log(`[IPTV] Found ${channels.length} channels`);

  console.log('[IPTV] Fetching streams...');
  const streams: Stream[] = await fetchJSON(STREAMS_API);
  console.log(`[IPTV] Found ${streams.length} streams`);

  // Create stream map
  const streamMap = new Map<string, Stream[]>();
  streams.forEach(stream => {
    if (stream.title) {
      if (!streamMap.has(stream.title)) {
        streamMap.set(stream.title, []);
      }
      streamMap.get(stream.title)!.push(stream);
    }
  });

  // Filter and match channels
  console.log('[IPTV] Filtering and matching channels...');
  const matchedChannels: any[] = [];
  let channelNumber = 1;
  let filteredCount = 0;
  let noStreamCount = 0;
  const seenURLs = new Set<string>();

  channels.forEach(channel => {
    if (shouldFilterChannel(channel, config)) {
      filteredCount++;
      return;
    }

    // Find matching stream
    let matchingStreams = streamMap.get(channel.name);

    if (!matchingStreams || matchingStreams.length === 0) {
      const simplifiedName = channel.name.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
      for (const [streamTitle, streams] of streamMap.entries()) {
        const simplifiedTitle = streamTitle.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
        if (simplifiedTitle === simplifiedName || simplifiedTitle.includes(simplifiedName) || simplifiedName.includes(simplifiedTitle)) {
          matchingStreams = streams;
          break;
        }
      }
    }

    let streamURL: string | null = null;
    if (matchingStreams && matchingStreams.length > 0) {
      const qualityOrder = ['1080p', '720p', '480p', '360p', '240p'];
      let bestStream = matchingStreams[0];

      for (const quality of qualityOrder) {
        const qualityStream = matchingStreams.find(s => s.quality === quality);
        if (qualityStream) {
          bestStream = qualityStream;
          break;
        }
      }

      streamURL = bestStream.url;
    }

    if (!shouldIncludeStream(streamURL, config.m3u8Only)) {
      noStreamCount++;
      return;
    }

    if (streamURL && !seenURLs.has(streamURL)) {
      seenURLs.add(streamURL);
      matchedChannels.push({
        number: channelNumber++,
        name: channel.name,
        current_program: 'Live Programming',
        logo: '/logos/default.png',
        Language: mapLanguage(channel.country),
        Category: mapCategory(channel.categories),
        streamURL: streamURL
      });
    }
  });

  console.log(`[IPTV] Filtered: ${filteredCount}, No stream: ${noStreamCount}, Matched: ${matchedChannels.length}`);

  const duration = Math.floor((Date.now() - startTime) / 1000);

  return {
    metadata: {
      source: 'master-channels-workflow',
      generated_at: new Date().toISOString(),
      profile: config.profile || 'custom',
      total_channels: matchedChannels.length,
      configuration: {
        countries: config.countries,
        categories: config.categories,
        exclude_local: config.excludeLocal,
        m3u8_only: config.m3u8Only
      },
      generation_stats: {
        api_channels: channels.length,
        api_streams: streams.length,
        filtered_by_criteria: filteredCount,
        no_stream_or_wrong_format: noStreamCount,
        matched_unique: matchedChannels.length
      },
      validation: config.skipValidation ? 'skipped' : 'pending',
      duration_seconds: duration
    },
    channels: matchedChannels,
    needsValidation: !config.skipValidation
  };
}
