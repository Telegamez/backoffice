const nextConfig = { 
  output: 'standalone',
  serverExternalPackages: ['bull'],
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Exclude Bull from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        worker_threads: false,
      };
      
      config.externals = [
        ...(config.externals || []),
        'bull'
      ];
    }
    return config;
  }
};
export default nextConfig;
