#!/usr/bin/env node
/**
 * SEO Validation Script
 * Checks all pages for essential SEO requirements.
 * Used in CI/CD pipeline to gate deployments.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://futureatoms.com';

// Pages exempt from some checks
const NOINDEX_PAGES = [
  '404.html',
  'chipos-settings.html',
  'hub-coming-soon.html'
];

const FEATURE_PAGES = glob.sync('*-features.html', { cwd: PUBLIC_DIR });

let errors = 0;
let warnings = 0;

function error(file, msg) {
  console.error(`  ERROR [${file}]: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`  WARN  [${file}]: ${msg}`);
  warnings++;
}

function info(msg) {
  console.log(`  INFO: ${msg}`);
}

function validatePage(filePath) {
  const filename = path.basename(filePath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const isNoindex = NOINDEX_PAGES.includes(filename);
  const isFeature = FEATURE_PAGES.includes(filename);

  // 1. Title tag
  const title = $('title').text().trim();
  if (!title) {
    error(filename, 'Missing <title> tag');
  } else if (title.length > 70) {
    warn(filename, `Title too long (${title.length} chars, max 70)`);
  } else if (title.length < 10) {
    warn(filename, `Title too short (${title.length} chars, min 10)`);
  }

  // 2. Meta description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (!metaDesc && !isNoindex) {
    error(filename, 'Missing meta description');
  } else if (metaDesc.length > 160) {
    warn(filename, `Meta description too long (${metaDesc.length} chars, max 160)`);
  }

  // 3. Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  if (!canonical && !isNoindex) {
    error(filename, 'Missing canonical URL');
  }

  // 4. H1 tag
  const h1s = $('h1');
  if (h1s.length === 0 && !isNoindex) {
    warn(filename, 'No H1 tag found');
  } else if (h1s.length > 1) {
    warn(filename, `Multiple H1 tags found (${h1s.length})`);
  }

  // 5. og:type
  if (!$('meta[property="og:type"]').length && !isNoindex) {
    error(filename, 'Missing og:type meta tag');
  }

  // 6. Twitter card
  if (!$('meta[name="twitter:card"]').length && !isNoindex) {
    error(filename, 'Missing twitter:card meta tag');
  }

  // 7. og:title
  if (!$('meta[property="og:title"]').length && !isNoindex) {
    warn(filename, 'Missing og:title meta tag');
  }

  // 8. og:description
  if (!$('meta[property="og:description"]').length && !isNoindex) {
    warn(filename, 'Missing og:description meta tag');
  }

  // 9. og:image
  if (!$('meta[property="og:image"]').length && !isNoindex) {
    warn(filename, 'Missing og:image meta tag');
  }

  // 10. Structured data (JSON-LD)
  if (!$('script[type="application/ld+json"]').length && !isNoindex && !isFeature) {
    warn(filename, 'No JSON-LD structured data found');
  }

  // 11. Image alt text
  const imgsWithoutAlt = $('img:not([alt])').length;
  if (imgsWithoutAlt > 0) {
    warn(filename, `${imgsWithoutAlt} image(s) missing alt text`);
  }

  // 12. Language attribute
  if (!$('html').attr('lang')) {
    warn(filename, 'Missing lang attribute on <html>');
  }

  // 13. Viewport meta
  if (!$('meta[name="viewport"]').length) {
    error(filename, 'Missing viewport meta tag');
  }

  // 14. Feature pages should have noindex
  if (isFeature && !$('meta[name="robots"][content*="noindex"]').length) {
    warn(filename, 'Feature page missing noindex meta tag');
  }
}

function validateGlobalFiles() {
  console.log('\nChecking global SEO files...');

  // robots.txt
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    error('global', 'robots.txt not found');
  } else {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (!robots.includes('Sitemap:')) {
      warn('global', 'robots.txt missing Sitemap directive');
    }
    info('robots.txt exists and is valid');
  }

  // sitemap.xml
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    error('global', 'sitemap.xml not found');
  } else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    if (!sitemap.includes('<urlset')) {
      error('global', 'sitemap.xml is not valid XML');
    }
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    info(`sitemap.xml contains ${urlCount} URLs`);

    // Check that all non-excluded HTML files are in sitemap
    const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
      .filter(f => !NOINDEX_PAGES.includes(f));
    for (const file of htmlFiles) {
      const url = file === 'index.html' ? '/' : `/${file}`;
      if (!sitemap.includes(url)) {
        warn('sitemap', `${file} not found in sitemap.xml`);
      }
    }
  }

  // LLM files
  const llmPath = path.join(PUBLIC_DIR, 'llm.txt');
  if (!fs.existsSync(llmPath)) {
    warn('global', 'llm.txt not found');
  } else {
    const llm = fs.readFileSync(llmPath, 'utf8');
    if (llm.length < 100) {
      warn('global', 'llm.txt is too short (< 100 chars)');
    }
    info(`llm.txt exists (${llm.length} chars)`);
  }

  const llmsFullPath = path.join(PUBLIC_DIR, 'llms-full.txt');
  if (!fs.existsSync(llmsFullPath)) {
    warn('global', 'llms-full.txt not found');
  } else {
    const llmsFull = fs.readFileSync(llmsFullPath, 'utf8');
    if (llmsFull.length < 1000) {
      warn('global', 'llms-full.txt is too short (< 1000 chars)');
    }
    info(`llms-full.txt exists (${llmsFull.length} chars)`);
  }
}

function validateInternalLinks() {
  console.log('\nChecking internal links...');
  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR });
  const existingFiles = new Set(htmlFiles);
  let brokenLinks = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(PUBLIC_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      // Skip external links, anchors, javascript, mailto, tel
      if (href.startsWith('http') || href.startsWith('#') ||
          href.startsWith('javascript:') || href.startsWith('mailto:') ||
          href.startsWith('tel:')) return;

      // Normalize the path
      let target = href.split('#')[0].split('?')[0];
      if (target.startsWith('/')) target = target.slice(1);
      if (target === '' || target === '/') target = 'index.html';

      // Check if file exists (skip directories and non-html)
      if (target.endsWith('.html') && !existingFiles.has(target)) {
        warn(file, `Broken internal link: ${href}`);
        brokenLinks++;
      }
    });
  }

  if (brokenLinks === 0) {
    info('No broken internal links found');
  }
}

function main() {
  console.log('SEO Validation Report');
  console.log('====================\n');

  console.log('Checking individual pages...');
  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
    .map(f => path.join(PUBLIC_DIR, f));

  for (const file of htmlFiles) {
    validatePage(file);
  }

  validateGlobalFiles();
  validateInternalLinks();

  console.log('\n====================');
  console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);
  console.log(`Pages checked: ${htmlFiles.length}`);

  if (errors > 0) {
    console.error('\nSEO validation FAILED. Fix errors before deploying.');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('\nSEO validation PASSED with warnings.');
  } else {
    console.log('\nSEO validation PASSED.');
  }
}

main();
