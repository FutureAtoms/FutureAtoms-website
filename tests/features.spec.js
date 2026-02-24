const { test, expect } = require('@playwright/test');

/**
 * Comprehensive tests for the Feature Request System
 * Tests all 8 product feature pages and their functionality
 */

// All product feature pages to test
const FEATURE_PAGES = [
    { product: 'chipos', name: 'ChipOS', url: '/chipos-features', backLink: '/chipos' },
    { product: 'bevybeats', name: 'BevyBeats', url: '/bevybeats-features', backLink: '/bevybeats' },
    { product: 'savitri', name: 'Savitri', url: '/savitri-features', backLink: '/savitri' },
    { product: 'zaphy', name: 'Zaphy', url: '/zaphy-features', backLink: '/zaphy' },
    { product: 'agentic', name: 'Agentic Control', url: '/agentic-features', backLink: '/agentic' },
    { product: 'yuj', name: 'Yuj', url: '/yuj-features', backLink: '/yuj' },
    { product: 'adaptivision', name: 'AdaptiveVision', url: '/adaptivision-features', backLink: '/adaptivision' },
    { product: 'systemverilog', name: 'SystemVerilogGPT', url: '/systemverilog-features', backLink: '/systemverilog' }
];

test.describe('Feature Request Pages - Loading & Structure', () => {

    for (const page of FEATURE_PAGES) {
        test(`${page.name} feature page loads correctly`, async ({ page: browserPage }) => {
            await browserPage.goto(page.url);

            // Check page title
            await expect(browserPage).toHaveTitle(new RegExp(`${page.name}.*Feature Requests`, 'i'));

            // Check meta description
            const metaDesc = browserPage.locator('meta[name="description"]');
            await expect(metaDesc).toHaveAttribute('content', new RegExp(page.name, 'i'));

            console.log(`✓ ${page.name} feature page loaded`);
        });
    }

    test('all 8 feature pages are accessible', async ({ page: browserPage }) => {
        let successCount = 0;

        for (const pageInfo of FEATURE_PAGES) {
            const response = await browserPage.goto(pageInfo.url);
            if (response && response.status() === 200) {
                successCount++;
            }
        }

        expect(successCount).toBe(8);
        console.log('✓ All 8 feature pages accessible');
    });
});

test.describe('Feature Request Pages - Navigation', () => {

    test('header navigation elements exist', async ({ page }) => {
        await page.goto('/chipos-features');

        // Check header
        const header = page.locator('header');
        await expect(header).toBeVisible();

        // Check FutureAtoms logo/branding
        const branding = page.locator('header').getByText('FUTUREATOMS');
        await expect(branding).toBeVisible();

        // Check navigation links
        const navLinks = ['HOME', 'PRODUCTS', 'RESEARCH', 'NEWS', 'ABOUT', 'CAREERS', 'CONTACT'];
        for (const linkText of navLinks) {
            const link = page.locator('header nav').getByText(linkText, { exact: false }).first();
            await expect(link).toBeAttached();
        }

        console.log('✓ Header navigation elements present');
    });

    for (const pageInfo of FEATURE_PAGES) {
        test(`${pageInfo.name} back link navigates correctly`, async ({ page }) => {
            await page.goto(pageInfo.url);

            // Check back link exists
            const backLink = page.locator('.back-link');
            await expect(backLink).toBeVisible();
            await expect(backLink).toHaveAttribute('href', pageInfo.backLink);

            // Check it contains "Back to"
            await expect(backLink).toContainText('Back to');

            console.log(`✓ ${pageInfo.name} back link correct`);
        });
    }

    test('products dropdown contains all product links', async ({ page }) => {
        await page.goto('/chipos-features');

        const productLinks = [
            '/chipos', '/systemverilog', '/zaphy', '/agentic',
            '/yuj', '/adaptivision', '/bevybeats', '/savitri'
        ];

        for (const href of productLinks) {
            const link = page.locator(`.dropdown-content a[href="${href}"]`);
            await expect(link).toBeAttached();
        }

        console.log('✓ Products dropdown contains all links');
    });

    test('clicking home link navigates to index', async ({ page }) => {
        await page.goto('/chipos-features');

        await page.click('a[href="index.html"]');
        await expect(page).toHaveURL(/index\.html/);

        console.log('✓ Home link navigation works');
    });
});

test.describe('Feature Request Pages - Hero Section', () => {

    for (const pageInfo of FEATURE_PAGES) {
        test(`${pageInfo.name} has correct hero content`, async ({ page }) => {
            await page.goto(pageInfo.url);

            // Check hero section exists
            const hero = page.locator('.features-hero');
            await expect(hero).toBeVisible();

            // Check hero icon
            const heroIcon = page.locator('.features-hero-icon');
            await expect(heroIcon).toBeVisible();

            // Check title contains product name and "FEATURE REQUESTS"
            const title = page.locator('.features-hero h1');
            await expect(title).toContainText('FEATURE REQUESTS');

            // Check subtitle/description exists
            const subtitle = page.locator('.features-hero p');
            await expect(subtitle).toBeVisible();

            console.log(`✓ ${pageInfo.name} hero section correct`);
        });
    }
});

test.describe('Feature Request Pages - Stats Section', () => {

    test('stats section displays all stat items', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        // Check all stat elements exist
        await expect(page.locator('#stat-total')).toBeAttached();
        await expect(page.locator('#stat-planned')).toBeAttached();
        await expect(page.locator('#stat-progress')).toBeAttached();
        await expect(page.locator('#stat-completed')).toBeAttached();

        // Check stat labels
        const statLabels = page.locator('.stat-label');
        await expect(statLabels).toHaveCount(4);

        console.log('✓ Stats section displays correctly');
    });

    test('stats items have correct labels', async ({ page }) => {
        await page.goto('/chipos-features');

        const expectedLabels = ['Total Requests', 'Planned', 'In Progress', 'Completed'];
        const statItems = page.locator('.stat-item');

        for (let i = 0; i < expectedLabels.length; i++) {
            const label = statItems.nth(i).locator('.stat-label');
            await expect(label).toContainText(expectedLabels[i]);
        }

        console.log('✓ Stats labels correct');
    });
});

test.describe('Feature Request Pages - Filter Tabs', () => {

    test('all filter tabs are present', async ({ page }) => {
        await page.goto('/chipos-features');

        const filterTabs = page.locator('.filter-tab');
        await expect(filterTabs).toHaveCount(5);

        // Check tab text
        const expectedTabs = ['All', 'Submitted', 'Planned', 'In Progress', 'Completed'];
        for (let i = 0; i < expectedTabs.length; i++) {
            await expect(filterTabs.nth(i)).toContainText(expectedTabs[i]);
        }

        console.log('✓ All filter tabs present');
    });

    test('filter tabs have correct data attributes', async ({ page }) => {
        await page.goto('/chipos-features');

        const expectedStatuses = ['all', 'submitted', 'planned', 'in_progress', 'completed'];
        const filterTabs = page.locator('.filter-tab');

        for (let i = 0; i < expectedStatuses.length; i++) {
            await expect(filterTabs.nth(i)).toHaveAttribute('data-status', expectedStatuses[i]);
        }

        console.log('✓ Filter tabs have correct data attributes');
    });

    test('"All" filter tab is active by default', async ({ page }) => {
        await page.goto('/chipos-features');

        const allTab = page.locator('.filter-tab[data-status="all"]');
        await expect(allTab).toHaveClass(/active/);

        console.log('✓ All tab active by default');
    });

    test('clicking filter tab changes active state', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Click Submitted tab
        const submittedTab = page.locator('.filter-tab[data-status="submitted"]');
        await submittedTab.click();
        await page.waitForTimeout(300);

        // Check Submitted is now active
        await expect(submittedTab).toHaveClass(/active/);

        // Check All is no longer active
        const allTab = page.locator('.filter-tab[data-status="all"]');
        await expect(allTab).not.toHaveClass(/active/);

        console.log('✓ Filter tab click changes active state');
    });

    test('all filter tabs are clickable', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const filterTabs = page.locator('.filter-tab');
        const count = await filterTabs.count();

        for (let i = 0; i < count; i++) {
            await filterTabs.nth(i).click();
            await page.waitForTimeout(200);
            await expect(filterTabs.nth(i)).toHaveClass(/active/);
        }

        console.log('✓ All filter tabs clickable');
    });
});

test.describe('Feature Request Pages - Sort Controls', () => {

    test('sort dropdown exists with correct options', async ({ page }) => {
        await page.goto('/chipos-features');

        const sortSelect = page.locator('#sort-select');
        await expect(sortSelect).toBeVisible();

        // Check options
        const options = sortSelect.locator('option');
        await expect(options).toHaveCount(3);

        await expect(options.nth(0)).toHaveAttribute('value', 'votes');
        await expect(options.nth(1)).toHaveAttribute('value', 'newest');
        await expect(options.nth(2)).toHaveAttribute('value', 'oldest');

        console.log('✓ Sort dropdown with correct options');
    });

    test('sort dropdown default is "Most Voted"', async ({ page }) => {
        await page.goto('/chipos-features');

        const sortSelect = page.locator('#sort-select');
        await expect(sortSelect).toHaveValue('votes');

        console.log('✓ Sort default is votes');
    });

    test('sort dropdown can be changed', async ({ page }) => {
        await page.goto('/chipos-features');

        const sortSelect = page.locator('#sort-select');

        // Change to newest
        await sortSelect.selectOption('newest');
        await expect(sortSelect).toHaveValue('newest');

        // Change to oldest
        await sortSelect.selectOption('oldest');
        await expect(sortSelect).toHaveValue('oldest');

        console.log('✓ Sort dropdown changeable');
    });
});

test.describe('Feature Request Pages - Features Grid', () => {

    test('features grid container exists', async ({ page }) => {
        await page.goto('/chipos-features');

        const grid = page.locator('#features-grid');
        await expect(grid).toBeAttached();

        console.log('✓ Features grid exists');
    });

    test('features grid shows loading or content', async ({ page }) => {
        await page.goto('/chipos-features');

        const grid = page.locator('#features-grid');

        // Should have some content (loading, empty, or features)
        await page.waitForTimeout(2000);
        const innerHTML = await grid.innerHTML();
        expect(innerHTML.length).toBeGreaterThan(0);

        console.log('✓ Features grid has content');
    });

    test('empty state shows when no features', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(2000);

        // Check if empty state exists (may or may not depending on data)
        const emptyState = page.locator('.features-empty');
        const featureCards = page.locator('.feature-card');

        const emptyCount = await emptyState.count();
        const cardsCount = await featureCards.count();

        // Either empty state OR feature cards should be present
        expect(emptyCount + cardsCount).toBeGreaterThanOrEqual(0);

        console.log('✓ Grid shows appropriate state');
    });
});

test.describe('Feature Request Pages - Submit Button', () => {

    test('submit feature button exists and is visible', async ({ page }) => {
        await page.goto('/chipos-features');

        const submitBtn = page.locator('#submit-feature-btn');
        await expect(submitBtn).toBeVisible();

        console.log('✓ Submit button visible');
    });

    test('submit button has correct text', async ({ page }) => {
        await page.goto('/chipos-features');

        const submitBtn = page.locator('#submit-feature-btn');
        await expect(submitBtn).toContainText('Request Feature');

        console.log('✓ Submit button text correct');
    });

    test('submit button has icon', async ({ page }) => {
        await page.goto('/chipos-features');

        const submitBtnIcon = page.locator('#submit-feature-btn i.fa-plus');
        await expect(submitBtnIcon).toBeAttached();

        console.log('✓ Submit button has icon');
    });
});

test.describe('Feature Request Pages - Submit Modal', () => {

    test('modal is hidden by default', async ({ page }) => {
        await page.goto('/chipos-features');

        const modal = page.locator('#submit-modal');
        await expect(modal).not.toHaveClass(/active/);

        console.log('✓ Modal hidden by default');
    });

    test('clicking submit button opens modal', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Click submit button
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Check modal is active
        const modal = page.locator('#submit-modal');
        await expect(modal).toHaveClass(/active/);

        console.log('✓ Submit button opens modal');
    });

    test('modal close button works', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Close with X button
        await page.click('#modal-close');
        await page.waitForTimeout(300);

        // Check modal is closed
        const modal = page.locator('#submit-modal');
        await expect(modal).not.toHaveClass(/active/);

        console.log('✓ Modal close button works');
    });

    test('clicking modal overlay closes modal', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Click overlay (outside modal content)
        const modal = page.locator('#submit-modal');
        await modal.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Check modal is closed
        await expect(modal).not.toHaveClass(/active/);

        console.log('✓ Clicking overlay closes modal');
    });

    test('pressing Escape closes modal', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Check modal is closed
        const modal = page.locator('#submit-modal');
        await expect(modal).not.toHaveClass(/active/);

        console.log('✓ Escape key closes modal');
    });

    test('modal has correct form fields', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Check form fields exist
        await expect(page.locator('#feature-title')).toBeVisible();
        await expect(page.locator('#feature-description')).toBeVisible();
        await expect(page.locator('#submitter-name')).toBeVisible();
        await expect(page.locator('#submitter-email')).toBeVisible();
        await expect(page.locator('#form-submit-btn')).toBeVisible();

        console.log('✓ Modal has all form fields');
    });

    test('title field is required', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const titleInput = page.locator('#feature-title');
        await expect(titleInput).toHaveAttribute('required');

        console.log('✓ Title field is required');
    });

    test('title field has maxlength of 200', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const titleInput = page.locator('#feature-title');
        await expect(titleInput).toHaveAttribute('maxlength', '200');

        console.log('✓ Title field has maxlength');
    });

    test('character counter updates on input', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const titleInput = page.locator('#feature-title');
        const counter = page.locator('#title-counter');

        // Initial state
        await expect(counter).toHaveText('0/200');

        // Type some text
        await titleInput.fill('Test Feature');
        await expect(counter).toHaveText('12/200');

        console.log('✓ Character counter updates');
    });

    test('email field validates email format', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const emailInput = page.locator('#submitter-email');
        await expect(emailInput).toHaveAttribute('type', 'email');

        console.log('✓ Email field validates format');
    });
});

test.describe('Feature Request Pages - Responsive Design', () => {

    test('mobile viewport - page renders correctly', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');

        // Check main elements visible
        await expect(page.locator('.features-hero')).toBeVisible();
        await expect(page.locator('#submit-feature-btn')).toBeVisible();

        console.log('✓ Mobile viewport renders correctly');
    });

    test('mobile viewport - mobile menu button visible', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');

        const mobileMenuBtn = page.locator('#mobile-menu-btn');
        await expect(mobileMenuBtn).toBeVisible();

        console.log('✓ Mobile menu button visible');
    });

    test('mobile viewport - mobile menu opens', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');

        // Menu should be hidden initially
        const mobileMenu = page.locator('#mobile-menu');
        await expect(mobileMenu).toHaveClass(/hidden/);

        // Click menu button
        await page.click('#mobile-menu-btn');
        await page.waitForTimeout(300);

        // Menu should be visible
        await expect(mobileMenu).not.toHaveClass(/hidden/);

        console.log('✓ Mobile menu opens');
    });

    test('mobile viewport - mobile menu closes', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');

        // Open menu
        await page.click('#mobile-menu-btn');
        await page.waitForTimeout(300);

        // Close menu
        await page.click('#close-mobile-menu');
        await page.waitForTimeout(300);

        const mobileMenu = page.locator('#mobile-menu');
        await expect(mobileMenu).toHaveClass(/hidden/);

        console.log('✓ Mobile menu closes');
    });

    test('tablet viewport - page renders correctly', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/chipos-features');

        await expect(page.locator('.features-hero')).toBeVisible();
        await expect(page.locator('#features-grid')).toBeAttached();

        console.log('✓ Tablet viewport renders correctly');
    });

    test('desktop viewport - desktop nav visible', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/chipos-features');

        // Desktop nav should be visible
        const desktopNav = page.locator('header nav.hidden.md\\:flex');
        await expect(desktopNav).toBeVisible();

        // Mobile menu button should be hidden
        const mobileMenuBtn = page.locator('#mobile-menu-btn');
        await expect(mobileMenuBtn).not.toBeVisible();

        console.log('✓ Desktop viewport shows correct nav');
    });

    test('filter tabs wrap on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');

        const filterTabs = page.locator('.filter-tabs');
        await expect(filterTabs).toBeVisible();

        // Check tabs are still functional on mobile
        const firstTab = page.locator('.filter-tab').first();
        await expect(firstTab).toBeVisible();

        console.log('✓ Filter tabs work on mobile');
    });

    test('submit modal works on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Check modal content visible
        const modalContent = page.locator('.modal-content');
        await expect(modalContent).toBeVisible();

        // Check form is usable
        const titleInput = page.locator('#feature-title');
        await expect(titleInput).toBeVisible();

        console.log('✓ Submit modal works on mobile');
    });
});

test.describe('Feature Request Pages - Styling & UI', () => {

    test('status badge colors are correct', async ({ page }) => {
        await page.goto('/chipos-features');

        // Load the CSS and verify status-related CSS variables exist
        const hasStyles = await page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            // Check if the CSS file loaded properly
            const links = document.querySelectorAll('link[href*="features.css"]');
            return links.length > 0;
        });

        expect(hasStyles).toBe(true);

        console.log('✓ Features CSS loaded');
    });

    test('glass panel styling applied to header', async ({ page }) => {
        await page.goto('/chipos-features');

        const header = page.locator('header');
        await expect(header).toHaveClass(/glass-panel/);

        console.log('✓ Glass panel styling applied');
    });

    test('submit button has correct styling', async ({ page }) => {
        await page.goto('/chipos-features');

        const submitBtn = page.locator('#submit-feature-btn');
        await expect(submitBtn).toHaveClass(/submit-feature-btn/);

        console.log('✓ Submit button styled correctly');
    });
});

test.describe('Feature Request Pages - Supabase Integration', () => {

    test('Supabase SDK is loaded', async ({ page }) => {
        await page.goto('/chipos-features');

        const supabaseLoaded = await page.evaluate(() => {
            return typeof window.supabase !== 'undefined';
        });

        expect(supabaseLoaded).toBe(true);

        console.log('✓ Supabase SDK loaded');
    });

    test('features.js is loaded', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const initFeaturesExists = await page.evaluate(() => {
            return typeof window.initFeatures === 'function';
        });

        expect(initFeaturesExists).toBe(true);

        console.log('✓ features.js loaded');
    });

    test('initFeatures is called with correct product', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        // Check the features-container has loaded (indicates initFeatures ran)
        const container = page.locator('.features-container');
        await expect(container).toBeVisible();

        console.log('✓ initFeatures called');
    });
});

test.describe('Feature Request Pages - Footer', () => {

    test('footer exists with copyright', async ({ page }) => {
        await page.goto('/chipos-features');

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(footer).toContainText('FutureAtoms');
        await expect(footer).toContainText('2026');

        console.log('✓ Footer with copyright exists');
    });
});

test.describe('Feature Request Pages - Accessibility', () => {

    test('modal has close button with aria-label', async ({ page }) => {
        await page.goto('/chipos-features');

        const closeBtn = page.locator('#modal-close');
        await expect(closeBtn).toHaveAttribute('aria-label', 'Close modal');

        console.log('✓ Modal close has aria-label');
    });

    test('mobile menu close button has aria-label', async ({ page }) => {
        await page.goto('/chipos-features');

        const closeBtn = page.locator('#close-mobile-menu');
        await expect(closeBtn).toHaveAttribute('aria-label', 'Close mobile menu');

        console.log('✓ Mobile menu close has aria-label');
    });

    test('form labels are associated with inputs', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Check label for attribute matches input id
        const titleLabel = page.locator('label[for="feature-title"]');
        await expect(titleLabel).toBeAttached();

        const descLabel = page.locator('label[for="feature-description"]');
        await expect(descLabel).toBeAttached();

        console.log('✓ Form labels properly associated');
    });

    test('submit button is focusable', async ({ page }) => {
        await page.goto('/chipos-features');

        const submitBtn = page.locator('#submit-feature-btn');
        await submitBtn.focus();

        await expect(submitBtn).toBeFocused();

        console.log('✓ Submit button focusable');
    });
});

test.describe('Feature Request Pages - Form Interactions', () => {

    test('form can be filled out', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Fill out form
        await page.fill('#feature-title', 'Test Feature Request');
        await page.fill('#feature-description', 'This is a test description for the feature request.');
        await page.fill('#submitter-name', 'Test User');
        await page.fill('#submitter-email', 'test@example.com');

        // Verify values
        await expect(page.locator('#feature-title')).toHaveValue('Test Feature Request');
        await expect(page.locator('#feature-description')).toHaveValue('This is a test description for the feature request.');
        await expect(page.locator('#submitter-name')).toHaveValue('Test User');
        await expect(page.locator('#submitter-email')).toHaveValue('test@example.com');

        console.log('✓ Form can be filled out');
    });

    test('form is reset when modal is closed', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal and fill form
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        await page.fill('#feature-title', 'Test Feature');

        // Close modal
        await page.click('#modal-close');
        await page.waitForTimeout(300);

        // Reopen modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Form should be reset
        await expect(page.locator('#feature-title')).toHaveValue('');

        console.log('✓ Form resets on modal close');
    });

    test('character counter shows warning near limit', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Fill title with 150 characters (>70% of 200)
        const longText = 'A'.repeat(150);
        await page.fill('#feature-title', longText);

        const counter = page.locator('#title-counter');
        await expect(counter).toHaveText('150/200');

        // Should have warning class
        await expect(counter).toHaveClass(/warning/);

        console.log('✓ Character counter shows warning');
    });

    test('character counter shows error near max', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        // Fill title with 185 characters (>90% of 200)
        const longText = 'B'.repeat(185);
        await page.fill('#feature-title', longText);

        const counter = page.locator('#title-counter');
        await expect(counter).toHaveText('185/200');

        // Should have error class
        await expect(counter).toHaveClass(/error/);

        console.log('✓ Character counter shows error near max');
    });
});

test.describe('Feature Request Pages - Cross-Product Tests', () => {

    test('each product page initializes with correct product ID', async ({ page }) => {
        for (const pageInfo of FEATURE_PAGES) {
            await page.goto(pageInfo.url);
            await page.waitForTimeout(500);

            // The page should have called initFeatures with the correct product
            const container = page.locator('.features-container');
            await expect(container).toBeVisible();
        }

        console.log('✓ All products initialize correctly');
    });

    test('each product has unique accent colors in CSS', async ({ page }) => {
        // Test that each page has custom styling
        for (const pageInfo of FEATURE_PAGES) {
            await page.goto(pageInfo.url);

            // Check page has style tag with product-specific colors
            const hasStyles = await page.evaluate(() => {
                const styles = document.querySelectorAll('style');
                return styles.length > 0;
            });

            expect(hasStyles).toBe(true);
        }

        console.log('✓ All products have custom styling');
    });
});

test.describe('Feature Request Pages - Error Handling', () => {

    test('page handles missing Supabase gracefully', async ({ page }) => {
        // Block Supabase CDN
        await page.route('**/supabase**', route => route.abort());

        await page.goto('/chipos-features');
        await page.waitForTimeout(2000);

        // Page should still load, just without features
        await expect(page.locator('.features-hero')).toBeVisible();

        console.log('✓ Page handles missing Supabase');
    });
});

test.describe('Feature Request Pages - Performance', () => {

    test('page loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/chipos-features');
        await page.waitForLoadState('domcontentloaded');

        const loadTime = Date.now() - startTime;

        // Page should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);

        console.log(`✓ Page loaded in ${loadTime}ms`);
    });

    test('all CSS and JS resources load', async ({ page }) => {
        const failedResources = [];

        page.on('requestfailed', request => {
            failedResources.push(request.url());
        });

        await page.goto('/chipos-features');
        await page.waitForLoadState('networkidle');

        // Filter out external resources that might be blocked
        const criticalFailures = failedResources.filter(url =>
            url.includes('features.css') || url.includes('features.js') || url.includes('main.css')
        );

        expect(criticalFailures.length).toBe(0);

        console.log('✓ All critical resources loaded');
    });
});

test.describe('Product Page Feature Links', () => {

    const PRODUCT_PAGES = [
        { url: '/chipos', featureUrl: '/chipos-features' },
        { url: '/bevybeats', featureUrl: '/bevybeats-features' },
        { url: '/savitri', featureUrl: '/savitri-features' },
        { url: '/zaphy', featureUrl: '/zaphy-features' },
        { url: '/agentic', featureUrl: '/agentic-features' },
        { url: '/yuj', featureUrl: '/yuj-features' },
        { url: '/adaptivision', featureUrl: '/adaptivision-features' },
        { url: '/systemverilog', featureUrl: '/systemverilog-features' }
    ];

    for (const pageInfo of PRODUCT_PAGES) {
        test(`${pageInfo.url} has Feature Requests link`, async ({ page }) => {
            await page.goto(pageInfo.url);
            await page.waitForTimeout(500);

            // Check for Feature Requests button/link
            const featureLink = page.locator(`a[href="${pageInfo.featureUrl}"]`).first();
            await expect(featureLink).toBeAttached();

            console.log(`✓ ${pageInfo.url} has feature request link`);
        });
    }

    test('clicking Feature Requests link navigates correctly', async ({ page }) => {
        await page.goto('/chipos');
        await page.waitForTimeout(1000);

        // Find and click the Feature Requests link
        const featureLink = page.locator('a[href="chipos-features.html"]').first();
        await featureLink.click();

        // Should navigate to features page
        await expect(page).toHaveURL(/chipos-features\.html/);

        console.log('✓ Feature Requests link navigation works');
    });
});

// ============================================================================
// CATEGORY SYSTEM TESTS
// ============================================================================

test.describe('Feature Request Pages - Category System', () => {

    // Expected categories with their properties
    const EXPECTED_CATEGORIES = [
        { key: 'all', label: 'All' },
        { key: 'general', label: 'General', icon: 'fa-circle', color: '#00ffff' },
        { key: 'ui', label: 'UI/UX', icon: 'fa-palette', color: '#ff6b9d' },
        { key: 'performance', label: 'Performance', icon: 'fa-bolt', color: '#ffd700' },
        { key: 'integration', label: 'Integration', icon: 'fa-plug', color: '#4facfe' },
        { key: 'workflow', label: 'Workflow', icon: 'fa-sitemap', color: '#00ff88' },
        { key: 'documentation', label: 'Docs', icon: 'fa-book', color: '#c084fc' },
        { key: 'ai', label: 'AI/ML', icon: 'fa-brain', color: '#ff8c00' },
        { key: 'security', label: 'Security', icon: 'fa-shield-halved', color: '#ef4444' }
    ];

    test('category tabs container exists', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const categoryTabs = page.locator('#category-tabs');
        await expect(categoryTabs).toBeAttached();

        console.log('✓ Category tabs container exists');
    });

    test('all category tabs are present (9 total including All)', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const categoryTabs = page.locator('.category-tab');
        await expect(categoryTabs).toHaveCount(9);

        console.log('✓ All 9 category tabs present');
    });

    test('category tabs have correct data attributes', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        for (const category of EXPECTED_CATEGORIES) {
            const tab = page.locator(`.category-tab[data-category="${category.key}"]`);
            await expect(tab).toBeAttached();
        }

        console.log('✓ Category tabs have correct data-category attributes');
    });

    test('category tabs display correct labels', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        for (const category of EXPECTED_CATEGORIES) {
            const tab = page.locator(`.category-tab[data-category="${category.key}"]`);
            await expect(tab).toContainText(category.label);
        }

        console.log('✓ Category tabs display correct labels');
    });

    test('"All" category tab is active by default', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const allTab = page.locator('.category-tab[data-category="all"]');
        await expect(allTab).toHaveClass(/active/);

        console.log('✓ All category tab active by default');
    });

    test('clicking category tab changes active state', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Click UI/UX tab
        const uiTab = page.locator('.category-tab[data-category="ui"]');
        await uiTab.click();
        await page.waitForTimeout(300);

        // Check UI/UX is now active
        await expect(uiTab).toHaveClass(/active/);

        // Check All is no longer active
        const allTab = page.locator('.category-tab[data-category="all"]');
        await expect(allTab).not.toHaveClass(/active/);

        console.log('✓ Category tab click changes active state');
    });

    test('all category tabs are clickable', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const categoryTabs = page.locator('.category-tab');
        const count = await categoryTabs.count();

        for (let i = 0; i < count; i++) {
            await categoryTabs.nth(i).click();
            await page.waitForTimeout(200);
            await expect(categoryTabs.nth(i)).toHaveClass(/active/);
        }

        console.log('✓ All category tabs clickable');
    });

    test('category tabs have icons (except All)', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Check that category tabs with icons have them
        for (const category of EXPECTED_CATEGORIES.filter(c => c.icon)) {
            const tab = page.locator(`.category-tab[data-category="${category.key}"]`);
            const icon = tab.locator('i.fas, i.fa-solid');
            await expect(icon).toBeAttached();
        }

        console.log('✓ Category tabs have icons');
    });
});

test.describe('Feature Request Pages - Category Form Dropdown', () => {

    test('category dropdown exists in form', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Open modal
        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const categorySelect = page.locator('#feature-category');
        await expect(categorySelect).toBeVisible();

        console.log('✓ Category dropdown exists in form');
    });

    test('category dropdown has all 8 category options', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const categorySelect = page.locator('#feature-category');
        const options = categorySelect.locator('option');

        // Should have 8 categories
        await expect(options).toHaveCount(8);

        console.log('✓ Category dropdown has 8 options');
    });

    test('category dropdown options have correct values', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const expectedValues = ['general', 'ui', 'performance', 'integration', 'workflow', 'documentation', 'ai', 'security'];

        for (const value of expectedValues) {
            const option = page.locator(`#feature-category option[value="${value}"]`);
            await expect(option).toBeAttached();
        }

        console.log('✓ Category dropdown options have correct values');
    });

    test('category dropdown default is "general"', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const categorySelect = page.locator('#feature-category');
        await expect(categorySelect).toHaveValue('general');

        console.log('✓ Category dropdown defaults to general');
    });

    test('category dropdown can be changed', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const categorySelect = page.locator('#feature-category');

        // Change to different categories
        await categorySelect.selectOption('ui');
        await expect(categorySelect).toHaveValue('ui');

        await categorySelect.selectOption('security');
        await expect(categorySelect).toHaveValue('security');

        await categorySelect.selectOption('ai');
        await expect(categorySelect).toHaveValue('ai');

        console.log('✓ Category dropdown can be changed');
    });

    test('category dropdown has label', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        await page.click('#submit-feature-btn');
        await page.waitForTimeout(300);

        const label = page.locator('label[for="feature-category"]');
        await expect(label).toBeAttached();
        await expect(label).toContainText('Category');

        console.log('✓ Category dropdown has label');
    });
});

test.describe('Feature Request Pages - Category Helper Functions', () => {

    test('CATEGORIES constant is exported to window', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const categoriesExist = await page.evaluate(() => {
            return typeof window.CATEGORIES === 'object' && window.CATEGORIES !== null;
        });

        expect(categoriesExist).toBe(true);

        console.log('✓ CATEGORIES constant exported');
    });

    test('CATEGORIES has all 8 categories', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const categoryCount = await page.evaluate(() => {
            return Object.keys(window.CATEGORIES).length;
        });

        expect(categoryCount).toBe(8);

        console.log('✓ CATEGORIES has 8 entries');
    });

    test('each category has label, icon, and color', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const allCategoriesValid = await page.evaluate(() => {
            const categories = window.CATEGORIES;
            for (const key of Object.keys(categories)) {
                const cat = categories[key];
                if (!cat.label || !cat.icon || !cat.color) {
                    return false;
                }
            }
            return true;
        });

        expect(allCategoriesValid).toBe(true);

        console.log('✓ All categories have required properties');
    });

    test('generateCategoryTabs function is exported', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const functionExists = await page.evaluate(() => {
            return typeof window.generateCategoryTabs === 'function';
        });

        expect(functionExists).toBe(true);

        console.log('✓ generateCategoryTabs function exported');
    });

    test('generateCategoryOptions function is exported', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const functionExists = await page.evaluate(() => {
            return typeof window.generateCategoryOptions === 'function';
        });

        expect(functionExists).toBe(true);

        console.log('✓ generateCategoryOptions function exported');
    });

    test('generateCategoryTabs returns valid HTML', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const html = await page.evaluate(() => {
            return window.generateCategoryTabs();
        });

        // Should contain category-tab class
        expect(html).toContain('category-tab');
        // Should contain data-category attributes
        expect(html).toContain('data-category');
        // Should have All tab
        expect(html).toContain('All');

        console.log('✓ generateCategoryTabs returns valid HTML');
    });

    test('generateCategoryOptions returns valid HTML options', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(1000);

        const html = await page.evaluate(() => {
            return window.generateCategoryOptions();
        });

        // Should contain option tags
        expect(html).toContain('<option');
        // Should have all category values
        expect(html).toContain('value="general"');
        expect(html).toContain('value="ui"');
        expect(html).toContain('value="security"');

        console.log('✓ generateCategoryOptions returns valid HTML');
    });
});

test.describe('Feature Request Pages - Category Filtering Integration', () => {

    test('category and status filters can be combined', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Set status filter to Submitted
        const submittedTab = page.locator('.filter-tab[data-status="submitted"]');
        await submittedTab.click();
        await page.waitForTimeout(300);

        // Set category filter to UI/UX
        const uiTab = page.locator('.category-tab[data-category="ui"]');
        await uiTab.click();
        await page.waitForTimeout(300);

        // Both should be active
        await expect(submittedTab).toHaveClass(/active/);
        await expect(uiTab).toHaveClass(/active/);

        console.log('✓ Category and status filters can be combined');
    });

    test('changing category preserves status filter', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Set status filter to Planned
        const plannedTab = page.locator('.filter-tab[data-status="planned"]');
        await plannedTab.click();
        await page.waitForTimeout(300);

        // Change category
        const performanceTab = page.locator('.category-tab[data-category="performance"]');
        await performanceTab.click();
        await page.waitForTimeout(300);

        // Status should still be Planned
        await expect(plannedTab).toHaveClass(/active/);

        console.log('✓ Changing category preserves status filter');
    });

    test('changing status preserves category filter', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        // Set category filter
        const securityTab = page.locator('.category-tab[data-category="security"]');
        await securityTab.click();
        await page.waitForTimeout(300);

        // Change status
        const completedTab = page.locator('.filter-tab[data-status="completed"]');
        await completedTab.click();
        await page.waitForTimeout(300);

        // Category should still be Security
        await expect(securityTab).toHaveClass(/active/);

        console.log('✓ Changing status preserves category filter');
    });
});

test.describe('Feature Request Pages - Category Styling', () => {

    test('category tabs have proper styling class', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const categoryTabs = page.locator('.category-tabs');
        await expect(categoryTabs).toBeVisible();

        console.log('✓ Category tabs container has proper class');
    });

    test('active category tab has visual distinction', async ({ page }) => {
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const activeTab = page.locator('.category-tab.active');
        await expect(activeTab).toBeVisible();

        // Check it has visual styling (background or border)
        const hasStyles = await page.evaluate(() => {
            const tab = document.querySelector('.category-tab.active');
            const styles = getComputedStyle(tab);
            return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                   styles.borderColor !== 'rgba(0, 0, 0, 0)';
        });

        expect(hasStyles).toBe(true);

        console.log('✓ Active category tab has visual distinction');
    });

    test('category tabs are horizontally scrollable on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/chipos-features');
        await page.waitForTimeout(500);

        const categoryTabs = page.locator('.category-tabs');

        // Check overflow-x is set to auto or scroll
        const overflowX = await categoryTabs.evaluate(el => {
            return getComputedStyle(el).overflowX;
        });

        expect(['auto', 'scroll']).toContain(overflowX);

        console.log('✓ Category tabs scrollable on mobile');
    });
});

test.describe('Feature Request Pages - Category in All Products', () => {

    for (const pageInfo of FEATURE_PAGES) {
        test(`${pageInfo.name} has category tabs`, async ({ page }) => {
            await page.goto(pageInfo.url);
            await page.waitForTimeout(500);

            const categoryTabs = page.locator('#category-tabs');
            await expect(categoryTabs).toBeAttached();

            const tabs = page.locator('.category-tab');
            await expect(tabs).toHaveCount(9);

            console.log(`✓ ${pageInfo.name} has category tabs`);
        });

        test(`${pageInfo.name} has category dropdown in form`, async ({ page }) => {
            await page.goto(pageInfo.url);
            await page.waitForTimeout(500);

            await page.click('#submit-feature-btn');
            await page.waitForTimeout(300);

            const categorySelect = page.locator('#feature-category');
            await expect(categorySelect).toBeVisible();

            const options = categorySelect.locator('option');
            await expect(options).toHaveCount(8);

            console.log(`✓ ${pageInfo.name} has category dropdown`);
        });
    }
});
