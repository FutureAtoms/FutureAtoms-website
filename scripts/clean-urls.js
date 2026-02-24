#!/usr/bin/env node
/**
 * Clean URL Migration Script
 * Removes .html from all internal references across the FutureAtoms website.
 *
 * Handles:
 * - Internal href links (href="page.html" → href="/page")
 * - Canonical & OG URLs (futureatoms.com/page.html → futureatoms.com/page)
 * - JavaScript URL references (window.location, redirectTo, url properties)
 * - Structured data (JSON-LD url/item fields)
 * - Support files (sitemap.xml, robots.txt, llm.txt, llms-full.txt)
 * - Test files (page.goto, assertions)
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TESTS_DIR = path.join(__dirname, '..', 'tests');

// All known internal HTML pages (without .html extension)
const PAGES = [
  'index', 'about', 'accept-invite', 'adaptivision-features', 'adaptivision',
  'agentic-features', 'agentic', 'bevybeats-features', 'bevybeats',
  'billing-dashboard', 'blog-ai-music-revolution', 'blog-ai-therapy',
  'blog-chipos-launch', 'blog-chipos-mcp', 'blog-linkedin-automation',
  'blog-semiconductor-ai', 'blog', 'careers', 'chipos-changelog',
  'chipos-docs', 'chipos-features', 'chipos-pitch', 'chipos-pricing',
  'chipos-settings', 'chipos', 'contact', 'feedback', 'hub-coming-soon',
  'india-ai-summit-2026', 'news', 'savitri-features', 'savitri',
  'signup', 'swaastik-pitch', 'swaastik', 'systemverilog-features',
  'systemverilog', 'yuj-features', 'yuj', 'zaphy-features', 'zaphy', '404'
];

let totalReplacements = 0;
let fileChanges = {};

function countAndReplace(content, pattern, replacement, label) {
  let count = 0;
  const newContent = content.replace(pattern, (...args) => {
    count++;
    if (typeof replacement === 'function') {
      return replacement(...args);
    }
    return replacement;
  });
  if (count > 0) {
    totalReplacements += count;
  }
  return { content: newContent, count };
}

function cleanHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileName = path.basename(filePath);
  let changes = [];

  // 1. Internal href links: href="page.html" → href="/page"
  //    Also handles href="page.html#anchor" → href="/page#anchor"
  //    Also handles href="page.html?query" → href="/page?query"
  //    Special case: index.html → /
  {
    const result = countAndReplace(content,
      /href="([a-zA-Z0-9_-]+)\.html((?:#[^"]*|(?:\?[^"]*))?)" /g,
      (match, page, suffix) => {
        if (page === 'index') {
          return `href="/${suffix}" `;
        }
        return `href="/${page}${suffix}" `;
      },
      'href with space after'
    );
    if (result.count) changes.push(`href(space): ${result.count}`);
    content = result.content;
  }

  // href="page.html"> and href="page.html"/>
  {
    const result = countAndReplace(content,
      /href="([a-zA-Z0-9_-]+)\.html((?:#[^"]*|(?:\?[^"]*))?)"(>|\/>)/g,
      (match, page, suffix, closing) => {
        if (page === 'index') {
          return `href="/${suffix}"${closing}`;
        }
        return `href="/${page}${suffix}"${closing}`;
      },
      'href with closing'
    );
    if (result.count) changes.push(`href(close): ${result.count}`);
    content = result.content;
  }

  // href='page.html' (single quotes)
  {
    const result = countAndReplace(content,
      /href='([a-zA-Z0-9_-]+)\.html((?:#[^']*|(?:\?[^']*))?)'/g,
      (match, page, suffix) => {
        if (page === 'index') {
          return `href='/${suffix}'`;
        }
        return `href='/${page}${suffix}'`;
      },
      'href single quotes'
    );
    if (result.count) changes.push(`href(sq): ${result.count}`);
    content = result.content;
  }

  // 2. Canonical & OG URLs: full domain references
  //    https://futureatoms.com/page.html → https://futureatoms.com/page
  //    Special: https://futureatoms.com/index.html → https://futureatoms.com/
  {
    const result = countAndReplace(content,
      /https:\/\/futureatoms\.com\/([a-zA-Z0-9_-]+)\.html/g,
      (match, page) => {
        if (page === 'index') {
          return 'https://futureatoms.com/';
        }
        return `https://futureatoms.com/${page}`;
      },
      'full URL'
    );
    if (result.count) changes.push(`fullURL: ${result.count}`);
    content = result.content;
  }

  // 3. JavaScript URL references

  // window.location.replace('/page.html') or window.location.replace('/page.html')
  {
    const result = countAndReplace(content,
      /window\.location\.replace\('\/([a-zA-Z0-9_-]+)\.html'\)/g,
      (match, page) => {
        if (page === 'index') {
          return "window.location.replace('/')";
        }
        return `window.location.replace('/${page}')`;
      },
      'location.replace'
    );
    if (result.count) changes.push(`loc.replace: ${result.count}`);
    content = result.content;
  }

  // window.location.href = 'page.html...' (with potential query string)
  {
    const result = countAndReplace(content,
      /window\.location\.href\s*=\s*'([a-zA-Z0-9_-]+)\.html([^']*)'/g,
      (match, page, suffix) => {
        if (page === 'index') {
          return `window.location.href = '/${suffix}'`;
        }
        return `window.location.href = '/${page}${suffix}'`;
      },
      'location.href assignment'
    );
    if (result.count) changes.push(`loc.href: ${result.count}`);
    content = result.content;
  }

  // window.location.href = `page.html...` (template literals)
  {
    const result = countAndReplace(content,
      /window\.location\.href\s*=\s*`([a-zA-Z0-9_-]+)\.html([^`]*)`/g,
      (match, page, suffix) => {
        if (page === 'index') {
          return `window.location.href = \`/${suffix}\``;
        }
        return `window.location.href = \`/${page}${suffix}\``;
      },
      'location.href template'
    );
    if (result.count) changes.push(`loc.href(tpl): ${result.count}`);
    content = result.content;
  }

  // url: 'page.html' in JS objects (venture URLs etc.)
  {
    const result = countAndReplace(content,
      /url:\s*'([a-zA-Z0-9_-]+)\.html'/g,
      (match, page) => {
        if (page === 'index') {
          return "url: '/'";
        }
        return `url: '/${page}'`;
      },
      'url property'
    );
    if (result.count) changes.push(`url prop: ${result.count}`);
    content = result.content;
  }

  // redirectTo with .html
  {
    const result = countAndReplace(content,
      /redirectTo:\s*(window\.location\.origin\s*\+\s*)'\/([a-zA-Z0-9_-]+)\.html'/g,
      (match, prefix, page) => {
        if (page === 'index') {
          return `redirectTo: ${prefix}'/'`;
        }
        return `redirectTo: ${prefix}'/${page}'`;
      },
      'redirectTo'
    );
    if (result.count) changes.push(`redirectTo: ${result.count}`);
    content = result.content;
  }

  // emailRedirectTo with .html
  {
    const result = countAndReplace(content,
      /emailRedirectTo:\s*(window\.location\.origin\s*\+\s*)'\/([a-zA-Z0-9_-]+)\.html'/g,
      (match, prefix, page) => {
        if (page === 'index') {
          return `emailRedirectTo: ${prefix}'/'`;
        }
        return `emailRedirectTo: ${prefix}'/${page}'`;
      },
      'emailRedirectTo'
    );
    if (result.count) changes.push(`emailRedirectTo: ${result.count}`);
    content = result.content;
  }

  // 4. JSON-LD structured data: "url": "...page.html" or "item": "...page.html"
  // Already handled by the full URL replacement above

  // 5. Any remaining .html references in quotes that are internal
  //    Catch: "page.html" that wasn't caught above (e.g. in JSON-LD urlTemplate)
  {
    const result = countAndReplace(content,
      /"([a-zA-Z0-9_-]+)\.html"/g,
      (match, page) => {
        // Only replace if it's a known page
        if (PAGES.includes(page)) {
          if (page === 'index') {
            return '"/"';
          }
          return `"/${page}"`;
        }
        return match;
      },
      'remaining quoted'
    );
    if (result.count) changes.push(`quoted: ${result.count}`);
    content = result.content;
  }

  // Catch href="/page.html" patterns (with leading slash already)
  {
    const result = countAndReplace(content,
      /href="\/([a-zA-Z0-9_-]+)\.html((?:#[^"]*|(?:\?[^"]*))?)"/g,
      (match, page, suffix) => {
        if (page === 'index') {
          return `href="/${suffix}"`;
        }
        return `href="/${page}${suffix}"`;
      },
      'href with leading slash'
    );
    if (result.count) changes.push(`href(slash): ${result.count}`);
    content = result.content;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    fileChanges[fileName] = changes;
    return true;
  }
  return false;
}

function cleanSitemap() {
  const filePath = path.join(PUBLIC_DIR, 'sitemap.xml');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace all .html in <loc> entries, update lastmod
  content = content.replace(
    /<loc>https:\/\/futureatoms\.com\/([a-zA-Z0-9_-]+)\.html<\/loc>/g,
    (match, page) => {
      if (page === 'index') {
        return '<loc>https://futureatoms.com/</loc>';
      }
      return `<loc>https://futureatoms.com/${page}</loc>`;
    }
  );

  // Update lastmod to today
  content = content.replace(/<lastmod>[^<]+<\/lastmod>/g, '<lastmod>2026-02-19</lastmod>');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = (original.match(/\.html<\/loc>/g) || []).length;
    console.log(`  sitemap.xml: ${count} .html URLs cleaned, lastmod dates updated`);
    totalReplacements += count;
  }
}

function cleanRobotsTxt() {
  const filePath = path.join(PUBLIC_DIR, 'robots.txt');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(/Disallow: \/chipos-settings\.html/, 'Disallow: /chipos-settings');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  robots.txt: 1 .html reference cleaned');
    totalReplacements += 1;
  }
}

function cleanLlmTxt() {
  const filePath = path.join(PUBLIC_DIR, 'llm.txt');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /https:\/\/futureatoms\.com\/([a-zA-Z0-9_-]+)\.html/g,
    (match, page) => {
      if (page === 'index') return 'https://futureatoms.com/';
      return `https://futureatoms.com/${page}`;
    }
  );

  if (content !== original) {
    const count = (original.match(/futureatoms\.com\/[a-zA-Z0-9_-]+\.html/g) || []).length;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  llm.txt: ${count} .html URLs cleaned`);
    totalReplacements += count;
  }
}

function cleanLlmsFullTxt() {
  const filePath = path.join(PUBLIC_DIR, 'llms-full.txt');
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /https:\/\/futureatoms\.com\/([a-zA-Z0-9_-]+)\.html/g,
    (match, page) => {
      if (page === 'index') return 'https://futureatoms.com/';
      return `https://futureatoms.com/${page}`;
    }
  );

  if (content !== original) {
    const count = (original.match(/futureatoms\.com\/[a-zA-Z0-9_-]+\.html/g) || []).length;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  llms-full.txt: ${count} .html URLs cleaned`);
    totalReplacements += count;
  }
}

function cleanTestFiles() {
  if (!fs.existsSync(TESTS_DIR)) {
    console.log('  No tests directory found, skipping');
    return;
  }

  const testFiles = fs.readdirSync(TESTS_DIR).filter(f => f.endsWith('.spec.js'));

  for (const file of testFiles) {
    const filePath = path.join(TESTS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // page.goto('/page.html') → page.goto('/page')
    content = content.replace(
      /page\.goto\('\/([a-zA-Z0-9_-]+)\.html([^']*)'\)/g,
      (match, page, suffix) => {
        if (page === 'index') return `page.goto('/${suffix}')`;
        return `page.goto('/${page}${suffix}')`;
      }
    );

    // page.goto(`/page.html...`) (template literals)
    content = content.replace(
      /page\.goto\(`\/([a-zA-Z0-9_-]+)\.html([^`]*)`\)/g,
      (match, page, suffix) => {
        if (page === 'index') return `page.goto(\`/${suffix}\`)`;
        return `page.goto(\`/${page}${suffix}\`)`;
      }
    );

    // toHaveURL assertions with .html
    content = content.replace(
      /toHaveURL\(\/([^/]*?)([a-zA-Z0-9_-]+)\.html([^/]*?)\/\)/g,
      (match, before, page, after) => {
        if (page === 'index') return `toHaveURL(/${before}${after}/)`;
        return `toHaveURL(/${before}${page}${after}/)`;
      }
    );

    // String-based toHaveURL: toHaveURL('...page.html')
    content = content.replace(
      /toHaveURL\('([^']*?)([a-zA-Z0-9_-]+)\.html([^']*)'\)/g,
      (match, before, page, after) => {
        if (page === 'index') return `toHaveURL('${before}${after}')`;
        return `toHaveURL('${before}${page}${after}')`;
      }
    );

    // Regex-based URL checks with .html in regex patterns
    content = content.replace(
      /\/([a-zA-Z0-9_-]+)\.html/g,
      (match, page) => {
        if (PAGES.includes(page)) {
          if (page === 'index') return '/';
          return `/${page}`;
        }
        return match;
      }
    );

    // String literals 'page.html' in test assertions and expected values
    content = content.replace(
      /'([a-zA-Z0-9_-]+)\.html'/g,
      (match, page) => {
        if (PAGES.includes(page)) {
          if (page === 'index') return "'/'";
          return `'/${page}'`;
        }
        return match;
      }
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ${file}: cleaned`);
    }
  }
}

// Main execution
console.log('=== FutureAtoms Clean URL Migration ===\n');

// Phase 1.1-1.4: Clean all HTML files
console.log('Phase 1.1-1.4: Cleaning HTML files...');
const htmlFiles = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => path.join(PUBLIC_DIR, f));

let changedFiles = 0;
for (const file of htmlFiles) {
  if (cleanHtmlFile(file)) {
    changedFiles++;
  }
}
console.log(`  ${changedFiles}/${htmlFiles.length} HTML files modified\n`);

// Print per-file changes
for (const [file, changes] of Object.entries(fileChanges)) {
  console.log(`  ${file}: ${changes.join(', ')}`);
}
console.log('');

// Phase 1.5: Support files
console.log('Phase 1.5: Cleaning support files...');
cleanSitemap();
cleanRobotsTxt();
cleanLlmTxt();
cleanLlmsFullTxt();
console.log('');

// Phase 1.6: Test files
console.log('Phase 1.6: Cleaning test files...');
cleanTestFiles();
console.log('');

console.log(`\n=== Total replacements: ${totalReplacements} ===`);
