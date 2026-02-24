const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  const mainPages = [
    { path: '/', title: /FutureAtoms/ },
    { path: '/blog', title: /Research|FutureAtoms/ },
    { path: '/news', title: /News|FutureAtoms/ },
    { path: '/about', title: /About|FutureAtoms/ },
    { path: '/contact', title: /Contact|FutureAtoms/ },
  ];

  const venturePages = [
    { path: '/bevybeats', title: /BevyBeats|FutureAtoms/ },
    { path: '/savitri', title: /Savitri|FutureAtoms/ },
    { path: '/zaphy', title: /Zaphy|FutureAtoms/ },
    { path: '/agentic', title: /Agentic|FutureAtoms/ },
    { path: '/yuj', title: /Yuj|FutureAtoms/ },
    { path: '/adaptivision', title: /AdaptiVision|Adaptive|FutureAtoms/ },
    { path: '/chipos', title: /ChipOS|FutureAtoms/ },
    { path: '/systemverilog', title: /SystemVerilog|FutureAtoms/ },
  ];

  const blogPages = [
    { path: '/blog-ai-music-revolution', title: /Music|BevyBeats|FutureAtoms/ },
    { path: '/blog-ai-therapy', title: /Therapy|Savitri|FutureAtoms/ },
    { path: '/blog-semiconductor-ai', title: /ChipOS|Semiconductor|FutureAtoms/ },
    { path: '/blog-linkedin-automation', title: /LinkedIn|Zaphy|FutureAtoms/ },
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
    const allPages = [...mainPages, ...venturePages];

    for (const pageInfo of allPages) {
      await page.goto(pageInfo.path);
      const header = page.locator('header');
      await expect(header).toBeVisible();
      console.log(`✓ ${pageInfo.path} has navigation header`);
    }
  });

  test('navigation links work from homepage', async ({ page }) => {
    await page.goto('/');

    // Test navigation to Blog
    const blogLink = page.locator('a[href="blog.html"]').first();
    await blogLink.click();
    await expect(page).toHaveURL(/blog\.html/);
    console.log('✓ Blog link works');

    // Navigate back
    await page.goto('/');

    // Test navigation to News
    const newsLink = page.locator('a[href="news.html"]').first();
    await newsLink.click();
    await expect(page).toHaveURL(/news\.html/);
    console.log('✓ News link works');

    // Navigate back
    await page.goto('/');

    // Test navigation to About
    const aboutLink = page.locator('a[href="about.html"]').first();
    await aboutLink.click();
    await expect(page).toHaveURL(/about\.html/);
    console.log('✓ About link works');

    console.log('✓ All main navigation links work');
  });

  test('home link returns to homepage from blog', async ({ page }) => {
    await page.goto('/blog');

    const homeLink = page.locator('a[href="index.html"]').first();
    await homeLink.click();
    await expect(page).toHaveURL(/index\.html/);

    console.log('✓ Home navigation from blog works');
  });

  test('product links in dropdown navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Hover over products dropdown to show it
    const dropdown = page.locator('.dropdown').first();
    await dropdown.hover();
    await page.waitForTimeout(300);

    // Click ChipOS link
    const chiposLink = page.locator('.dropdown-content a[href="chipos.html"]');
    await chiposLink.click();
    await expect(page).toHaveURL(/chipos\.html/);

    console.log('✓ Product dropdown navigation works');
  });

  test('contact page links are functional', async ({ page }) => {
    await page.goto('/contact');

    // Check social links exist and have proper hrefs
    const githubLink = page.locator('a[href="https://github.com/FutureAtoms"]');
    await expect(githubLink).toBeAttached();

    const twitterLink = page.locator('a[href="https://x.com/futureatoms"]');
    await expect(twitterLink).toBeAttached();

    const linkedinLink = page.locator('a[href="https://linkedin.com/company/futureatoms"]');
    await expect(linkedinLink).toBeAttached();

    console.log('✓ Contact page social links are functional');
  });

  test('product pages have working CTA buttons', async ({ page }) => {
    // Test Yuj page GitHub link
    await page.goto('/yuj');
    const yujGithub = page.locator('a[href="https://github.com/FutureAtoms/Yuj"]');
    await expect(yujGithub).toBeAttached();
    console.log('✓ Yuj GitHub link exists');

    // Test Agentic page GitHub link
    await page.goto('/agentic');
    const agenticGithub = page.locator('a[href*="github.com/FutureAtoms/agentic"]').first();
    await expect(agenticGithub).toBeAttached();
    console.log('✓ Agentic GitHub link exists');

    // Test AdaptiVision page GitHub link
    await page.goto('/adaptivision');
    const adaptivisionGithub = page.locator('a[href*="github.com/FutureAtoms/AdaptiVision"]').first();
    await expect(adaptivisionGithub).toBeAttached();
    console.log('✓ AdaptiVision GitHub link exists');
  });

  test('BevyBeats page has working links', async ({ page }) => {
    await page.goto('/bevybeats');

    // Check the listen now button links to bevybeats.com
    const listenNowBtn = page.locator('a[href="https://www.bevybeats.com"]').first();
    await expect(listenNowBtn).toBeAttached();

    console.log('✓ BevyBeats external links are functional');
  });

  test('ChipOS page has download buttons', async ({ page }) => {
    await page.goto('/chipos');

    // Check that download section exists
    const downloadSection = page.locator('text=Download');
    await expect(downloadSection.first()).toBeAttached();

    console.log('✓ ChipOS download section exists');
  });
});
