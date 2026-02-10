#!/usr/bin/env node
/**
 * Inject Google Analytics (GA4) + Search Console verification
 * Adds GA4 gtag snippet before </head> on all public HTML pages (except 404).
 * Optionally adds google-site-verification meta tag.
 *
 * Usage:
 *   GA4_ID=G-XXXXXXXXXX GOOGLE_SITE_VERIFICATION=contentvalue node scripts/inject-analytics.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const EXCLUDED_PAGES = ['404.html'];

const GA4_ID = process.env.GA4_ID || process.env.GA_MEASUREMENT_ID || process.env.GTAG_ID;
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_VERIFICATION || '';

if (!GA4_ID) {
  console.error('Missing GA4_ID. Set GA4_ID=G-XXXXXXXXXX to inject analytics.');
  process.exit(1);
}

function parseVerificationContent(value) {
  if (!value) return '';
  const match = value.match(/content=["']([^"']+)["']/i);
  if (match) return match[1];
  return value.trim();
}

const verificationContent = parseVerificationContent(GOOGLE_SITE_VERIFICATION);

function buildGtagSnippet(id) {
  return [
    '<!-- Google tag (gtag.js) -->',
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>`,
    '<script>',
    '  window.dataLayer = window.dataLayer || [];',
    '  function gtag(){dataLayer.push(arguments);}',
    '  gtag(\'js\', new Date());',
    `  gtag(\'config\', '${id}');`,
    '</script>'
  ].join('\n');
}

function insertAfter($, selector, html) {
  const node = $(selector).first();
  if (node.length) {
    node.after(`\n    ${html}`);
  } else {
    $('head').prepend(`\n    ${html}`);
  }
}

function injectAnalytics(filePath) {
  const filename = path.basename(filePath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  let modified = false;

  // Remove existing GA scripts
  $('script[src*="googletagmanager.com/gtag/js"]').remove();
  $('script').each((_, el) => {
    const scriptText = $(el).html() || '';
    if (scriptText.includes("gtag('config'") || scriptText.includes('gtag(\'config\'') || scriptText.includes('gtag(\"config\"')) {
      $(el).remove();
    }
  });

  // Remove existing verification tag
  if ($('meta[name="google-site-verification"]').length) {
    $('meta[name="google-site-verification"]').remove();
  }

  if (verificationContent) {
    const metaTag = `<meta name="google-site-verification" content="${verificationContent}">`;
    insertAfter($, 'meta[name="viewport"]', metaTag);
    modified = true;
  }

  // Inject GA4 snippet
  $('head').append(`\n    ${buildGtagSnippet(GA4_ID)}\n`);
  modified = true;

  if (modified) {
    fs.writeFileSync(filePath, $.html(), 'utf8');
    console.log(`  Injected analytics: ${filename}`);
  }
}

function main() {
  console.log('Injecting GA4 analytics...\n');

  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
    .filter(file => !EXCLUDED_PAGES.includes(file))
    .map(file => path.join(PUBLIC_DIR, file));

  for (const file of htmlFiles) {
    injectAnalytics(file);
  }

  console.log(`\nDone. Updated ${htmlFiles.length} files.`);
  if (!verificationContent) {
    console.warn('Note: GOOGLE_SITE_VERIFICATION not set; verification meta tag was not added.');
  }
}

main();
