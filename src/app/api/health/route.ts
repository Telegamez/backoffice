import { NextResponse } from 'next/server';
import { checkRedisHealth } from '@/lib/redis';
import { GoogleAPIClient } from '@/lib/google-api';
import { getAllQueuesStatus } from '@/lib/queues';

export async function GET() {
  const health = {
    redis: false,
    googleApi: false,
    queues: null as Record<string, unknown> | null,
    timestamp: new Date().toISOString(),
    status: 'unhealthy' as 'healthy' | 'unhealthy' | 'degraded',
  };

  try {
    // Test Redis
    health.redis = await checkRedisHealth();
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Test Google API (using a dummy email)
    const client = new GoogleAPIClient('health-check@telegames.ai');
    const authTest = await client.testAuthentication();
    health.googleApi = authTest.success;
  } catch (error) {
    console.error('Google API health check failed:', error);
  }

  try {
    // Check queue status
    health.queues = await getAllQueuesStatus();
  } catch (error) {
    console.error('Queue status check failed:', error);
  }

  // Determine overall health status
  if (health.redis && health.googleApi) {
    health.status = 'healthy';
  } else if (health.redis || health.googleApi) {
    health.status = 'degraded';
  } else {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 206 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}