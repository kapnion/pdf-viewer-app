const fs = require('fs');
const path = require('path');

module.exports = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization.splitChunks.cacheGroups = {
        default: false,
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  generateBuildId: async () => {
    try {
      const buildId = fs.readFileSync(path.resolve(__dirname, '.next', 'BUILD_ID'), 'utf8').trim();
      return buildId;
    } catch (error) {
      console.error('Error reading BUILD_ID:', error);
      return null; // Return a default build ID or handle the error as needed
    }
  },
};
