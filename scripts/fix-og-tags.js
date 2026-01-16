const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const ogImage = 'https://futureatoms.com/images/optimized/futureatoms-icon-512w.webp';

// Pages that need og:image
const pagesToFix = [
    'chipos.html',
    'blog-ai-music-revolution.html',
    'blog-ai-therapy.html',
    'blog-chipos-mcp.html',
    'blog-linkedin-automation.html',
    'blog-semiconductor-ai.html',
    'chipos-changelog.html',
    'chipos-docs.html',
    'chipos-settings.html'
];

function fixFile(filename) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return { ogImage: false, ogDesc: false };
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = { ogImage: false, ogDesc: false };

    // Add og:image if missing
    if (!content.includes('og:image')) {
        const ogTitleMatch = content.match(/<meta property="og:title"[^>]*>/);
        if (ogTitleMatch) {
            const ogImageTag = `\n    <meta property="og:image" content="${ogImage}">`;
            content = content.replace(ogTitleMatch[0], ogTitleMatch[0] + ogImageTag);
            changes.ogImage = true;
        }
    }

    // Add og:description if missing (copy from meta description)
    if (!content.includes('og:description')) {
        const descMatch = content.match(/<meta name="description" content="([^"]+)">/);
        if (descMatch) {
            const ogDescTag = `\n    <meta property="og:description" content="${descMatch[1]}">`;
            // Insert after og:title or og:image
            const ogTitleMatch = content.match(/<meta property="og:title"[^>]*>/);
            const ogImageMatch = content.match(/<meta property="og:image"[^>]*>/);

            if (ogImageMatch) {
                content = content.replace(ogImageMatch[0], ogImageMatch[0] + ogDescTag);
                changes.ogDesc = true;
            } else if (ogTitleMatch) {
                content = content.replace(ogTitleMatch[0], ogTitleMatch[0] + ogDescTag);
                changes.ogDesc = true;
            }
        }
    }

    if (changes.ogImage || changes.ogDesc) {
        fs.writeFileSync(filePath, content, 'utf8');
    }

    return changes;
}

console.log('🔧 Fixing og:image and og:description tags\n');
console.log('=' .repeat(60) + '\n');

let totalOgImage = 0;
let totalOgDesc = 0;

for (const file of pagesToFix) {
    const changes = fixFile(file);
    const status = [];
    if (changes.ogImage) {
        status.push('og:image');
        totalOgImage++;
    }
    if (changes.ogDesc) {
        status.push('og:description');
        totalOgDesc++;
    }

    if (status.length > 0) {
        console.log(`  ✅ ${file}: Added ${status.join(', ')}`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Added ${totalOgImage} og:image and ${totalOgDesc} og:description tags`);
