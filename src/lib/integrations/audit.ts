import { db } from '@/lib/db';
import { integrationUsage } from '@/db/db-schema';

export interface IntegrationUsageLog {
  userEmail: string;
  providerId: string;
  capability: string;
  requestingApp: string;
  operation: 'read' | 'write' | 'sync';
  success: boolean;
  responseTimeMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export async function logIntegrationUsage(log: IntegrationUsageLog): Promise<void> {
  if (!db) {
    console.warn('Database not available - integration usage not logged');
    return;
  }

  try {
    await db.insert(integrationUsage).values({
      userEmail: log.userEmail,
      providerId: log.providerId,
      capability: log.capability,
      requestingApp: log.requestingApp,
      operation: log.operation,
      success: log.success,
      responseTimeMs: log.responseTimeMs,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
    });
  } catch (error) {
    console.error('Failed to log integration usage:', error);
    // Don't throw - logging shouldn't break the main functionality
  }
}

export async function getIntegrationUsageStats(userEmail: string, days: number = 30) {
  if (!db) return null;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // This would be a complex aggregation query
    // For now, return a placeholder structure
    return {
      totalRequests: 0,
      successRate: 100,
      topCapabilities: [],
      topApps: [],
      avgResponseTime: 0
    };
  } catch (error) {
    console.error('Failed to get integration usage stats:', error);
    return null;
  }
}