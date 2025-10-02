import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timelineSegments } from '@/db/db-schema';

export const POST = async () => {
  if (!db) return NextResponse.json({ error: 'No DB' }, { status: 500 });
  const demo = [
    {
      slug: 'nov-2024-w1',
      title: 'Next.js Migration Start',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-07'),
      categories: ['infrastructure'],
      issues: 8,
      prs: 15,
      customerFacing: 20,
      platformWork: 80,
      impact: 'high',
      deliverables: [
        { title: 'Project structure migration', type: 'infrastructure', impact: 'high' },
        { title: 'Build pipeline setup', type: 'infrastructure', impact: 'high' },
        { title: 'Basic routing implementation', type: 'infrastructure', impact: 'medium' },
      ],
      keyWork: ['Migrated legacy app', 'Setup CI/CD', 'Routing created'],
    },
    {
      slug: 'dec-2024-w1',
      title: 'User Authentication System',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-07'),
      categories: ['auth'],
      issues: 12,
      prs: 18,
      customerFacing: 90,
      platformWork: 10,
      impact: 'high',
      deliverables: [
        { title: 'Registration and login', type: 'auth', impact: 'high' },
        { title: 'Password reset', type: 'auth', impact: 'medium' },
        { title: 'Session management', type: 'auth', impact: 'high' },
      ],
      keyWork: ['Auth core', 'Secure password handling', 'Sessions'],
    },
  ];
  for (const s of demo) {
    await db.insert(timelineSegments).values(s).onConflictDoUpdate({
      target: timelineSegments.slug,
      set: s,
    });
  }
  return NextResponse.json({ inserted: demo.length });
};




