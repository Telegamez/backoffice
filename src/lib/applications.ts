import { IntegrationRequirement, IntegrationExport } from './integrations/types';

export interface BackofficeApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: 'development' | 'analytics' | 'operations' | 'ai';
  enabled: boolean;
  requiresPermissions?: string[];
  services?: {
    mcp?: string[];
    api?: string[];
    external?: string[];
  };
  
  // NEW: Integration requirements
  integrations?: {
    required: IntegrationRequirement[];
    optional: IntegrationRequirement[];
    provides: IntegrationExport[];
  };
}

export const applications: BackofficeApp[] = [
  {
    id: 'github-timeline',
    name: 'GitHub Timeline Explorer',
    description: 'Explore development timeline with AI insights from GitHub data',
    icon: 'GitBranch',
    path: '/apps/github-timeline',
    category: 'development',
    enabled: true,
    services: {
      api: ['github-sync', 'segments', 'segment-insights'],
    },
    integrations: {
      required: [
        {
          capability: 'github.repos',
          purpose: 'Access repository information',
          fallback: 'disable',
          priority: 'required'
        },
        {
          capability: 'github.issues',
          purpose: 'Display issues in timeline',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [],
      provides: [
        {
          capability: 'timeline.events',
          dataType: 'timeline_event',
          endpoint: '/api/apps/github-timeline/events',
          permissions: ['timeline:read']
        }
      ]
    }
  },
  {
    id: 'mail-assistant',
    name: 'Mail Assistant',
    description: 'AI-powered automation for Google Workspace document-to-email workflows',
    icon: 'Bot',
    path: '/apps/mail-assistant',
    category: 'ai',
    enabled: true,
    services: {
      api: ['google-drive-api', 'gmail-api', 'openai-gpt5'],
      external: ['google-workspace-oauth']
    },
    integrations: {
      required: [
        {
          capability: 'google.drive',
          purpose: 'Analyze documents for email campaigns',
          fallback: 'disable',
          priority: 'required'
        },
        {
          capability: 'google.gmail',
          purpose: 'Send personalized email campaigns',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [
        {
          capability: 'github.user_issues',
          purpose: 'Include GitHub tasks in daily summary',
          fallback: 'limited',
          priority: 'optional'
        },
        {
          capability: 'google.calendar',
          purpose: 'Include calendar events in context',
          fallback: 'limited',
          priority: 'optional'
        }
      ],
      provides: [
        {
          capability: 'ai.document_analysis',
          dataType: 'document_analysis',
          endpoint: '/api/apps/mail-assistant/analyze',
          permissions: ['ai:read']
        }
      ]
    }
  },
  {
    id: 'autonomous-agent',
    name: 'Autonomous Agent Scheduler',
    description: 'Natural language task scheduler with automated data collection and email delivery',
    icon: 'Clock',
    path: '/apps/autonomous-agent',
    category: 'ai',
    enabled: true,
    services: {
      api: ['google-calendar-api', 'gmail-api', 'youtube-api', 'google-search-api', 'openai-gpt'],
      external: ['google-workspace-oauth']
    },
    integrations: {
      required: [
        {
          capability: 'google.calendar',
          purpose: 'Fetch calendar events for scheduled tasks',
          fallback: 'disable',
          priority: 'required'
        },
        {
          capability: 'google.gmail',
          purpose: 'Send scheduled email reports',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [
        {
          capability: 'google.youtube',
          purpose: 'Search and collect YouTube videos',
          fallback: 'limited',
          priority: 'optional'
        },
        {
          capability: 'google.search',
          purpose: 'Web search for information gathering',
          fallback: 'limited',
          priority: 'optional'
        }
      ],
      provides: [
        {
          capability: 'scheduler.tasks',
          dataType: 'scheduled_task',
          endpoint: '/api/autonomous-agent/tasks',
          permissions: ['scheduler:read', 'scheduler:write']
        }
      ]
    }
  },
  {
    id: 'iptv-channels',
    name: 'IPTV Channel Manager',
    description: 'Generate and manage IPTV channel lists with validation and filtering',
    icon: 'Tv',
    path: '/apps/iptv-channels',
    category: 'operations',
    enabled: true,
    services: {
      api: ['iptv-generate', 'iptv-download'],
    },
    integrations: {
      required: [],
      optional: [],
      provides: [
        {
          capability: 'iptv.channels',
          dataType: 'iptv_channel',
          endpoint: '/api/iptv/generate',
          permissions: ['iptv:read', 'iptv:write']
        }
      ]
    }
  },
  // Future applications can be added here
  // {
  //   id: 'project-analytics',
  //   name: 'Project Analytics',
  //   description: 'Advanced project metrics and performance dashboards',
  //   icon: 'BarChart3',
  //   path: '/apps/analytics',
  //   category: 'analytics',
  //   enabled: false,
  //   services: {
  //     mcp: ['analytics-mcp'],
  //     api: ['metrics', 'reports'],
  //   }
  // },
  // {
  //   id: 'deployment-manager',
  //   name: 'Deployment Manager',
  //   description: 'Manage deployments and infrastructure operations',
  //   icon: 'Rocket',
  //   path: '/apps/deployment',
  //   category: 'operations',
  //   enabled: false,
  //   services: {
  //     mcp: ['deployment-mcp'],
  //     api: ['deployments', 'infrastructure'],
  //     external: ['docker-registry', 'kubernetes']
  //   }
  // }
];

export function getApplicationById(id: string): BackofficeApp | undefined {
  return applications.find(app => app.id === id);
}

export function getEnabledApplications(): BackofficeApp[] {
  return applications.filter(app => app.enabled);
}

export function getApplicationsByCategory(category: BackofficeApp['category']): BackofficeApp[] {
  return applications.filter(app => app.category === category && app.enabled);
}

export function getUserApplications(userPermissions: string[] = []): BackofficeApp[] {
  return applications.filter(app => {
    if (!app.enabled) return false;
    if (!app.requiresPermissions) return true;
    return app.requiresPermissions.every(permission => userPermissions.includes(permission));
  });
}