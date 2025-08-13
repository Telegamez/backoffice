"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GitBranch, 
  BarChart3, 
  Rocket, 
  Cpu, 
  Users, 
  Settings,
  Bot,
  type LucideIcon
} from 'lucide-react';
import { BackofficeApp, getEnabledApplications } from '@/lib/applications';
import { useRouter } from 'next/navigation';

const iconMap: Record<string, LucideIcon> = {
  GitBranch,
  BarChart3,
  Rocket,
  Cpu,
  Users,
  Settings,
  Bot,
};

const categoryColors = {
  development: 'border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20',
  analytics: 'border-green-500/20 bg-green-500/10 hover:bg-green-500/20',
  operations: 'border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20',
  ai: 'border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20',
};

const categoryNames = {
  development: 'Development Tools',
  analytics: 'Analytics & Reporting',
  operations: 'Operations & Infrastructure',
  ai: 'AI & Intelligence',
};

interface ApplicationCardProps {
  app: BackofficeApp;
  onClick: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ app, onClick }) => {
  const IconComponent = iconMap[app.icon] || Settings;
  
  return (
    <Card 
      className={`p-6 cursor-pointer transition-all duration-200 ${categoryColors[app.category]}`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <IconComponent className="h-8 w-8 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {app.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {app.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
              {categoryNames[app.category]}
            </span>
            <Button size="sm" variant="outline">
              Open
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface ApplicationSelectorProps {
  userEmail?: string;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({ userEmail }) => {
  const router = useRouter();
  const applications = getEnabledApplications();

  const handleApplicationSelect = (app: BackofficeApp) => {
    router.push(app.path);
  };

  const categorizedApps = applications.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = [];
    }
    acc[app.category].push(app);
    return acc;
  }, {} as Record<BackofficeApp['category'], BackofficeApp[]>);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Telegamez Backoffice
              </h1>
              <p className="text-muted-foreground mt-2">
                Welcome {userEmail}. Select a tool to get started.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {applications.length} tool{applications.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          {Object.entries(categorizedApps).map(([category, apps]) => (
            <section key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {categoryNames[category as BackofficeApp['category']]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onClick={() => handleApplicationSelect(app)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No applications available
            </h3>
            <p className="text-muted-foreground">
              Contact your administrator to enable applications for your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationSelector;