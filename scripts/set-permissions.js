const fs = require('fs-extra');
const path = require('path');

const setPermissions = async () => {
  try {
    const nextDir = path.resolve(__dirname, '..', '.next');
    await fs.chmod(nextDir, 0o755);
    console.log(`Permissions set to 755 for ${nextDir}`);
  } catch (error) {
    console.error('Error setting permissions:', error);
  }
};

setPermissions();
