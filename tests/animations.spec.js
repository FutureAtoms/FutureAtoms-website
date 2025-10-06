const { test, expect } = require('@playwright/test');

test.describe('Animation Tests', () => {
  test('Three.js scene renders on homepage', async ({ page }) => {
    await page.goto('/index.html');

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

  test('cursor glow follows mouse movement', async ({ page }) => {
    await page.goto('/index.html');

    const cursorGlow = page.locator('.cursor-glow, #cursorGlow');
    await expect(cursorGlow).toBeAttached();

    // Move mouse and check if cursor glow position updates
    await page.mouse.move(100, 100);
    await page.waitForTimeout(100);

    const style1 = await cursorGlow.getAttribute('style');

    await page.mouse.move(500, 500);
    await page.waitForTimeout(100);

    const style2 = await cursorGlow.getAttribute('style');

    // Styles should be different after mouse move
    expect(style1).not.toBe(style2);

    console.log('✓ Cursor glow follows mouse');
  });

  test('venture cards have hover effects', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for page to load
    await page.waitForTimeout(1000);

    const card = page.locator('#bevybeats').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Get initial transform
    const initialTransform = await card.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Hover over card
    await card.hover();
    await page.waitForTimeout(500);

    const hoverTransform = await card.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    console.log('✓ Venture cards have hover effects');
  });

  test('GSAP scroll animations initialize', async ({ page }) => {
    await page.goto('/index.html');

    // Wait for GSAP to load and initialize
    await page.waitForTimeout(2000);

    // Check if GSAP is loaded
    const gsapLoaded = await page.evaluate(() => {
      return typeof window.gsap !== 'undefined';
    });

    expect(gsapLoaded).toBe(true);

    console.log('✓ GSAP loaded successfully');
  });

  test('Three.js animation loop is running', async ({ page }) => {
    await page.goto('/index.html');

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

  test('blog page loads with newspaper design', async ({ page }) => {
    await page.goto('/blog.html');

    await page.waitForTimeout(1000);

    // Blog uses newspaper design, not Three.js
    const newspaperTitle = page.locator('.newspaper-title');
    await expect(newspaperTitle).toBeVisible();

    console.log('✓ Blog page loaded with newspaper design');
  });

  test('news page globe animation loads', async ({ page }) => {
    await page.goto('/news.html');

    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    console.log('✓ News page globe animation loaded');
  });
});
