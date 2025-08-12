"use client";
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
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
                <div className="text-3xl font-bold">
                  {segment.impact.toUpperCase()}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm font-semibold">Work Distribution</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Customer</span>
                      <span>{segment.customerFacing}%</span>
                    </div>
                    <div className="mt-1 h-3 w-full rounded bg-muted">
                      <div className="h-3 rounded bg-green-600" style={{ width: `${segment.customerFacing}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Platform</span>
                      <span>{segment.platformWork}%</span>
                    </div>
                    <div className="mt-1 h-3 w-full rounded bg-muted">
                      <div className="h-3 rounded bg-violet-600" style={{ width: `${segment.platformWork}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-2 text-sm font-semibold">Deliverables</div>
                <ul className="space-y-2 text-sm">
                  {segment.deliverables.map((d, idx) => (
                    <li key={idx} className="rounded border bg-background px-2 py-1">
                      <span className="font-medium">{d.title}</span>
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
          </TabsContent>
          <TabsContent value="insights">
            <div className="text-sm text-muted-foreground">Use the main panel AI Insights for streaming analysis.</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};




