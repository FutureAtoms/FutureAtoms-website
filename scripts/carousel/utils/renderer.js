/**
 * Playwright-based HTML-to-PNG renderer for carousel slides.
 * Launches headless Chromium, loads Google Fonts, renders at exact pixel dimensions.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const GOOGLE_FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@500;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
`;

class SlideRenderer {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Render an HTML string to a PNG buffer.
   * @param {string} html - Complete HTML content
   * @param {object} dimensions - { width, height }
   * @param {string} outputPath - Where to save the PNG
   */
  async renderSlide(html, dimensions, outputPath) {
    if (!this.browser) {
      throw new Error('Renderer not initialized. Call init() first.');
    }

    const context = await this.browser.newContext({
      viewport: { width: dimensions.width, height: dimensions.height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Load the HTML
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Inject Google Fonts
    await page.addStyleTag({ content: GOOGLE_FONTS_CSS });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Small delay to ensure rendering is complete
    await page.waitForTimeout(500);

    // Screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false,
    });

    await context.close();
    return outputPath;
  }
}

/**
 * Build complete HTML from a template file and substitutions.
 * @param {string} templatePath - Path to the HTML template
 * @param {object} subs - Key-value pairs for {{KEY}} replacement
 * @returns {string} Final HTML
 */
function buildHtml(templatePath, subs) {
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace the stylesheet link with inline CSS (for Playwright file:// reliability)
  const stylesPath = subs.STYLES_PATH;
  if (stylesPath && fs.existsSync(stylesPath)) {
    const cssContent = fs.readFileSync(stylesPath, 'utf-8');
    html = html.replace(
      `<link rel="stylesheet" href="{{STYLES_PATH}}">`,
      `<style>${cssContent}</style>`
    );
  }

  for (const [key, value] of Object.entries(subs)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }

  return html;
}

module.exports = { SlideRenderer, buildHtml };
