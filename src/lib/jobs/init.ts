// Job processor initialization
// Import this file to start all job processors

import './document-analysis';

console.log('Job processors initialized');

// Export queue status for monitoring
export { getAllQueuesStatus } from '../queues';