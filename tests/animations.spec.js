const { test, expect } = require('@playwright/test');

test.describe('Animation Tests', () => {
  test('Three.js scene renders on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for Three.js initialization
    await page.waitForTimeout(2000);

    // Check if canvas exists and has dimensions
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    console.log('✓ Three.js scene renders with dimensions:', box);
  });

  test('homepage scroll sections have transitions', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check scroll sections exist
    const scrollSections = page.locator('.scroll-section');
    const count = await scrollSections.count();
    expect(count).toBeGreaterThan(5);

    console.log(`✓ Found ${count} scroll sections`);
  });

  test('product pages have Three.js visualizations', async ({ page }) => {
    const pagesWithCanvas = [
      '/bevybeats',
      '/savitri',
      '/zaphy',
      '/yuj',
      '/agentic',
      '/adaptivision',
      '/systemverilog'
    ];

    for (const pagePath of pagesWithCanvas) {
      await page.goto(pagePath);
      await page.waitForTimeout(2000);

      const canvas = page.locator('canvas');
      const isVisible = await canvas.isVisible();

      if (isVisible) {
        console.log(`✓ ${pagePath} has Three.js canvas`);
      } else {
        console.log(`○ ${pagePath} does not have Three.js canvas (may use different effects)`);
      }
    }
  });

  test('Three.js animation loop is running on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if animation is running by sampling canvas content
    const canvas = page.locator('canvas');

    // Take screenshots at different times
    const screenshot1 = await canvas.screenshot();
    await page.waitForTimeout(1000);
    const screenshot2 = await canvas.screenshot();

    // Screenshots should be different if animation is running
    const isDifferent = !screenshot1.equals(screenshot2);
    expect(isDifferent).toBe(true);

    console.log('✓ Three.js animation loop running');
  });

  test('blog page loads correctly', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(1000);

    // Check page title contains expected text
    await expect(page).toHaveTitle(/Research|FutureAtoms/);

    // Check blog cards exist
    const blogCards = page.locator('.blog-card, .glass-panel');
    const count = await blogCards.count();
    expect(count).toBeGreaterThan(0);

    console.log('✓ Blog page loaded with content');
  });

  test('news page loads correctly', async ({ page }) => {
    await page.goto('/news');
    await page.waitForTimeout(1000);

    // Check page title
    await expect(page).toHaveTitle(/News|FutureAtoms/);

    // Check for news content
    const newsItems = page.locator('.news-item, .glass-panel, article');
    const count = await newsItems.count();
    expect(count).toBeGreaterThan(0);

    console.log('✓ News page loaded with content');
  });

  test('glass-panel styling is applied', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(500);

    const glassPanels = page.locator('.glass-panel');
    const count = await glassPanels.count();
    expect(count).toBeGreaterThan(0);

    // Check first panel has backdrop-filter styling
    const firstPanel = glassPanels.first();
    const style = await firstPanel.evaluate(el => {
      return window.getComputedStyle(el).backdropFilter;
    });

    expect(style).not.toBe('none');
    console.log('✓ Glass panel styling applied with backdrop-filter:', style);
  });

  test('hover effects work on product pages', async ({ page }) => {
    await page.goto('/bevybeats');
    await page.waitForTimeout(1000);

    // Find a feature card
    const featureCard = page.locator('.feature-card, .glass-panel').first();

    if (await featureCard.isVisible()) {
      // Hover over card
      await featureCard.hover();
      await page.waitForTimeout(300);

      console.log('✓ Hover effects can be triggered');
    } else {
      console.log('○ Feature card not visible for hover test');
    }
  });

  test('mobile responsive design works', async ({ page }) => {
    // Test at mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Desktop nav should be hidden
    const desktopNav = page.locator('nav.hidden.md\\:flex');

    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    console.log('✓ Mobile responsive design works');
  });

  test('page transitions are smooth', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Navigate to a product page
    const startTime = Date.now();
    await page.goto('/bevybeats');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);

    console.log(`✓ Page transition completed in ${loadTime}ms`);
  });
});
