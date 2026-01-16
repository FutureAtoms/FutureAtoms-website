#!/usr/bin/env node
/**
 * CSS Analysis Script using PurgeCSS
 * Finds unused CSS and generates optimized stylesheets
 */

const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const CSS_DIR = path.join(PUBLIC_DIR, 'css');
const OUTPUT_DIR = path.join(CSS_DIR, 'optimized');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function analyzeFontAwesomeUsage() {
    console.log('\n🔍 Analyzing Font Awesome Icon Usage...\n');

    const htmlFiles = fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(PUBLIC_DIR, f));

    const iconPattern = /fa-([a-z0-9-]+)/g;
    const usedIcons = new Set();

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = iconPattern.exec(content)) !== null) {
            usedIcons.add(match[1]);
        }
    }

    console.log(`Found ${usedIcons.size} unique Font Awesome icons used:\n`);
    const iconList = Array.from(usedIcons).sort();
    iconList.forEach(icon => console.log(`  fa-${icon}`));

    // Font Awesome full CSS is ~150KB, subset would be ~5KB
    console.log(`\n📊 Font Awesome Analysis:`);
    console.log(`   Current: ~150 KB (all.min.css with all icons)`);
    console.log(`   Optimized: ~${Math.ceil(usedIcons.size * 0.3)} KB (only used icons)`);
    console.log(`   Potential savings: ~${150 - Math.ceil(usedIcons.size * 0.3)} KB`);

    return iconList;
}

async function analyzeCSS() {
    console.log('\n🎨 Analyzing CSS Files...\n');

    const cssFiles = ['main.css', 'chat.css'].map(f => path.join(CSS_DIR, f)).filter(fs.existsSync);
    const htmlFiles = fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(PUBLIC_DIR, f));

    for (const cssFile of cssFiles) {
        const originalSize = fs.statSync(cssFile).size;
        const cssName = path.basename(cssFile);

        console.log(`\n📄 ${cssName}:`);
        console.log(`   Original size: ${(originalSize / 1024).toFixed(1)} KB`);

        try {
            const result = await new PurgeCSS().purge({
                content: htmlFiles,
                css: [cssFile],
                safelist: {
                    standard: [
                        /^fa-/,
                        /^fab-/,
                        /^fas-/,
                        /^far-/,
                        /active/,
                        /hidden/,
                        /show/,
                        /open/,
                        /modal/,
                        /dropdown/,
                        /section-active/
                    ],
                    deep: [/modal/, /dropdown/, /chat/]
                }
            });

            if (result.length > 0) {
                const purgedCSS = result[0].css;
                const purgedSize = Buffer.byteLength(purgedCSS, 'utf8');
                const savings = ((1 - purgedSize / originalSize) * 100).toFixed(0);

                const outputPath = path.join(OUTPUT_DIR, cssName);
                fs.writeFileSync(outputPath, purgedCSS);

                console.log(`   Purged size: ${(purgedSize / 1024).toFixed(1)} KB`);
                console.log(`   Savings: ${savings}%`);
                console.log(`   ✅ Saved to: css/optimized/${cssName}`);
            }
        } catch (err) {
            console.log(`   ❌ Error: ${err.message}`);
        }
    }
}

async function analyzeTailwindUsage() {
    console.log('\n🌬️  Analyzing Tailwind CSS Usage...\n');

    const htmlFiles = fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => path.join(PUBLIC_DIR, f));

    // Common Tailwind class patterns
    const tailwindPattern = /class="([^"]+)"/g;
    const allClasses = new Set();

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = tailwindPattern.exec(content)) !== null) {
            match[1].split(/\s+/).forEach(cls => {
                if (cls) allClasses.add(cls);
            });
        }
    }

    console.log(`Total unique classes found: ${allClasses.size}`);

    // Check if using CDN
    const indexContent = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
    const usesCDN = indexContent.includes('cdn.tailwindcss.com');

    if (usesCDN) {
        console.log('\n⚠️  Currently using Tailwind CDN (JIT in browser)');
        console.log('   CDN size: ~127 KB + runtime compilation');
        console.log('\n💡 Recommendation: Build Tailwind at compile time');
        console.log('   Expected optimized size: ~15-30 KB (only used utilities)');
    }

    return allClasses.size;
}

async function generateReport() {
    console.log('=' .repeat(70));
    console.log('📊 CSS & Asset Optimization Report');
    console.log('=' .repeat(70));

    await analyzeFontAwesomeUsage();
    await analyzeCSS();
    await analyzeTailwindUsage();

    console.log('\n' + '=' .repeat(70));
    console.log('📋 Optimization Recommendations:');
    console.log('=' .repeat(70));
    console.log(`
1. FONT AWESOME (High Impact)
   - Current: Loading all.min.css (~150KB) + fonts (~150KB)
   - Solution: Use @fortawesome/fontawesome-svg-core with tree-shaking
   - Or: Self-host only the icons used (~30 icons = ~10KB)
   - Savings: ~290KB

2. TAILWIND CSS (High Impact)
   - Current: CDN with JIT (~127KB JS + runtime cost)
   - Solution: npx tailwindcss build -o dist/styles.css --minify
   - Savings: ~100KB + faster initial render

3. CUSTOM CSS (Low-Medium Impact)
   - Run PurgeCSS on main.css and chat.css
   - Combine and minify all CSS into single file
   - Inline critical CSS, defer rest

4. CSS LOADING STRATEGY
   - Preload critical fonts
   - Use font-display: swap
   - Defer non-critical CSS with media="print" onload trick
`);
}

generateReport().catch(console.error);
