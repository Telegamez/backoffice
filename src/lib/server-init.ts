// Server-side initialization
// This runs when the application starts

// Initialize job processors
if (typeof window === 'undefined') {
  // Only run on server side
  import('./jobs/init').then(() => {
    console.log('Server-side job processors initialized');
  }).catch((error) => {
    console.error('Failed to initialize job processors:', error);
  });
}