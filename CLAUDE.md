# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FutureAtoms is a static portfolio website showcasing a technology ecosystem of 8 different ventures/applications. The site features interactive 3D visualizations powered by Three.js, with each page having unique visual effects. This is a pure frontend project with no build step - all HTML files contain embedded CSS and JavaScript.

## Development Commands

### Local Development
```bash
# Start local development server (Python)
npm start
# Serves on http://localhost:8000

# Alternative: Use Firebase local server
npm run serve
# or
firebase serve
```

### Deployment
```bash
# Deploy to Firebase Hosting
npm run deploy
# or
firebase deploy --only hosting

# Full deployment (all Firebase services)
firebase deploy
```

### Testing
```bash
# Install dependencies (first time)
npm install

# Run all Playwright tests
npm test

# Run tests with visible browser
npm run test:headed

# Run tests in interactive UI mode
npm run test:ui

# View test report
npm run test:report
```

### Setup (First Time)
```bash
# Run automated setup script
chmod +x setup.sh
./setup.sh

# Manual setup
npm install -g firebase-tools
firebase login
firebase init hosting
```

## Architecture

### Site Structure

The website follows a multi-page architecture where each venture has its own dedicated HTML page:

**Main Pages:**
- `index.html` - Homepage with 3D atomic structure representing all ventures
- `blog.html` - Blog listing page with particle text effect
- `news.html` - News page with 3D globe visualization
- `about.html` - About page
- `contact.html` - Contact page

**Venture Pages:**
- `bevybeats.html` - AI Music Generation Platform
- `savitri.html` - AI Therapy Application
- `zaphy.html` - LinkedIn Automation Chrome Extension
- `agentic.html` - CLI Tool with MCP Server
- `yuj.html` - Yoga & Workout App
- `adaptivision.html` - Object Detection Technology
- `chipos.html` - Semiconductor Design OS (formerly Incoder)
- `systemverilog.html` - Hardware Description AI

**Blog Articles:**
- `blog-ai-music-revolution.html`
- `blog-ai-therapy.html`
- `blog-semiconductor-ai.html`
- `blog-linkedin-automation.html`

### Design Patterns

**Self-Contained Pages:** Each HTML file is completely self-contained with:
- Embedded CSS in `<style>` tags
- Embedded JavaScript (Three.js visualizations, animations)
- No shared CSS or JS files
- All dependencies loaded via CDN

**Common Dependencies (loaded via CDN):**
- Three.js r128 - 3D graphics library
- GSAP 3.12.2 - Animation library
- ScrollTrigger (GSAP plugin) - Scroll-based animations
- Font Awesome 6.4.0 - Icon library

**Visual Consistency Across Pages:**
- Dark background: `#0a0a0f`
- Custom cursor glow effect (invisible cursor with glow following mouse)
- Glass morphism design (backdrop-filter blur effects)
- Consistent navigation header with logo and links
- Consistent footer with copyright

**Three.js Implementation Pattern:**
Each page creates its own unique 3D visualization:
- Homepage: Animated atomic structure with venture atoms connected by lines
- Blog: Particle text effects
- News: 3D rotating globe
- Venture pages: Custom effects (circuits, music waves, neural networks, etc.)

### Homepage Architecture (index.html)

The homepage is the most complex page with scroll-based interactions:

**GSAP ScrollTrigger Integration:**
- 5 main sections triggered by scroll
- Each section reveals 2 venture cards positioned at 25% and 75% width
- Atomic structure rotates and zooms based on scroll progress
- Navigation dots update based on scroll position

**Venture Card System:**
- Cards are absolutely positioned with `left` percentage values
- Initially hidden (`opacity: 0`)
- Revealed via `.active` class when scrolling into view
- Click handlers navigate to individual venture pages

**Three.js Scene:**
- 8 atoms (spheres) representing ventures, each with unique color
- Orbital rings around each atom
- Connecting lines between atoms
- 1000 ambient particles for background effect
- Dynamic lighting (spotlight + 2 point lights)
- Mouse parallax effect on camera position

### Naming Conventions

**Important:** The project recently renamed "Incoder" to "ChipOS":
- Page: `chipos.html` (not `incoder.html`)
- References in other files updated to "ChipOS"
- DMG file hosted: `ChipOS-macOS-arm64.dmg`
- All blog posts and news items refer to "ChipOS"

When adding/updating content related to the semiconductor design venture, always use "ChipOS".

### Asset Management

**Static Assets Location:**
- All files served from `/public` directory
- DMG downloads stored directly in `/public` (e.g., `ChipOS-macOS-arm64.dmg`)
- No separate assets directory

**External Dependencies:**
- Three.js: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- GSAP: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js`
- ScrollTrigger: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js`
- Font Awesome: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

## Testing

The project uses Playwright for end-to-end testing with comprehensive test coverage:

**Test Structure:**
- `tests/homepage.spec.js` - Homepage functionality (Three.js canvas, venture cards, navigation)
- `tests/navigation.spec.js` - Navigation between pages
- `tests/animations.spec.js` - GSAP scroll animations
- `tests/downloads.spec.js` - Download links (DMG files, etc.)
- `tests/responsive.spec.js` - Responsive design across breakpoints

**Test Configuration (`playwright.config.js`):**
- Runs on `http://localhost:8000` (automatically starts server via `npm start`)
- Uses Python's HTTP server for local testing
- Configured for Chromium (Desktop Chrome) tests
- Single worker to avoid conflicts
- HTML reporter with screenshots/videos on failure

**Running Tests:**
Tests automatically start the local server, so no need to run `npm start` separately. Just run `npm test` and Playwright handles everything.

## Firebase Hosting Configuration

The site uses Firebase Hosting with the following setup:

**Public Directory:** `public/`

**Rewrites:** All routes redirect to `/index.html` (configured but not actively used since this is multi-page)

**Cache Headers:**
- Images: 7 days (`max-age=604800`)
- JS/CSS: 7 days (`max-age=604800`)

**CI/CD Pipeline:**
- GitHub Actions workflow: `.github/workflows/firebase-deploy.yml`
- Auto-deploys on push to `main` branch
- Also runs on pull requests for preview
- Requires `FIREBASE_TOKEN` secret in GitHub repository settings
- Uses Firebase CLI to deploy hosting only

## Common Tasks

### Adding a New Venture Page

1. Create new HTML file in `/public` (e.g., `newventure.html`)
2. Copy structure from existing venture page (e.g., `bevybeats.html`)
3. Update page-specific content:
   - Title, tagline, features
   - Three.js visualization (customize colors, effects)
   - Icon class and gradient colors
4. Add venture to homepage `index.html`:
   - Add to `ventures` array in JavaScript (with color and position)
   - Add venture card in appropriate section
   - Add to `ventureUrls` mapping for click navigation
   - Add icon class CSS with gradient colors
5. Update navigation if needed

### Updating Venture References

When renaming a venture (like Incoder → ChipOS):
1. Rename HTML file
2. Update all references in:
   - `index.html` (title, icon class, venture data, click handlers)
   - `blog.html` (article listings)
   - `news.html` (news items)
   - All blog article files (titles, content)
3. Update CSS class names for icons
4. Search codebase for old name to ensure all references updated

### Adding Blog Posts

1. Create new HTML file: `blog-[topic].html`
2. Use newspaper-style layout from existing blog posts
3. Add article card to `blog.html` sidebar
4. Add to related items section in other blog posts
5. Update news feed in `news.html` if newsworthy

### Writing Tests

When adding new features or pages:

1. Add test file in `/tests` directory following naming pattern: `feature-name.spec.js`
2. Use existing tests as templates (e.g., `tests/homepage.spec.js`)
3. Test structure:
   ```javascript
   const { test, expect } = require('@playwright/test');

   test.describe('Feature Name', () => {
     test('test description', async ({ page }) => {
       await page.goto('/page.html');
       // Test logic
     });
   });
   ```
4. Common test patterns:
   - Three.js canvas: Wait 2000ms for initialization, check canvas visibility
   - Scroll animations: Use `scrollIntoViewIfNeeded()` before interactions
   - Navigation: Check URL with `toHaveURL()` regex
   - Loading screens: Wait for disappearance with timeout
5. Run tests locally before committing: `npm test`

## Color Palette & Branding

**Venture-Specific Gradients:**
- BevyBeats: `#d4a574, #b8860b` (bronze/gold)
- Savitri: `#ff6b6b, #ff8e53` (red/orange)
- Zaphy: `#c0c0c0, #e6e6e6, #a8a8a8` (metallic silver with shimmer)
- Agentic: `#4facfe, #00f2fe` (blue)
- Yuj: `#fa709a, #fee140` (pink/yellow)
- AdaptiveVision: `#30cfd0, #330867` (cyan/purple)
- ChipOS: `#a8edea, #fed6e3` (cyan/pink)
- SystemVerilog: `#c0c0c0, #e6e6e6, #a8a8a8` (metallic with shimmer)

**Shimmer Animation:** Used for Zaphy and SystemVerilog icons to create metallic luster effect

## Technical Notes

- No build process required (pure static HTML/CSS/JS)
- Firebase hosting serves files directly from `/public`
- Three.js scenes are created per-page (no shared Three.js context)
- Custom cursor implemented via fixed div following mouse events
- Responsive design uses media queries within each page
- Glass morphism: `backdrop-filter: blur(20px)` with rgba backgrounds
