#!/usr/bin/env node

/**
 * Verify that Git LFS files are actual binaries, not pointer files.
 * This prevents deploying LFS pointers instead of real content.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const LFS_POINTER_SIGNATURE = 'version https://git-lfs';
const DEB_SIGNATURE = '!<arch>';

async function verifyLfsFiles() {
  console.log('Verifying LFS files...\n');

  const publicDir = path.join(__dirname, '..', 'public');
  const debFiles = await glob('*.deb', { cwd: publicDir });

  if (debFiles.length === 0) {
    console.log('No .deb files found in public/ - skipping verification.');
    return;
  }

  let hasErrors = false;

  for (const file of debFiles) {
    const filePath = path.join(publicDir, file);
    const stats = fs.statSync(filePath);

    // Read first 100 bytes to check signature
    const buffer = Buffer.alloc(100);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);

    const header = buffer.toString('utf8', 0, 50);

    if (header.includes(LFS_POINTER_SIGNATURE)) {
      console.error(`ERROR: ${file} is an LFS pointer file, not the actual binary!`);
      console.error('       Run "git lfs pull" to fetch the actual content.\n');
      hasErrors = true;
    } else if (header.startsWith(DEB_SIGNATURE)) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
      console.log(`✓ ${file} - Valid Debian package (${sizeMB} MB)`);
    } else {
      console.warn(`WARNING: ${file} - Unknown format (may not be a valid .deb)`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('Verification failed! Please run "git lfs pull" before deploying.');
    process.exit(1);
  }

  console.log('All LFS files verified successfully!');
}

verifyLfsFiles().catch(err => {
  console.error('Verification error:', err.message);
  process.exit(1);
});
