const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  const mainPages = [
    { path: '/index.html', title: 'FutureAtoms - Building Tomorrow\'s Technology' },
    { path: '/blog.html', title: /Blog|FutureAtoms/ },
    { path: '/news.html', title: /News|FutureAtoms/ },
    { path: '/about.html', title: /About|FutureAtoms/ },
    { path: '/contact.html', title: /Contact|FutureAtoms/ },
  ];

  const venturePages = [
    { path: '/bevybeats.html', title: /BevyBeats|FutureAtoms/ },
    { path: '/savitri.html', title: /Savitri|FutureAtoms/ },
    { path: '/zaphy.html', title: /Zaphy|FutureAtoms/ },
    { path: '/agentic.html', title: /Agentic|FutureAtoms/ },
    { path: '/yuj.html', title: /Yuj|FutureAtoms/ },
    { path: '/adaptivision.html', title: /AdaptiveVision|FutureAtoms/ },
    { path: '/chipos.html', title: /ChipOS|FutureAtoms/ },
    { path: '/systemverilog.html', title: /SystemVerilog|FutureAtoms/ },
  ];

  const blogPages = [
    { path: '/blog-ai-music-revolution.html', title: /Music|BevyBeats|FutureAtoms/ },
    { path: '/blog-ai-therapy.html', title: /Therapy|Savitri|FutureAtoms/ },
    { path: '/blog-semiconductor-ai.html', title: /ChipOS|Semiconductor|FutureAtoms/ },
    { path: '/blog-linkedin-automation.html', title: /LinkedIn|Zaphy|FutureAtoms/ },
  ];

  test('all main pages load successfully', async ({ page }) => {
    for (const pageInfo of mainPages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
      console.log(`✓ ${pageInfo.path} loaded successfully`);
    }
  });

  test('all venture pages load successfully', async ({ page }) => {
    for (const pageInfo of venturePages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
      console.log(`✓ ${pageInfo.path} loaded successfully`);
    }
  });

  test('all blog pages load successfully', async ({ page }) => {
    for (const pageInfo of blogPages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.title);
      console.log(`✓ ${pageInfo.path} loaded successfully`);
    }
  });

  test('navigation header exists on all pages', async ({ page }) => {
    const allPages = [...mainPages, ...venturePages, ...blogPages];

    for (const pageInfo of allPages) {
      await page.goto(pageInfo.path);
      const nav = await page.locator('.nav-header, nav');
      await expect(nav).toBeVisible();
      console.log(`✓ ${pageInfo.path} has navigation header`);
    }
  });

  test('navigation links work from homepage', async ({ page }) => {
    await page.goto('/index.html');

    // Test navigation to Blog
    const blogLink = page.locator('a[href="blog.html"]').first();
    await blogLink.click();
    await expect(page).toHaveURL(/blog\.html/);

    // Navigate back
    await page.goto('/index.html');

    // Test navigation to News
    const newsLink = page.locator('a[href="news.html"]').first();
    await newsLink.click();
    await expect(page).toHaveURL(/news\.html/);

    // Navigate back
    await page.goto('/index.html');

    // Test navigation to About
    const aboutLink = page.locator('a[href="about.html"]').first();
    await aboutLink.click();
    await expect(page).toHaveURL(/about\.html/);

    console.log('✓ All main navigation links work');
  });

  test('home link returns to homepage from blog', async ({ page }) => {
    await page.goto('/blog.html');

    // Blog uses nav-bar instead of logo
    const homeLink = page.locator('a[href="index.html"]').first();
    await homeLink.click();
    await expect(page).toHaveURL(/index\.html/);

    console.log('✓ Home navigation from blog works');
  });
});
