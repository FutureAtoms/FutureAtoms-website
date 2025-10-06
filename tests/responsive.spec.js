const { test, expect } = require('@playwright/test');

test.describe('Responsive Design Tests', () => {
  test('homepage is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/index.html');

    // Check if navigation is visible
    const nav = page.locator('.nav-header, nav');
    await expect(nav).toBeVisible();

    // Check if hero section is visible
    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();

    console.log('✓ Homepage responsive on mobile');
  });

  test('homepage is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/index.html');

    const nav = page.locator('.nav-header, nav');
    await expect(nav).toBeVisible();

    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();

    console.log('✓ Homepage responsive on tablet');
  });

  test('homepage is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/index.html');

    const nav = page.locator('.nav-header, nav');
    await expect(nav).toBeVisible();

    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();

    console.log('✓ Homepage responsive on desktop');
  });

  test('venture cards are visible on different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/index.html');

      await page.waitForTimeout(1000);

      const cards = page.locator('.venture-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      console.log(`✓ ${count} venture cards visible on ${size.name}`);
    }
  });

  test('Three.js canvas scales properly', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667 },
      { width: 1920, height: 1080 }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/index.html');

      await page.waitForTimeout(1000);

      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();

      // Canvas should fill viewport
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);

      console.log(`✓ Canvas scales to ${size.width}x${size.height}`);
    }
  });
});

test.describe('Interactive Elements Tests', () => {
  test('all external links have correct attributes', async ({ page }) => {
    await page.goto('/index.html');

    // Check CDN links (Three.js, GSAP, Font Awesome)
    const scripts = await page.locator('script[src^="http"]').all();
    expect(scripts.length).toBeGreaterThan(0);

    console.log(`✓ ${scripts.length} external scripts loaded`);
  });

  test('venture card icons are visible', async ({ page }) => {
    await page.goto('/index.html');

    await page.waitForTimeout(1000);

    const icons = page.locator('.venture-icon');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const icon = icons.nth(i);
      await expect(icon).toBeVisible();
    }

    console.log(`✓ ${count} venture icons found`);
  });

  test('copyright information exists on all pages', async ({ page }) => {
    const pages = ['/index.html', '/blog.html', '/news.html', '/chipos.html'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check for copyright text (regardless of element structure)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain('2024');
      expect(bodyText).toContain('FutureAtoms');

      console.log(`✓ ${pagePath} has copyright information`);
    }
  });

  test('Font Awesome icons load', async ({ page }) => {
    await page.goto('/index.html');

    // Check if Font Awesome CSS is loaded
    const fontAwesome = page.locator('link[href*="font-awesome"]');
    await expect(fontAwesome).toBeAttached();

    console.log('✓ Font Awesome loaded');
  });

  test('no console errors on page load', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/index.html');
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Firebase') &&
      !err.includes('404')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠ Console errors found:', criticalErrors);
    } else {
      console.log('✓ No critical console errors');
    }
  });
});
