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

    // Pattern 1: Logo div with onclick for navigation
    // Replace div with onclick="window.location.href='url'" with <a href="url">
    content = content.replace(
        /<div class="flex items-center gap-3 cursor-pointer" onclick="window\.location\.href='index\.html'">/g,
        '<a href="index.html" class="flex items-center gap-3">'
    );

    // Also check for variations with group class
    content = content.replace(
        /<div class="flex items-center gap-3 group cursor-pointer" onclick="window\.location\.href='index\.html'">/g,
        '<a href="index.html" class="flex items-center gap-3 group">'
    );

    // Find the closing </div> for these converted elements and change to </a>
    // This is tricky - we need to match the structure
    // The pattern is: <a ...><div>...img...</div><div>...text...</div></a>

    // For files that were changed, we need to find the matching closing div
    if (content !== originalContent) {
        // Find all <a href="index.html" class="flex items-center gap-3">
        // and ensure the next significant closing tag matches

        // Split by lines for more controlled replacement
        const lines = content.split('\n');
        const newLines = [];
        let insideLogoLink = false;
        let divDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('<a href="index.html" class="flex items-center gap-3">') ||
                line.includes('<a href="index.html" class="flex items-center gap-3 group">')) {
                insideLogoLink = true;
                divDepth = 0;
                newLines.push(line);
                continue;
            }

            if (insideLogoLink) {
                // Count div opens and closes
                const divOpens = (line.match(/<div/g) || []).length;
                const divCloses = (line.match(/<\/div>/g) || []).length;
                divDepth += divOpens - divCloses;

                // If we're back to depth -1, we found the closing div for the logo container
                if (divDepth < 0) {
                    // This line has the closing </div> that should be </a>
                    newLines.push(line.replace('</div>', '</a>'));
                    insideLogoLink = false;
                } else {
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }

        content = newLines.join('\n');
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return 1;
    }

    return 0;
}

// Get all HTML files
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('🔧 Fixing onclick divs to proper anchor tags\n');
console.log('=' .repeat(60) + '\n');

let fixed = 0;
for (const file of htmlFiles) {
    const wasFixed = fixFile(file);
    if (wasFixed) {
        console.log(`  ✅ ${file}: Converted logo div to anchor tag`);
        fixed++;
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`\n✅ Fixed ${fixed} files`);
