import ClientHome, { type ServerSegment } from './pageClient';

export default async function Home() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  const res = await fetch(`${base}/api/segments`, { cache: 'no-store' });
  const segments = (await res.json()) as ServerSegment[];
  return <ClientHome segments={segments} />;
}

