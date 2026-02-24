#!/usr/bin/env node

/**
 * generate-carousel.js — Main orchestrator for India AI Summit 2026 carousel.
 *
 * Usage:
 *   node scripts/carousel/generate-carousel.js [carousel|reel]
 *
 * Reads config.js, selects template per slide type, renders with Playwright,
 * optimizes with Sharp, outputs PNGs to the appropriate output directory.
 */

const path = require('path');
const fs = require('fs');
const { slides, DIMENSIONS } = require('./config');
const { SlideRenderer, buildHtml } = require('./utils/renderer');
const { optimizePng } = require('./utils/post-process');

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content/social-posts/india-ai-summit-2026');
const PHOTOS_DIR = path.join(CONTENT_DIR, 'photos');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const STYLES_PATH = path.join(TEMPLATES_DIR, 'shared-styles.css');
const BRAND_ICON = path.join(PROJECT_ROOT, 'public/images/futureatoms-icon.png');

async function main() {
  const format = (process.argv[2] || 'carousel').toLowerCase();
  if (!['carousel', 'reel'].includes(format)) {
    console.error('Usage: generate-carousel.js [carousel|reel]');
    process.exit(1);
  }

  const dims = DIMENSIONS[format];
  const outputDir = path.join(CONTENT_DIR, 'output', format);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n  Generating ${format} slides (${dims.width}x${dims.height})\n`);

  const renderer = new SlideRenderer();
  await renderer.init();

  let successCount = 0;

  for (const slide of slides) {
    const slideNum = slide.slide;
    const templateFile = slide.type === 'photo' ? 'photo-slide.html' : 'text-card-slide.html';
    const templatePath = path.join(TEMPLATES_DIR, templateFile);

    // Check for photo — convert to base64 data URI for Playwright compatibility
    let photoUrl = '';
    let photoClass = '';
    if (slide.type === 'photo' && slide.photo) {
      const photoPath = path.join(PHOTOS_DIR, slide.photo);
      if (fs.existsSync(photoPath)) {
        const photoBuffer = fs.readFileSync(photoPath);
        const ext = path.extname(slide.photo).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        photoUrl = `data:${mime};base64,${photoBuffer.toString('base64')}`;
      } else {
        photoClass = 'no-photo';
        console.log(`  [!] Slide ${slideNum}: Photo not found (${slide.photo}), using gradient placeholder`);
      }
    }

    // Swipe arrow (slide 1 only)
    const swipeArrow = slide.showSwipeArrow
      ? '<div class="swipe-arrow">&rsaquo;</div>'
      : '';

    // Convert brand icon to base64 data URI
    let brandIconUrl = '';
    if (fs.existsSync(BRAND_ICON)) {
      const iconBuffer = fs.readFileSync(BRAND_ICON);
      const iconExt = path.extname(BRAND_ICON).toLowerCase();
      const iconMime = iconExt === '.jpg' || iconExt === '.jpeg' ? 'image/jpeg' : 'image/png';
      brandIconUrl = `data:${iconMime};base64,${iconBuffer.toString('base64')}`;
    }

    // Build substitutions
    const subs = {
      STYLES_PATH: STYLES_PATH,
      WIDTH: String(dims.width),
      HEIGHT: String(dims.height),
      FORMAT_CLASS: format === 'reel' ? 'reel' : '',
      PHOTO_URL: photoUrl,
      PHOTO_CLASS: photoClass,
      BRAND_ICON_PATH: brandIconUrl,
      CONTENT: slide.content,
      SLIDE_NUM: String(slideNum),
      SWIPE_ARROW: swipeArrow,
    };

    const html = buildHtml(templatePath, subs);
    const outputPath = path.join(outputDir, `slide-${String(slideNum).padStart(2, '0')}.png`);

    try {
      await renderer.renderSlide(html, dims, outputPath);

      // Optimize with Sharp
      const result = await optimizePng(outputPath);
      const sizeKB = (result.optimizedSize / 1024).toFixed(0);
      console.log(`  [${slideNum}/10] ${slide.type.padEnd(10)} -> ${path.basename(outputPath)}  (${sizeKB} KB, -${result.savedPercent}%)`);
      successCount++;
    } catch (err) {
      console.error(`  [${slideNum}/10] ERROR: ${err.message}`);
    }
  }

  await renderer.close();

  console.log(`\n  Done! ${successCount}/10 slides generated in:`);
  console.log(`  ${outputDir}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
