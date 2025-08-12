import { z } from 'zod';
import { db } from '@/lib/db';
import { githubIssues, githubPullRequests } from '@/db/db-schema';
import { eq } from 'drizzle-orm';

export const GithubSyncInput = z.object({
  repo: z.string().default('Telegamez/telegamez'),
  token: z.string().optional(),
  perPage: z.number().int().min(1).max(100).default(50),
  maxPages: z.number().int().min(1).max(20).default(5),
});

type Issue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  user?: { login?: string } | null;
  labels: Array<{ name?: string } | string>;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown; // presence indicates it's a PR in issues list
};

type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  user?: { login?: string } | null;
  merged_at: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

const ghFetch = async (path: string, token?: string) => {
  const url = `https://api.github.com${path}`;
  const resp = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'telegamez-timeline-sync',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API error ${resp.status}: ${text}`);
  }
  return resp.json();
};

export const syncIssues = async (
  repo: string,
  token: string | undefined,
  perPage: number,
  maxPages: number
) => {
  if (!db) return { count: 0 };
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const data = (await ghFetch(
      `/repos/${repo}/issues?state=all&per_page=${perPage}&page=${page}`,
      token
    )) as Issue[];
    if (!data.length) break;
    for (const it of data) {
      if ((it as Issue).pull_request) continue; // skip PRs from issues endpoint
      total++;
      const labels = Array.isArray(it.labels)
        ? (it.labels as Array<{ name?: string } | string>).map((l) =>
            typeof l === 'string' ? { name: l } : { name: l?.name ?? '' }
          )
        : [];

      // upsert
      const existing = await db
        .select({ id: githubIssues.id })
        .from(githubIssues)
        .where(eq(githubIssues.id, it.id));
      if (existing.length) {
        await db
          .update(githubIssues)
          .set({
            number: it.number,
            title: it.title,
            body: it.body ?? null,
            state: it.state,
            authorLogin: it.user?.login ?? null,
            labelsJson: labels as Array<{ name: string }>,
            htmlUrl: it.html_url,
            createdAt: new Date(it.created_at),
            updatedAt: new Date(it.updated_at),
            closedAt: it.closed_at ? new Date(it.closed_at) : null,
          })
          .where(eq(githubIssues.id, it.id));
      } else {
        await db.insert(githubIssues).values({
          id: it.id,
          number: it.number,
          title: it.title,
          body: it.body ?? null,
          state: it.state,
          authorLogin: it.user?.login ?? null,
          labelsJson: labels as Array<{ name: string }>,
          htmlUrl: it.html_url,
          createdAt: new Date(it.created_at),
          updatedAt: new Date(it.updated_at),
          closedAt: it.closed_at ? new Date(it.closed_at) : null,
        });
      }
    }
  }
  return { count: total };
};

export const syncPullRequests = async (
  repo: string,
  token: string | undefined,
  perPage: number,
  maxPages: number
) => {
  if (!db) return { count: 0 };
  let total = 0;
  for (let page = 1; page <= maxPages; page++) {
    const data = (await ghFetch(
      `/repos/${repo}/pulls?state=all&per_page=${perPage}&page=${page}`,
      token
    )) as PullRequest[];
    if (!data.length) break;
    for (const pr of data) {
      total++;
      const merged = pr.merged_at ? 1 : 0;

      const existing = await db
        .select({ id: githubPullRequests.id })
        .from(githubPullRequests)
        .where(eq(githubPullRequests.id, pr.id));
      if (existing.length) {
        await db
          .update(githubPullRequests)
          .set({
            number: pr.number,
            title: pr.title,
            body: pr.body ?? null,
            state: pr.state,
            authorLogin: pr.user?.login ?? null,
            merged,
            htmlUrl: pr.html_url,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
          })
          .where(eq(githubPullRequests.id, pr.id));
      } else {
        await db.insert(githubPullRequests).values({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          body: pr.body ?? null,
          state: pr.state,
          authorLogin: pr.user?.login ?? null,
          merged,
          htmlUrl: pr.html_url,
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at),
          closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        });
      }
    }
  }
  return { count: total };
};


