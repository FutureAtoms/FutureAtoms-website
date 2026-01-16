const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

function fixFile(filename) {
    const filePath = path.join(publicDir, filename);
    if (!fs.existsSync(filePath)) {
        return 0;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Pattern: Related story div cards with onclick navigation
    // Match: <div class="glass-panel p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-colors"
    //          onclick="window.location.href='page.html'">
    const pattern = /<div class="glass-panel p-6 rounded-xl border border-white\/10 cursor-pointer hover:border-cyan-500\/30 transition-colors"\s*\n?\s*onclick="window\.location\.href='([^']+)'">/g;

    content = content.replace(pattern, (match, href) => {
        return `<a href="${href}" class="glass-panel p-6 rounded-xl border border-white/10 cursor-pointer hover:border-cyan-500/30 transition-colors block">`;
    });

    // Also need to close with </a> instead of </div>
    // This is tricky - we need to find the matching closing divs
    // Let's do a more careful replacement

    if (content !== originalContent) {
        // Now we need to close the <a> tags properly
        // The structure is: <a ...>content</div> should be <a ...>content</a>
        // We'll do line-by-line analysis

        const lines = content.split('\n');
        const newLines = [];
        let insideRelatedStoryLink = false;
        let linkDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line starts a related story link
            if (line.includes('<a href="') && line.includes('glass-panel p-6 rounded-xl')) {
                insideRelatedStoryLink = true;
                linkDepth = 0;
                newLines.push(line);
                continue;
            }

            if (insideRelatedStoryLink) {
                // Count nested divs
                const divOpens = (line.match(/<div/g) || []).length;
                const divCloses = (line.match(/<\/div>/g) || []).length;
                linkDepth += divOpens - divCloses;

                // If we hit a closing </div> at depth -1, this is the card's closing tag
                if (linkDepth < 0) {
                    // Replace first </div> with </a>
                    newLines.push(line.replace('</div>', '</a>'));
                    insideRelatedStoryLink = false;
                } else {
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }

        content = newLines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
        return 1;
    }

    return 0;
}

// Get all blog HTML files
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.startsWith('blog') && f.endsWith('.html'));

console.log('🔧 Fixing Related Stories onclick divs\n');
console.log('=' .repeat(60) + '\n');

let fixed = 0;
for (const file of htmlFiles) {
    const wasFixed = fixFile(file);
    if (wasFixed) {
        console.log(`  ✅ ${file}: Converted related story divs to anchor tags`);
        fixed++;
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Fixed ${fixed} files`);
