"use client";
import * as React from 'react';
import { ZoomLevel, getPixelsPerDay } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Segment = {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  categories: string[];
  issues: number;
  prs: number;
  customerFacing: number;
  platformWork: number;
  impact: 'high' | 'medium' | 'low';
  deliverables: Array<{ title: string; type: string; impact: string }>;
  keyWork: string[];
};

export type TimelineProps = {
  segments: Segment[];
  onSelect: (segment: Segment) => void;
};

export const Timeline: React.FC<TimelineProps> = ({ segments, onSelect }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = React.useState<ZoomLevel>('months');
  const [mode, setMode] = React.useState<'time' | 'compact'>('time');

  const { dataStart, dataEnd } = React.useMemo(() => {
    if (!segments.length) {
      const now = new Date();
      return { dataStart: now, dataEnd: now };
    }
    const minStart = new Date(
      Math.min(...segments.map((s) => new Date(s.startDate).getTime()))
    );
    const maxEnd = new Date(
      Math.max(...segments.map((s) => new Date(s.endDate).getTime()))
    );
    // Add 3 days padding on both ends
    const padStart = new Date(minStart);
    padStart.setDate(padStart.getDate() - 3);
    const padEnd = new Date(maxEnd);
    padEnd.setDate(padEnd.getDate() + 3);
    return { dataStart: padStart, dataEnd: padEnd };
  }, [segments]);

  const totalDays = React.useMemo(
    () => Math.max(1, (dataEnd.getTime() - dataStart.getTime()) / 86400000),
    [dataStart, dataEnd]
  );

  const [containerWidth, setContainerWidth] = React.useState(1600);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    obs.observe(el);
    setContainerWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const zoomScale = React.useMemo(() => {
    switch (zoom) {
      case 'weeks':
        return 2.5; // more pixels per day
      case 'months':
        return 1.2;
      case 'quarters':
        return 0.8;
      case 'year':
        return 0.5;
      default:
        return 1;
    }
  }, [zoom]);

  const pxPerDay = getPixelsPerDay(containerWidth * zoomScale, totalDays);

  // Lane stacking to reduce overlap/crowding
  type Lane = { lastEnd: number };
  const lanesRef = React.useRef<Lane[]>([]);
  const withLane = React.useMemo(() => {
    const sorted = [...segments].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const result: Array<Segment & { lane: number }> = [];
    lanesRef.current.length = 0;
    for (const s of sorted) {
      const sStart = new Date(s.startDate).getTime();
      const sEnd = new Date(s.endDate).getTime();
      let placed = false;
      for (let i = 0; i < lanesRef.current.length; i++) {
        if (lanesRef.current[i].lastEnd <= sStart) {
          lanesRef.current[i].lastEnd = sEnd;
          result.push({ ...s, lane: i });
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanesRef.current.push({ lastEnd: sEnd });
        result.push({ ...s, lane: lanesRef.current.length - 1 });
      }
    }
    return result;
  }, [segments]);

  // Compact layout precomputation (removes large empty gaps)
  const compactPositions = React.useMemo(() => {
    if (mode !== 'compact') return new Map<string, number>();
    const ordered = [...withLane].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const map = new Map<string, number>();
    const gapPx = 24; // spacing between items in compact mode
    let cursor = 0;
    for (const s of ordered) {
      map.set(s.id, cursor);
      cursor += Math.max(120,  // minimum width for readability
        (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / 86400000 * pxPerDay
      ) + gapPx;
    }
    return map;
  }, [withLane, mode, pxPerDay]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Development Timeline</h2>
        <div className="flex gap-2">
          {(['weeks', 'months', 'quarters', 'year'] as ZoomLevel[]).map((z) => (
            <Button
              key={z}
              variant={z === zoom ? 'default' : 'outline'}
              size="sm"
              onClick={() => setZoom(z)}
            >
              {z}
            </Button>
          ))}
          <Button
            variant={mode === 'time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('time')}
          >
            time
          </Button>
          <Button
            variant={mode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('compact')}
          >
            compact
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="relative h-[160px] overflow-x-auto rounded-lg border bg-background">
        <div
          className="relative h-full"
          style={{ minWidth: mode === 'compact' ? undefined : Math.max(containerWidth, 1200) * zoomScale }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/30" />

          {withLane.map((s) => {
            const sStart = new Date(s.startDate);
            const sEnd = new Date(s.endDate);
            const startOffset = (sStart.getTime() - dataStart.getTime()) / 86400000;
            const duration = (sEnd.getTime() - sStart.getTime()) / 86400000;
            const left = mode === 'compact' ? compactPositions.get(s.id) ?? 0 : startOffset * pxPerDay;
            const width = Math.max(duration * pxPerDay, 120);
            const color =
              s.categories[0] === 'infrastructure'
                ? 'bg-orange-500'
                : s.categories[0] === 'ui-ux'
                ? 'bg-teal-500'
                : s.categories[0] === 'ai-features'
                ? 'bg-violet-500'
                : s.categories[0] === 'webrtc'
                ? 'bg-blue-600'
                : 'bg-green-600';

            return (
              <button
                key={s.id}
                className={`absolute flex h-14 flex-col items-center justify-center rounded-md px-2 text-xs font-semibold text-white shadow-sm transition-transform hover:-translate-y-1 ${color}`}
                style={{ left, width, top: 12 + s.lane * 52 }}
                onClick={() => onSelect(s)}
              >
                <div className="truncate">{s.title}</div>
                <div className="opacity-90">{s.issues} issues • {s.prs} PRs</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


