/** @type {import('next').NextConfig} */
const nextConfig = {

  experimental: {
    allowedDevOrigins: ['https://5ed8be1e46e8.ngrok-free.app'],
  }, webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      // Remove React Refresh overlay plugin
      config.plugins = config.plugins.filter(
        (plugin) =>
          plugin.constructor.name !== 'ReactRefreshPlugin'
      );
    }
    return config;
  },
typescript: {
    ignoreBuildErrors: true, // ? disables blocking TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: true, // ? disables ESLint checks during build
  },	

};

module.exports = nextConfig;
