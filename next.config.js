const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
    const buildIdPath = path.resolve(__dirname, '.next', 'BUILD_ID');
    try {
      if (!fs.existsSync(buildIdPath)) {
        const newBuildId = uuidv4();
        fs.writeFileSync(buildIdPath, newBuildId, 'utf8');
        return newBuildId;
      }
      const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
      return buildId;
    } catch (error) {
      console.error('Error handling BUILD_ID:', error);
      return uuidv4(); // Return a new build ID if there's an error
    }
  },
};
