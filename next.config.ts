const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['bull', 'node-cron'],
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
