#!/usr/bin/env node
/**
 * Sitemap Generator
 * Scans public/*.html, excludes admin/app/settings pages,
 * assigns priorities, and outputs public/sitemap.xml
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://futureatoms.com';

// Pages to exclude from sitemap
const EXCLUDED_PAGES = [
  'chipos-settings.html',
  'hub-coming-soon.html',
  '404.html'
];

// Priority assignments
const PRIORITY_MAP = {
  'index.html': { priority: '1.0', changefreq: 'weekly' },
  // Product pages
  'chipos.html': { priority: '0.8', changefreq: 'weekly' },
  'bevybeats.html': { priority: '0.8', changefreq: 'weekly' },
  'savitri.html': { priority: '0.8', changefreq: 'weekly' },
  'zaphy.html': { priority: '0.8', changefreq: 'weekly' },
  'agentic.html': { priority: '0.8', changefreq: 'weekly' },
  'yuj.html': { priority: '0.8', changefreq: 'weekly' },
  'adaptivision.html': { priority: '0.8', changefreq: 'weekly' },
  'systemverilog.html': { priority: '0.8', changefreq: 'weekly' },
  // Key pages
  'about.html': { priority: '0.6', changefreq: 'monthly' },
  'contact.html': { priority: '0.6', changefreq: 'monthly' },
  'careers.html': { priority: '0.6', changefreq: 'monthly' },
  'news.html': { priority: '0.7', changefreq: 'weekly' },
  'blog.html': { priority: '0.7', changefreq: 'weekly' },
  'feedback.html': { priority: '0.4', changefreq: 'monthly' },
  // ChipOS sub-pages
  'chipos-pricing.html': { priority: '0.7', changefreq: 'monthly' },
  'chipos-docs.html': { priority: '0.7', changefreq: 'weekly' },
  'chipos-changelog.html': { priority: '0.6', changefreq: 'weekly' },
  'chipos-pitch.html': { priority: '0.5', changefreq: 'monthly' },
};

// Blog posts get 0.7 priority
const BLOG_PRIORITY = { priority: '0.7', changefreq: 'monthly' };
// Feature pages get 0.4 (they'll be noindexed but still in sitemap for discovery)
const FEATURE_PRIORITY = { priority: '0.4', changefreq: 'monthly' };

function getPageConfig(filename) {
  if (PRIORITY_MAP[filename]) return PRIORITY_MAP[filename];
  if (filename.startsWith('blog-')) return BLOG_PRIORITY;
  if (filename.endsWith('-features.html')) return FEATURE_PRIORITY;
  return { priority: '0.5', changefreq: 'monthly' };
}

function generateSitemap() {
  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR });

  const pages = htmlFiles
    .filter(file => !EXCLUDED_PAGES.includes(file))
    .filter(file => !file.startsWith('app/'))
    .sort((a, b) => {
      const pa = parseFloat(getPageConfig(a).priority);
      const pb = parseFloat(getPageConfig(b).priority);
      return pb - pa;
    });

  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of pages) {
    const config = getPageConfig(page);
    const url = page === 'index.html' ? '/' : `/${page}`;

    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${config.changefreq}</changefreq>\n`;
    xml += `    <priority>${config.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  const outputPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`Total URLs: ${pages.length}`);
}

generateSitemap();
