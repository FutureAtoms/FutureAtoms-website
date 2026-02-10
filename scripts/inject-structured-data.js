#!/usr/bin/env node
/**
 * Inject Structured Data (JSON-LD)
 * Adds schema.org structured data to HTML pages:
 * - Homepage: Organization + WebSite with SearchAction
 * - Product pages: SoftwareApplication schema
 * - Blog articles: Article schema
 * - All sub-pages: BreadcrumbList schema
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://futureatoms.com';
const LOGO_URL = `${SITE_URL}/images/optimized/futureatoms-icon-512w.webp`;

const CORE_SCHEMA_TYPES = new Set([
  'Organization',
  'WebSite',
  'SoftwareApplication',
  'Article',
  'BreadcrumbList'
]);

const PRODUCT_PAGES = {
  'chipos.html': {
    name: 'ChipOS',
    description: 'AI-native operating system for semiconductor chip development and automation',
    category: 'DeveloperApplication',
    os: 'macOS, Linux'
  },
  'bevybeats.html': {
    name: 'BevyBeats',
    description: 'AI-powered music generation platform creating unique compositions with machine learning',
    category: 'MultimediaApplication',
    os: 'Web, iOS, Android'
  },
  'savitri.html': {
    name: 'Savitri',
    description: 'AI therapy app offering CBT, DBT, and ACT methodologies for mental wellness',
    category: 'HealthApplication',
    os: 'iOS, Android'
  },
  'zaphy.html': {
    name: 'Zaphy',
    description: 'Smart Chrome extension for LinkedIn automation and professional networking',
    category: 'BusinessApplication',
    os: 'Chrome'
  },
  'agentic.html': {
    name: 'Agentic Control',
    description: 'Advanced CLI tool for orchestrating multi-agent AI workflows',
    category: 'DeveloperApplication',
    os: 'macOS, Linux, Windows'
  },
  'yuj.html': {
    name: 'Yuj',
    description: 'Holistic yoga and workout app combining ancient wisdom with modern fitness science',
    category: 'HealthApplication',
    os: 'iOS, Android'
  },
  'adaptivision.html': {
    name: 'AdaptiveVision',
    description: 'Real-time adaptive object detection algorithms for computer vision applications',
    category: 'DeveloperApplication',
    os: 'Linux, Windows'
  },
  'systemverilog.html': {
    name: 'SystemVerilogGPT',
    description: 'Specialized GPT for hardware verification, RTL design, and SystemVerilog coding',
    category: 'DeveloperApplication',
    os: 'Web'
  }
};

const BLOG_PAGES = [
  'blog-ai-music-revolution.html',
  'blog-ai-therapy.html',
  'blog-semiconductor-ai.html',
  'blog-linkedin-automation.html',
  'blog-chipos-mcp.html'
];

function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FutureAtoms',
    url: SITE_URL,
    logo: LOGO_URL,
    description: 'Building the next generation of AI tools and platforms for developers, engineers, and creators.',
    sameAs: [
      'https://github.com/FutureAtoms',
      'https://twitter.com/FutureAtoms'
    ],
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Abhilash Chadhar'
    }
  };
}

function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FutureAtoms',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/blog.html?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

function getSoftwareAppSchema(config, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.name,
    description: config.description,
    applicationCategory: config.category,
    operatingSystem: config.os,
    url: url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    author: {
      '@type': 'Organization',
      name: 'FutureAtoms',
      url: SITE_URL
    }
  };
}

function getArticleSchema($, filename, url) {
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
  const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  const image = $('meta[property="og:image"]').attr('content') || LOGO_URL;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image,
    url: url,
    author: {
      '@type': 'Organization',
      name: 'FutureAtoms',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'FutureAtoms',
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL
      }
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0]
  };
}

function getBreadcrumbSchema(filename, pageTitle) {
  const items = [
    { name: 'Home', url: SITE_URL }
  ];

  if (filename.startsWith('blog-')) {
    items.push({ name: 'Blog', url: `${SITE_URL}/blog.html` });
    items.push({ name: pageTitle, url: `${SITE_URL}/${filename}` });
  } else if (filename !== 'index.html') {
    items.push({ name: pageTitle, url: `${SITE_URL}/${filename}` });
  }

  if (items.length <= 1) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function collectTypes(node, types = new Set()) {
  if (!node) return types;
  if (Array.isArray(node)) {
    node.forEach(item => collectTypes(item, types));
    return types;
  }
  if (typeof node === 'object') {
    if (node['@type']) {
      if (Array.isArray(node['@type'])) {
        node['@type'].forEach(t => types.add(t));
      } else {
        types.add(node['@type']);
      }
    }
    if (node['@graph']) {
      collectTypes(node['@graph'], types);
    }
    for (const value of Object.values(node)) {
      if (typeof value === 'object' && value !== null) {
        collectTypes(value, types);
      }
    }
  }
  return types;
}

function hasCoreSchemaType(data) {
  const types = collectTypes(data);
  for (const t of types) {
    if (CORE_SCHEMA_TYPES.has(t)) return true;
  }
  return false;
}

function extractPreservedSchemas($) {
  const preserved = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!hasCoreSchemaType(parsed)) {
        preserved.push(raw.trim());
      }
    } catch (err) {
      // Keep non-JSON or unparsable blocks to avoid losing manual schemas
      preserved.push(raw.trim());
    }
  });
  return preserved;
}

function injectStructuredData(filePath) {
  const filename = path.basename(filePath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  const preservedSchemas = extractPreservedSchemas($);

  // Remove existing JSON-LD scripts before re-injecting
  $('script[type="application/ld+json"]').remove();

  const url = filename === 'index.html' ? SITE_URL : `${SITE_URL}/${filename}`;
  const pageTitle = $('title').text().split('|')[0].split('-')[0].trim();
  const schemas = [];

  // Homepage gets Organization + WebSite
  if (filename === 'index.html') {
    schemas.push(getOrganizationSchema());
    schemas.push(getWebSiteSchema());
  }

  // Product pages get SoftwareApplication
  if (PRODUCT_PAGES[filename]) {
    schemas.push(getSoftwareAppSchema(PRODUCT_PAGES[filename], url));
  }

  // Blog articles get Article schema
  if (BLOG_PAGES.includes(filename)) {
    schemas.push(getArticleSchema($, filename, url));
  }

  // All sub-pages get BreadcrumbList
  const breadcrumb = getBreadcrumbSchema(filename, pageTitle);
  if (breadcrumb) {
    schemas.push(breadcrumb);
  }

  if (schemas.length === 0 && preservedSchemas.length === 0) {
    console.log(`  Skipped (no schema needed): ${filename}`);
    return false;
  }

  // Inject schemas before </head>
  const preservedScripts = preservedSchemas.map(schema =>
    `<script type="application/ld+json">${schema}</script>`
  );

  const generatedScripts = schemas.map(schema =>
    `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
  );

  const schemaScripts = [...preservedScripts, ...generatedScripts].join('\n    ');

  $('head').append('\n    ' + schemaScripts + '\n');

  fs.writeFileSync(filePath, $.html(), 'utf8');
  console.log(`  Injected ${schemas.length} schema(s): ${filename}`);
  return true;
}

function main() {
  console.log('Injecting structured data (JSON-LD)...\n');

  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
    .filter(f => f !== '404.html' && f !== 'chipos-settings.html')
    .map(f => path.join(PUBLIC_DIR, f));

  let updated = 0;
  for (const file of htmlFiles) {
    if (injectStructuredData(file)) updated++;
  }

  console.log(`\nDone. Injected schemas into ${updated}/${htmlFiles.length} files.`);
}

main();
