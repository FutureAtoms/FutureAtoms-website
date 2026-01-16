const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Meta descriptions for each page
const metaDescriptions = {
    'adaptivision.html': 'AdaptiveVision by FutureAtoms - AI-powered real-time object detection and tracking for intelligent visual processing and automation.',
    'agentic.html': 'Agentic by FutureAtoms - Powerful CLI tool with MCP Server for AI-driven automation and task management.',
    'bevybeats.html': 'BevyBeats by FutureAtoms - AI-powered music generation platform creating unique compositions with machine learning.',
    'blog-ai-music-revolution.html': 'How AI is revolutionizing music creation - exploring the future of AI-generated music and its impact on the creative industry.',
    'blog-ai-therapy.html': 'AI-powered therapy: How artificial intelligence is transforming mental health support and making therapy more accessible.',
    'blog-chipos-mcp.html': 'ChipOS MCP Integration - How ChipOS leverages Model Context Protocol for enhanced semiconductor design automation.',
    'blog-linkedin-automation.html': 'LinkedIn automation best practices - ethical approaches to networking and professional growth with AI assistance.',
    'blog-semiconductor-ai.html': 'AI in semiconductor design - how machine learning is transforming chip design and hardware development.',
    'chipos.html': 'ChipOS by FutureAtoms - Revolutionary semiconductor design operating system for next-generation chip development and automation.',
    'chipos-changelog.html': 'ChipOS Changelog - Latest updates, features, and improvements to the ChipOS semiconductor design platform.',
    'feedback.html': 'Share your feedback with FutureAtoms - Help us improve our products and services with your valuable input.',
    'hub-coming-soon.html': 'ChipOS Hub - Coming soon. A centralized platform for semiconductor design resources and collaboration.',
    'savitri.html': 'Savitri by FutureAtoms - AI-powered therapy companion providing personalized mental health support and guidance.',
    'systemverilog.html': 'SystemVerilog AI by FutureAtoms - Intelligent hardware description language assistant for faster chip design.',
    'yuj.html': 'Yuj by FutureAtoms - AI-powered yoga and workout companion for personalized fitness guidance and wellness.',
    'zaphy.html': 'Zaphy by FutureAtoms - Smart LinkedIn automation extension for efficient professional networking and growth.'
};

// Standard favicon HTML to insert
const faviconHTML = `    <!-- Favicon -->
    <link rel="icon" type="image/webp" href="images/optimized/futureatoms-icon-64w.webp">
    <link rel="icon" type="image/png" href="images/optimized/futureatoms-icon-192w.png">
    <link rel="apple-touch-icon" href="images/optimized/futureatoms-icon-192w.png">`;

function fixFile(filename) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️ File not found: ${filename}`);
        return { favicon: false, meta: false };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = { favicon: false, meta: false };

    // Check and add favicon
    if (!content.includes('rel="icon"')) {
        // Find the title tag and add favicon after it
        const titleMatch = content.match(/<title>.*?<\/title>/);
        if (titleMatch) {
            content = content.replace(titleMatch[0], titleMatch[0] + '\n' + faviconHTML);
            changes.favicon = true;
        }
    }

    // Check and add meta description
    const metaDesc = metaDescriptions[filename];
    if (metaDesc && !content.includes('name="description"')) {
        // Find viewport meta and add description after it
        const viewportMatch = content.match(/<meta name="viewport"[^>]*>/);
        if (viewportMatch) {
            const descMeta = `\n    <meta name="description" content="${metaDesc}">`;
            content = content.replace(viewportMatch[0], viewportMatch[0] + descMeta);
            changes.meta = true;
        }
    }

    if (changes.favicon || changes.meta) {
        fs.writeFileSync(filePath, content, 'utf8');
    }

    return changes;
}

// Files to fix
const filesToFix = [
    'adaptivision.html',
    'agentic.html',
    'bevybeats.html',
    'blog-ai-music-revolution.html',
    'blog-ai-therapy.html',
    'blog-chipos-mcp.html',
    'blog-linkedin-automation.html',
    'blog-semiconductor-ai.html',
    'chipos.html',
    'chipos-changelog.html',
    'feedback.html',
    'hub-coming-soon.html',
    'savitri.html',
    'systemverilog.html',
    'yuj.html',
    'zaphy.html'
];

console.log('🔧 Fixing Missing Favicons and Meta Descriptions\n');
console.log('=' .repeat(60) + '\n');

let totalFavicons = 0;
let totalMetas = 0;

for (const file of filesToFix) {
    const changes = fixFile(file);
    const status = [];
    if (changes.favicon) {
        status.push('favicon');
        totalFavicons++;
    }
    if (changes.meta) {
        status.push('meta description');
        totalMetas++;
    }

    if (status.length > 0) {
        console.log(`  ✅ ${file}: Added ${status.join(', ')}`);
    } else {
        console.log(`  ⏭️  ${file}: Already has both`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Fixed ${totalFavicons} favicons and ${totalMetas} meta descriptions`);
