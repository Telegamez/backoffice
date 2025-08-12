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
  const [zoom] = React.useState<ZoomLevel>('months');
  const [mode] = React.useState<'time' | 'compact'>('compact');
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
      default:
        return 1;
    }
  }, [zoom]);

  const pxPerDay = getPixelsPerDay(containerWidth * zoomScale, totalDays);
  const timelineWidth = React.useMemo(() => totalDays * pxPerDay, [totalDays, pxPerDay]);

  // Original lane stacking to reduce overlap/crowding (must be defined before tick generation)
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

  // Compact layout precomputation (removes large empty gaps) used for compact positioning
  const compactPositions = React.useMemo(() => {
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
  }, [withLane, pxPerDay]);

  // Map real dates to compact coordinates and build calendar ticks aligned to compact layout
  type Interval = { start: Date; end: Date; left: number; width: number };
  const compactIntervals = React.useMemo(() => {
    const ordered = [...withLane].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const items: Interval[] = [];
    for (const s of ordered) {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      const left = compactPositions.get(s.id) ?? 0;
      const durationDays = (end.getTime() - start.getTime()) / 86400000;
      const width = Math.max(durationDays * pxPerDay, 120);
      items.push({ start, end, left, width });
    }
    return items;
  }, [withLane, compactPositions, pxPerDay]);

  const weekTicks = React.useMemo(() => {
    const ticks: Array<{ left: number; width: number; label: string }> = [];
    for (const it of compactIntervals) {
      const start = new Date(it.start);
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      let cursor = new Date(start);
      while (cursor < it.end) {
        const a = Math.max(cursor.getTime(), it.start.getTime());
        const b = Math.min(new Date(cursor.getTime() + 7 * 86400000).getTime(), it.end.getTime());
        const fracA = (a - it.start.getTime()) / (it.end.getTime() - it.start.getTime());
        const fracB = (b - it.start.getTime()) / (it.end.getTime() - it.start.getTime());
        const left = it.left + it.width * fracA;
        const width = Math.max(0, it.width * (fracB - fracA));
        const weekNumber = (() => {
          const temp = new Date(a);
          temp.setHours(0, 0, 0, 0);
          temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
          const week1 = new Date(temp.getFullYear(), 0, 4);
          return (
            1 +
            Math.round(
              ((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
            )
          );
        })();
        ticks.push({ left, width, label: `W${weekNumber}` });
        cursor = new Date(cursor.getTime() + 7 * 86400000);
      }
    }
    return ticks;
  }, [compactIntervals]);

  const monthTicks = React.useMemo(() => {
    const ticks: Array<{ left: number; label: string }> = [];
    for (const it of compactIntervals) {
      const start = new Date(it.start.getFullYear(), it.start.getMonth(), 1);
      let cursor = new Date(start);
      while (cursor <= it.end) {
        const clamped = Math.max(cursor.getTime(), it.start.getTime());
        const frac = (clamped - it.start.getTime()) / (it.end.getTime() - it.start.getTime());
        const left = it.left + it.width * frac;
        ticks.push({ left, label: cursor.toLocaleString(undefined, { month: 'short' }) });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    return ticks;
  }, [compactIntervals]);

  const quarterTicks = React.useMemo(() => {
    const ticks: Array<{ left: number; label: string }> = [];
    for (const it of compactIntervals) {
      const startMonth = Math.floor(it.start.getMonth() / 3) * 3;
      let cursor = new Date(it.start.getFullYear(), startMonth, 1);
      while (cursor <= it.end) {
        const clamped = Math.max(cursor.getTime(), it.start.getTime());
        const frac = (clamped - it.start.getTime()) / (it.end.getTime() - it.start.getTime());
        const left = it.left + it.width * frac;
        const q = Math.floor(cursor.getMonth() / 3) + 1;
        ticks.push({ left, label: `Q${q} ${cursor.getFullYear()}` });
        cursor.setMonth(cursor.getMonth() + 3);
      }
    }
    return ticks;
  }, [compactIntervals]);

  

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Development Timeline</h2>
      </div>

      <div ref={containerRef} className="relative h-[112px] overflow-x-auto rounded-lg border bg-background">
        {!mounted ? (
          <div className="relative h-full min-w-full">
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/30" />
          </div>
        ) : (
        <div
          className="relative h-full"
          style={{ minWidth: timelineWidth }}
        >
          {/* Grid background: alternating weeks + month/quarter boundaries (always visible) */}
            <div className="pointer-events-none absolute inset-0 z-0">
              {weekTicks.map((t, i) => (
                <div
                  key={`w-${i}`}
                  className={i % 2 === 0 ? 'absolute top-0 bottom-0 bg-foreground/10' : 'absolute top-0 bottom-0'}
                  style={{ left: Math.max(0, Math.round(t.left * 100) / 100), width: Math.round(t.width * 100) / 100 }}
                />
              ))}
              {monthTicks.map((t, i) => (
                <div
                  key={`m-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{ left: Math.max(0, Math.round(t.left * 100) / 100), borderLeft: '1px solid hsl(var(--timeline-month-line))' }}
                />
              ))}
              {quarterTicks.map((t, i) => (
                <div
                  key={`q-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{ left: Math.max(0, Math.round(t.left * 100) / 100), borderLeft: '2px solid hsl(var(--timeline-quarter-line))' }}
                />
              ))}
            </div>

            {/* Labels above items with de-duped spacing */}
            {(() => {
              const filterByDistance = (
                arr: Array<{ left: number; label: string }>,
                minPx: number
              ) => {
                const out: Array<{ left: number; label: string }> = [];
                let last = -Infinity;
                for (const t of arr) {
                  const left = Math.max(0, Math.round(t.left * 100) / 100);
                  if (left - last >= minPx) {
                    out.push({ left, label: t.label });
                    last = left;
                  }
                }
                return out;
              };
              const months = filterByDistance(monthTicks, 80);
              const quarters = filterByDistance(quarterTicks, 140);
              return (
                <>
                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex select-none px-1 text-[10px] text-foreground">
                    {quarters.map((t, i) => (
                      <div key={`ql-${i}`} className="absolute -translate-x-1/2 whitespace-nowrap font-semibold bg-background/80 px-1 rounded" style={{ left: t.left }}>
                        {t.label}
                      </div>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute left-0 right-0 top-4 z-20 flex select-none px-1 text-[10px] text-foreground">
                    {months.map((t, i) => (
                      <div key={`ml-${i}`} className="absolute -translate-x-1/2 whitespace-nowrap bg-background/70 px-1 rounded" style={{ left: t.left }}>
                        {t.label}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-primary/30" />

          {withLane.map((s) => {
            const sStart = new Date(s.startDate);
            const sEnd = new Date(s.endDate);
            const startOffset = (sStart.getTime() - dataStart.getTime()) / 86400000;
            const duration = (sEnd.getTime() - sStart.getTime()) / 86400000;
            const left = compactPositions.get(s.id) ?? 0;
            const width = Math.max(duration * pxPerDay, 120);
            const colorClass =
              s.categories[0] === 'infrastructure'
                ? 'bg-orange-500 text-white'
                : s.categories[0] === 'ui-ux'
                ? 'bg-teal-500 text-white'
                : s.categories[0] === 'ai-features'
                ? 'bg-violet-500 text-white'
                : s.categories[0] === 'webrtc'
                ? 'bg-blue-600 text-white'
                : 'bg-green-600 text-white';

            const labelOffset = 18;
            const summary = (() => {
              const raw = s.deliverables && s.deliverables.length
                ? s.deliverables.slice(0, 2).map((d) => d.title).join(' • ')
                : s.title;
              const max = 38;
              return raw.length > max ? raw.slice(0, max - 1) + '…' : raw;
            })();
            return (
              <button
                key={s.id}
                className={`absolute z-10 flex h-14 flex-col items-center justify-center rounded-md px-2 text-xs font-semibold shadow-sm transition-transform hover:-translate-y-1 ${colorClass}`}
                style={{ left, width, top: labelOffset + 12 + s.lane * 52 }}
                onClick={() => onSelect(s)}
              >
                <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">{summary}</div>
                <div className="opacity-90">{s.issues} issues • {s.prs} PRs</div>
              </button>
            );
          })}
        </div>
        )}
      </div>
      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {[
          { name: 'infrastructure', className: 'bg-orange-500' },
          { name: 'ui-ux', className: 'bg-teal-500' },
          { name: 'ai-features', className: 'bg-violet-500' },
          { name: 'webrtc', className: 'bg-blue-600' },
          { name: 'other', className: 'bg-green-600' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${item.className}`} />
            <span className="capitalize">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


