/**
 * Next.js Instrumentation
 * This file runs once when the server starts (Node.js runtime only)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server starting - initializing autonomous agent scheduler...');

    try {
      // Dynamically import to avoid edge runtime issues
      const { getScheduler } = await import('./lib/services/task-scheduler');

      const scheduler = getScheduler();
      await scheduler.initialize();

      console.log('✅ Autonomous agent scheduler initialized successfully');

      // Graceful shutdown
      const shutdown = async () => {
        console.log('🛑 Server shutting down - stopping scheduler...');
        await scheduler.shutdown();
        console.log('✅ Scheduler stopped gracefully');
        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error);
      // Don't crash the server if scheduler fails to initialize
      // The system can still function for other features
    }
  }
}
