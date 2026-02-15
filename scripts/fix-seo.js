const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const baseUrl = 'https://futureatoms.com';

// Page titles for og:title
const pageOgTitles = {
    'about.html': 'About FutureAtoms - Agentic AI for Semiconductors & Healthcare',
    'adaptivision.html': 'AdaptiveVision - AI Object Detection | FutureAtoms',
    'agentic.html': 'Agentic - AI-Driven CLI Tool | FutureAtoms',
    'bevybeats.html': 'BevyBeats - AI Music Generation | FutureAtoms',
    'blog.html': 'Tech Herald - FutureAtoms Blog',
    'blog-ai-music-revolution.html': 'AI Music Revolution - FutureAtoms Blog',
    'blog-ai-therapy.html': 'AI Therapy: Transforming Mental Health | FutureAtoms',
    'blog-chipos-mcp.html': 'ChipOS MCP Integration | FutureAtoms Blog',
    'blog-linkedin-automation.html': 'LinkedIn Automation Best Practices | FutureAtoms',
    'blog-semiconductor-ai.html': 'AI in Semiconductor Design | FutureAtoms Blog',
    'chipos.html': 'ChipOS - AI Operating System for Chip Development',
    'chipos-changelog.html': 'ChipOS Changelog - Latest Updates | FutureAtoms',
    'chipos-docs.html': 'ChipOS Documentation | FutureAtoms',
    'chipos-pitch.html': 'ChipOS - Investor Pitch Deck | FutureAtoms',
    'chipos-settings.html': 'ChipOS Settings | FutureAtoms',
    'contact.html': 'Contact FutureAtoms - Get in Touch',
    'feedback.html': 'Share Your Feedback | FutureAtoms',
    'hub-coming-soon.html': 'ChipOS Hub - Coming Soon | FutureAtoms',
    'index.html': 'FutureAtoms | Agentic AI for Semiconductors & Healthcare',
    'news.html': 'News & Updates | FutureAtoms',
    'savitri.html': 'Savitri - AI Therapy Companion | FutureAtoms',
    'systemverilog.html': 'SystemVerilog AI - Hardware Description | FutureAtoms',
    'yuj.html': 'Yuj - AI Yoga & Fitness | FutureAtoms',
    'zaphy.html': 'Zaphy - LinkedIn Automation | FutureAtoms'
};

function fixFile(filename) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return { canonical: false, ogTitle: false };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = { canonical: false, ogTitle: false };

    // Add canonical URL if missing
    if (!content.includes('rel="canonical"')) {
        const canonicalUrl = `${baseUrl}/${filename === 'index.html' ? '' : filename}`;
        const canonicalTag = `    <link rel="canonical" href="${canonicalUrl}">`;

        // Find the viewport meta and add canonical after it
        const viewportMatch = content.match(/<meta name="viewport"[^>]*>/);
        if (viewportMatch) {
            content = content.replace(viewportMatch[0], viewportMatch[0] + '\n' + canonicalTag);
            changes.canonical = true;
        }
    }

    // Add og:title if missing
    if (!content.includes('og:title') && pageOgTitles[filename]) {
        const ogTitleTag = `    <meta property="og:title" content="${pageOgTitles[filename]}">`;

        // Find the description meta and add og:title after it
        const descMatch = content.match(/<meta name="description"[^>]*>/);
        if (descMatch) {
            content = content.replace(descMatch[0], descMatch[0] + '\n' + ogTitleTag);
            changes.ogTitle = true;
        }
    }

    // Add og:description if missing
    if (!content.includes('og:description')) {
        const descMatch = content.match(/<meta name="description" content="([^"]+)">/);
        if (descMatch) {
            const ogDescTag = `    <meta property="og:description" content="${descMatch[1]}">`;
            // Add after og:title or description
            if (content.includes('og:title')) {
                const ogTitleMatch = content.match(/<meta property="og:title"[^>]*>/);
                if (ogTitleMatch) {
                    content = content.replace(ogTitleMatch[0], ogTitleMatch[0] + '\n' + ogDescTag);
                }
            } else {
                content = content.replace(descMatch[0], descMatch[0] + '\n' + ogDescTag);
            }
        }
    }

    // Add og:url if missing
    if (!content.includes('og:url')) {
        const canonicalUrl = `${baseUrl}/${filename === 'index.html' ? '' : filename}`;
        const ogUrlTag = `    <meta property="og:url" content="${canonicalUrl}">`;

        // Find og:description or description and add after it
        const ogDescMatch = content.match(/<meta property="og:description"[^>]*>/);
        if (ogDescMatch) {
            content = content.replace(ogDescMatch[0], ogDescMatch[0] + '\n' + ogUrlTag);
        }
    }

    if (changes.canonical || changes.ogTitle) {
        fs.writeFileSync(filePath, content, 'utf8');
    }

    return changes;
}

// Get all HTML files
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('🔧 Adding SEO Meta Tags\n');
console.log('=' .repeat(60) + '\n');

let totalCanonical = 0;
let totalOgTitle = 0;

for (const file of htmlFiles) {
    const changes = fixFile(file);
    const status = [];
    if (changes.canonical) {
        status.push('canonical');
        totalCanonical++;
    }
    if (changes.ogTitle) {
        status.push('og:title');
        totalOgTitle++;
    }

    if (status.length > 0) {
        console.log(`  ✅ ${file}: Added ${status.join(', ')}`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Added ${totalCanonical} canonical URLs and ${totalOgTitle} og:title tags`);
