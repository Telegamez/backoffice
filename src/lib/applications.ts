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
    }
  },
  {
    id: 'ai-admin-assistant',
    name: 'AI Admin Assistant',
    description: 'AI-powered automation for Google Workspace document-to-email workflows',
    icon: 'Bot',
    path: '/apps/ai-admin-assistant',
    category: 'ai',
    enabled: true,
    services: {
      api: ['google-drive-api', 'gmail-api', 'openai-gpt5'],
      external: ['google-workspace-oauth']
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