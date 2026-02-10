#!/usr/bin/env node
/**
 * SEO Report Generator
 * Produces a comprehensive terminal + HTML report of SEO metrics.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const glob = require('glob');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const REPORT_PATH = path.join(__dirname, '..', 'seo-report.html');

function analyzePage(filePath) {
  const filename = path.basename(filePath);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  return {
    filename,
    title: $('title').text().trim(),
    titleLength: ($('title').text().trim() || '').length,
    metaDescription: $('meta[name="description"]').attr('content') || '',
    descriptionLength: ($('meta[name="description"]').attr('content') || '').length,
    canonical: $('link[rel="canonical"]').attr('href') || '',
    h1Count: $('h1').length,
    h1Text: $('h1').first().text().trim().substring(0, 50),
    ogType: $('meta[property="og:type"]').attr('content') || '',
    ogTitle: !!$('meta[property="og:title"]').length,
    ogDescription: !!$('meta[property="og:description"]').length,
    ogImage: !!$('meta[property="og:image"]').length,
    twitterCard: $('meta[name="twitter:card"]').attr('content') || '',
    jsonLdCount: $('script[type="application/ld+json"]').length,
    imgCount: $('img').length,
    imgWithoutAlt: $('img:not([alt])').length,
    internalLinks: $('a[href]:not([href^="http"]):not([href^="#"]):not([href^="javascript"]):not([href^="mailto"])').length,
    externalLinks: $('a[href^="http"]').length,
    hasRobotsMeta: !!$('meta[name="robots"]').length,
    robotsContent: $('meta[name="robots"]').attr('content') || '',
    wordCount: $('body').text().replace(/\s+/g, ' ').trim().split(' ').length
  };
}

function generateTerminalReport(pages) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SEO METRICS REPORT                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Summary statistics
  const total = pages.length;
  const withTitle = pages.filter(p => p.titleLength > 0).length;
  const withDesc = pages.filter(p => p.descriptionLength > 0).length;
  const withCanonical = pages.filter(p => p.canonical).length;
  const withH1 = pages.filter(p => p.h1Count > 0).length;
  const withOgType = pages.filter(p => p.ogType).length;
  const withTwitter = pages.filter(p => p.twitterCard).length;
  const withJsonLd = pages.filter(p => p.jsonLdCount > 0).length;
  const totalImages = pages.reduce((sum, p) => sum + p.imgCount, 0);
  const missingAlt = pages.reduce((sum, p) => sum + p.imgWithoutAlt, 0);

  console.log('COVERAGE SUMMARY');
  console.log('─────────────────────────────────────────');
  console.log(`  Pages analyzed:        ${total}`);
  console.log(`  Title tags:            ${withTitle}/${total} (${Math.round(withTitle/total*100)}%)`);
  console.log(`  Meta descriptions:     ${withDesc}/${total} (${Math.round(withDesc/total*100)}%)`);
  console.log(`  Canonical URLs:        ${withCanonical}/${total} (${Math.round(withCanonical/total*100)}%)`);
  console.log(`  H1 headings:           ${withH1}/${total} (${Math.round(withH1/total*100)}%)`);
  console.log(`  og:type tags:          ${withOgType}/${total} (${Math.round(withOgType/total*100)}%)`);
  console.log(`  Twitter cards:         ${withTwitter}/${total} (${Math.round(withTwitter/total*100)}%)`);
  console.log(`  JSON-LD schemas:       ${withJsonLd}/${total} (${Math.round(withJsonLd/total*100)}%)`);
  console.log(`  Image alt coverage:    ${totalImages - missingAlt}/${totalImages} (${totalImages ? Math.round((totalImages-missingAlt)/totalImages*100) : 100}%)`);

  // Score
  const score = Math.round(
    (withTitle + withDesc + withCanonical + withH1 + withOgType + withTwitter + withJsonLd) / (total * 7) * 100
  );
  console.log(`\n  OVERALL SEO SCORE:     ${score}/100`);

  // Global files
  console.log('\nGLOBAL FILES');
  console.log('─────────────────────────────────────────');
  const globalFiles = ['robots.txt', 'sitemap.xml', 'llm.txt', 'llms-full.txt', '.well-known/ai-plugin.json'];
  for (const file of globalFiles) {
    const exists = fs.existsSync(path.join(PUBLIC_DIR, file));
    console.log(`  ${exists ? '✓' : '✗'} ${file}`);
  }

  // Per-page details
  console.log('\nPER-PAGE DETAILS');
  console.log('─────────────────────────────────────────');
  for (const page of pages) {
    const checks = [
      page.titleLength > 0,
      page.descriptionLength > 0,
      !!page.canonical,
      page.h1Count > 0,
      !!page.ogType,
      !!page.twitterCard,
      page.jsonLdCount > 0
    ];
    const passed = checks.filter(Boolean).length;
    const status = passed === 7 ? '✓' : passed >= 5 ? '~' : '✗';
    console.log(`  ${status} ${page.filename.padEnd(35)} ${passed}/7 checks`);
  }

  return score;
}

function generateHtmlReport(pages, score) {
  const rows = pages.map(page => `
    <tr>
      <td>${page.filename}</td>
      <td class="${page.titleLength > 0 ? 'pass' : 'fail'}">${page.titleLength > 0 ? page.title.substring(0, 40) : 'MISSING'}</td>
      <td class="${page.descriptionLength > 0 ? 'pass' : 'fail'}">${page.descriptionLength || 'MISSING'}</td>
      <td class="${page.canonical ? 'pass' : 'fail'}">${page.canonical ? 'Yes' : 'No'}</td>
      <td class="${page.ogType ? 'pass' : 'fail'}">${page.ogType || 'MISSING'}</td>
      <td class="${page.twitterCard ? 'pass' : 'fail'}">${page.twitterCard || 'MISSING'}</td>
      <td class="${page.jsonLdCount > 0 ? 'pass' : 'fail'}">${page.jsonLdCount}</td>
      <td>${page.wordCount}</td>
    </tr>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO Report - FutureAtoms</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0; }
    h1 { color: #4facfe; }
    h2 { color: #a8edea; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
    th, td { padding: 8px 12px; border: 1px solid #333; text-align: left; }
    th { background: #2a2a4a; }
    .pass { color: #4caf50; }
    .fail { color: #f44336; font-weight: bold; }
    .score { font-size: 3rem; color: ${score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336'}; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .card { background: #2a2a4a; padding: 1rem; border-radius: 8px; text-align: center; }
    .card-value { font-size: 2rem; font-weight: bold; color: #4facfe; }
  </style>
</head>
<body>
  <h1>SEO Report - FutureAtoms</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <div class="score">${score}/100</div>

  <h2>Page Analysis</h2>
  <table>
    <thead>
      <tr><th>Page</th><th>Title</th><th>Desc Length</th><th>Canonical</th><th>og:type</th><th>Twitter</th><th>JSON-LD</th><th>Words</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(REPORT_PATH, html, 'utf8');
  console.log(`\nHTML report saved to: ${REPORT_PATH}`);
}

function main() {
  const htmlFiles = glob.sync('*.html', { cwd: PUBLIC_DIR })
    .map(f => path.join(PUBLIC_DIR, f));

  const pages = htmlFiles.map(analyzePage);
  const score = generateTerminalReport(pages);
  generateHtmlReport(pages, score);
}

main();
