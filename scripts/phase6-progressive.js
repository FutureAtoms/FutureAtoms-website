#!/usr/bin/env node
/**
 * Phase 6: Modern Progressive Enhancement
 *
 * 6.1 - Add Speculation Rules API to high-traffic pages
 * 6.2 - Add View Transitions API meta tag and CSS to all pages
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const SPECULATION_RULES = `    <script type="speculationrules">
    {"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}
    </script>`;

const HIGH_TRAFFIC_PAGES = ['index.html', 'chipos.html', 'blog.html'];

const VIEW_TRANSITION_META = '    <meta name="view-transition" content="same-origin">';
const VIEW_TRANSITION_CSS = '@view-transition { navigation: auto; }';

function processHtmlFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileName = path.basename(filePath);
  let changes = [];

  // 6.1 - Add Speculation Rules to high-traffic pages
  if (HIGH_TRAFFIC_PAGES.includes(fileName) && !content.includes('speculationrules')) {
    content = content.replace('</head>', `${SPECULATION_RULES}\n</head>`);
    changes.push('speculation-rules');
  }

  // 6.2 - Add View Transitions API
  if (!content.includes('view-transition')) {
    // Add meta tag
    content = content.replace('</head>', `${VIEW_TRANSITION_META}\n</head>`);
    changes.push('view-transition-meta');

    // Add CSS - insert into first <style> block or before </head>
    if (content.includes('<style>')) {
      content = content.replace('<style>', `<style>\n        ${VIEW_TRANSITION_CSS}`);
    } else if (content.includes('<style ')) {
      // Some files may have <style type="text/css"> etc
      content = content.replace(/(<style[^>]*>)/, `$1\n        ${VIEW_TRANSITION_CSS}`);
    } else {
      // No style block, add inline style before </head>
      content = content.replace('</head>', `    <style>${VIEW_TRANSITION_CSS}</style>\n</head>`);
    }
    changes.push('view-transition-css');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${fileName}: ${changes.join(', ')}`);
    return true;
  }
  return false;
}

// Main execution
console.log('=== Phase 6: Modern Progressive Enhancement ===\n');

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
