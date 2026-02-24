#!/usr/bin/env node
/**
 * Phase 5: Structured Data Enhancement
 *
 * 5.1 - Add Organization schema to pages missing it
 * 5.2 - BreadcrumbList already exists on most pages; skip those that have it
 * 5.3 - Blog Article schema already exists on all blog pages
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const ORG_SCHEMA = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"FutureAtoms","url":"https://futureatoms.com","logo":"https://futureatoms.com/images/optimized/futureatoms-icon-512w.webp"}</script>`;

// Page titles for breadcrumb generation
const PAGE_META = {
  'about.html': { name: 'About', parent: null },
  'blog.html': { name: 'Blog', parent: null },
  'news.html': { name: 'News', parent: null },
  'careers.html': { name: 'Careers', parent: null },
  'contact.html': { name: 'Contact', parent: null },
  'feedback.html': { name: 'Feedback', parent: null },
  'hub-coming-soon.html': { name: 'Hub', parent: null },
  // Feature pages need breadcrumbs
  'adaptivision-features.html': { name: 'AdaptiVision Features', parent: { name: 'AdaptiVision', url: '/adaptivision' } },
  'agentic-features.html': { name: 'Agentic Features', parent: { name: 'Agentic', url: '/agentic' } },
  'bevybeats-features.html': { name: 'BevyBeats Features', parent: { name: 'BevyBeats', url: '/bevybeats' } },
  'chipos-features.html': { name: 'ChipOS Features', parent: { name: 'ChipOS', url: '/chipos' } },
  'chipos-changelog.html': { name: 'ChipOS Changelog', parent: { name: 'ChipOS', url: '/chipos' } },
  'chipos-docs.html': { name: 'ChipOS Documentation', parent: { name: 'ChipOS', url: '/chipos' } },
  'chipos-pricing.html': { name: 'ChipOS Pricing', parent: { name: 'ChipOS', url: '/chipos' } },
  'savitri-features.html': { name: 'Savitri Features', parent: { name: 'Savitri', url: '/savitri' } },
  'systemverilog-features.html': { name: 'SystemVerilog Features', parent: { name: 'SystemVerilog', url: '/systemverilog' } },
  'yuj-features.html': { name: 'Yuj Features', parent: { name: 'Yuj', url: '/yuj' } },
  'zaphy-features.html': { name: 'Zaphy Features', parent: { name: 'Zaphy', url: '/zaphy' } },
};

function makeBreadcrumb(pageName, pageSlug, parentInfo) {
  const items = [
    { pos: 1, name: 'Home', url: 'https://futureatoms.com/' }
  ];

  if (parentInfo) {
    items.push({ pos: 2, name: parentInfo.name, url: `https://futureatoms.com${parentInfo.url}` });
    items.push({ pos: 3, name: pageName, url: `https://futureatoms.com/${pageSlug}` });
  } else {
    items.push({ pos: 2, name: pageName, url: `https://futureatoms.com/${pageSlug}` });
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map(i => ({
      "@type": "ListItem",
      "position": i.pos,
      "name": i.name,
      "item": i.url
    }))
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileName = path.basename(filePath);
  const pageSlug = fileName.replace('.html', '');
  let changes = [];

  // 5.1 - Add Organization schema if missing
  if (!content.includes('"Organization"') ||
      (content.includes('"Organization"') && !content.includes('"@type":"Organization","name":"FutureAtoms","url"'))) {
    // Check if there's a standalone Organization schema already (not nested in publisher)
    const hasStandaloneOrg = content.includes('"@type":"Organization","name":"FutureAtoms","url":"https://futureatoms.com"');

    if (!hasStandaloneOrg) {
      // Insert before </head>
      content = content.replace('</head>', `${ORG_SCHEMA}\n</head>`);
      changes.push('org-schema');
    }
  }

  // 5.2 - Add BreadcrumbList if missing and page needs it
  if (!content.includes('BreadcrumbList') && PAGE_META[fileName]) {
    const meta = PAGE_META[fileName];
    const breadcrumb = makeBreadcrumb(meta.name, pageSlug, meta.parent);
    content = content.replace('</head>', `${breadcrumb}\n</head>`);
    changes.push('breadcrumb');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${fileName}: ${changes.join(', ')}`);
    return true;
  } else {
    return false;
  }
}

// Main execution
console.log('=== Phase 5: Structured Data Enhancement ===\n');

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
