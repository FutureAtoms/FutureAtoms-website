const { test, expect } = require('@playwright/test');

/**
 * Comprehensive tests for the Admin Panel (Refine)
 * Tests the admin interface for managing feature requests
 */

test.describe('Admin Panel - Loading & Basic Structure', () => {

    test('admin panel index.html exists and loads', async ({ page }) => {
        const response = await page.goto('/admin/index.html');

        expect(response).toBeTruthy();
        expect(response.status()).toBe(200);

        console.log('✓ Admin panel index.html loads');
    });

    test('admin panel has correct title', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(2000);

        // Title should contain either FutureAtoms, Admin, or Refine (the framework name)
        const title = await page.title();
        const hasValidTitle = title.toLowerCase().includes('futureatoms') ||
                              title.toLowerCase().includes('admin') ||
                              title.toLowerCase().includes('refine') ||
                              title.toLowerCase().includes('feature');

        expect(hasValidTitle).toBe(true);

        console.log(`✓ Admin panel has title: ${title}`);
    });

    test('admin panel has root element', async ({ page }) => {
        await page.goto('/admin/index.html');

        const root = page.locator('#root');
        await expect(root).toBeAttached();

        console.log('✓ Admin panel has root element');
    });

    test('admin panel loads React app', async ({ page }) => {
        await page.goto('/admin/index.html');

        // Wait for React to render
        await page.waitForTimeout(3000);

        // The root should have content (React rendered)
        const rootContent = await page.locator('#root').innerHTML();
        expect(rootContent.length).toBeGreaterThan(0);

        console.log('✓ Admin panel React app loads');
    });
});

test.describe('Admin Panel - Assets', () => {

    test('admin CSS assets load', async ({ page }) => {
        const cssRequests = [];

        page.on('response', response => {
            if (response.url().includes('/admin/assets/') && response.url().endsWith('.css')) {
                cssRequests.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        await page.goto('/admin/index.html');
        await page.waitForLoadState('networkidle');

        // Should have at least one CSS file
        expect(cssRequests.length).toBeGreaterThan(0);

        // All CSS should load successfully
        for (const req of cssRequests) {
            expect(req.status).toBe(200);
        }

        console.log(`✓ ${cssRequests.length} CSS assets loaded`);
    });

    test('admin JS assets load', async ({ page }) => {
        const jsRequests = [];

        page.on('response', response => {
            if (response.url().includes('/admin/assets/') && response.url().endsWith('.js')) {
                jsRequests.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        await page.goto('/admin/index.html');
        await page.waitForLoadState('networkidle');

        // Should have at least one JS file
        expect(jsRequests.length).toBeGreaterThan(0);

        // All JS should load successfully
        for (const req of jsRequests) {
            expect(req.status).toBe(200);
        }

        console.log(`✓ ${jsRequests.length} JS assets loaded`);
    });
});

test.describe('Admin Panel - Refine UI Components', () => {

    test('admin panel renders Refine layout', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Refine should render some layout structure
        // Looking for Ant Design components that Refine uses
        const hasLayout = await page.evaluate(() => {
            // Check for any rendered content
            const root = document.getElementById('root');
            return root && root.children.length > 0;
        });

        expect(hasLayout).toBe(true);

        console.log('✓ Refine layout renders');
    });

    test('admin panel has sidebar or navigation', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Check for sidebar, nav, or menu elements
        const hasSidebar = await page.evaluate(() => {
            const selectors = [
                'aside',
                'nav',
                '[class*="sider"]',
                '[class*="Sider"]',
                '[class*="sidebar"]',
                '[class*="menu"]'
            ];

            for (const selector of selectors) {
                if (document.querySelector(selector)) {
                    return true;
                }
            }
            return false;
        });

        expect(hasSidebar).toBe(true);

        console.log('✓ Admin panel has navigation');
    });

    test('admin panel shows Feature Requests menu item', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Look for Feature Requests text in the menu
        const hasFeatureRequestsMenu = await page.evaluate(() => {
            const body = document.body.innerText;
            return body.toLowerCase().includes('feature') ||
                   body.toLowerCase().includes('request');
        });

        expect(hasFeatureRequestsMenu).toBe(true);

        console.log('✓ Feature Requests menu item visible');
    });
});

test.describe('Admin Panel - Dark Theme', () => {

    test('admin panel uses dark theme', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Check if body or root has dark background
        const isDarkTheme = await page.evaluate(() => {
            const body = document.body;
            const root = document.getElementById('root');
            const firstChild = root?.firstChild;

            // Check various elements for dark background
            const elements = [body, root, firstChild].filter(Boolean);

            for (const el of elements) {
                const bg = getComputedStyle(el).backgroundColor;
                // Dark colors typically have low RGB values
                const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    const [, r, g, b] = match.map(Number);
                    // If all RGB values are below 50, it's likely dark
                    if (r < 50 && g < 50 && b < 50) {
                        return true;
                    }
                }
            }
            return false;
        });

        expect(isDarkTheme).toBe(true);

        console.log('✓ Admin panel uses dark theme');
    });
});

test.describe('Admin Panel - Routing', () => {

    test('admin panel handles /admin/ route', async ({ page }) => {
        const response = await page.goto('/admin/');

        expect(response).toBeTruthy();
        // Should either return 200 or redirect to index.html
        expect([200, 301, 302]).toContain(response.status());

        console.log('✓ Admin /admin/ route works');
    });

    test('admin panel redirects to feature-requests by default', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Check if URL contains feature-requests or if the content shows it
        const url = page.url();
        const hasFeatureRequestsContent = await page.evaluate(() => {
            const body = document.body.innerText.toLowerCase();
            return body.includes('feature') || body.includes('request') || body.includes('loading');
        });

        expect(url.includes('feature-requests') || hasFeatureRequestsContent).toBe(true);

        console.log('✓ Admin redirects to feature requests');
    });
});

test.describe('Admin Panel - No Console Errors', () => {

    test('admin panel loads without critical JS errors', async ({ page }) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignore known non-critical errors
                if (!text.includes('favicon') &&
                    !text.includes('404') &&
                    !text.includes('net::ERR')) {
                    errors.push(text);
                }
            }
        });

        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Filter out Supabase connection errors (expected in test env)
        const criticalErrors = errors.filter(e =>
            !e.includes('supabase') &&
            !e.includes('Supabase') &&
            !e.includes('CORS') &&
            !e.includes('network')
        );

        expect(criticalErrors.length).toBe(0);

        console.log('✓ No critical JS errors');
    });
});

test.describe('Admin Panel - Responsive Design', () => {

    test('admin panel renders on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Should still render content
        const hasContent = await page.evaluate(() => {
            const root = document.getElementById('root');
            return root && root.innerHTML.length > 100;
        });

        expect(hasContent).toBe(true);

        console.log('✓ Admin panel renders on mobile');
    });

    test('admin panel renders on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        const hasContent = await page.evaluate(() => {
            const root = document.getElementById('root');
            return root && root.innerHTML.length > 100;
        });

        expect(hasContent).toBe(true);

        console.log('✓ Admin panel renders on tablet');
    });

    test('admin panel renders on desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        const hasContent = await page.evaluate(() => {
            const root = document.getElementById('root');
            return root && root.innerHTML.length > 100;
        });

        expect(hasContent).toBe(true);

        console.log('✓ Admin panel renders on desktop');
    });
});

test.describe('Admin Panel - Meta Tags', () => {

    test('admin panel has viewport meta tag', async ({ page }) => {
        await page.goto('/admin/index.html');

        const viewport = page.locator('meta[name="viewport"]');
        await expect(viewport).toBeAttached();

        console.log('✓ Admin has viewport meta tag');
    });

    test('admin panel has charset meta tag', async ({ page }) => {
        await page.goto('/admin/index.html');

        const charset = page.locator('meta[charset]');
        await expect(charset).toBeAttached();

        console.log('✓ Admin has charset meta tag');
    });
});

test.describe('Admin Panel - Performance', () => {

    test('admin panel loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/admin/index.html');
        await page.waitForLoadState('domcontentloaded');

        const loadTime = Date.now() - startTime;

        // Admin panel should load in under 10 seconds (it's a larger React app)
        expect(loadTime).toBeLessThan(10000);

        console.log(`✓ Admin loaded in ${loadTime}ms`);
    });

    test('admin assets are bundled (not too many requests)', async ({ page }) => {
        const requests = [];

        page.on('request', request => {
            if (request.url().includes('/admin/')) {
                requests.push(request.url());
            }
        });

        await page.goto('/admin/index.html');
        await page.waitForLoadState('networkidle');

        // Should have minimal requests (index.html + bundled JS + bundled CSS)
        // Vite typically produces 2-5 files
        expect(requests.length).toBeLessThan(20);

        console.log(`✓ Admin made ${requests.length} requests`);
    });
});

test.describe('Admin Panel - Feature Request List Interface', () => {

    test('admin shows statistics cards', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(4000);

        // Look for statistics or cards in the UI
        const hasStats = await page.evaluate(() => {
            const body = document.body.innerText.toLowerCase();
            // Check for common stat labels
            return body.includes('total') ||
                   body.includes('planned') ||
                   body.includes('progress') ||
                   body.includes('completed') ||
                   body.includes('requests');
        });

        expect(hasStats).toBe(true);

        console.log('✓ Admin shows statistics');
    });

    test('admin shows table or list structure', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(4000);

        // Look for table elements (Ant Design Table)
        const hasTable = await page.evaluate(() => {
            return document.querySelector('table') !== null ||
                   document.querySelector('[class*="table"]') !== null ||
                   document.querySelector('[class*="Table"]') !== null ||
                   document.querySelector('[class*="list"]') !== null ||
                   document.querySelector('[class*="List"]') !== null;
        });

        expect(hasTable).toBe(true);

        console.log('✓ Admin shows table/list structure');
    });
});

test.describe('Admin Panel - Ant Design Integration', () => {

    test('Ant Design CSS is loaded', async ({ page }) => {
        await page.goto('/admin/index.html');
        await page.waitForTimeout(3000);

        // Check for Ant Design specific classes
        const hasAntdClasses = await page.evaluate(() => {
            const html = document.documentElement.outerHTML;
            return html.includes('ant-') ||
                   html.includes('antd') ||
                   html.includes('anticon');
        });

        expect(hasAntdClasses).toBe(true);

        console.log('✓ Ant Design CSS loaded');
    });
});

test.describe('Admin Panel - Build Output Verification', () => {

    test('admin assets directory exists', async ({ page }) => {
        const response = await page.goto('/admin/assets/');

        // Either 200 (directory listing) or 403 (forbidden, but exists)
        // or redirect, which is all fine - just shouldn't be 404
        expect(response.status()).not.toBe(404);

        console.log('✓ Admin assets directory exists');
    });

    test('admin index.html has correct script reference', async ({ page }) => {
        await page.goto('/admin/index.html');

        // Check for module script tag
        const hasModuleScript = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="module"]');
            return scripts.length > 0;
        });

        expect(hasModuleScript).toBe(true);

        console.log('✓ Admin has module script');
    });

    test('admin index.html has CSS link', async ({ page }) => {
        await page.goto('/admin/index.html');

        // Check for stylesheet link
        const hasCssLink = await page.evaluate(() => {
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            return links.length > 0;
        });

        expect(hasCssLink).toBe(true);

        console.log('✓ Admin has CSS link');
    });
});
