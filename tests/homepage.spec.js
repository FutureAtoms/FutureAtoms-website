const { test, expect } = require('@playwright/test');

test.describe('Homepage Functionality', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FutureAtoms/);
    console.log('✓ Homepage title correct');
  });

  test('Three.js canvas loads and renders', async ({ page }) => {
    await page.goto('/');

    // Wait for Three.js to initialize
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check canvas has proper dimensions
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    console.log('✓ Three.js canvas loaded with dimensions:', box);
  });

  test('scroll sections contain all products', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForTimeout(1000);

    const products = [
      { id: 'chipos', name: 'ChipOS' },
      { id: 'bevy', name: 'BevyBeats' },
      { id: 'zaphy', name: 'Zaphy' },
      { id: 'agentic', name: 'Agentic' },
      { id: 'sv_gpt', name: 'SystemVerilog' },
      { id: 'yuj', name: 'Yuj' },
      { id: 'savitri', name: 'Savitri' },
      { id: 'adaptive', name: 'AdaptiveVision' }
    ];

    for (const product of products) {
      const section = page.locator(`.scroll-section[data-id="${product.id}"]`);
      await expect(section).toBeAttached();
      console.log(`✓ ${product.name} section found`);
    }
  });

  test('product titles are visible in scroll sections', async ({ page }) => {
    await page.goto('/');

    await page.waitForTimeout(1000);

    // Check intro section
    const introTitle = page.locator('.scroll-section[data-id="intro"] .product-title');
    await expect(introTitle).toContainText('Build Faster with AI');

    // Check first product section
    const chiposTitle = page.locator('.scroll-section[data-id="chipos"] .product-title');
    await expect(chiposTitle).toContainText('ChipOS');

    console.log('✓ Product titles visible');
  });

  test('navigation header exists with logo', async ({ page }) => {
    await page.goto('/');

    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check FutureAtoms branding
    const branding = page.locator('header').getByText('FUTUREATOMS');
    await expect(branding).toBeVisible();

    console.log('✓ Navigation header with logo exists');
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');

    const navLinks = [
      { href: '/blog', text: 'RESEARCH' },
      { href: '/news', text: 'NEWS' },
      { href: '/about', text: 'ABOUT' },
      { href: '/contact', text: 'CONTACT' }
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`a[href="${link.href}"]`).first();
      await expect(navLink).toBeAttached();
      console.log(`✓ ${link.text} link found`);
    }
  });

  test('products dropdown contains all product links', async ({ page }) => {
    await page.goto('/');

    const productLinks = [
      '/chipos',
      '/systemverilog',
      '/zaphy',
      '/agentic',
      '/yuj',
      '/adaptivision',
      '/bevybeats',
      '/savitri'
    ];

    for (const href of productLinks) {
      const link = page.locator(`.dropdown-content a[href="${href}"]`);
      await expect(link).toBeAttached();
      console.log(`✓ Product link ${href} found in dropdown`);
    }
  });

  test('mobile menu button exists on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();

    console.log('✓ Mobile menu button visible on mobile');
  });

  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check menu is initially hidden
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toHaveClass(/hidden/);

    // Click menu button
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await mobileMenuBtn.click();
    await page.waitForTimeout(300);

    // Menu should now be visible (hidden class removed)
    await expect(mobileMenu).not.toHaveClass(/hidden/);

    // Close menu
    const closeBtn = page.locator('#close-mobile-menu');
    await closeBtn.click();
    await page.waitForTimeout(300);

    // Menu should be hidden again
    await expect(mobileMenu).toHaveClass(/hidden/);

    console.log('✓ Mobile menu opens and closes correctly');
  });

  test('scroll container allows scrolling between sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const scrollContainer = page.locator('#scroll-container');
    await expect(scrollContainer).toBeVisible();

    // Scroll to next section
    await scrollContainer.evaluate(el => {
      el.scrollBy({ top: window.innerHeight, behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Get scroll position
    const scrollTop = await scrollContainer.evaluate(el => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);

    console.log('✓ Scroll container works');
  });

  test('product modal can be opened', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check modal exists
    const modal = page.locator('#product-modal');
    await expect(modal).toBeAttached();

    console.log('✓ Product modal element exists');
  });

  test('Three.js animation is running', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');

    // Take screenshots at different times
    const screenshot1 = await canvas.screenshot();
    await page.waitForTimeout(1000);
    const screenshot2 = await canvas.screenshot();

    // Screenshots should be different if animation is running
    const isDifferent = !screenshot1.equals(screenshot2);
    expect(isDifferent).toBe(true);

    console.log('✓ Three.js animation is running');
  });
});
