const { test, expect } = require('@playwright/test');

// =============================================================================
// Download Links & Installation Page Tests
//
// These tests ensure that chipos.html download buttons, install commands,
// and all related links are functional BEFORE deploying. If a download
// URL 404s or a section still says "Coming Soon" when it shouldn't, CI fails.
// =============================================================================

test.describe('ChipOS Download & Installation', () => {

  // ---------------------------------------------------------------------------
  // Section: Page structure
  // ---------------------------------------------------------------------------

  test('installation section exists and has correct heading', async ({ page }) => {
    await page.goto('/chipos.html#installation');
    const heading = page.locator('#installation h2');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('GET STARTED');
  });

  test('page title and branding are correct', async ({ page }) => {
    await page.goto('/chipos.html');
    await expect(page).toHaveTitle(/ChipOS/);
    const body = await page.locator('body').textContent();
    expect(body.toLowerCase()).toContain('chipos');
    expect(body.toLowerCase()).not.toContain('incoder');
  });

  // ---------------------------------------------------------------------------
  // Section: macOS download
  // ---------------------------------------------------------------------------

  test('macOS download button is a working link (not Coming Soon)', async ({ page }) => {
    await page.goto('/chipos.html');
    const macBtn = page.locator('#macos-download-btn');
    await expect(macBtn).toBeVisible();

    // Must be an <a> tag with an href, NOT a disabled <span>
    const tagName = await macBtn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('a');

    const href = await macBtn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('ChipOS');
    expect(href).toContain('.dmg');

    // Must NOT contain "Coming Soon" text
    const text = await macBtn.textContent();
    expect(text).not.toContain('Coming Soon');
  });

  test('macOS download shows version info', async ({ page }) => {
    await page.goto('/chipos.html');
    const macSection = page.locator('#macos-download-btn + p');
    const text = await macSection.textContent();
    expect(text).toContain('macOS');
    expect(text).toContain('Apple Silicon');
    // Should show a version, not "Coming Soon"
    expect(text).not.toContain('Coming Soon');
  });

  // ---------------------------------------------------------------------------
  // Section: Linux ARM64 download
  // ---------------------------------------------------------------------------

  test('Linux ARM64 download button is a working link', async ({ page }) => {
    await page.goto('/chipos.html');
    const arm64Btn = page.locator('#linux-download-btn-arm64');
    await expect(arm64Btn).toBeVisible();

    const tagName = await arm64Btn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('a');

    const href = await arm64Btn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('arm64');
    expect(href).toContain('.deb');

    const text = await arm64Btn.textContent();
    expect(text).not.toContain('Coming Soon');
    expect(text).toContain('Download');
  });

  // ---------------------------------------------------------------------------
  // Section: Linux AMD64 download
  // ---------------------------------------------------------------------------

  test('Linux AMD64 download button is a working link', async ({ page }) => {
    await page.goto('/chipos.html');

    // Click the amd64 tab to reveal the section
    await page.click('#chipos-tab-amd64');

    const amd64Btn = page.locator('#linux-download-btn-amd64');
    await expect(amd64Btn).toBeVisible();

    const tagName = await amd64Btn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('a');

    const href = await amd64Btn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('amd64');
    expect(href).toContain('.deb');

    const text = await amd64Btn.textContent();
    expect(text).not.toContain('Coming Soon');
    expect(text).toContain('Download');
  });

  // ---------------------------------------------------------------------------
  // Section: Linux arch tab switching
  // ---------------------------------------------------------------------------

  test('Linux architecture tabs switch correctly', async ({ page }) => {
    await page.goto('/chipos.html');

    // ARM64 section visible by default
    await expect(page.locator('#chipos-linux-arm64')).toBeVisible();
    await expect(page.locator('#chipos-linux-amd64')).toBeHidden();

    // Click amd64 tab
    await page.click('#chipos-tab-amd64');
    await expect(page.locator('#chipos-linux-amd64')).toBeVisible();
    await expect(page.locator('#chipos-linux-arm64')).toBeHidden();

    // Click back to arm64
    await page.click('#chipos-tab-arm64');
    await expect(page.locator('#chipos-linux-arm64')).toBeVisible();
    await expect(page.locator('#chipos-linux-amd64')).toBeHidden();
  });

  // ---------------------------------------------------------------------------
  // Section: install.sh
  // ---------------------------------------------------------------------------

  test('install.sh one-liner is displayed', async ({ page }) => {
    await page.goto('/chipos.html');
    const installBlock = page.locator('text=curl -fsSL https://futureatoms.com/install.sh | bash');
    await expect(installBlock).toBeVisible();
  });

  test('install.sh is accessible locally', async ({ request }) => {
    const response = await request.get('http://localhost:8000/install.sh');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('#!/usr/bin/env bash');
    expect(body).toContain('ChipOS');
  });

  // ---------------------------------------------------------------------------
  // Section: Browser / Web App access
  // ---------------------------------------------------------------------------

  test('browser sign-in form renders', async ({ page }) => {
    await page.goto('/chipos.html#installation');
    await expect(page.locator('#email-signin-form')).toBeVisible();
    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
    await expect(page.locator('#signin-btn')).toBeVisible();
  });

  test('OAuth buttons render', async ({ page }) => {
    await page.goto('/chipos.html#installation');
    const googleBtn = page.locator('button:has-text("Google")');
    const microsoftBtn = page.locator('button:has-text("Microsoft")');
    await expect(googleBtn).toBeVisible();
    await expect(microsoftBtn).toBeVisible();
  });

  test('sign-up form toggles correctly', async ({ page }) => {
    await page.goto('/chipos.html#installation');
    await expect(page.locator('#signup-form')).toBeHidden();
    await page.click('button:has-text("Sign up")');
    await expect(page.locator('#signup-form')).toBeVisible();
    await expect(page.locator('#email-signin-form')).toBeHidden();
  });

  test('forgot password form toggles correctly', async ({ page }) => {
    await page.goto('/chipos.html#installation');
    await expect(page.locator('#forgot-password-form')).toBeHidden();
    await page.click('button:has-text("Forgot password")');
    await expect(page.locator('#forgot-password-form')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Section: Hero CTA links
  // ---------------------------------------------------------------------------

  test('hero CTA buttons have valid hrefs', async ({ page }) => {
    await page.goto('/chipos.html');

    const ctas = [
      { text: 'DOWNLOAD CHIPOS', expected: '#installation' },
      { text: 'DOCUMENTATION', expected: 'chipos-docs.html' },
      { text: 'VIEW SOURCE', expected: 'github.com' },
      { text: 'FEATURE REQUESTS', expected: 'chipos-features.html' },
    ];

    for (const cta of ctas) {
      const link = page.locator(`a:has-text("${cta.text}")`).first();
      const href = await link.getAttribute('href');
      expect(href, `CTA "${cta.text}" href should contain "${cta.expected}"`).toContain(cta.expected);
    }
  });

  // ---------------------------------------------------------------------------
  // Section: Internal navigation links resolve to existing pages
  // ---------------------------------------------------------------------------

  test('all internal page links return 200', async ({ request }) => {
    const pages = [
      '/chipos.html',
      '/chipos-docs.html',
      '/chipos-changelog.html',
      '/chipos-features.html',
      '/chipos-pitch.html',
      '/feedback.html',
      '/careers.html',
      '/index.html',
      '/blog.html',
      '/news.html',
      '/about.html',
      '/contact.html',
    ];

    for (const pagePath of pages) {
      const response = await request.get(`http://localhost:8000${pagePath}`);
      expect(response.status(), `${pagePath} should return 200`).toBe(200);
    }
  });

  // ---------------------------------------------------------------------------
  // Section: No stale "Coming Soon" on download buttons
  // ---------------------------------------------------------------------------

  test('no download button says Coming Soon', async ({ page }) => {
    await page.goto('/chipos.html');

    // Check macOS
    const macBtn = page.locator('#macos-download-btn');
    const macText = await macBtn.textContent();
    expect(macText, 'macOS button should not say Coming Soon').not.toContain('Coming Soon');

    // Check arm64
    const arm64Btn = page.locator('#linux-download-btn-arm64');
    const arm64Text = await arm64Btn.textContent();
    expect(arm64Text, 'arm64 button should not say Coming Soon').not.toContain('Coming Soon');

    // Check amd64
    await page.click('#chipos-tab-amd64');
    const amd64Btn = page.locator('#linux-download-btn-amd64');
    const amd64Text = await amd64Btn.textContent();
    expect(amd64Text, 'amd64 button should not say Coming Soon').not.toContain('Coming Soon');
  });

  // ---------------------------------------------------------------------------
  // Section: Changelog reference
  // ---------------------------------------------------------------------------

  test('changelog page loads and has content', async ({ page }) => {
    await page.goto('/chipos-changelog.html');
    await expect(page).toHaveTitle(/Changelog|ChipOS|FutureAtoms/);
    const text = await page.locator('body').textContent();
    expect(text.toLowerCase()).toContain('changelog');
  });

  // ---------------------------------------------------------------------------
  // Section: FAQ renders
  // ---------------------------------------------------------------------------

  test('FAQ section has 5 questions', async ({ page }) => {
    await page.goto('/chipos.html#faq');
    const questions = page.locator('#faq details');
    await expect(questions).toHaveCount(5);
  });

  test('FAQ accordion opens and closes', async ({ page }) => {
    await page.goto('/chipos.html#faq');
    const firstQuestion = page.locator('#faq details').first();
    const answer = firstQuestion.locator('p');

    // Initially collapsed
    await expect(firstQuestion).not.toHaveAttribute('open', '');

    // Click to open
    await firstQuestion.locator('summary').click();
    await expect(answer).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Section: Version badge
  // ---------------------------------------------------------------------------

  test('version badge shows a version number', async ({ page }) => {
    await page.goto('/chipos.html');
    const badge = page.locator('text=Version').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/Version\s+\d+\.\d+\.\d+/);
  });
});

// =============================================================================
// Post-Deploy Smoke Tests (run against live site)
//
// These only run when LIVE_URL is set, e.g.:
//   LIVE_URL=https://futureatoms.com npx playwright test tests/downloads.spec.js
// =============================================================================

const LIVE_URL = process.env.LIVE_URL;

test.describe('Live Download URL Verification', () => {
  test.skip(!LIVE_URL, 'Skipped: set LIVE_URL=https://futureatoms.com to run');

  test('macOS DMG redirect returns 302 (not 404)', async ({ request }) => {
    const response = await request.head(`${LIVE_URL}/ChipOS-macOS-arm64.dmg`, {
      maxRedirects: 0,
    });
    expect([200, 301, 302]).toContain(response.status());
  });

  test('Linux arm64 .deb redirect returns 302 (not 404)', async ({ request }) => {
    const response = await request.head(`${LIVE_URL}/chipos_latest_arm64.deb`, {
      maxRedirects: 0,
    });
    expect([200, 301, 302]).toContain(response.status());
  });

  test('Linux amd64 .deb redirect returns 302 (not 404)', async ({ request }) => {
    const response = await request.head(`${LIVE_URL}/chipos_latest_amd64.deb`, {
      maxRedirects: 0,
    });
    expect([200, 301, 302]).toContain(response.status());
  });

  test('install.sh is accessible', async ({ request }) => {
    const response = await request.get(`${LIVE_URL}/install.sh`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('#!/usr/bin/env bash');
  });
});
