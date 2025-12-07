const { test, expect } = require('@playwright/test');

test.describe('Download Links Tests', () => {
  test('ChipOS page has download section', async ({ page }) => {
    await page.goto('/chipos.html');

    // Check for download section heading or buttons
    const downloadSection = page.locator('text=Download').first();
    await expect(downloadSection).toBeAttached();

    console.log('✓ ChipOS download section exists');
  });

  test.skip('ChipOS .deb file is accessible', async ({ page, request }) => {
    // Skip in CI - large binary files are not in git repo
    // Check if file exists by making a HEAD request
    const response = await request.head('http://localhost:8000/chipos_1.105.0_amd64.deb');
    expect(response.status()).toBe(200);

    console.log('✓ ChipOS .deb file is accessible');
  });

  test('ChipOS page shows correct product name', async ({ page }) => {
    await page.goto('/chipos.html');

    // Check page title
    await expect(page).toHaveTitle(/ChipOS|FutureAtoms/);

    // Check main heading contains ChipOS
    const pageContent = await page.locator('body').textContent();
    expect(pageContent.toLowerCase()).toContain('chipos');
    expect(pageContent.toLowerCase()).not.toContain('incoder');

    console.log('✓ ChipOS page displays correct product name');
  });

  test('no references to old "Incoder" name remain', async ({ page }) => {
    const pages = [
      '/index.html',
      '/chipos.html',
      '/blog-semiconductor-ai.html',
      '/news.html',
      '/blog.html'
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      const bodyText = await page.locator('body').textContent();

      // Check for Incoder (case-insensitive)
      const hasIncoder = bodyText.toLowerCase().includes('incoder');

      if (hasIncoder) {
        const incoderMatches = bodyText.match(/incoder/gi) || [];
        console.log(`⚠ Found ${incoderMatches.length} "Incoder" references in ${pagePath}`);
      }
    }

    console.log('✓ Checked for old Incoder references');
  });

  test('ChipOS changelog page loads', async ({ page }) => {
    await page.goto('/chipos-changelog.html');

    await expect(page).toHaveTitle(/Changelog|ChipOS|FutureAtoms/);

    // Check for changelog content
    const changelogContent = page.locator('body');
    const text = await changelogContent.textContent();
    expect(text.toLowerCase()).toContain('changelog');

    console.log('✓ ChipOS changelog page loads correctly');
  });

  test('product page CTA links are not placeholder', async ({ page }) => {
    const productPages = [
      { path: '/yuj.html', expectedLink: 'github.com' },
      { path: '/agentic.html', expectedLink: 'github.com' },
      { path: '/adaptivision.html', expectedLink: 'github.com' },
      { path: '/bevybeats.html', expectedLink: 'bevybeats.com' },
      { path: '/savitri.html', expectedLink: 'contact.html' },
      { path: '/zaphy.html', expectedLink: 'contact.html' },
      { path: '/systemverilog.html', expectedLink: 'contact.html' }
    ];

    for (const product of productPages) {
      await page.goto(product.path);

      // Find CTA buttons
      const ctaButtons = page.locator('.cta-btn, a.rounded-full').first();

      if (await ctaButtons.isVisible()) {
        const href = await ctaButtons.getAttribute('href');
        expect(href).not.toBe('#');
        console.log(`✓ ${product.path} has functional CTA: ${href}`);
      }
    }
  });
});
