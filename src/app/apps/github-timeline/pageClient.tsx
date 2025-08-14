"use client";
import * as React from 'react';
import { Timeline } from '@/components/timeline/Timeline';
import { DetailPanel } from '@/components/timeline/DetailPanel';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';

type Segment = React.ComponentProps<typeof Timeline>['segments'][number];

export type ServerSegment = {
  id: number;
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  categories: string[];
  issues: number;
  prs: number;
  customerFacing: number;
  platformWork: number;
  impact: string;
  deliverables: Array<{ title: string; type: string; impact: string }>;
  keyWork: string[];
};

const toClient = (row: ServerSegment): Segment => ({
  id: row.slug,
  title: row.title,
  startDate: row.startDate,
  endDate: row.endDate,
  categories: row.categories,
  issues: row.issues,
  prs: row.prs,
  customerFacing: row.customerFacing,
  platformWork: row.platformWork,
  impact: row.impact as 'high' | 'medium' | 'low',
  deliverables: row.deliverables,
  keyWork: row.keyWork,
});

const AIInsights: React.FC<{ selected: Segment | null }> = ({ selected }) => {
  const [text, setText] = React.useState('Select a segment to analyze.');
  const [loading, setLoading] = React.useState(false);
  const [prompt, setPrompt] = React.useState('');
  const [infOpen, setInfOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement | null>(null);

  const loadCached = React.useCallback(async (slug: string) => {
    const r = await fetch(`/api/segment-insights?slug=${encodeURIComponent(slug)}`);
    const data = (await r.json()) as { insights: Array<{ content: string }> };
    if (data.insights?.length) {
      setText(data.insights[0].content);
    } else {
      setText('No insights yet. Click Re-analyze to generate.');
    }
  }, []);

  React.useEffect(() => {
    if (!selected) {
      setText('Select a segment to analyze.');
      return;
    }
    // Use DB-cached insights first
    loadCached(selected.id);
  }, [selected, loadCached]);

  const reanalyze = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const previous = text?.startsWith('No insights') ? '' : text;
      const r = await fetch('/api/segment-insights/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: selected.id, segment: selected, previous }),
      });
      const j = (await r.json()) as { content?: string; error?: string };
      if (j.content) setText(j.content);
      else if (j.error) setText(`Error: ${j.error}`);
    } finally {
      setLoading(false);
    }
  };

  const runInference = async () => {
    if (!selected || !prompt.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/segment-insights/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment: selected, prompt }),
      });
      const j = (await r.json()) as { content?: string; error?: string };
      if (j.content) {
        setText(j.content);
        setInfOpen(true);
      } else if (j.error) {
        setText(`Error: ${j.error}`);
        setInfOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Button onClick={reanalyze} disabled={!selected || loading}>
          {loading ? 'Analyzing…' : 'Re-analyze'}
        </Button>
      </div>
      <div ref={anchorRef} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask about this week's deliverables (not saved)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runInference();
          }}
          className="w-full rounded border bg-background px-2 py-1 text-sm"
        />
        <Button size="sm" onClick={runInference} disabled={!selected || loading || !prompt.trim()}>Ask</Button>
      </div>
      <Popover open={infOpen} onOpenChange={setInfOpen} anchorRef={anchorRef}>
        <div className="max-w-[520px] whitespace-pre-wrap">{text}</div>
      </Popover>
      <pre className="whitespace-pre-wrap text-sm text-foreground/90">{text}</pre>
    </div>
  );
};

const ClientHome: React.FC<{ segments: ServerSegment[] }> = ({ segments }) => {
  const [selected, setSelected] = React.useState<Segment | null>(null);
  const list = React.useMemo(() => segments.map(toClient), [segments]);

  const [syncing, setSyncing] = React.useState(false);
  const [integrationReady, setIntegrationReady] = React.useState(false);

  // Check integration status on component mount
  React.useEffect(() => {
    const checkIntegrationStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status?app=github-timeline');
        const data = await response.json();
        
        const githubIntegration = data.integrations?.find(
          (integration: {capability: string; available: boolean}) => integration.capability === 'github.issues' || 
                                 integration.capability === 'github.repos' ||
                                 integration.capability.startsWith('github.')
        );
        
        setIntegrationReady(githubIntegration?.available || false);
      } catch (error) {
        console.error('Failed to check integration status:', error);
        setIntegrationReady(false);
      }
    };

    checkIntegrationStatus();
  }, []);

  const syncGithub = async () => {
    if (!integrationReady) {
      alert('Please connect your GitHub integration first by clicking "Manage Auth" above.');
      return;
    }

    try {
      setSyncing(true);
      // 1) Sync issues/PRs using unified authentication
      const syncResponse = await fetch('/api/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perPage: 100, maxPages: 20 }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      // 2) Remap into weekly segments (rest of the year)
      await fetch('/api/map-timeline', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({}) 
      });
      
      // 3) Reload page data
      window.location.reload();
    } catch (error) {
      console.error('GitHub sync failed:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };


  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Telegamez Development Explorer</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/integrations'}
          >
            Manage Auth
          </Button>
          <Button 
            onClick={syncGithub} 
            disabled={syncing || !integrationReady}
            variant={integrationReady ? "default" : "outline"}
          >
            {syncing ? 'Syncing…' : integrationReady ? 'Sync GitHub' : 'Connect GitHub First'}
          </Button>
        </div>
      </header>


      <Timeline segments={list} onSelect={setSelected} />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <DetailPanel segment={selected} />
        <div className="rounded-lg border p-4 md:col-span-2">
          <h3 className="mb-2 text-lg font-semibold">AI Insights</h3>
          <AIInsights selected={selected} />
        </div>
      </section>
    </div>
  );
};

export default ClientHome;

