#!/usr/bin/env node
/**
 * Phase 4: Image Optimization
 *
 * 4.1 - Add loading="lazy" to all <img> tags below the fold
 * 4.2 - Add decoding="async" to all <img> tags
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileName = path.basename(filePath);
  let lazyCount = 0;
  let decodingCount = 0;

  // Find all img tags
  content = content.replace(/<img\s([^>]*?)>/g, (match, attrs) => {
    let newAttrs = attrs;

    // Check if this is a header/nav logo (above the fold) - don't lazy load
    const isNavLogo = match.includes('futureatoms-icon-64w') ||
                      match.includes('futureatoms-icon-48w') ||
                      match.includes('logo') && match.includes('nav');

    // Determine if this img is in the header area (above fold)
    // We check if the img tag appears before the main content / first section
    const imgPos = content.indexOf(match);
    const mainPos = content.indexOf('id="main-content"');
    const headerEnd = content.indexOf('</header>');
    const isAboveFold = (headerEnd > 0 && imgPos < headerEnd) || isNavLogo;

    // Add loading="lazy" if not above fold and not already present
    if (!newAttrs.includes('loading=') && !isAboveFold) {
      newAttrs += ' loading="lazy"';
      lazyCount++;
    }

    // Add decoding="async" if not already present
    if (!newAttrs.includes('decoding=')) {
      newAttrs += ' decoding="async"';
      decodingCount++;
    }

    return `<img ${newAttrs}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${fileName}: lazy=${lazyCount}, decoding=${decodingCount}`);
    return true;
  }
  return false;
}

// Main execution
console.log('=== Phase 4: Image Optimization ===\n');

const htmlFiles = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(PUBLIC_DIR, f));

let changedFiles = 0;
for (const file of htmlFiles) {
  if (processHtmlFile(file)) {
    changedFiles++;
  }
}
console.log(`\n  ${changedFiles}/${htmlFiles.length} HTML files modified`);
