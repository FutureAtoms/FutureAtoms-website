#!/usr/bin/env node
/**
 * Phase 3: Head Meta Enhancements
 *
 * 3.1 - Add theme-color, manifest, dns-prefetch to every page's <head>
 * 3.2 - Create manifest.json (handled separately)
 * 3.3 - Fix external links missing rel="noopener noreferrer"
 * 3.4 - Add skip-to-content accessibility link + id="main-content"
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const META_TAGS = `    <meta name="theme-color" content="#0a0a0f">
    <link rel="manifest" href="/manifest.json">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="dns-prefetch" href="//cdn.tailwindcss.com">`;

const SKIP_LINK = `<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-cyan-500 focus:text-black focus:px-4 focus:py-2 focus:rounded">Skip to content</a>`;

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  let changes = [];

  // 3.1 - Add meta tags to <head> (after viewport meta or after last meta in head)
  if (!content.includes('name="theme-color"')) {
    // Insert after the viewport meta tag, or after <head> if no viewport
    if (content.includes('name="viewport"')) {
      content = content.replace(
        /(<meta name="viewport"[^>]*>)/,
        `$1\n${META_TAGS}`
      );
    } else {
      // Insert after <head> opening
      content = content.replace(
        /(<head[^>]*>)/,
        `$1\n${META_TAGS}`
      );
    }
    changes.push('theme-color+manifest+dns-prefetch');
  }

  // 3.3 - Fix external links: add rel="noopener noreferrer" where missing
  // Find target="_blank" links missing noreferrer
  content = content.replace(
    /(<a\s[^>]*target="_blank"[^>]*rel=")noopener(")/g,
    '$1noopener noreferrer$2'
  );
  // Also handle case where rel has just noopener with other order
  content = content.replace(
    /(<a\s[^>]*rel=")noopener("[^>]*target="_blank")/g,
    '$1noopener noreferrer$2'
  );
  // Handle target="_blank" links with NO rel attribute at all
  content = content.replace(
    /(<a\s[^>]*target="_blank")(?![^>]*rel=)/g,
    '$1 rel="noopener noreferrer"'
  );

  // 3.4 - Add skip-to-content link after <body>
  if (!content.includes('skip-to-content') && !content.includes('#main-content')) {
    // Add skip link right after <body...>
    content = content.replace(
      /(<body[^>]*>)/,
      `$1\n${SKIP_LINK}`
    );
    changes.push('skip-link');

    // Add id="main-content" to <main> element
    if (content.includes('<main ')) {
      content = content.replace(
        /<main\s/,
        '<main id="main-content" '
      );
      changes.push('main-content-id');
    } else if (content.includes('<main>')) {
      content = content.replace(
        '<main>',
        '<main id="main-content">'
      );
      changes.push('main-content-id');
    } else {
      // For pages without <main>, find the first significant content div after nav
      // Use the first <section> or first major div
      if (content.includes('<section ')) {
        content = content.replace(
          /<section /,
          '<section id="main-content" '
        );
        changes.push('section-content-id');
      } else if (content.includes('class="container"')) {
        content = content.replace(
          /class="container"/,
          'id="main-content" class="container"'
        );
        changes.push('container-content-id');
      }
    }
  }

  if (changes.length > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${fileName}: ${changes.join(', ')}`);
    return true;
  }
  return false;
}

// Main execution
console.log('=== Phase 3: Head Meta Enhancements ===\n');

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
