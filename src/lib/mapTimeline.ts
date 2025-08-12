import { db } from '@/lib/db';
import { githubIssues, githubPullRequests, timelineSegments } from '@/db/db-schema';
import { and, gte, lte } from 'drizzle-orm';

type Label = { name: string };

type Category = 'infrastructure' | 'ui-ux' | 'ai-features' | 'webrtc' | 'auth' | 'uncategorized';

const normalize = (s: string) => s.toLowerCase();

const labelToCategory = (label: string): Category => {
  const l = normalize(label);
  if (/(infra|infrastructure|devops|ci|docker|k8s|grafana|loki)/.test(l)) return 'infrastructure';
  if (/(ui|ux|design|frontend|css|tailwind)/.test(l)) return 'ui-ux';
  if (/(ai|openai|gpt|ml|model|prompt)/.test(l)) return 'ai-features';
  if (/(webrtc|stream|video|audio)/.test(l)) return 'webrtc';
  if (/(auth|login|user|session|supabase)/.test(l)) return 'auth';
  return 'uncategorized';
};

const getWeekStart = (d: Date) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0..6 Sun..Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setUTCDate(x.getUTCDate() - diff);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

export type MapOptions = {
  start?: string; // ISO date
  end?: string;   // ISO date
};

export const mapGithubToWeeklySegments = async (opts: MapOptions = {}) => {
  if (!db) return { inserted: 0, updated: 0 };

  const startDate = opts.start ? new Date(opts.start) : undefined;
  const endDate = opts.end ? new Date(opts.end) : undefined;

  const issueRows = startDate || endDate
    ? await db
        .select()
        .from(githubIssues)
        .where(
          startDate && endDate
            ? and(gte(githubIssues.createdAt, startDate), lte(githubIssues.createdAt, endDate))
            : startDate
            ? gte(githubIssues.createdAt, startDate)
            : lte(githubIssues.createdAt, endDate as Date)
        )
    : await db.select().from(githubIssues);

  const prRows = startDate || endDate
    ? await db
        .select()
        .from(githubPullRequests)
        .where(
          startDate && endDate
            ? and(gte(githubPullRequests.createdAt, startDate), lte(githubPullRequests.createdAt, endDate))
            : startDate
            ? gte(githubPullRequests.createdAt, startDate)
            : lte(githubPullRequests.createdAt, endDate as Date)
        )
    : await db.select().from(githubPullRequests);

  type Bucket = {
    weekStart: Date;
    issues: number;
    prs: number;
    categoryCounts: Record<Category, number>;
    topTitles: string[]; // from PRs/issues
  };

  const bucketKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  const buckets = new Map<string, Bucket>();

  const addToBucket = (date: Date, categories: Category[], title: string, isPR: boolean) => {
    const ws = getWeekStart(date);
    const key = bucketKey(ws);
    const b = buckets.get(key) ?? {
      weekStart: ws,
      issues: 0,
      prs: 0,
      categoryCounts: { infrastructure: 0, 'ui-ux': 0, 'ai-features': 0, webrtc: 0, auth: 0, uncategorized: 0 },
      topTitles: [],
    };
    if (isPR) b.prs += 1; else b.issues += 1;
    for (const c of categories) b.categoryCounts[c] += 1;
    if (b.topTitles.length < 6) b.topTitles.push(title);
    buckets.set(key, b);
  };

  for (const it of issueRows) {
    const date = it.createdAt as Date;
    const labels = (it.labelsJson as Label[]) ?? [];
    const cats: Category[] = labels.length
      ? (labels.map(l => labelToCategory(l.name)).filter(Boolean) as Category[])
      : (['uncategorized'] as Category[]);
    addToBucket(date, cats, it.title, false);
  }

  for (const pr of prRows) {
    const date = pr.createdAt as Date;
    // PR labels are not stored; derive from title keywords
    const titleCats = [labelToCategory(pr.title)];
    addToBucket(date, titleCats[0] ? titleCats : ['uncategorized'], pr.title, true);
  }

  let inserted = 0;
  const updated = 0;

  for (const [, b] of buckets) {
    const totalCategorized = Object.values(b.categoryCounts).reduce((a, n) => a + n, 0) || 1;
    const customerCount = b.categoryCounts['ui-ux'] + b.categoryCounts['ai-features'];
    const customerFacing = Math.round((customerCount / totalCategorized) * 100);
    const platformWork = 100 - customerFacing;

    const impact: 'high' | 'medium' | 'low' = b.prs > 10 || b.issues > 15 ? 'high' : b.prs > 3 || b.issues > 7 ? 'medium' : 'low';

    const slug = `${b.weekStart.toISOString().slice(0, 10)}`; // week start date
    const title = `Week of ${b.weekStart.toISOString().slice(0, 10)}`;
    const endDate = new Date(b.weekStart);
    endDate.setUTCDate(endDate.getUTCDate() + 6);

    const categories: Category[] = (Object.entries(b.categoryCounts)
      .filter(([, n]) => n > 0)
      .map(([k]) => k as Category)) as Category[];

    const values = {
      slug,
      title,
      startDate: b.weekStart,
      endDate,
      categories: categories.length ? categories : ['uncategorized'],
      issues: b.issues,
      prs: b.prs,
      customerFacing,
      platformWork,
      impact,
      deliverables: b.topTitles.slice(0, 5).map(t => ({ title: t, type: 'summary', impact })),
      keyWork: b.topTitles.slice(0, 5),
    } as const;

    await db.insert(timelineSegments).values(values).onConflictDoUpdate({
      target: timelineSegments.slug,
      set: values,
    });
    // Drizzle doesn't return affectedRows in pg; we approximate by treating as update when slug exists.
    // Ignore exact counts; just track totals roughly.
    inserted += 1;
  }

  return { inserted, updated };
};


