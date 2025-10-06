const { test, expect } = require('@playwright/test');

test.describe('Homepage Functionality', () => {
  test('homepage loads with all key elements', async ({ page }) => {
    await page.goto('/index.html');

    // Check hero section
    const heroTitle = page.locator('.hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('FutureAtoms');

    const heroSubtitle = page.locator('.hero-subtitle');
    await expect(heroSubtitle).toBeVisible();

    console.log('✓ Hero section loaded');
  });

  test('Three.js canvas loads', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for Three.js to initialize
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    console.log('✓ Three.js canvas loaded');
  });

  test('all venture cards are present', async ({ page }) => {
    await page.goto('/index.html');

    const ventures = [
      'BevyBeats',
      'Savitri',
      'Zaphy',
      'Agentic',
      'Yuj',
      'AdaptiveVision',
      'ChipOS',
      'SystemVerilog'
    ];

    for (const venture of ventures) {
      const card = page.locator('.venture-card', { hasText: venture });
      await expect(card).toBeAttached();
      console.log(`✓ ${venture} card found`);
    }
  });

  test('venture cards are clickable and navigate correctly', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for cards to be ready
    await page.waitForTimeout(1000);

    // Test BevyBeats card
    const bevybeatsCard = page.locator('#bevybeats');
    await expect(bevybeatsCard).toBeVisible();

    // Scroll card into view
    await bevybeatsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await bevybeatsCard.click();
    await expect(page).toHaveURL(/bevybeats\.html/);

    console.log('✓ Venture card navigation works');
  });

  test('scroll indicator is visible', async ({ page }) => {
    await page.goto('/index.html');

    const scrollIndicator = page.locator('.scroll-indicator');
    await expect(scrollIndicator).toBeVisible();

    console.log('✓ Scroll indicator visible');
  });

  test('navigation dots are present', async ({ page }) => {
    await page.goto('/index.html');

    const navDots = page.locator('.nav-dot');
    const count = await navDots.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✓ ${count} navigation dots found`);
  });

  test('custom cursor glow element exists', async ({ page }) => {
    await page.goto('/index.html');

    const cursorGlow = page.locator('.cursor-glow, #cursorGlow');
    await expect(cursorGlow).toBeAttached();

    console.log('✓ Custom cursor glow exists');
  });

  test('loading screen disappears after load', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for loading screen to disappear
    await page.waitForTimeout(3000);

    const loadingScreen = page.locator('#loadingScreen');
    const isVisible = await loadingScreen.isVisible();
    expect(isVisible).toBe(false);

    console.log('✓ Loading screen disappears correctly');
  });
});
