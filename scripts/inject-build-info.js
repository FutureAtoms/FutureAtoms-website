const fs = require('fs');
const path = require('path');

// Build info object with deployment metadata
const buildInfo = {
  version: process.env.VERSION || require('../package.json').version,
  commit: (process.env.GITHUB_SHA || 'local').substring(0, 7),
  branch: process.env.GITHUB_REF_NAME || 'local',
  buildTime: new Date().toISOString(),
  buildNumber: process.env.GITHUB_RUN_NUMBER || 'local'
};

// Write to public directory for deployment
const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:');
console.log(JSON.stringify(buildInfo, null, 2));
