#!/usr/bin/env node
/**
 * Fix Social Meta Tags
 * Adds og:type and Twitter card meta tags to all HTML pages.
 * Uses cheerio to parse and modify HTML files.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://futureatoms.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/optimized/futureatoms-icon-512w.webp`;
const TWITTER_HANDLE = '@FutureAtoms';

// Blog posts get og:type "article", everything else "website"
const BLOG_PREFIXES = ['blog-'];

function isArticle(filename) {
  return BLOG_PREFIXES.some(prefix => filename.startsWith(prefix));
}

function fixSocialMeta(filePath) {
  const filename = path.basename(filePath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  const head = $('head');
  let modified = false;

  // Determine og:type
  const ogType = isArticle(filename) ? 'article' : 'website';

  // Add og:type if missing
  if (!$('meta[property="og:type"]').length) {
    // Insert after og:url or og:description or at end of existing OG tags
    const lastOg = $('meta[property^="og:"]').last();
    if (lastOg.length) {
      lastOg.after(`\n    <meta property="og:type" content="${ogType}">`);
    } else {
      // No OG tags at all - add after meta description
      const metaDesc = $('meta[name="description"]');
      if (metaDesc.length) {
        metaDesc.after(`\n    <meta property="og:type" content="${ogType}">`);
      } else {
        head.append(`\n    <meta property="og:type" content="${ogType}">`);
      }
    }
    modified = true;
  }

  // Get existing values for Twitter cards
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content') || DEFAULT_IMAGE;

  // Add Twitter card tags if missing
  if (!$('meta[name="twitter:card"]').length) {
    const twitterTags = [
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:site" content="${TWITTER_HANDLE}">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:image" content="${image}">`
    ];

    // Insert after OG tags
    const lastOgOrMeta = $('meta[property^="og:"]').last();
    if (lastOgOrMeta.length) {
      lastOgOrMeta.after('\n    ' + twitterTags.join('\n    '));
    } else {
      head.append('\n    ' + twitterTags.join('\n    '));
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, $.html(), 'utf8');
    console.log(`  Updated: ${filename}`);
  } else {
    console.log(`  Skipped (already has tags): ${filename}`);
  }

  return modified;
}

function main() {
  console.log('Fixing social meta tags...\n');

  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
    .map(f => path.join(PUBLIC_DIR, f));

  let updated = 0;
  for (const file of htmlFiles) {
    if (fixSocialMeta(file)) updated++;
  }

  console.log(`\nDone. Updated ${updated}/${htmlFiles.length} files.`);
}

main();
