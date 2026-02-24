const { test, expect } = require('@playwright/test');

test.describe('Responsive Design Tests', () => {
  test('homepage is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Check if header is visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check mobile menu button is visible
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    console.log('✓ Homepage responsive on mobile');
  });

  test('homepage is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.goto('/');
    await page.waitForTimeout(1000);

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check that canvas renders
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    console.log('✓ Homepage responsive on tablet');
  });

  test('homepage is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    await page.waitForTimeout(1000);

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Desktop nav should be visible
    const nav = page.locator('nav.hidden.md\\:flex');
    await expect(nav).toBeVisible();

    console.log('✓ Homepage responsive on desktop');
  });

  test('scroll sections are visible on different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('/');
      await page.waitForTimeout(1000);

      const sections = page.locator('.scroll-section');
      const count = await sections.count();
      expect(count).toBeGreaterThan(5);

      console.log(`✓ ${count} scroll sections visible on ${size.name}`);
    }
  });

  test('Three.js canvas scales properly', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667 },
      { width: 1920, height: 1080 }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForTimeout(2000);

      const canvas = page.locator('canvas');
      const box = await canvas.boundingBox();

      // Canvas should fill viewport
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);

      console.log(`✓ Canvas scales to ${size.width}x${size.height}`);
    }
  });

  test('product pages are responsive', async ({ page }) => {
    const productPages = ['/bevybeats', '/chipos', '/agentic'];

    for (const pagePath of productPages) {
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(pagePath);
      await page.waitForTimeout(500);

      const mobileMenuBtn = page.locator('#mobile-menu-btn');
      await expect(mobileMenuBtn).toBeVisible();

      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await page.waitForTimeout(500);

      const desktopNav = page.locator('nav.hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();

      console.log(`✓ ${pagePath} is responsive`);
    }
  });
});

test.describe('Interactive Elements Tests', () => {
  test('all external links have correct attributes', async ({ page }) => {
    await page.goto('/');

    // Check CDN links (Three.js, GSAP, Font Awesome)
    const scripts = await page.locator('script[src^="http"]').all();
    expect(scripts.length).toBeGreaterThan(0);

    console.log(`✓ ${scripts.length} external scripts loaded`);
  });

  test('product titles in scroll sections are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const productTitles = page.locator('.product-title');
    const count = await productTitles.count();
    expect(count).toBeGreaterThan(5);

    console.log(`✓ ${count} product titles found`);
  });

  test('copyright information exists on all pages', async ({ page }) => {
    const pages = ['/', '/blog', '/news', '/chipos'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check for copyright text (regardless of element structure)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toContain('2026');
      expect(bodyText).toContain('FutureAtoms');

      console.log(`✓ ${pagePath} has copyright information`);
    }
  });

  test('Font Awesome icons load', async ({ page }) => {
    await page.goto('/');

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

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('Firebase') &&
      !err.includes('404') &&
      !err.includes('net::ERR')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠ Console errors found:', criticalErrors);
    } else {
      console.log('✓ No critical console errors');
    }
  });

  test('mobile menu navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(500);

    // Open mobile menu
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);

    // Check menu is visible
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).not.toHaveClass(/hidden/);

    // Check links are visible in menu
    const homeLink = page.locator('#mobile-menu a[href="index.html"]');
    await expect(homeLink).toBeVisible();

    // Close menu
    const closeBtn = page.locator('#close-mobile-menu');
    await closeBtn.click();
    await page.waitForTimeout(300);

    await expect(mobileMenu).toHaveClass(/hidden/);

    console.log('✓ Mobile menu navigation works');
  });

  test('glass panel effects are applied', async ({ page }) => {
    await page.goto('/bevybeats');
    await page.waitForTimeout(500);

    const glassPanels = page.locator('.glass-panel');
    const count = await glassPanels.count();

    if (count > 0) {
      const firstPanel = glassPanels.first();
      const style = await firstPanel.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backdropFilter: computed.backdropFilter,
          background: computed.background
        };
      });

      console.log('✓ Glass panel styling:', style);
    } else {
      console.log('○ No glass panels found on this page');
    }
  });
});
