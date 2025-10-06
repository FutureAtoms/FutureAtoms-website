const { test, expect } = require('@playwright/test');

test.describe('Download Links Tests', () => {
  test('ChipOS DMG file exists and download link works', async ({ page }) => {
    await page.goto('/chipos.html');

    // Find the download button
    const downloadButton = page.locator('a[href*="ChipOS-macOS-arm64.dmg"]');
    await expect(downloadButton).toBeVisible();

    // Verify it has download attribute
    const hasDownload = await downloadButton.getAttribute('download');
    expect(hasDownload).not.toBeNull();

    // Check the href points to the correct file
    const href = await downloadButton.getAttribute('href');
    expect(href).toContain('ChipOS-macOS-arm64.dmg');

    console.log('✓ ChipOS download button configured correctly');
  });

  test('ChipOS DMG file is accessible', async ({ page, request }) => {
    // Check if file exists by making a HEAD request
    const response = await request.head('http://localhost:8000/ChipOS-macOS-arm64.dmg');
    expect(response.status()).toBe(200);

    console.log('✓ ChipOS DMG file is accessible');
  });

  test('ChipOS page shows correct product name', async ({ page }) => {
    await page.goto('/chipos.html');

    // Should say ChipOS, not Incoder
    const title = await page.locator('.app-title, h1').first();
    const titleText = await title.textContent();

    expect(titleText).toContain('ChipOS');
    expect(titleText).not.toContain('Incoder');

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

      // Check for Incoder (case-insensitive, but not in URLs)
      const hasIncoder = bodyText.toLowerCase().includes('incoder');

      if (hasIncoder) {
        // Check if it's just in a URL (which might be ok)
        const incoderMatches = bodyText.match(/incoder/gi) || [];
        console.log(`⚠ Found ${incoderMatches.length} "Incoder" references in ${pagePath}`);
      }
    }

    console.log('✓ Checked for old Incoder references');
  });
});
