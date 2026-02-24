/**
 * Sharp-based PNG post-processing for carousel slides.
 * Optimizes file size while maintaining quality.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimize a PNG file in-place.
 * @param {string} filePath - Path to the PNG file
 * @param {object} opts - Options
 * @param {number} opts.quality - PNG compression level (1-9, default 6)
 * @returns {object} { originalSize, optimizedSize, savedPercent }
 */
async function optimizePng(filePath, opts = {}) {
  const { quality = 6 } = opts;
  const originalBuf = fs.readFileSync(filePath);
  const originalSize = originalBuf.length;

  const optimizedBuf = await sharp(originalBuf)
    .png({
      compressionLevel: quality,
      adaptiveFiltering: true,
    })
    .toBuffer();

  fs.writeFileSync(filePath, optimizedBuf);
  const optimizedSize = optimizedBuf.length;
  const savedPercent = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  return { originalSize, optimizedSize, savedPercent };
}

/**
 * Optimize all PNGs in a directory.
 * @param {string} dir - Directory containing PNGs
 * @returns {object} { totalOriginal, totalOptimized, fileCount }
 */
async function optimizeDirectory(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const result = await optimizePng(filePath);
    totalOriginal += result.originalSize;
    totalOptimized += result.optimizedSize;
  }

  return {
    totalOriginal,
    totalOptimized,
    fileCount: files.length,
    savedPercent: ((1 - totalOptimized / totalOriginal) * 100).toFixed(1),
  };
}

module.exports = { optimizePng, optimizeDirectory };
