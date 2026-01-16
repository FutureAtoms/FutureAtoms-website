#!/usr/bin/env node
/**
 * Comprehensive Website Audit Script
 * Checks for issues, inconsistencies, and errors across the entire site
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '../public');
const REPORT = {
    html: [],
    links: [],
    images: [],
    javascript: [],
    css: [],
    seo: [],
    design: [],
    accessibility: [],
    consistency: []
};

// Get all HTML files
function getHtmlFiles() {
    return fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => ({ name: f, path: path.join(PUBLIC_DIR, f) }));
}

// Check HTML structure and common issues
function auditHtml(file) {
    const content = fs.readFileSync(file.path, 'utf-8');
    const issues = [];
    const lineCount = content.split('\n').length;

    // Check for DOCTYPE
    if (!content.trim().startsWith('<!DOCTYPE html>')) {
        issues.push({ type: 'error', msg: 'Missing or incorrect DOCTYPE' });
    }

    // Check for lang attribute
    if (!/<html[^>]*lang="[^"]+"/i.test(content)) {
        issues.push({ type: 'error', msg: 'Missing lang attribute on <html>' });
    }

    // Check for meta viewport
    if (!/<meta[^>]*name="viewport"/i.test(content)) {
        issues.push({ type: 'warning', msg: 'Missing viewport meta tag' });
    }

    // Check for meta description
    if (!/<meta[^>]*name="description"/i.test(content)) {
        issues.push({ type: 'warning', msg: 'Missing meta description' });
    }

    // Check for title
    if (!/<title>[^<]+<\/title>/i.test(content)) {
        issues.push({ type: 'error', msg: 'Missing or empty <title>' });
    }

    // Check for favicon
    if (!/<link[^>]*rel="icon"/i.test(content)) {
        issues.push({ type: 'warning', msg: 'Missing favicon' });
    }

    // Check for inline styles (too many is bad)
    const inlineStyles = (content.match(/style="[^"]+"/g) || []).length;
    if (inlineStyles > 20) {
        issues.push({ type: 'warning', msg: `Excessive inline styles (${inlineStyles} found)` });
    }

    // Check for empty links
    const emptyLinks = content.match(/<a[^>]*href=""[^>]*>/g) || [];
    if (emptyLinks.length > 0) {
        issues.push({ type: 'error', msg: `${emptyLinks.length} empty href attributes` });
    }

    // Check for empty alt attributes
    const emptyAlts = content.match(/<img[^>]*alt=""[^>]*>/g) || [];
    if (emptyAlts.length > 0) {
        issues.push({ type: 'warning', msg: `${emptyAlts.length} empty alt attributes on images` });
    }

    // Check for missing alt attributes
    const missingAlts = content.match(/<img(?![^>]*alt=)[^>]*>/g) || [];
    if (missingAlts.length > 0) {
        issues.push({ type: 'error', msg: `${missingAlts.length} images missing alt attributes` });
    }

    // Check for deprecated tags
    const deprecatedTags = ['<center>', '<font>', '<marquee>', '<blink>'];
    deprecatedTags.forEach(tag => {
        if (content.includes(tag)) {
            issues.push({ type: 'error', msg: `Deprecated tag used: ${tag}` });
        }
    });

    // Check for javascript: in href
    if (/href="javascript:/i.test(content)) {
        issues.push({ type: 'warning', msg: 'Using javascript: in href (accessibility issue)' });
    }

    // Check for onclick on non-interactive elements
    const onclickDivs = content.match(/<div[^>]*onclick/gi) || [];
    if (onclickDivs.length > 0) {
        issues.push({ type: 'warning', msg: `${onclickDivs.length} <div> elements with onclick (use <button> instead)` });
    }

    // Check file size
    const sizeKB = (fs.statSync(file.path).size / 1024).toFixed(1);
    if (parseFloat(sizeKB) > 100) {
        issues.push({ type: 'warning', msg: `Large file size: ${sizeKB} KB (consider splitting)` });
    }

    return { file: file.name, lines: lineCount, sizeKB, issues };
}

// Check for broken internal links
function auditLinks(files) {
    const issues = [];
    const allFiles = new Set(files.map(f => f.name));

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        // Find all internal links
        const linkPattern = /href="([^"#][^"]*\.html)"/g;
        let match;
        while ((match = linkPattern.exec(content)) !== null) {
            const linkedFile = match[1];
            if (!linkedFile.startsWith('http') && !allFiles.has(linkedFile)) {
                issues.push({
                    file: file.name,
                    type: 'error',
                    msg: `Broken link: ${linkedFile}`
                });
            }
        }

        // Check for links to old image paths
        if (content.includes('images/futureatoms-icon.png') &&
            !content.includes('images/optimized/')) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: 'Still using unoptimized image path'
            });
        }
    });

    return issues;
}

// Check for missing/broken images
function auditImages(files) {
    const issues = [];
    const imagesDir = path.join(PUBLIC_DIR, 'images');
    const optimizedDir = path.join(imagesDir, 'optimized');

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        // Find all image sources
        const imgPattern = /src="([^"]+\.(png|jpg|jpeg|gif|webp|svg))"/gi;
        let match;
        while ((match = imgPattern.exec(content)) !== null) {
            let imgPath = match[1];

            // Skip external images
            if (imgPath.startsWith('http')) continue;

            // Resolve path
            const fullPath = path.join(PUBLIC_DIR, imgPath);

            if (!fs.existsSync(fullPath)) {
                issues.push({
                    file: file.name,
                    type: 'error',
                    msg: `Missing image: ${imgPath}`
                });
            }
        }
    });

    return issues;
}

// Check JavaScript consistency
function auditJavaScript(files) {
    const issues = [];

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        // Check for console.log
        const consoleLogs = (content.match(/console\.(log|warn|error)/g) || []).length;
        if (consoleLogs > 0) {
            issues.push({
                file: file.name,
                type: 'info',
                msg: `${consoleLogs} console statements found`
            });
        }

        // Check for TODO/FIXME comments
        const todos = content.match(/\/\/.*TODO|\/\/.*FIXME|\/\*.*TODO|\/\*.*FIXME/gi) || [];
        if (todos.length > 0) {
            issues.push({
                file: file.name,
                type: 'info',
                msg: `${todos.length} TODO/FIXME comments`
            });
        }

        // Check for var usage (should use let/const)
        const varUsage = (content.match(/\bvar\s+\w+/g) || []).length;
        if (varUsage > 0) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `${varUsage} uses of 'var' (use let/const)`
            });
        }

        // Check for == instead of ===
        const looseEquality = (content.match(/[^=!]==[^=]/g) || []).length;
        if (looseEquality > 0) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `${looseEquality} uses of == (use === for strict equality)`
            });
        }

        // Check for undefined function calls
        const undefinedCalls = content.match(/onclick="(\w+)\(\)"/g) || [];
        undefinedCalls.forEach(call => {
            const funcName = call.match(/onclick="(\w+)\(\)"/)[1];
            if (!content.includes(`function ${funcName}`) &&
                !content.includes(`const ${funcName}`) &&
                !content.includes(`let ${funcName}`)) {
                // Check if it's a common global
                if (!['closeModal', 'openModal', 'resetCamera', 'signOut'].includes(funcName)) {
                    issues.push({
                        file: file.name,
                        type: 'warning',
                        msg: `Possibly undefined function: ${funcName}()`
                    });
                }
            }
        });
    });

    return issues;
}

// Check SEO issues
function auditSEO(files) {
    const issues = [];
    const titles = new Map();
    const descriptions = new Map();

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        // Extract title
        const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : null;

        if (title) {
            if (title.length < 30) {
                issues.push({
                    file: file.name,
                    type: 'warning',
                    msg: `Title too short (${title.length} chars): "${title}"`
                });
            }
            if (title.length > 60) {
                issues.push({
                    file: file.name,
                    type: 'warning',
                    msg: `Title too long (${title.length} chars)`
                });
            }
            // Check for duplicate titles
            if (titles.has(title)) {
                issues.push({
                    file: file.name,
                    type: 'warning',
                    msg: `Duplicate title with ${titles.get(title)}`
                });
            }
            titles.set(title, file.name);
        }

        // Extract meta description
        const descMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        const desc = descMatch ? descMatch[1] : null;

        if (!desc) {
            issues.push({
                file: file.name,
                type: 'error',
                msg: 'Missing meta description'
            });
        } else if (desc.length < 50) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `Meta description too short (${desc.length} chars)`
            });
        } else if (desc.length > 160) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `Meta description too long (${desc.length} chars)`
            });
        }

        // Check for H1
        const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
        if (h1Count === 0) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: 'No H1 tag found'
            });
        } else if (h1Count > 1) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `Multiple H1 tags (${h1Count} found)`
            });
        }

        // Check for canonical URL
        if (!/<link[^>]*rel="canonical"/i.test(content)) {
            issues.push({
                file: file.name,
                type: 'info',
                msg: 'Missing canonical URL'
            });
        }

        // Check Open Graph tags
        if (!/<meta[^>]*property="og:title"/i.test(content)) {
            issues.push({
                file: file.name,
                type: 'info',
                msg: 'Missing og:title'
            });
        }
    });

    return issues;
}

// Check design consistency
function auditDesignConsistency(files) {
    const issues = [];
    const colorSchemes = {};
    const fontFamilies = new Set();

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        // Extract primary colors used
        const colors = content.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g) || [];
        colorSchemes[file.name] = [...new Set(colors)].length;

        // Check for consistent font loading
        const hasOrbitron = content.includes('Orbitron');
        const hasRajdhani = content.includes('Rajdhani');

        if (!hasOrbitron || !hasRajdhani) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: `Missing brand fonts (Orbitron: ${hasOrbitron}, Rajdhani: ${hasRajdhani})`
            });
        }

        // Check for consistent navigation
        const hasNav = /<nav|class=".*nav|id=".*nav/i.test(content);
        if (!hasNav && !file.name.includes('hub-coming-soon')) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: 'Missing navigation element'
            });
        }

        // Check for footer
        const hasFooter = /<footer/i.test(content);
        if (!hasFooter) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: 'Missing footer element'
            });
        }

        // Check for mobile menu
        const hasMobileMenu = /mobile-menu/i.test(content);
        if (!hasMobileMenu && !file.name.includes('coming-soon') && !file.name.includes('docs')) {
            issues.push({
                file: file.name,
                type: 'warning',
                msg: 'Missing mobile menu'
            });
        }

        // Check glass-panel usage consistency
        const glassPanel = (content.match(/glass-panel/g) || []).length;
        if (glassPanel === 0 && !file.name.includes('coming-soon')) {
            issues.push({
                file: file.name,
                type: 'info',
                msg: 'Not using glass-panel design system'
            });
        }
    });

    return issues;
}

// Check for copyright year
function auditCopyright(files) {
    const issues = [];
    const currentYear = new Date().getFullYear();

    files.forEach(file => {
        const content = fs.readFileSync(file.path, 'utf-8');

        const yearMatch = content.match(/©\s*(\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            if (year !== currentYear && year !== currentYear - 1) {
                issues.push({
                    file: file.name,
                    type: 'warning',
                    msg: `Outdated copyright year: ${year}`
                });
            }
        }
    });

    return issues;
}

// Main audit function
async function runFullAudit() {
    console.log('='.repeat(80));
    console.log('🔍 COMPREHENSIVE WEBSITE AUDIT');
    console.log('='.repeat(80));
    console.log('');

    const files = getHtmlFiles();
    console.log(`Found ${files.length} HTML files to audit\n`);

    // 1. HTML Audit
    console.log('📄 HTML STRUCTURE AUDIT');
    console.log('-'.repeat(80));

    let totalHtmlIssues = 0;
    files.forEach(file => {
        const result = auditHtml(file);
        if (result.issues.length > 0) {
            console.log(`\n${result.file} (${result.sizeKB} KB, ${result.lines} lines):`);
            result.issues.forEach(issue => {
                const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`  ${icon} ${issue.msg}`);
                totalHtmlIssues++;
            });
        }
    });
    console.log(`\nTotal HTML issues: ${totalHtmlIssues}\n`);

    // 2. Link Audit
    console.log('🔗 LINK AUDIT');
    console.log('-'.repeat(80));

    const linkIssues = auditLinks(files);
    if (linkIssues.length > 0) {
        linkIssues.forEach(issue => {
            const icon = issue.type === 'error' ? '❌' : '⚠️';
            console.log(`  ${icon} ${issue.file}: ${issue.msg}`);
        });
    } else {
        console.log('  ✅ No broken internal links found');
    }
    console.log('');

    // 3. Image Audit
    console.log('🖼️  IMAGE AUDIT');
    console.log('-'.repeat(80));

    const imageIssues = auditImages(files);
    if (imageIssues.length > 0) {
        imageIssues.forEach(issue => {
            const icon = issue.type === 'error' ? '❌' : '⚠️';
            console.log(`  ${icon} ${issue.file}: ${issue.msg}`);
        });
    } else {
        console.log('  ✅ All images found');
    }
    console.log('');

    // 4. JavaScript Audit
    console.log('📜 JAVASCRIPT AUDIT');
    console.log('-'.repeat(80));

    const jsIssues = auditJavaScript(files);
    if (jsIssues.length > 0) {
        jsIssues.forEach(issue => {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${issue.file}: ${issue.msg}`);
        });
    } else {
        console.log('  ✅ No JavaScript issues found');
    }
    console.log('');

    // 5. SEO Audit
    console.log('🔎 SEO AUDIT');
    console.log('-'.repeat(80));

    const seoIssues = auditSEO(files);
    if (seoIssues.length > 0) {
        seoIssues.forEach(issue => {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${issue.file}: ${issue.msg}`);
        });
    }
    console.log('');

    // 6. Design Consistency Audit
    console.log('🎨 DESIGN CONSISTENCY AUDIT');
    console.log('-'.repeat(80));

    const designIssues = auditDesignConsistency(files);
    if (designIssues.length > 0) {
        designIssues.forEach(issue => {
            const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${issue.file}: ${issue.msg}`);
        });
    }
    console.log('');

    // 7. Copyright Audit
    console.log('©️  COPYRIGHT AUDIT');
    console.log('-'.repeat(80));

    const copyrightIssues = auditCopyright(files);
    if (copyrightIssues.length > 0) {
        copyrightIssues.forEach(issue => {
            console.log(`  ⚠️ ${issue.file}: ${issue.msg}`);
        });
    } else {
        console.log('  ✅ Copyright years are current');
    }
    console.log('');

    // Summary
    const totalIssues = totalHtmlIssues + linkIssues.length + imageIssues.length +
                        jsIssues.length + seoIssues.length + designIssues.length +
                        copyrightIssues.length;

    console.log('='.repeat(80));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`
  HTML Issues:        ${totalHtmlIssues}
  Link Issues:        ${linkIssues.length}
  Image Issues:       ${imageIssues.length}
  JavaScript Issues:  ${jsIssues.length}
  SEO Issues:         ${seoIssues.length}
  Design Issues:      ${designIssues.length}
  Copyright Issues:   ${copyrightIssues.length}
  ─────────────────────────
  TOTAL ISSUES:       ${totalIssues}
    `);

    return totalIssues;
}

runFullAudit().then(total => {
    process.exit(total > 0 ? 1 : 0);
}).catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
});
