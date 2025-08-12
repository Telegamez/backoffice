"use client";
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type Segment = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  categories: string[];
  issues: number;
  prs: number;
  customerFacing: number;
  platformWork: number;
  impact: 'high' | 'medium' | 'low';
  deliverables: Array<{ title: string; type: string; impact: string }>;
  keyWork: string[];
};

export const DetailPanel: React.FC<{ segment: Segment | null }> = ({ segment }) => {
  if (!segment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Select a segment to view details.</div>
        </CardContent>
      </Card>
    );
  }

  const durationDays = Math.max(
    1,
    (new Date(segment.endDate).getTime() - new Date(segment.startDate).getTime()) / 86400000
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{segment.title}</CardTitle>
          <div className="text-sm text-primary">
            {new Date(segment.startDate).toLocaleDateString()} – {new Date(segment.endDate).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overview (default and only view) */}
        <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Issues</div>
                <div className="text-3xl font-bold text-primary">{segment.issues}</div>
                <div className="text-sm">{Math.round(segment.issues / durationDays)} per day</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Pull Requests</div>
                <div className="text-3xl font-bold text-primary">{segment.prs}</div>
                <div className="text-sm">{Math.round((segment.issues / Math.max(segment.prs, 1)) * 100)}% issue/PR</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Impact</div>
                <div className="mt-2 inline-flex items-center gap-2 rounded px-2 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor:
                      segment.impact === 'high'
                        ? 'hsl(0 72% 45%)'
                        : segment.impact === 'medium'
                        ? 'hsl(45 93% 47%)'
                        : 'hsl(142 70% 40%)',
                    color: segment.impact === 'medium' ? 'black' : 'white',
                  }}
                >
                  {segment.impact === 'high' ? 'High' : segment.impact === 'medium' ? 'Medium' : 'Low'}
                </div>
              </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm font-semibold">Work Distribution</div>
                {(() => {
                  type Cat = 'infrastructure' | 'ui-ux' | 'ai-features' | 'webrtc' | 'other';
                  const allowed: Cat[] = ['infrastructure', 'ui-ux', 'ai-features', 'webrtc', 'other'];
                  const normalize = (c: string): Cat =>
                    (['infrastructure','ui-ux','ai-features','webrtc'].includes(c) ? (c as Cat) : 'other');
                  const counts: Record<Cat, number> = {
                    'infrastructure': 0,
                    'ui-ux': 0,
                    'ai-features': 0,
                    'webrtc': 0,
                    'other': 0,
                  };
                  const list = (segment.categories?.length ? segment.categories : ['other']).map(normalize);
                  for (const c of list) counts[c] += 1;
                  const total = list.length || 1;
                  const toPercent = (n: number) => Math.round((n / total) * 100);
                  const items = allowed
                    .map((k) => ({ key: k, pct: toPercent(counts[k]) }))
                    .filter((i) => i.pct > 0);
                  // Adjust rounding to 100%
                  const sum = items.reduce((a, b) => a + b.pct, 0);
                  if (sum !== 100 && items.length) items[items.length - 1].pct += 100 - sum;
                  const color: Record<Cat, string> = {
                    'infrastructure': 'bg-orange-500',
                    'ui-ux': 'bg-teal-500',
                    'ai-features': 'bg-violet-500',
                    'webrtc': 'bg-blue-600',
                    'other': 'bg-green-600',
                  };
                  return (
                    <div className="space-y-3">
                      {items.map((i) => (
                        <div key={i.key}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize">{i.key.replace('-', ' ')}</span>
                            <span>{i.pct}%</span>
                          </div>
                          <div className="mt-1 h-3 w-full rounded bg-muted">
                            <div className={`h-3 rounded ${color[i.key as Cat]}`} style={{ width: `${i.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm font-semibold">Deliverables</div>
                <ul className="space-y-2 text-sm">
                  {segment.deliverables.map((d, idx) => (
                    <li key={idx} className="rounded border bg-background px-2 py-1">
                      <span className="font-medium block truncate">{d.title}</span>
                      <span className="text-muted-foreground"> · {d.type}</span>
                      <span className="ml-1 rounded bg-muted px-1 text-xs uppercase">{d.impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
        </div>

        <Separator className="my-4" />

        <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">Key Work</div>
              <ul className="space-y-2 text-sm">
                {segment.keyWork.map((k, idx) => (
                  <li key={idx} className="rounded border bg-background px-2 py-1">
                    {k}
                  </li>
                ))}
              </ul>
        </div>
      </CardContent>
    </Card>
  );
};




